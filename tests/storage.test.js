const test = require('node:test');
const assert = require('node:assert');

// Mock localStorage
let mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { mockStorage = {}; }
};

// Mock window
global.window = {};

const storage = require('../storage.js');

test('storage.setJSON serializes values and returns true on success', () => {
  localStorage.clear();

  // Test numeric high scores
  assert.strictEqual(storage.setJSON('snake_best', 120), true);
  assert.strictEqual(mockStorage['snake_best'], '120');

  assert.strictEqual(storage.setJSON('flappy_best', 450), true);
  assert.strictEqual(mockStorage['flappy_best'], '450');

  // Test booleans
  assert.strictEqual(storage.setJSON('neonsimon.muted', true), true);
  assert.strictEqual(mockStorage['neonsimon.muted'], 'true');

  assert.strictEqual(storage.setJSON('towerdefense_muted', false), true);
  assert.strictEqual(mockStorage['towerdefense_muted'], 'false');
});

test('storage.getJSON returns parsed value if valid', () => {
  localStorage.clear();

  mockStorage['snake_best'] = '120';
  assert.strictEqual(storage.getJSON('snake_best', 0), 120);

  mockStorage['flappy_best'] = '450';
  assert.strictEqual(storage.getJSON('flappy_best', 0), 450);

  mockStorage['neonsimon.muted'] = 'true';
  assert.strictEqual(storage.getJSON('neonsimon.muted', false), true);

  mockStorage['towerdefense_muted'] = 'false';
  assert.strictEqual(storage.getJSON('towerdefense_muted', true), false);
});

test('storage.getJSON returns fallback on missing key', () => {
  localStorage.clear();
  assert.strictEqual(storage.getJSON('nonexistent_key', 99), 99);
  assert.strictEqual(storage.getJSON('neonsimon.muted', false), false);
});

test('storage.getJSON handles invalid/corrupt JSON gracefully', () => {
  localStorage.clear();

  // A direct plain text string like "hello" is invalid JSON (should be '"hello"')
  mockStorage['snake_best'] = 'invalid_json_string';
  assert.strictEqual(storage.getJSON('snake_best', 0), 0);

  mockStorage['neonsimon.highscore'] = '{unclosed:';
  assert.strictEqual(storage.getJSON('neonsimon.highscore', 10), 10);
});

test('storage.getJSON returns fallback when localStorage.getItem throws', () => {
  localStorage.clear();
  const originalGetItem = global.localStorage.getItem;
  global.localStorage.getItem = () => { throw new Error('fail'); };

  try {
    assert.strictEqual(storage.getJSON('snake_best', 5), 5);
  } finally {
    global.localStorage.getItem = originalGetItem;
  }
});

test('storage.setJSON returns false when localStorage.setItem throws', () => {
  localStorage.clear();
  const originalSetItem = global.localStorage.setItem;
  global.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };

  try {
    assert.strictEqual(storage.setJSON('snake_best', 120), false);
  } finally {
    global.localStorage.setItem = originalSetItem;
  }
});

test('storage supports custom prefixing', () => {
  localStorage.clear();
  storage.prefix = 'arcade-';

  assert.strictEqual(storage.setJSON('snake_best', 120), true);
  assert.strictEqual(mockStorage['arcade-snake_best'], '120');

  mockStorage['arcade-flappy_best'] = '450';
  assert.strictEqual(storage.getJSON('flappy_best', 0), 450);

  // Reset prefix
  storage.prefix = '';
});
