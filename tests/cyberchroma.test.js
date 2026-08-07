// Node.js Unit Tests for Cyber Chroma Engine logic
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

// Extract CyberChromaEngine from cyberchroma.html
const htmlPath = path.join(__dirname, '..', 'cyberchroma.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberChromaEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberChromaEngine boundaries in cyberchroma.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberChromaEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberChromaEngine = mockModule.exports.CyberChromaEngine;

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

test('CyberChromaEngine - Initial state', () => {
  const canvas = createMockCanvas();
  const engine = new CyberChromaEngine(canvas);

  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.player.colorIndex, 0);
});

test('CyberChromaEngine - Lifecycle controls & state resets', () => {
  const canvas = createMockCanvas();
  const engine = new CyberChromaEngine(canvas);

  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.ok(engine.enemies.length > 0);
});

test('CyberChromaEngine - Spectrum Color Shift', () => {
  const canvas = createMockCanvas();
  const engine = new CyberChromaEngine(canvas);
  engine.start();

  assert.strictEqual(engine.player.colorIndex, 0);
  engine.cycleColor();
  assert.strictEqual(engine.player.colorIndex, 1);
  engine.cycleColor();
  assert.strictEqual(engine.player.colorIndex, 2);
  engine.cycleColor();
  assert.strictEqual(engine.player.colorIndex, 0);
});

test('CyberChromaEngine - EMP Nova trigger', () => {
  const canvas = createMockCanvas();
  const engine = new CyberChromaEngine(canvas);
  engine.start();

  const initialEmp = engine.player.empEnergy;
  engine.triggerEMP();
  assert.strictEqual(engine.player.empEnergy, initialEmp - 50);
  assert.strictEqual(engine.empWaves.length, 1);
});

test('CyberChromaEngine - Bullet shooting and update step', () => {
  const canvas = createMockCanvas();
  const engine = new CyberChromaEngine(canvas);
  engine.start();

  engine.shootBullet();
  assert.strictEqual(engine.bullets.length, 1);

  engine.update();
  assert.ok(engine.bullets.length >= 0);
});
