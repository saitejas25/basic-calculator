/**
 * Modern Basic Calculator Logic
 * Safe parser, high precision, keyboard support, history & themes.
 */

(function () {
  'use strict';

  // State
  let currentExpression = '';
  let lastResult = null;
  let hasEvaluated = false;
  let history = [];

  // DOM Elements
  const mainDisplay = document.getElementById('main-display');
  const expressionDisplay = document.getElementById('expression-display');
  const pendingOpDisplay = document.getElementById('pending-op');
  const themeToggle = document.getElementById('theme-toggle');
  const historyToggle = document.getElementById('history-toggle');
  const historyDrawer = document.getElementById('history-drawer');
  const closeHistoryBtn = document.getElementById('close-history-btn');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const historyList = document.getElementById('history-list');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const copyBtn = document.getElementById('copy-btn');
  const toast = document.getElementById('toast');
  const keypad = document.querySelector('.keypad');

  // LocalStorage keys
  const STORAGE_THEME = 'calc_theme';
  const STORAGE_HISTORY = 'calc_history';

  // Operator symbols map
  const DISPLAY_OPS = {
    '*': '×',
    '/': '÷',
    '-': '−',
    '+': '+'
  };

  /* ==========================================================================
     Theme Management
     ========================================================================== */
  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_THEME);
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem(STORAGE_THEME, nextTheme);
    showToast(`Switched to ${nextTheme} mode`);
  });

  /* ==========================================================================
     History Management
     ========================================================================== */
  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_HISTORY);
      if (raw) {
        history = JSON.parse(raw);
      }
    } catch (e) {
      history = [];
    }
    renderHistory();
  }

  function saveHistoryItem(expr, res) {
    if (!expr || res === null || res === 'Error' || res === 'Cannot divide by 0') return;
    history.unshift({
      expression: expr,
      result: res,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    if (history.length > 30) history.pop();
    try {
      localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history));
    } catch (e) {}
    renderHistory();
  }

  function renderHistory() {
    if (!historyList) return;
    if (history.length === 0) {
      historyList.innerHTML = '<div class="empty-history-msg">No recent calculations</div>';
      return;
    }
    historyList.innerHTML = history.map((item, index) => `
      <div class="history-item" data-index="${index}" role="button" tabindex="0" title="Click to use this result">
        <div class="history-expr">${formatForDisplay(item.expression)} =</div>
        <div class="history-res">${item.result}</div>
      </div>
    `).join('');

    // Attach click events
    historyList.querySelectorAll('.history-item').forEach(itemEl => {
      itemEl.addEventListener('click', () => {
        const idx = itemEl.getAttribute('data-index');
        const item = history[idx];
        if (item) {
          currentExpression = String(item.result);
          lastResult = item.result;
          hasEvaluated = false;
          updateDisplay();
          closeDrawer();
          showToast('Loaded into calculator');
        }
      });
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    history = [];
    localStorage.removeItem(STORAGE_HISTORY);
    renderHistory();
    showToast('History cleared');
  });

  function openDrawer() {
    historyDrawer.classList.add('open');
    historyDrawer.setAttribute('aria-hidden', 'false');
    drawerBackdrop.style.display = 'block';
  }

  function closeDrawer() {
    historyDrawer.classList.remove('open');
    historyDrawer.setAttribute('aria-hidden', 'true');
    drawerBackdrop.style.display = 'none';
  }

  historyToggle.addEventListener('click', openDrawer);
  closeHistoryBtn.addEventListener('click', closeDrawer);
  drawerBackdrop.addEventListener('click', closeDrawer);

  /* ==========================================================================
     Display Formatting & Utilities
     ========================================================================== */
  function formatForDisplay(expr) {
    if (!expr) return '';
    return expr
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\+/g, ' + ')
      .replace(/-/g, ' − ');
  }

  function updateDisplay() {
    if (!currentExpression) {
      mainDisplay.textContent = '0';
      expressionDisplay.textContent = '';
      pendingOpDisplay.textContent = '';
      return;
    }

    // Check if ends with operator
    const lastChar = currentExpression.slice(-1);
    if (['+', '-', '*', '/'].includes(lastChar)) {
      pendingOpDisplay.textContent = DISPLAY_OPS[lastChar] || lastChar;
      expressionDisplay.textContent = formatForDisplay(currentExpression.slice(0, -1));
      // Show preview or last operand
      const parts = currentExpression.slice(0, -1).split(/[+\-*/]/);
      mainDisplay.textContent = parts[parts.length - 1] || '0';
    } else {
      pendingOpDisplay.textContent = '';
      expressionDisplay.textContent = '';
      mainDisplay.textContent = formatForDisplay(currentExpression);
    }
  }

  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  function copyCurrentDisplay() {
    const textToCopy = mainDisplay.textContent.trim();
    if (!textToCopy || textToCopy === '0' || textToCopy === 'Error') {
      showToast('Nothing to copy');
      return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('Copied: ' + textToCopy);
    }).catch(() => {
      showToast('Failed to copy');
    });
  }

  copyBtn.addEventListener('click', copyCurrentDisplay);
  mainDisplay.addEventListener('click', copyCurrentDisplay);

  /* ==========================================================================
     Arithmetic & Safe Expression Evaluator
     ========================================================================== */
  // Safe math tokenizer and Shunting-Yard algorithm (avoids eval())
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

    // Clean floating-point artifacts e.g. 0.1 + 0.2 = 0.3
    return parseFloat(finalVal.toPrecision(12));
  }

  function calculateResult() {
    if (!currentExpression) return;

    // Clean trailing operators if any
    let expr = currentExpression;
    while (['+', '-', '*', '/'].includes(expr.slice(-1))) {
      expr = expr.slice(0, -1);
    }
    if (!expr) return;

    // Auto-balance parentheses
    const openParens = (expr.match(/\(/g) || []).length;
    const closeParens = (expr.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      expr += ')'.repeat(openParens - closeParens);
    }

    try {
      const tokens = tokenize(expr);
      const res = evaluateTokens(tokens);

      if (res === 'Cannot divide by 0') {
        mainDisplay.textContent = 'Cannot divide by 0';
        expressionDisplay.textContent = formatForDisplay(expr) + ' =';
        pendingOpDisplay.textContent = '';
        currentExpression = '';
        hasEvaluated = true;
        return;
      }

      if (isNaN(res) || res === undefined) {
        mainDisplay.textContent = 'Error';
        expressionDisplay.textContent = '';
        pendingOpDisplay.textContent = '';
        currentExpression = '';
        hasEvaluated = true;
        return;
      }

      const formattedResult = Number(res).toString();
      expressionDisplay.textContent = formatForDisplay(expr) + ' =';
      mainDisplay.textContent = formattedResult;
      pendingOpDisplay.textContent = '';

      saveHistoryItem(expr, formattedResult);
      lastResult = formattedResult;
      currentExpression = formattedResult;
      hasEvaluated = true;
    } catch (err) {
      mainDisplay.textContent = 'Error';
      expressionDisplay.textContent = '';
      pendingOpDisplay.textContent = '';
      currentExpression = '';
      hasEvaluated = true;
    }
  }

  /* ==========================================================================
     Key Action Handlers
     ========================================================================== */
  function appendNumber(num) {
    if (hasEvaluated) {
      currentExpression = num;
      hasEvaluated = false;
    } else {
      if (currentExpression === '0') {
        currentExpression = num;
      } else {
        currentExpression += num;
      }
    }
    updateDisplay();
  }

  function appendOperator(op) {
    if (hasEvaluated) {
      hasEvaluated = false;
    }

    if (!currentExpression) {
      if (op === '-') {
        currentExpression = '-';
        updateDisplay();
      }
      return;
    }

    const lastChar = currentExpression.slice(-1);
    if (['+', '-', '*', '/'].includes(lastChar)) {
      // Replace previous operator
      currentExpression = currentExpression.slice(0, -1) + op;
    } else {
      currentExpression += op;
    }
    updateDisplay();
  }

  function appendDecimal() {
    if (hasEvaluated) {
      currentExpression = '0.';
      hasEvaluated = false;
      updateDisplay();
      return;
    }

    if (!currentExpression) {
      currentExpression = '0.';
      updateDisplay();
      return;
    }

    // Split expression into parts by operator to check if current number has decimal
    const parts = currentExpression.split(/[+\-*/()]/);
    const lastPart = parts[parts.length - 1];
    if (!lastPart.includes('.')) {
      currentExpression += '.';
      updateDisplay();
    }
  }

  function handleParentheses() {
    if (hasEvaluated) {
      currentExpression = '(';
      hasEvaluated = false;
      updateDisplay();
      return;
    }

    const openCount = (currentExpression.match(/\(/g) || []).length;
    const closeCount = (currentExpression.match(/\)/g) || []).length;
    const lastChar = currentExpression.slice(-1);

    if (
      openCount > closeCount &&
      (/[0-9.]/.test(lastChar) || lastChar === ')')
    ) {
      currentExpression += ')';
    } else {
      if (/[0-9.]/.test(lastChar) || lastChar === ')') {
        currentExpression += '*(';
      } else {
        currentExpression += '(';
      }
    }
    updateDisplay();
  }

  function toggleNegate() {
    if (!currentExpression || currentExpression === '0') {
      currentExpression = '-';
      updateDisplay();
      return;
    }

    // If starts with single negative number without operator:
    if (/^-?\d+(\.\d+)?$/.test(currentExpression)) {
      if (currentExpression.startsWith('-')) {
        currentExpression = currentExpression.slice(1);
      } else {
        currentExpression = '-' + currentExpression;
      }
      updateDisplay();
      return;
    }

    // If complex expression, wrap in - ( ... )
    if (currentExpression.startsWith('-(') && currentExpression.endsWith(')')) {
      currentExpression = currentExpression.slice(2, -1);
    } else {
      currentExpression = `-(${currentExpression})`;
    }
    updateDisplay();
  }

  function backspace() {
    if (hasEvaluated) {
      clearAll();
      return;
    }
    if (currentExpression.length > 0) {
      currentExpression = currentExpression.slice(0, -1);
    }
    updateDisplay();
  }

  function clearAll() {
    currentExpression = '';
    lastResult = null;
    hasEvaluated = false;
    updateDisplay();
  }

  /* ==========================================================================
     Keypad Click Listener
     ========================================================================== */
  keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    // Visual ripple effect
    btn.classList.add('active-key');
    setTimeout(() => btn.classList.remove('active-key'), 120);

    const number = btn.getAttribute('data-number');
    const operator = btn.getAttribute('data-operator');
    const action = btn.getAttribute('data-action');

    if (number !== null) {
      appendNumber(number);
    } else if (operator) {
      appendOperator(operator);
    } else if (action) {
      switch (action) {
        case 'clear':
          clearAll();
          break;
        case 'backspace':
          backspace();
          break;
        case 'decimal':
          appendDecimal();
          break;
        case 'calculate':
          calculateResult();
          break;
        case 'parentheses':
          handleParentheses();
          break;
        case 'negate':
          toggleNegate();
          break;
      }
    }
  });

  /* ==========================================================================
     Keyboard Support
     ========================================================================== */
  window.addEventListener('keydown', (e) => {
    // Ignore keyboard shortcuts if focus is inside an input/modal
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    const key = e.key;

    // Numbers 0-9
    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      appendNumber(key);
      flashButton(`[data-number="${key}"]`);
    } else if (['+', '-', '*', '/'].includes(key)) {
      e.preventDefault();
      appendOperator(key);
      flashButton(`[data-operator="${key}"]`);
    } else if (key === '.' || key === ',') {
      e.preventDefault();
      appendDecimal();
      flashButton('[data-action="decimal"]');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      calculateResult();
      flashButton('#key-equals');
    } else if (key === 'Backspace') {
      e.preventDefault();
      backspace();
      flashButton('#key-backspace');
    } else if (key === 'Escape' || key.toLowerCase() === 'c') {
      e.preventDefault();
      clearAll();
      flashButton('#key-clear');
    } else if (key === '(' || key === ')') {
      e.preventDefault();
      handleParentheses();
      flashButton('#key-parentheses');
    } else if (key === '%') {
      e.preventDefault();
      appendOperator('%');
    }
  });

  function flashButton(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.classList.add('active-key');
      setTimeout(() => el.classList.remove('active-key'), 140);
    }
  }

  // Initial startup
  initTheme();
  loadHistory();
  updateDisplay();
})();
