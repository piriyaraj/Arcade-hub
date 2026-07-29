const test = require('node:test');
const assert = require('node:assert');

// 1. Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; }
};

// 2. Mock window event listeners and dispatching
const listeners = {};
const dispatchedEvents = [];

if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail || null;
    }
  };
}

global.window = {
  addEventListener: (event, cb) => {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(cb);
  },
  removeEventListener: (event, cb) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(l => l !== cb);
    }
  },
  dispatchEvent: (event) => {
    const eventName = event.type || event;
    if (listeners[eventName]) {
      listeners[eventName].forEach(cb => cb(event));
    }
    dispatchedEvents.push(event);
    return true;
  }
};

// 3. Mock document
const documentElementStyle = {};
const bodyClasses = new Set();
const domContentLoadedListeners = [];

global.document = {
  readyState: 'complete',
  documentElement: {
    style: {
      setProperty: (key, value) => {
        documentElementStyle[key] = value;
      }
    }
  },
  body: {
    classList: {
      remove: (...classes) => {
        classes.forEach(c => bodyClasses.delete(c));
      },
      add: (...classes) => {
        classes.forEach(c => bodyClasses.add(c));
      }
    }
  },
  querySelector: () => null,
  addEventListener: (event, cb) => {
    if (event === 'DOMContentLoaded') {
      domContentLoadedListeners.push(cb);
    }
  }
};

// Reset function
function resetMocks() {
  for (const key in mockStorage) {
    delete mockStorage[key];
  }
  dispatchedEvents.length = 0;
  for (const key in documentElementStyle) {
    delete documentElementStyle[key];
  }
  for (const key in listeners) {
    delete listeners[key];
  }
  bodyClasses.clear();
  domContentLoadedListeners.length = 0;
}

// Require ThemeManager after mocks are set up
const { ThemeManager } = require('../theme.js');

test('(a) initial currentTheme is \'dark\' when localStorage is empty', () => {
  resetMocks();
  ThemeManager.init();
  assert.strictEqual(ThemeManager.currentTheme, 'dark');
});

test('(b) init() reads persisted theme from \'arcade-theme\'', () => {
  resetMocks();
  mockStorage['arcade-theme'] = 'light';
  ThemeManager.init();
  assert.strictEqual(ThemeManager.currentTheme, 'light');
});

test('(c) init() falls back to \'dark\' on invalid stored value', () => {
  resetMocks();
  mockStorage['arcade-theme'] = 'not-a-valid-theme';
  ThemeManager.init();
  assert.strictEqual(ThemeManager.currentTheme, 'dark');
});

test('(d) setTheme persists the value to localStorage under \'arcade-theme\'', () => {
  resetMocks();
  ThemeManager.init(); // default to dark
  ThemeManager.setTheme('retro-neon');
  assert.strictEqual(ThemeManager.currentTheme, 'retro-neon');
  assert.strictEqual(mockStorage['arcade-theme'], 'retro-neon');
});

test('(e) setTheme dispatches \'themechange\' CustomEvent with detail.theme', () => {
  resetMocks();
  ThemeManager.init(); // loads dark

  let receivedEvent = null;
  window.addEventListener('themechange', (e) => {
    receivedEvent = e;
  });

  ThemeManager.setTheme('light');

  assert.ok(receivedEvent);
  assert.strictEqual(receivedEvent.type, 'themechange');
  assert.strictEqual(receivedEvent.detail.theme, 'light');
});

test('(f) setTheme does NOT persist or dispatch on invalid theme', () => {
  resetMocks();
  ThemeManager.init(); // loads dark (persists dark default?)

  let receivedEvent = null;
  window.addEventListener('themechange', (e) => {
    receivedEvent = e;
  });

  ThemeManager.setTheme('invalid-theme');

  // Value in localStorage is still the old one (or not set to 'invalid-theme')
  assert.notStrictEqual(mockStorage['arcade-theme'], 'invalid-theme');
  // Theme remained dark
  assert.strictEqual(ThemeManager.currentTheme, 'dark');
  // Event was not dispatched
  assert.strictEqual(receivedEvent, null);
});

test('(g) getColor returns the CSS variable value for the current theme', () => {
  resetMocks();
  ThemeManager.setTheme('dark');
  assert.strictEqual(ThemeManager.getColor('--bg'), '#0b0f1a');

  ThemeManager.setTheme('light');
  assert.strictEqual(ThemeManager.getColor('--bg'), '#f3f4f6');
  assert.strictEqual(ThemeManager.getColor('--accent-green'), '#00994d');
});

test('(h) getColor strips var() wrapper if present', () => {
  resetMocks();
  ThemeManager.setTheme('dark');
  assert.strictEqual(ThemeManager.getColor('var(--bg)'), '#0b0f1a');
  assert.strictEqual(ThemeManager.getColor('var(--accent-pink)'), '#ff007f');
});

test('(i) applyTheme sets CSS custom properties on documentElement and toggles body class', () => {
  resetMocks();
  ThemeManager.applyTheme('retro-neon');

  assert.strictEqual(documentElementStyle['--bg'], '#05000a');
  assert.strictEqual(documentElementStyle['--text'], '#39ff14');
  assert.strictEqual(documentElementStyle['--border'], '#ff00ff');

  assert.ok(bodyClasses.has('theme-retro-neon'));
  assert.ok(!bodyClasses.has('theme-dark'));
  assert.ok(!bodyClasses.has('theme-light'));
});
