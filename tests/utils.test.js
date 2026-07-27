const test = require('node:test');
const assert = require('node:assert');

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; }
};

// Mock window
global.window = {};

const utils = require('../utils.js');

test('getBestScore returns parsed number if valid', () => {
  mockStorage['game_best'] = '150';
  assert.strictEqual(utils.getBestScore('game'), 150);
});

test('getBestScore returns 0 if localStorage contains invalid number', () => {
  mockStorage['game_best'] = 'not-a-number';
  assert.strictEqual(utils.getBestScore('game'), 0);

  mockStorage['game_best'] = 'NaN';
  assert.strictEqual(utils.getBestScore('game'), 0);
});

test('getBestScore returns 0 if localStorage fails/throws', () => {
  const originalGetItem = global.localStorage.getItem;
  global.localStorage.getItem = () => { throw new Error('fail'); };

  assert.strictEqual(utils.getBestScore('game'), 0);

  global.localStorage.getItem = originalGetItem;
});

test('saveBestScore persists score and returns true on success', () => {
  const result = utils.saveBestScore('game', 300);
  assert.strictEqual(result, true);
  assert.strictEqual(mockStorage['game_best'], '300');
});

test('saveBestScore returns false if localStorage fails/throws', () => {
  const originalSetItem = global.localStorage.setItem;
  global.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };

  const result = utils.saveBestScore('game', 300);
  assert.strictEqual(result, false);

  global.localStorage.setItem = originalSetItem;
});

test('getMuteState gets boolean representation of muted status', () => {
  mockStorage['game_muted'] = 'true';
  assert.strictEqual(utils.getMuteState('game'), true);

  mockStorage['game_muted'] = 'false';
  assert.strictEqual(utils.getMuteState('game'), false);

  mockStorage['game_muted'] = 'invalid';
  assert.strictEqual(utils.getMuteState('game'), false);
});

test('saveMuteState persists muted status and returns true', () => {
  const result = utils.saveMuteState('game', true);
  assert.strictEqual(result, true);
  assert.strictEqual(mockStorage['game_muted'], 'true');
});
