"""
Interactive Command-Line Calculator (CLI)
Type expressions directly, view history, or run quick math commands.
"""

import sys
from calculator_gui import evaluate_expression


def print_banner():
    print("=" * 48)
    print("         CALCPRO - TERMINAL CALCULATOR          ")
    print("=" * 48)
    print("  Supported: +, -, *, /, %, (), decimals        ")
    print("  Commands : 'history', 'clear', 'help', 'exit' ")
    print("=" * 48)


def run_cli():
    print_banner()
    history = []

    while True:
        try:
            raw_input_str = input("\ncalc> ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting CalcPro. Goodbye!")
            sys.exit(0)

        if not raw_input_str:
            continue

        cmd = raw_input_str.lower()
        if cmd in ("exit", "quit", "q"):
            print("Exiting CalcPro. Goodbye!")
            break
        elif cmd in ("help", "?"):
            print("\nUsage:")
            print("  Simply type any arithmetic expression, e.g.:")
            print("    calc> 12.5 * 4 + (100 / 2)")
            print("    calc> 25 % 4")
            print("  Special commands:")
            print("    history - list past results")
            print("    clear   - clear history")
            print("    exit    - close the calculator")
            continue
        elif cmd == "history":
            if not history:
                print("  (No calculations yet)")
            else:
                print("\nCalculation History:")
                for i, (expr, res) in enumerate(reversed(history), 1):
                    print(f"  {i}. {expr} = {res}")
            continue
        elif cmd == "clear":
            history.clear()
            print("  History cleared.")
            continue

        try:
            result = evaluate_expression(raw_input_str)
            print(f"  = {result}")
            history.append((raw_input_str, result))
        except ZeroDivisionError:
            print("  Error: Cannot divide by zero")
        except Exception as err:
            print(f"  Error: Invalid expression ({err})")


if __name__ == "__main__":
    run_cli()
