"""
Modern Desktop Calculator (Tkinter GUI)
Safe AST evaluation, dark theme, keyboard navigation, and history log.
"""

import ast
import operator
import tkinter as tk
from tkinter import ttk, messagebox


# Safe Math Evaluator using AST to prevent arbitrary code execution
SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Mod: operator.mod,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def safe_eval(node):
    if isinstance(node, ast.Expression):
        return safe_eval(node.body)
    elif isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError("Invalid constant type")
    elif isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type in SAFE_OPERATORS:
            left = safe_eval(node.left)
            right = safe_eval(node.right)
            if op_type is ast.Div and right == 0:
                raise ZeroDivisionError("Cannot divide by zero")
            return SAFE_OPERATORS[op_type](left, right)
        raise ValueError(f"Unsupported operator: {op_type}")
    elif isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type in SAFE_OPERATORS:
            operand = safe_eval(node.operand)
            return SAFE_OPERATORS[op_type](operand)
        raise ValueError(f"Unsupported unary operator: {op_type}")
    else:
        raise ValueError(f"Unsupported syntax: {type(node).__name__}")


def evaluate_expression(expr: str):
    # Normalize operators
    expr = expr.replace('×', '*').replace('÷', '/').replace('−', '-')
    tree = ast.parse(expr, mode='eval')
    val = safe_eval(tree)
    # Format floating point
    if isinstance(val, float):
        return round(val, 10) if not val.is_integer() else int(val)
    return val


