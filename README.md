# CalcPro - Modern Basic Calculator

[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen)](https://saitejas25.github.io/basic-calculator/)

A versatile, responsive, and robust basic calculator built with both a modern **Web interface (HTML/CSS/JS)** and native **Python implementations (GUI & CLI)**.

🌐 **Live Deployed App**: [https://saitejas25.github.io/basic-calculator/](https://saitejas25.github.io/basic-calculator/)

---

## 🌟 Features

- **Standard Arithmetic Operations**: Addition (`+`), Subtraction (`−`), Multiplication (`×`), Division (`÷`), and Modulo (`%`).
- **Precedence & Grouping**: Full support for parentheses `(` `)` and standard mathematical order of operations (PEMDAS).
- **Floating-point Accuracy**: Prevents common IEEE-754 precision artifacts (e.g. `0.1 + 0.2 = 0.3`).
- **Safe Evaluation**: Zero unsafe `eval()` calls. Uses AST (Python) and Shunting-Yard tokenized RPN evaluation (JavaScript).
- **Themes**: Instant Dark / Light mode toggle with smooth glassmorphism styling and auto-detection.
- **Calculation History**: Stores past calculations with click-to-recall/load into the current display.
- **Full Keyboard Navigation**: Type numbers, operators, Enter (`=`), Esc (`AC`), and Backspace seamlessly.
- **Copy to Clipboard**: One-click copy with toast notifications.
- **Responsive Layout**: Designed for mobile, tablet, and desktop screens.

---

## 🚀 How to Run

### 1. Web Calculator (In Browser)
No installation or dependencies required!
- Double-click [`index.html`](index.html) to open directly in any browser (Chrome, Edge, Firefox, Safari).
- Or run a local HTTP server:
  ```bash
  python -m http.server 8080
  ```
  Then open `http://localhost:8080` in your web browser.

---

### 2. Desktop GUI (Python Tkinter)
Run the native desktop calculator application with a dark theme:
```bash
python calculator_gui.py
```

---

### 3. Terminal REPL (Python CLI)
For quick calculations straight from the command line:
```bash
python calculator_cli.py
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `0` - `9` | Input digits |
| `+`, `-`, `*`, `/` | Basic operators |
| `.` or `,` | Decimal point |
| `Enter` or `=` | Calculate result |
| `Backspace` | Delete last entered character |
| `Esc` or `C` | All Clear (`AC`) |
| `(` and `)` | Parentheses |
| `%` | Modulo / percentage |

---

## 🧪 Running Tests

- **Python Unit Tests**:
  ```bash
  python test_calculator.py
  ```
- **JavaScript Evaluator Tests**:
  ```bash
  node test_app.js
  ```

---

## 📁 File Structure

- [`index.html`](index.html) - Semantic HTML5 layout and accessibility markup.
- [`style.css`](style.css) - Responsive CSS with Dark/Light theme variables and glassmorphism.
- [`app.js`](app.js) - Shunting-Yard arithmetic parser, keyboard event listener, history drawer.
- [`calculator_gui.py`](calculator_gui.py) - Standalone Python Tkinter desktop GUI.
- [`calculator_cli.py`](calculator_cli.py) - Interactive Python command-line REPL.
- [`test_calculator.py`](test_calculator.py) - Python unit tests.
- [`test_app.js`](test_app.js) - Node.js validation test runner.
