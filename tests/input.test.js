const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Setup mock browser environment before requiring input.js
let localStorageStore = {};

global.localStorage = {
  getItem(key) {
    return localStorageStore[key] || null;
  },
  setItem(key, value) {
    localStorageStore[key] = String(value);
  },
  removeItem(key) {
    delete localStorageStore[key];
  },
  clear() {
    localStorageStore = {};
  }
};

global.document = {
  readyState: 'complete',
  getElementById(id) { return null; },
  querySelector(selector) { return null; },
  createElement(tag) {
    return {
      id: '',
      className: '',
      style: {},
      innerHTML: '',
      textContent: '',
      appendChild() {},
      addEventListener() {},
      remove() {}
    };
  },
  head: {
    appendChild() {}
  },
  body: {
    appendChild() {}
  },
  addEventListener() {}
};

global.window = {
  addEventListener() {},
  removeEventListener() {}
};

const { KeyManager } = require('../input.js');

test('KeyManager - default bindings', () => {
  localStorage.clear();
  KeyManager.init();
  assert.strictEqual(KeyManager.bindings.pause, 'KeyP');
  assert.strictEqual(KeyManager.bindings.action, 'Space');
});

test('KeyManager - save and init persistence round-trip', () => {
  localStorage.clear();
  KeyManager.bindings = { pause: 'KeyK', action: 'KeyW' };
  KeyManager.save();
  
  assert.ok(localStorage.getItem('arcade-keybindings').includes('KeyK'));
  
  KeyManager.bindings = { pause: 'KeyP', action: 'Space' };
  KeyManager.init();
  assert.strictEqual(KeyManager.bindings.pause, 'KeyK');
  assert.strictEqual(KeyManager.bindings.action, 'KeyW');
});

test('KeyManager - isKey matching logic', () => {
  KeyManager.bindings = { pause: 'KeyP', action: 'Space' };

  // Test Space action
  assert.strictEqual(KeyManager.isKey({ code: 'Space', key: ' ' }, 'action'), true);
  assert.strictEqual(KeyManager.isKey({ code: 'KeyP', key: 'p' }, 'action'), false);

  // Test Pause action (KeyP)
  assert.strictEqual(KeyManager.isKey({ code: 'KeyP', key: 'p' }, 'pause'), true);
  assert.strictEqual(KeyManager.isKey({ code: 'KeyP', key: 'P' }, 'pause'), true);
  assert.strictEqual(KeyManager.isKey({ code: 'KeyX', key: 'x' }, 'pause'), false);
});

test('KeyManager - handles localStorage.getItem throwing an error', () => {
  localStorage.clear();
  const originalGetItem = global.localStorage.getItem;
  let warnCalled = false;
  const originalWarn = console.warn;
  console.warn = (...args) => {
    warnCalled = true;
  };

  try {
    global.localStorage.getItem = () => {
      throw new Error('SecurityError: localStorage is disabled');
    };

    // Reset default bindings first to see if it remains default
    KeyManager.bindings = { pause: 'KeyP', action: 'Space' };

    // Attempt init
    KeyManager.init();

    // Verify warnings are printed and structure is not crashed
    assert.strictEqual(warnCalled, true);
    assert.strictEqual(KeyManager.bindings.pause, 'KeyP');
    assert.strictEqual(KeyManager.bindings.action, 'Space');
  } finally {
    global.localStorage.getItem = originalGetItem;
    console.warn = originalWarn;
  }
});

test('KeyManager - handles localStorage.setItem throwing an error', () => {
  localStorage.clear();
  const originalSetItem = global.localStorage.setItem;
  let warnCalled = false;
  const originalWarn = console.warn;
  console.warn = (...args) => {
    warnCalled = true;
  };

  try {
    global.localStorage.setItem = () => {
      throw new Error('QuotaExceededError: storage is full');
    };

    // Change binding
    KeyManager.bindings = { pause: 'KeyL', action: 'Space' };

    // Attempt save, which should catch the error and log warning
    KeyManager.save();

    // Verify warning is called
    assert.strictEqual(warnCalled, true);
  } finally {
    global.localStorage.setItem = originalSetItem;
    console.warn = originalWarn;
  }
});
