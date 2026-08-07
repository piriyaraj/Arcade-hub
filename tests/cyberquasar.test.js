// Node.js Unit Tests for Cyber Quasar Engine logic
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

// Extract CyberQuasarEngine from cyberquasar.html
const htmlPath = path.join(__dirname, '..', 'cyberquasar.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberQuasarEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberQuasarEngine boundaries in cyberquasar.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberQuasarEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberQuasarEngine = mockModule.exports.CyberQuasarEngine;

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
      setLineDash: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
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

test('CyberQuasarEngine - Initial state', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);

  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.player.quasarEnergy, 0);
});

test('CyberQuasarEngine - Lifecycle controls & state resets', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);

  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.ok(engine.enemies.length > 0);

  engine.pause();
  assert.strictEqual(engine.paused, true);
  engine.pause();
  assert.strictEqual(engine.paused, false);
});

test('CyberQuasarEngine - EMP trigger and charges', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);

  engine.start();
  assert.strictEqual(engine.player.empCharges, 3);

  const empSuccess = engine.triggerEMP();
  assert.strictEqual(empSuccess, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.empShockwaves.length, 1);
});

test('CyberQuasarEngine - Quasar HyperBeam trigger', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);

  engine.start();
  assert.strictEqual(engine.triggerHyperBeam(), false);

  engine.player.quasarEnergy = 100;
  assert.strictEqual(engine.triggerHyperBeam(), true);
  assert.strictEqual(engine.player.quasarEnergy, 0);
  assert.strictEqual(engine.player.hyperBeamActive, true);
});

test('CyberQuasarEngine - Enemy damage and collision handling', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);

  engine.start();
  const initialEnemies = engine.enemies.length;
  engine.update();
  assert.strictEqual(engine.enemies.length, initialEnemies);
});

test('CyberQuasarEngine - High score saving', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);

  engine.start();
  engine.score = 500;
  engine.gameOver();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.highScore, 500);
});
