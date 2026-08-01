const test = require('node:test');
const assert = require('node:assert');

// Setup in-memory localStorage shim
const mockStorage = {};
global.localStorage = {
  getItem: (key) => {
    if (mockStorage[key] === undefined) return null;
    return mockStorage[key];
  },
  setItem: (key, val) => {
    mockStorage[key] = String(val);
  },
  removeItem: (key) => {
    delete mockStorage[key];
  }
};

// Mock console.error to keep test runs clean
const originalConsoleError = console.error;
let consoleErrors = [];
console.error = (...args) => {
  consoleErrors.push(args.join(' '));
};

// Load leaderboard.js
const { Leaderboard } = require('../leaderboard.js');

test('Leaderboard - getScores() returns parsed numbers for valid stored entries', () => {
  // Clear mockStorage
  for (const k of Object.keys(mockStorage)) {
    delete mockStorage[k];
  }

  // Set some scores
  mockStorage['snake_best'] = '100';
  mockStorage['bingball_best'] = '45';
  mockStorage['cyberracer_best'] = '1234';
  mockStorage['neonsimon_best'] = '15';
  mockStorage['sokoban_best'] = '{"0":{"moves":145,"time":210},"1":{"moves":54,"time":80}}';

  const scores = Leaderboard.getScores();

  const snake = scores.find(s => s.id === 'snake');
  const bingball = scores.find(s => s.id === 'bingball');
  const cyberracer = scores.find(s => s.id === 'cyberracer');
  const tetris = scores.find(s => s.id === 'tetris');
  const neonsimon = scores.find(s => s.id === 'neonsimon');
  const sokoban = scores.find(s => s.id === 'sokoban');

  assert.strictEqual(snake.score, 100);
  assert.strictEqual(bingball.score, 45);
  assert.strictEqual(cyberracer.score, 1234);
  assert.strictEqual(tetris.score, 0); // fallback
  assert.strictEqual(neonsimon.score, 15);
  assert.strictEqual(sokoban.score, 2);
});

test('Leaderboard - getScores() falls back to 0 for missing or NaN/invalid entries', () => {
  // Clear mockStorage
  for (const k of Object.keys(mockStorage)) {
    delete mockStorage[k];
  }

  mockStorage['snake_best'] = 'not-a-number';
  mockStorage['bingball_best'] = 'NaN';
  mockStorage['breakout_best'] = '100.5'; // gets parsed as 100 via parseInt

  const scores = Leaderboard.getScores();

  const snake = scores.find(s => s.id === 'snake');
  const bingball = scores.find(s => s.id === 'bingball');
  const breakout = scores.find(s => s.id === 'breakout');

  assert.strictEqual(snake.score, 0);
  assert.strictEqual(bingball.score, 0);
  assert.strictEqual(breakout.score, 100);
});

test('Leaderboard - getScores() does not propagate errors when localStorage throws', () => {
  // Clear mockStorage and errors
  for (const k of Object.keys(mockStorage)) {
    delete mockStorage[k];
  }
  consoleErrors = [];

  const originalGetItem = global.localStorage.getItem;
  global.localStorage.getItem = () => {
    throw new Error('Simulation of localStorage failure');
  };

  try {
    const scores = Leaderboard.getScores();
    // Verify it returns safe defaults (0 for all scores)
    scores.forEach(s => {
      assert.strictEqual(s.score, 0);
    });
    // Check that console.error was called for each game
    assert.strictEqual(consoleErrors.length, Leaderboard.games.length);
    assert.ok(consoleErrors[0].includes('Failed to load score for'));
  } finally {
    global.localStorage.getItem = originalGetItem;
  }
});

test('Leaderboard - resetAllScores() clears all known game keys and leaves others untouched', () => {
  // Clear mockStorage and errors
  for (const k of Object.keys(mockStorage)) {
    delete mockStorage[k];
  }
  consoleErrors = [];

  // Set known game keys
  Leaderboard.games.forEach(game => {
    mockStorage[game.key] = '50';
  });

  // Set unrelated items
  mockStorage['unrelated_key'] = 'preserve_this';
  mockStorage['arcade-theme'] = 'retro-neon';

  // Call reset
  Leaderboard.resetAllScores();

  // Verify all game keys are removed
  Leaderboard.games.forEach(game => {
    assert.strictEqual(mockStorage[game.key], undefined);
  });

  // Verify unrelated keys are still present
  assert.strictEqual(mockStorage['unrelated_key'], 'preserve_this');
  assert.strictEqual(mockStorage['arcade-theme'], 'retro-neon');
});

test('Leaderboard - resetAllScores() does not propagate errors when localStorage.removeItem throws', () => {
  consoleErrors = [];
  const originalRemoveItem = global.localStorage.removeItem;
  global.localStorage.removeItem = () => {
    throw new Error('Simulation of removeItem failure');
  };

  try {
    // Should not throw
    Leaderboard.resetAllScores();
    assert.strictEqual(consoleErrors.length, Leaderboard.games.length);
    assert.ok(consoleErrors[0].includes('Failed to reset score for'));
  } finally {
    global.localStorage.removeItem = originalRemoveItem;
  }
});

// Restore console.error at the very end
test('cleanup', () => {
  console.error = originalConsoleError;
});
