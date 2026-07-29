const test = require('node:test');
const assert = require('node:assert');

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; }
};

// Mock window event listeners and dispatching
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

const documentElementStyle = {};
const bodyClasses = new Set();

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
}

// Require ThemeManager after mocks are set up
const { ThemeManager } = require('../theme.js');

test('getTheme returns default theme when localStorage empty', () => {
  resetMocks();
  ThemeManager.init();
  assert.strictEqual(ThemeManager.getTheme(), 'dark');
});

test('getTheme returns persisted theme from localStorage', () => {
  resetMocks();
  mockStorage['arcade-theme'] = 'light';
  ThemeManager.init();
  assert.strictEqual(ThemeManager.getTheme(), 'light');
});

test('getTheme falls back to default on invalid stored value', () => {
  resetMocks();
  mockStorage['arcade-theme'] = 'invalid-theme';
  ThemeManager.init();
  assert.strictEqual(ThemeManager.getTheme(), 'dark');
});

test('setTheme persists to localStorage', () => {
  resetMocks();
  ThemeManager.init();
  ThemeManager.setTheme('retro-neon');
  assert.strictEqual(ThemeManager.getTheme(), 'retro-neon');
  assert.strictEqual(mockStorage['arcade-theme'], 'retro-neon');
});

test("setTheme dispatches 'themechange' CustomEvent with detail containing old/new theme", () => {
  resetMocks();
  ThemeManager.init(); // defaults to dark

  let receivedEvent = null;
  window.addEventListener('themechange', (e) => {
    receivedEvent = e;
  });

  ThemeManager.setTheme('light');

  assert.ok(receivedEvent);
  assert.strictEqual(receivedEvent.type, 'themechange');
  assert.strictEqual(receivedEvent.detail.theme, 'light');
  assert.strictEqual(receivedEvent.detail.oldTheme, 'dark');
  assert.strictEqual(receivedEvent.detail.newTheme, 'light');
});

test('cycleTheme child advances through theme list and dispatches event', () => {
  resetMocks();
  ThemeManager.init(); // default dark

  let cycleEvents = [];
  window.addEventListener('themechange', (e) => {
    cycleEvents.push(e);
  });

  // Cycle 1: dark -> light
  const next1 = ThemeManager.cycleTheme();
  assert.strictEqual(next1, 'light');
  assert.strictEqual(ThemeManager.getTheme(), 'light');
  assert.strictEqual(mockStorage['arcade-theme'], 'light');
  assert.strictEqual(cycleEvents.length, 1);
  assert.strictEqual(cycleEvents[0].detail.theme, 'light');
  assert.strictEqual(cycleEvents[0].detail.oldTheme, 'dark');
});

test('cycleTheme wraps around at end', () => {
  resetMocks();
  ThemeManager.init(); // default dark
  ThemeManager.setTheme('retro-neon'); // end of themes array

  const next = ThemeManager.cycleTheme();
  assert.strictEqual(next, 'dark');
  assert.strictEqual(ThemeManager.getTheme(), 'dark');
  assert.strictEqual(mockStorage['arcade-theme'], 'dark');
});

test('constructor reads initial theme from localStorage', () => {
  resetMocks();
  mockStorage['arcade-theme'] = 'retro-neon';
  ThemeManager.init();
  assert.strictEqual(ThemeManager.getTheme(), 'retro-neon');
});
