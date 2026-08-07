// Node.js Unit Tests for Cyber Blitz Engine logic
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mock browser globals
global.window = global.window || {
  addEventListener: () => {}
};
global.document = global.document || {
  addEventListener: () => {},
  DOMContentLoaded: 'DOMContentLoaded'
};
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = val.toString(); },
  removeItem(key) { delete this.store[key]; }
};

// Require shared utilities
const { getBestScore, saveBestScore, checkCollision, checkCircleCollision, clamp, formatScore, randomRange } = require('../utils.js');
global.getBestScore = getBestScore;
global.saveBestScore = saveBestScore;
global.checkCollision = checkCollision;
global.checkCircleCollision = checkCircleCollision;
global.clamp = clamp;
global.formatScore = formatScore;
global.randomRange = randomRange;

// Extract CyberBlitzEngine from cyberblitz.html
const htmlPath = path.join(__dirname, '..', 'cyberblitz.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberBlitzEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberBlitzEngine boundaries in cyberblitz.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberBlitzEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberBlitzEngine = mockModule.exports.CyberBlitzEngine;

function createMockCanvas() {
  return {
    width: 800,
    height: 600,
    getContext: () => ({
      clearRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      shadowColor: '',
      shadowBlur: 0,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1
    }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    addEventListener: () => {}
  };
}

test('CyberBlitzEngine - Initial state', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBlitzEngine(canvas);

  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.polarity, 'ALPHA');
});

test('CyberBlitzEngine - Start game & enemy spawning', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBlitzEngine(canvas);

  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.ok(engine.enemies.length > 0);
});

test('CyberBlitzEngine - Polarity swap toggle', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBlitzEngine(canvas);
  engine.start();

  assert.strictEqual(engine.player.polarity, 'ALPHA');
  engine.togglePolarity();
  assert.strictEqual(engine.player.polarity, 'OMEGA');
  engine.togglePolarity();
  assert.strictEqual(engine.player.polarity, 'ALPHA');
});

test('CyberBlitzEngine - Speed Dash trigger', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBlitzEngine(canvas);
  engine.start();

  assert.strictEqual(engine.player.dashActive, 0);
  engine.triggerDash();
  assert.strictEqual(engine.player.dashActive, 12);
  assert.ok(engine.player.dashCooldown > 0);
});

test('CyberBlitzEngine - EMP Shockwave trigger', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBlitzEngine(canvas);
  engine.start();

  const initialCharges = engine.player.empCharges;
  engine.triggerEMP();
  assert.strictEqual(engine.player.empCharges, initialCharges - 1);
  assert.strictEqual(engine.empWaves.length, 1);
});

test('CyberBlitzEngine - Shooting bullets and position update', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBlitzEngine(canvas);
  engine.start();

  engine.shootBullet();
  assert.strictEqual(engine.bullets.length, 1);

  const initialX = engine.bullets[0].x;
  engine.update();
  assert.notStrictEqual(engine.bullets[0].x, initialX);
});

test('CyberBlitzEngine - Game pause & resume toggle', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBlitzEngine(canvas);
  engine.start();

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);
});

test('CyberBlitzEngine - Game Over and high score update', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBlitzEngine(canvas);
  engine.start();

  engine.score = 3500;
  engine.endGame();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.highScore, 3500);
});
