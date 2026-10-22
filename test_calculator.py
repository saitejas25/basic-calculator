"""
Unit tests for Calculator mathematical evaluations
"""

import unittest
from calculator_gui import evaluate_expression


class TestCalculator(unittest.TestCase):
    def test_basic_arithmetic(self):
        self.assertEqual(evaluate_expression("2 + 2"), 4)
        self.assertEqual(evaluate_expression("10 - 4"), 6)
        self.assertEqual(evaluate_expression("6 * 7"), 42)
        self.assertEqual(evaluate_expression("100 / 4"), 25)

    def test_floating_point(self):
        self.assertEqual(evaluate_expression("0.1 + 0.2"), 0.3)
        self.assertEqual(evaluate_expression("12.5 * 2"), 25)
        self.assertEqual(evaluate_expression("7 / 2"), 3.5)

    def test_precedence_and_parentheses(self):
        self.assertEqual(evaluate_expression("2 + 3 * 4"), 14)
        self.assertEqual(evaluate_expression("(2 + 3) * 4"), 20)
        self.assertEqual(evaluate_expression("((10 + 5) * 2) / 3"), 10)

    def test_modulo(self):
        self.assertEqual(evaluate_expression("10 % 3"), 1)
        self.assertEqual(evaluate_expression("14 % 5"), 4)

    def test_unary_minus(self):
        self.assertEqual(evaluate_expression("-5 + 10"), 5)
        self.assertEqual(evaluate_expression("-(3 + 2) * 4"), -20)

    def test_zero_division(self):
        with self.assertRaises(ZeroDivisionError):
            evaluate_expression("10 / 0")

    def test_syntax_error(self):
        with self.assertRaises(Exception):
            evaluate_expression("2 + * 3")


if __name__ == "__main__":
    unittest.main()
