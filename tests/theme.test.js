const test = require('node:test');
const assert = require('node:assert');

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; }
};

// Mock CustomEvent
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail || null;
    }
  };
} else {
  global.windowCustomEvent = global.CustomEvent;
}

// Mock window event listeners and dispatching
const listeners = {};
const dispatchedEvents = [];

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
  },
  CustomEvent: global.CustomEvent
};

const documentElementStyle = {};
const bodyClasses = new Set();
let removedClasses = [];
let addedClasses = [];

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
        classes.forEach(c => {
          bodyClasses.delete(c);
          removedClasses.push(c);
        });
      },
      add: (...classes) => {
        classes.forEach(c => {
          bodyClasses.add(c);
          addedClasses.push(c);
        });
      }
    }
  },
  querySelector: () => null,
  addEventListener: () => {}
};

// Helper to reset mocks
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
  removedClasses.length = 0;
  addedClasses.length = 0;
}

// Require ThemeManager after mocks are set up
const { ThemeManager } = require('../theme.js');

test("(a) initial currentTheme is 'dark' when localStorage is empty", () => {
  resetMocks();
  ThemeManager.init();
  assert.strictEqual(ThemeManager.currentTheme, 'dark');
});

test("(b) init() reads persisted theme from 'arcade-theme'", () => {
  resetMocks();
  mockStorage['arcade-theme'] = 'light';
  ThemeManager.init();
  assert.strictEqual(ThemeManager.currentTheme, 'light');
});

test("(c) init() falls back to 'dark' on invalid stored value", () => {
  resetMocks();
  mockStorage['arcade-theme'] = 'unknown-color-theme';
  ThemeManager.init();
  assert.strictEqual(ThemeManager.currentTheme, 'dark');
});

test("(d) setTheme persists the value to localStorage under 'arcade-theme'", () => {
  resetMocks();
  ThemeManager.init(); // defaults to dark
  ThemeManager.setTheme('retro-neon');
  assert.strictEqual(ThemeManager.currentTheme, 'retro-neon');
  assert.strictEqual(mockStorage['arcade-theme'], 'retro-neon');
});

test("(e) setTheme dispatches 'themechange' CustomEvent with detail.theme", () => {
  resetMocks();
  ThemeManager.init(); // defaults to dark

  let receivedEvent = null;
  window.addEventListener('themechange', (e) => {
    receivedEvent = e;
  });

  ThemeManager.setTheme('light');

  assert.ok(receivedEvent);
  assert.strictEqual(receivedEvent.type, 'themechange');
  assert.ok(receivedEvent.detail);
  assert.strictEqual(receivedEvent.detail.theme, 'light');
});

test('(f) setTheme does NOT persist or dispatch on invalid theme', () => {
  resetMocks();
  ThemeManager.init(); // defaults to dark

  let eventFired = false;
  window.addEventListener('themechange', () => {
    eventFired = true;
  });

  ThemeManager.setTheme('invalid-theme-name');

  assert.strictEqual(ThemeManager.currentTheme, 'dark');
  assert.strictEqual(mockStorage['arcade-theme'], undefined);
  assert.strictEqual(eventFired, false);
});

test('(g) getColor returns the CSS variable value for the current theme', () => {
  resetMocks();
  ThemeManager.init(); // defaults to dark

  assert.strictEqual(ThemeManager.getColor('--bg'), '#0b0f1a');
  assert.strictEqual(ThemeManager.getColor('--text'), '#e8eaed');

  ThemeManager.setTheme('light');
  assert.strictEqual(ThemeManager.getColor('--bg'), '#f3f4f6');
  assert.strictEqual(ThemeManager.getColor('--text'), '#000000');
});

test('(h) getColor strips var() wrapper if present', () => {
  resetMocks();
  ThemeManager.init(); // defaults to dark

  assert.strictEqual(ThemeManager.getColor('var(--bg)'), '#0b0f1a');
  assert.strictEqual(ThemeManager.getColor('var(--text)'), '#e8eaed');
});

test('(i) applyTheme sets CSS custom properties on documentElement and toggles body class', () => {
  resetMocks();

  ThemeManager.applyTheme('retro-neon');

  assert.strictEqual(documentElementStyle['--bg'], '#05000a');
  assert.strictEqual(documentElementStyle['--text'], '#39ff14');
  assert.strictEqual(documentElementStyle['--border'], '#ff00ff');

  assert.deepStrictEqual(removedClasses, ['theme-dark', 'theme-light', 'theme-retro-neon']);
  assert.ok(addedClasses.includes('theme-retro-neon'));
});
