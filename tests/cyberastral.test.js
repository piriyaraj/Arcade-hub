// Node.js Unit Tests for Cyber Astral Engine logic
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

global.playSound = global.playSound || (() => {});

// Require shared utilities
const { getBestScore, saveBestScore, checkCollision, checkCircleCollision, clamp, formatScore, randomRange } = require('../utils.js');
global.getBestScore = getBestScore;
global.saveBestScore = saveBestScore;
global.checkCollision = checkCollision;
global.checkCircleCollision = checkCircleCollision;
global.clamp = clamp;
global.formatScore = formatScore;
global.randomRange = randomRange;

// Extract CyberAstralEngine from cyberastral.html
const htmlPath = path.join(__dirname, '..', 'cyberastral.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberAstralEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberAstralEngine boundaries in cyberastral.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberAstralEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberAstralEngine = mockModule.exports.CyberAstralEngine;

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

test('CyberAstralEngine - Initial state', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);

  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.empCharges, 3);
});

test('CyberAstralEngine - Start game & enemy spawning', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);

  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.ok(engine.enemies.length > 0);
  assert.ok(engine.astralNodes.length > 0);
});

test('CyberAstralEngine - EMP Surge trigger', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);
  engine.start();

  const initialCharges = engine.player.empCharges;
  engine.triggerEMP();
  assert.strictEqual(engine.player.empCharges, initialCharges - 1);
  assert.strictEqual(engine.empWaves.length, 1);
});

test('CyberAstralEngine - Deploy Phase Decoy', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);
  engine.start();

  const initialEnergy = engine.player.astralEnergy;
  engine.deployDecoy();
  assert.notStrictEqual(engine.decoy, null);
  assert.strictEqual(engine.player.astralEnergy, initialEnergy - 20);
});

test('CyberAstralEngine - Shooting astral beams', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);
  engine.start();

  engine.mousePos = { x: 500, y: 300 };
  const initialEnergy = engine.player.astralEnergy;
  engine.shootAstralBeam();
  assert.strictEqual(engine.beams.length, 1);
  assert.strictEqual(engine.player.astralEnergy, initialEnergy - 8);

  const initialX = engine.beams[0].x;
  engine.update();
  assert.notStrictEqual(engine.beams[0].x, initialX);
});

test('CyberAstralEngine - Game pause & resume toggle', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);
  engine.start();

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);
});

test('CyberAstralEngine - Game Over and high score update', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);
  engine.start();

  engine.score = 5200;
  engine.endGame();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.highScore, 5200);
});
