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
  assert.strictEqual(utils.loadHighScore('game'), 150);
});

test('getBestScore returns 0 if localStorage contains invalid number', () => {
  mockStorage['game_best'] = 'not-a-number';
  assert.strictEqual(utils.getBestScore('game'), 0);
  assert.strictEqual(utils.loadHighScore('game'), 0);

  mockStorage['game_best'] = 'NaN';
  assert.strictEqual(utils.getBestScore('game'), 0);
  assert.strictEqual(utils.loadHighScore('game'), 0);
});

test('getBestScore returns 0 if localStorage fails/throws', () => {
  const originalGetItem = global.localStorage.getItem;
  global.localStorage.getItem = () => { throw new Error('fail'); };

  assert.strictEqual(utils.getBestScore('game'), 0);
  assert.strictEqual(utils.loadHighScore('game'), 0);

  global.localStorage.getItem = originalGetItem;
});

test('saveBestScore persists score and returns true on success', () => {
  const result = utils.saveBestScore('game', 300);
  assert.strictEqual(result, true);
  assert.strictEqual(mockStorage['game_best'], '300');

  const result2 = utils.saveHighScore('game', 400);
  assert.strictEqual(result2, true);
  assert.strictEqual(mockStorage['game_best'], '400');
});

test('saveBestScore returns false if localStorage fails/throws', () => {
  const originalSetItem = global.localStorage.setItem;
  global.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };

  const result = utils.saveBestScore('game', 300);
  assert.strictEqual(result, false);

  const result2 = utils.saveHighScore('game', 300);
  assert.strictEqual(result2, false);

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

test('resetScore removes best score from localStorage and returns true', () => {
  mockStorage['game_best'] = '500';
  const result = utils.resetScore('game');
  assert.strictEqual(result, true);
  assert.strictEqual(mockStorage['game_best'], undefined);
});

test('resetScore returns false if localStorage.removeItem fails/throws', () => {
  const originalRemoveItem = global.localStorage.removeItem;
  global.localStorage.removeItem = () => { throw new Error('fail'); };

  const result = utils.resetScore('game');
  assert.strictEqual(result, false);

  global.localStorage.removeItem = originalRemoveItem;
});

test('formatScore formats numbers with commas and handles invalid inputs', () => {
  assert.strictEqual(utils.formatScore(1234567), '1,234,567');
  assert.strictEqual(utils.formatScore('5000'), '5,000');
  assert.strictEqual(utils.formatScore(-10), '0');
  assert.strictEqual(utils.formatScore('invalid'), '0');
});

test('clamp restricts numbers within min and max bounds', () => {
  assert.strictEqual(utils.clamp(5, 0, 10), 5);
  assert.strictEqual(utils.clamp(-5, 0, 10), 0);
  assert.strictEqual(utils.clamp(15, 0, 10), 10);
  assert.strictEqual(utils.clamp(NaN, 0, 10), 0);
});

test('checkCollision correctly detects bounding box overlap', () => {
  const boxA = { x: 10, y: 10, width: 20, height: 20 };
  const boxB = { x: 20, y: 20, width: 20, height: 20 };
  const boxC = { x: 50, y: 50, width: 20, height: 20 };

  assert.strictEqual(utils.checkCollision(boxA, boxB), true);
  assert.strictEqual(utils.checkCollision(boxA, boxC), false);
  assert.strictEqual(utils.checkCollision(null, boxA), false);
});

test('checkCircleCollision correctly detects circular overlap', () => {
  const c1 = { x: 0, y: 0, radius: 10 };
  const c2 = { x: 12, y: 0, radius: 5 };
  const c3 = { x: 50, y: 50, radius: 5 };

  assert.strictEqual(utils.checkCircleCollision(c1, c2), true);
  assert.strictEqual(utils.checkCircleCollision(c1, c3), false);
  assert.strictEqual(utils.checkCircleCollision(null, c1), false);
});

test('lerp correctly interpolates values and handles bounds', () => {
  assert.strictEqual(utils.lerp(0, 100, 0.5), 50);
  assert.strictEqual(utils.lerp(10, 20, 0), 10);
  assert.strictEqual(utils.lerp(10, 20, 1), 20);
  assert.strictEqual(utils.lerp(10, 20, 1.5), 20);
  assert.strictEqual(utils.lerp(10, 20, -0.5), 10);
  assert.strictEqual(utils.lerp('a', 20, 0.5), 0);
});

