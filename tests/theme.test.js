const test = require('node:test');
const assert = require('node:assert');

// We need to set up mock JS globals before importing/invoking theme.js.
// Since theme.js runs code when window is defined, let's mock carefully.

const mockStorage = {};
const documentElementStyle = {};
const bodyClasses = [];
const eventListeners = {};
let customEventsDispatched = [];

global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; }
};

// Set up mock window and document
global.CustomEvent = class {
  constructor(name, init = {}) {
    this.type = name;
    this.detail = init.detail || {};
  }
};

global.window = {
  dispatchEvent: (event) => {
    customEventsDispatched.push(event);
  },
  addEventListener: (event, cb) => {
    if (!eventListeners[event]) eventListeners[event] = [];
    eventListeners[event].push(cb);
  }
};

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
          const idx = bodyClasses.indexOf(c);
          if (idx !== -1) bodyClasses.splice(idx, 1);
        });
      },
      add: (...classes) => {
        classes.forEach(c => {
          if (!bodyClasses.includes(c)) bodyClasses.push(c);
        });
      },
      contains: (c) => bodyClasses.includes(c)
    }
  },
  querySelector: () => null,
  addEventListener: (event, cb) => {
    if (!eventListeners[event]) eventListeners[event] = [];
    eventListeners[event].push(cb);
  }
};

// Now load ThemeManager
const { ThemeManager } = require('../theme.js');

function resetMocks() {
  // Clear mock storage
  for (const key in mockStorage) {
    delete mockStorage[key];
  }
  // Clear styles
  for (const key in documentElementStyle) {
    delete documentElementStyle[key];
  }
  // Clear body classes
  bodyClasses.length = 0;
  // Clear event dispatch history
  customEventsDispatched = [];
  // Reset ThemeManager currentTheme
  ThemeManager.currentTheme = 'dark';
}

test('Default applied when storage is empty', () => {
  resetMocks();

  // Initialize
  ThemeManager.init();

  // Default theme should be dark
  assert.strictEqual(ThemeManager.currentTheme, 'dark');
  assert.ok(bodyClasses.includes('theme-dark'));

  // Verify accent CSS vars are set
  assert.strictEqual(documentElementStyle['--bg'], '#0b0f1a');
  assert.strictEqual(documentElementStyle['--text'], '#e8eaed');
});

test('Persists across reload (restores from localStorage)', () => {
  resetMocks();
  mockStorage['arcade-theme'] = 'retro-neon';

  // Initialize again
  ThemeManager.init();

  assert.strictEqual(ThemeManager.currentTheme, 'retro-neon');
  assert.ok(bodyClasses.includes('theme-retro-neon'));
  assert.ok(!bodyClasses.includes('theme-dark'));
  assert.strictEqual(documentElementStyle['--bg'], '#05000a');
  assert.strictEqual(documentElementStyle['--text'], '#39ff14');
});

test('setTheme switches class and updates localStorage', () => {
  resetMocks();
  ThemeManager.init(); // Starts dark

  // Switch to light
  ThemeManager.setTheme('light');
  assert.strictEqual(ThemeManager.currentTheme, 'light');
  assert.strictEqual(mockStorage['arcade-theme'], 'light');
  assert.ok(bodyClasses.includes('theme-light'));
  assert.ok(!bodyClasses.includes('theme-dark'));
  assert.strictEqual(documentElementStyle['--bg'], '#f3f4f6');

  // Switch back to retro-neon
  ThemeManager.setTheme('retro-neon');
  assert.strictEqual(ThemeManager.currentTheme, 'retro-neon');
  assert.strictEqual(mockStorage['arcade-theme'], 'retro-neon');
  assert.ok(bodyClasses.includes('theme-retro-neon'));
  assert.ok(!bodyClasses.includes('theme-light'));
  assert.strictEqual(documentElementStyle['--bg'], '#05000a');
});

test('Dispatches themechange event', () => {
  resetMocks();
  ThemeManager.init();

  ThemeManager.setTheme('light');

  // Verify dispatchEvent was called with themechange custom event
  assert.strictEqual(customEventsDispatched.length, 1);
  assert.strictEqual(customEventsDispatched[0].type, 'themechange');
  assert.strictEqual(customEventsDispatched[0].detail.theme, 'light');
});

test('Invalid value fallback or ignored in setTheme', () => {
  resetMocks();
  ThemeManager.init(); // defaults to dark

  // Switch to light first
  ThemeManager.setTheme('light');
  assert.strictEqual(ThemeManager.currentTheme, 'light');

  // Attempt to set key to an invalid value
  ThemeManager.setTheme('invalid-theme-value');

  // It should retain light theme (or fallback), here setTheme ignores it because !this.themes[theme]
  assert.strictEqual(ThemeManager.currentTheme, 'light');
  assert.ok(bodyClasses.includes('theme-light'));
  assert.ok(!bodyClasses.includes('theme-invalid-theme-value'));
});

test('Invalid localStorage value fallback during init', () => {
  resetMocks();
  mockStorage['arcade-theme'] = 'completely-broken';

  ThemeManager.init();

  // Should fallback to dark
  assert.strictEqual(ThemeManager.currentTheme, 'dark');
  assert.ok(bodyClasses.includes('theme-dark'));
  assert.strictEqual(documentElementStyle['--bg'], '#0b0f1a');
});
