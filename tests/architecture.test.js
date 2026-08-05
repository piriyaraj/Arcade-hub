const test = require('node:test');
const assert = require('node:assert');

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; }
};

// Mock window and document
global.window = {
  dispatchEvent: () => {}
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
      remove: () => {},
      add: () => {}
    }
  },
  querySelector: () => null,
  addEventListener: () => {}
};

const documentElementStyle = {};

const { ThemeManager } = require('../theme.js');
const { KeyManager } = require('../input.js');
const { Leaderboard } = require('../leaderboard.js');

test('ThemeManager init and setTheme', () => {
  mockStorage['arcade-theme'] = 'light';

  ThemeManager.init();
  assert.strictEqual(ThemeManager.currentTheme, 'light');
  assert.strictEqual(documentElementStyle['--bg'], '#f3f4f6');

  ThemeManager.setTheme('retro-neon');
  assert.strictEqual(ThemeManager.currentTheme, 'retro-neon');
  assert.strictEqual(mockStorage['arcade-theme'], 'retro-neon');
  assert.strictEqual(documentElementStyle['--bg'], '#05000a');

  // Test getColor
  assert.strictEqual(ThemeManager.getColor('var(--racer-glow)'), '#00ffff');
  assert.strictEqual(ThemeManager.getColor('--racer-glow'), '#00ffff');
});

test('KeyManager bindings and matching', () => {
  mockStorage['arcade-keybindings'] = JSON.stringify({ pause: 'KeyM', action: 'KeyF' });

  KeyManager.init();
  assert.strictEqual(KeyManager.bindings.pause, 'KeyM');
  assert.strictEqual(KeyManager.bindings.action, 'KeyF');

  // Test isKey matches code
  assert.ok(KeyManager.isKey({ code: 'KeyM' }, 'pause'));
  assert.ok(KeyManager.isKey({ code: 'KeyF' }, 'action'));

  // Test isKey matches key
  assert.ok(KeyManager.isKey({ key: 'm' }, 'pause'));
  assert.ok(KeyManager.isKey({ key: 'f' }, 'action'));

  // Test space default/handling
  KeyManager.bindings.action = 'Space';
  assert.ok(KeyManager.isKey({ code: 'Space' }, 'action'));
  assert.ok(KeyManager.isKey({ key: ' ' }, 'action'));
});

test('Leaderboard aggregations', () => {
  // Setup mock scores
  mockStorage['snake_best'] = '120';
  mockStorage['pong_best_streak'] = '5';
  mockStorage['breakout_best'] = '450';
  mockStorage['cyberbreaker_best'] = '850';

  const scores = Leaderboard.getScores();
  const snakeScore = scores.find(s => s.id === 'snake');
  const pongScore = scores.find(s => s.id === 'pong');
  const breakoutScore = scores.find(s => s.id === 'breakout');
  const cyberRacerScore = scores.find(s => s.id === 'cyberracer');
  const cyberBreakerScore = scores.find(s => s.id === 'cyberbreaker');

  assert.strictEqual(snakeScore.score, 120);
  assert.strictEqual(pongScore.score, 5);
  assert.strictEqual(breakoutScore.score, 450);
  assert.strictEqual(cyberRacerScore.score, 0); // Not set
  assert.strictEqual(cyberBreakerScore.score, 850);

  // Test reset operations
  Leaderboard.resetAllScores();
  assert.strictEqual(mockStorage['snake_best'], undefined);
  assert.strictEqual(mockStorage['pong_best_streak'], undefined);
  assert.strictEqual(mockStorage['breakout_best'], undefined);
  assert.strictEqual(mockStorage['cyberbreaker_best'], undefined);
});
