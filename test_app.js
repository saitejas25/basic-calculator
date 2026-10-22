function tokenize(str) {
  const tokens = [];
  let i = 0;
  while (i < str.length) {
    const c = str[i];
    if (c === ' ') {
      i++;
      continue;
    }
    if (['+', '-', '*', '/', '(', ')', '%'].includes(c)) {
      if (c === '-') {
        const prevToken = tokens[tokens.length - 1];
        if (!prevToken || ['+', '-', '*', '/', '(', '%', 'u-'].includes(prevToken)) {
          tokens.push('u-');
          i++;
          continue;
        }
      }
      tokens.push(c);
      i++;
    } else if (/[0-9.]/.test(c)) {
      let numStr = '';
      while (i < str.length && /[0-9.]/.test(str[i])) {
        numStr += str[i];
        i++;
      }
      tokens.push(numStr);
    } else {
      i++;
    }
  }
  return tokens;
}

function evaluateTokens(tokens) {
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, 'u-': 3 };
  const outputQueue = [];
  const opStack = [];

  for (let token of tokens) {
    if (!isNaN(parseFloat(token)) && isFinite(token)) {
      outputQueue.push(parseFloat(token));
    } else if (token in precedence) {
      if (token === 'u-') {
        // Right-associative unary
        while (
          opStack.length &&
          opStack[opStack.length - 1] in precedence &&
          precedence[opStack[opStack.length - 1]] > precedence[token]
        ) {
          outputQueue.push(opStack.pop());
        }
        opStack.push(token);
      } else {
        // Left-associative binary
        while (
          opStack.length &&
          opStack[opStack.length - 1] in precedence &&
          precedence[opStack[opStack.length - 1]] >= precedence[token]
        ) {
          outputQueue.push(opStack.pop());
        }
        opStack.push(token);
      }
    } else if (token === '(') {
      opStack.push(token);
    } else if (token === ')') {
      while (opStack.length && opStack[opStack.length - 1] !== '(') {
        outputQueue.push(opStack.pop());
      }
      if (opStack.length && opStack[opStack.length - 1] === '(') {
        opStack.pop();
      }
    }
  }

  while (opStack.length) {
    const op = opStack.pop();
    if (op === '(' || op === ')') continue;
    outputQueue.push(op);
  }

  // Evaluate RPN
  const evalStack = [];
  for (let item of outputQueue) {
    if (typeof item === 'number') {
      evalStack.push(item);
    } else if (item === 'u-') {
      const val = evalStack.pop();
      if (val === undefined) return NaN;
      evalStack.push(-val);
    } else {
      const b = evalStack.pop();
      const a = evalStack.pop();
      if (a === undefined || b === undefined) return NaN;

      let res = 0;
      switch (item) {
        case '+': res = a + b; break;
        case '-': res = a - b; break;
        case '*': res = a * b; break;
        case '/':
          if (b === 0) return 'Cannot divide by 0';
          res = a / b;
          break;
        case '%':
          if (b === 0) return 'Cannot divide by 0';
          res = a % b;
          break;
        default: return NaN;
      }
      evalStack.push(res);
    }
  }

  if (evalStack.length !== 1) return NaN;
  const finalVal = evalStack[0];
  if (typeof finalVal === 'string') return finalVal;

  return parseFloat(finalVal.toPrecision(12));
}

function test(expr, expected) {
  const tokens = tokenize(expr);
  const result = evaluateTokens(tokens);
  const pass = result === expected || Math.abs(result - expected) < 1e-9;
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${expr} => ${result} (expected ${expected})`);
  if (!pass) process.exit(1);
}

console.log("Testing Updated JS Evaluator:");
test("2+2", 4);
test("10-4", 6);
test("6*7", 42);
test("100/4", 25);
test("0.1+0.2", 0.3);
test("2+3*4", 14);
test("(2+3)*4", 20);
test("10%3", 1);
test("-(3+2)*4", -20);
test("-5+10", 5);
test("10*-5", -50);
test("10--5", 15);
test("10/0", "Cannot divide by 0");

console.log("\nAll JS evaluator tests passed!");
