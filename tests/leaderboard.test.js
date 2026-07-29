const test = require('node:test');
const assert = require('node:assert');

// Setup in-memory localStorage shim on globalThis before requiring leaderboard.js
const mockStorage = {};
const calls = {
  getItem: [],
  setItem: [],
  removeItem: []
};

globalThis.localStorage = {
  getItem: (key) => {
    calls.getItem.push(key);
    if (mockStorage[key] === undefined) return null;
    return mockStorage[key];
  },
  setItem: (key, val) => {
    calls.setItem.push({ key, val });
    mockStorage[key] = String(val);
  },
  removeItem: (key) => {
    calls.removeItem.push(key);
    delete mockStorage[key];
  }
};

// Also set global.localStorage as a secondary measure (global is an alias to globalThis in Node)
global.localStorage = globalThis.localStorage;

// Mock console.error to keep test runs clean
const originalConsoleError = console.error;
console.error = () => {};

// Load leaderboard.js after the localStorage shim is on globalThis
const { Leaderboard } = require('../leaderboard.js');

test('Leaderboard - Scenario A: getScores() returns parsed numbers for valid stored entries', () => {
  // Clear mockStorage and spies
  for (const k of Object.keys(mockStorage)) {
    delete mockStorage[k];
  }
  calls.getItem = [];
  calls.setItem = [];
  calls.removeItem = [];

  // Set valid scores for some known game keys
  mockStorage['snake_best'] = '150';
  mockStorage['bingball_best'] = '42';
  mockStorage['cyberracer_best'] = '1000';

  const scores = Leaderboard.getScores();

  const snake = scores.find(s => s.id === 'snake');
  const bingball = scores.find(s => s.id === 'bingball');
  const cyberracer = scores.find(s => s.id === 'cyberracer');

  assert.strictEqual(snake.score, 150);
  assert.strictEqual(bingball.score, 42);
  assert.strictEqual(cyberracer.score, 1000);
});

test('Leaderboard - Scenario B: getScores() falls back to 0 for missing OR NaN/invalid entries', () => {
  // Clear mockStorage
  for (const k of Object.keys(mockStorage)) {
    delete mockStorage[k];
  }

  // Define some invalid/NaN values and missing values
  mockStorage['snake_best'] = 'abc'; // NaN
  mockStorage['bingball_best'] = 'NaN'; // NaN
  // 'breakout_best' is left undefined / missing

  const scores = Leaderboard.getScores();

  const snake = scores.find(s => s.id === 'snake');
  const bingball = scores.find(s => s.id === 'bingball');
  const breakout = scores.find(s => s.id === 'breakout');

  assert.strictEqual(snake.score, 0);
  assert.strictEqual(bingball.score, 0);
  assert.strictEqual(breakout.score, 0);
});

test('Leaderboard - Scenario C: when localStorage.getItem throws, getScores() returns a safe default and does not propagate the error', () => {
  // Clear mockStorage
  for (const k of Object.keys(mockStorage)) {
    delete mockStorage[k];
  }

  const originalGetItem = globalThis.localStorage.getItem;
  globalThis.localStorage.getItem = () => {
    throw new Error('localStorage getItem failure');
  };

  try {
    let scores;
    assert.doesNotThrow(() => {
      scores = Leaderboard.getScores();
    });

    // Each game score returns safe default of 0
    scores.forEach(s => {
      assert.strictEqual(s.score, 0);
    });
  } finally {
    globalThis.localStorage.getItem = originalGetItem;
  }
});

test('Leaderboard - Scenario D: resetAllScores() clears all 13 game keys and leaves unrelated keys untouched', () => {
  // Clear mockStorage and spies
  for (const k of Object.keys(mockStorage)) {
    delete mockStorage[k];
  }
  calls.removeItem = [];

  // Initialize scores for all 13 games
  Leaderboard.games.forEach(game => {
    mockStorage[game.key] = '50';
  });

  // Set an unrelated key to show smoke test of keeping other storage untouched
  mockStorage['unrelated_key'] = 'keep_me';

  // Run the reset
  Leaderboard.resetAllScores();

  // Verify each one of Leaderboard.games' .key is gone
  Leaderboard.games.forEach(game => {
    assert.strictEqual(mockStorage[game.key], undefined);
    assert.ok(calls.removeItem.includes(game.key), `removeItem spy should have recorded deletion of ${game.key}`);
  });

  // Verify that the unrelated key is still present
  assert.strictEqual(mockStorage['unrelated_key'], 'keep_me');
});

// Restore console.error at the very end
test('cleanup', () => {
  console.error = originalConsoleError;
});