class ModernCalculator(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("CalcPro - Desktop Calculator")
        self.geometry("380x560")
        self.minsize(340, 500)
        self.configure(bg="#111827")

        self.expression = ""
        self.evaluated = False
        self.history = []

        self._setup_styles()
        self._build_ui()
        self._bind_keys()

    def _setup_styles(self):
        self.style = ttk.Style(self)
        self.style.theme_use("clam")

        # Configure colors
        self.style.configure(".", background="#111827", foreground="#F9FAFB")
        self.style.configure("Display.TFrame", background="#1F2937")

    def _build_ui(self):
        # Container
        main_frame = tk.Frame(self, bg="#111827", padx=16, pady=16)
        main_frame.pack(fill=tk.BOTH, expand=True)

        # Header with Title and History button
        header = tk.Frame(main_frame, bg="#111827")
        header.pack(fill=tk.X, pady=(0, 10))

        title = tk.Label(header, text="CalcPro", font=("Segoe UI", 12, "bold"), fg="#38BDF8", bg="#111827")
        title.pack(side=tk.LEFT)

        self.history_btn = tk.Button(
            header,
            text="🕒 History",
            font=("Segoe UI", 9, "bold"),
            bg="#374151",
            fg="#E5E7EB",
            activebackground="#4B5563",
            activeforeground="#FFFFFF",
            relief=tk.FLAT,
            padx=8,
            pady=3,
            command=self.show_history_window
        )
        self.history_btn.pack(side=tk.RIGHT)

        # Display Frame
        disp_frame = tk.Frame(main_frame, bg="#1F2937", bd=1, relief=tk.SOLID, padx=14, pady=12)
        disp_frame.pack(fill=tk.X, pady=(0, 16))

        self.expr_label = tk.Label(
            disp_frame,
            text="",
            font=("Consolas", 11),
            fg="#9CA3AF",
            bg="#1F2937",
            anchor="e"
        )
        self.expr_label.pack(fill=tk.X)

        self.main_label = tk.Label(
            disp_frame,
            text="0",
            font=("Consolas", 24, "bold"),
            fg="#F9FAFB",
            bg="#1F2937",
            anchor="e"
        )
        self.main_label.pack(fill=tk.X)

        # Keypad Grid
        grid_frame = tk.Frame(main_frame, bg="#111827")
        grid_frame.pack(fill=tk.BOTH, expand=True)

        # 4 columns, 5 rows
        for i in range(4):
            grid_frame.columnconfigure(i, weight=1, uniform="col")
        for i in range(5):
            grid_frame.rowconfigure(i, weight=1, uniform="row")

        buttons = [
            ("AC", 0, 0, self.clear_all, "#4B5563", "#FFFFFF"),
            ("⌫", 0, 1, self.backspace, "#4B5563", "#FFFFFF"),
            ("( )", 0, 2, self.handle_parens, "#4B5563", "#FFFFFF"),
            ("÷", 0, 3, lambda: self.append_op("/"), "#2563EB", "#FFFFFF"),

            ("7", 1, 0, lambda: self.append_num("7"), "#1F2937", "#F3F4F6"),
            ("8", 1, 1, lambda: self.append_num("8"), "#1F2937", "#F3F4F6"),
            ("9", 1, 2, lambda: self.append_num("9"), "#1F2937", "#F3F4F6"),
            ("×", 1, 3, lambda: self.append_op("*"), "#2563EB", "#FFFFFF"),

            ("4", 2, 0, lambda: self.append_num("4"), "#1F2937", "#F3F4F6"),
            ("5", 2, 1, lambda: self.append_num("5"), "#1F2937", "#F3F4F6"),
            ("6", 2, 2, lambda: self.append_num("6"), "#1F2937", "#F3F4F6"),
            ("−", 2, 3, lambda: self.append_op("-"), "#2563EB", "#FFFFFF"),

            ("1", 3, 0, lambda: self.append_num("1"), "#1F2937", "#F3F4F6"),
            ("2", 3, 1, lambda: self.append_num("2"), "#1F2937", "#F3F4F6"),
            ("3", 3, 2, lambda: self.append_num("3"), "#1F2937", "#F3F4F6"),
            ("+", 3, 3, lambda: self.append_op("+"), "#2563EB", "#FFFFFF"),

            ("±", 4, 0, self.toggle_negate, "#374151", "#F3F4F6"),
            ("0", 4, 1, lambda: self.append_num("0"), "#1F2937", "#F3F4F6"),
            (".", 4, 2, self.append_decimal, "#1F2937", "#F3F4F6"),
            ("=", 4, 3, self.calculate, "#0284C7", "#FFFFFF"),
        ]

        for text, r, c, cmd, bg_col, fg_col in buttons:
            btn = tk.Button(
                grid_frame,
                text=text,
                font=("Segoe UI", 14, "bold" if text in ("=", "AC") else "normal"),
                bg=bg_col,
                fg=fg_col,
                activebackground="#3B82F6" if bg_col == "#2563EB" else "#374151",
                activeforeground="#FFFFFF",
                relief=tk.FLAT,
                command=cmd,
                cursor="hand2"
            )
            btn.grid(row=r, column=c, padx=4, pady=4, sticky="nsew")

    def _bind_keys(self):
        self.bind("<Key>", self._on_key_press)

    def _on_key_press(self, event):
        key = event.char
        keysym = event.keysym

        if key in "0123456789":
            self.append_num(key)
        elif key in "+-*/":
            self.append_op(key)
        elif key == ".":
            self.append_decimal()
        elif keysym in ("Return", "equal"):
            self.calculate()
        elif keysym == "BackSpace":
            self.backspace()
        elif keysym == "Escape" or key.lower() == "c":
            self.clear_all()
        elif key in "()":
            self.handle_parens()

    def append_num(self, n):
        if self.evaluated:
            self.expression = n
            self.evaluated = False
        else:
            if self.expression == "0":
                self.expression = n
            else:
                self.expression += n
        self.update_display()

    def append_op(self, op):
        if self.evaluated:
            self.evaluated = False
        if not self.expression:
            if op == "-":
                self.expression = "-"
                self.update_display()
            return
        if self.expression[-1] in "+-*/":
            self.expression = self.expression[:-1] + op
        else:
            self.expression += op
        self.update_display()

    def append_decimal(self):
        if self.evaluated:
            self.expression = "0."
            self.evaluated = False
            self.update_display()
            return
        parts = self.expression.replace("+", " ").replace("-", " ").replace("*", " ").replace("/", " ").split()
        if not parts or "." not in parts[-1]:
            self.expression += "." if self.expression else "0."
            self.update_display()

    def handle_parens(self):
        if self.evaluated:
            self.expression = "("
            self.evaluated = False
            self.update_display()
            return
        opens = self.expression.count("(")
        closes = self.expression.count(")")
        last_char = self.expression[-1] if self.expression else ""

        if opens > closes and (last_char.isdigit() or last_char == ")"):
            self.expression += ")"
        else:
            if last_char.isdigit() or last_char == ")":
                self.expression += "*("
            else:
                self.expression += "("
        self.update_display()

    def toggle_negate(self):
        if not self.expression or self.expression == "0":
            self.expression = "-"
        elif self.expression.startswith("-(") and self.expression.endswith(")"):
            self.expression = self.expression[2:-1]
        elif self.expression.startswith("-") and self.expression[1:].isdigit():
            self.expression = self.expression[1:]
        elif self.expression.isdigit():
            self.expression = "-" + self.expression
        else:
            self.expression = f"-({self.expression})"
        self.update_display()

    def backspace(self):
        if self.evaluated:
            self.clear_all()
            return
        if self.expression:
            self.expression = self.expression[:-1]
        self.update_display()

    def clear_all(self):
        self.expression = ""
        self.evaluated = False
        self.expr_label.config(text="")
        self.main_label.config(text="0")

    def update_display(self):
        display_text = self.expression.replace("*", " × ").replace("/", " ÷ ").replace("-", " − ")
        self.main_label.config(text=display_text if display_text else "0")

    def calculate(self):
        if not self.expression:
            return
        expr_clean = self.expression
        while expr_clean and expr_clean[-1] in "+-*/":
            expr_clean = expr_clean[:-1]

        # Auto close parens
        opens = expr_clean.count("(")
        closes = expr_clean.count(")")
        if opens > closes:
            expr_clean += ")" * (opens - closes)

        try:
            res = evaluate_expression(expr_clean)
            display_expr = expr_clean.replace("*", " × ").replace("/", " ÷ ") + " ="
            self.expr_label.config(text=display_expr)
            self.main_label.config(text=str(res))

            self.history.insert(0, (display_expr, str(res)))
            if len(self.history) > 30:
                self.history.pop()

            self.expression = str(res)
            self.evaluated = True
        except ZeroDivisionError:
            self.main_label.config(text="Cannot divide by 0")
            self.expression = ""
            self.evaluated = True
        except Exception:
            self.main_label.config(text="Error")
            self.expression = ""
            self.evaluated = True

    def show_history_window(self):
        top = tk.Toplevel(self)
        top.title("Calculation History")
        top.geometry("300x400")
        top.configure(bg="#1F2937")

        lbl = tk.Label(top, text="Past Calculations", font=("Segoe UI", 11, "bold"), fg="#F9FAFB", bg="#1F2937", pady=10)
        lbl.pack()

        listbox = tk.Listbox(top, bg="#111827", fg="#E5E7EB", font=("Consolas", 10), bd=0, highlightthickness=0)
        listbox.pack(fill=tk.BOTH, expand=True, padx=12, pady=(0, 10))

        if not self.history:
            listbox.insert(tk.END, "No recent history")
        else:
            for item in self.history:
                listbox.insert(tk.END, f"{item[0]} {item[1]}")

        def use_selected():
            sel = listbox.curselection()
            if sel and self.history:
                val = self.history[sel[0]][1]
                self.expression = val
                self.evaluated = False
                self.update_display()
                top.destroy()

        btn_frame = tk.Frame(top, bg="#1F2937")
        btn_frame.pack(fill=tk.X, padx=12, pady=10)

        use_btn = tk.Button(btn_frame, text="Load Result", bg="#2563EB", fg="#FFFFFF", relief=tk.FLAT, command=use_selected)
        use_btn.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4))

        close_btn = tk.Button(btn_frame, text="Close", bg="#4B5563", fg="#FFFFFF", relief=tk.FLAT, command=top.destroy)
        close_btn.pack(side=tk.RIGHT, fill=tk.X, expand=True, padx=(4, 0))


if __name__ == "__main__":
    app = ModernCalculator()
    app.mainloop()
