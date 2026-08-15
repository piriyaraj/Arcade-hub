// Node.js Unit Tests for Cyber Aurora Engine logic
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

// Extract CyberAuroraEngine from cyberaurora.html
const htmlPath = path.join(__dirname, '..', 'cyberaurora.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberAuroraEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberAuroraEngine boundaries in cyberaurora.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberAuroraEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberAuroraEngine = mockModule.exports.CyberAuroraEngine;

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
      createLinearGradient: () => ({
        addColorStop: () => {}
      }),
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

test('CyberAuroraEngine - Initial state', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAuroraEngine(canvas);

  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.empCharges, 3);
});

test('CyberAuroraEngine - Start game & enemy spawning', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAuroraEngine(canvas);

  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.ok(engine.enemies.length > 0);
});

test('CyberAuroraEngine - Solar Wind EMP Nova trigger', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAuroraEngine(canvas);
  engine.start();

  const initialCharges = engine.player.empCharges;
  engine.triggerEMP();
  assert.strictEqual(engine.player.empCharges, initialCharges - 1);
  assert.strictEqual(engine.empWaves.length, 1);
});

test('CyberAuroraEngine - Polar Magnetic Shield activation', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAuroraEngine(canvas);
  engine.start();

  const initialEnergy = engine.player.energy;
  engine.triggerShield();
  assert.strictEqual(engine.player.shieldActive, true);
  assert.strictEqual(engine.player.energy, initialEnergy - 15);
});

test('CyberAuroraEngine - Shooting auroral plasma beams & position update', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAuroraEngine(canvas);
  engine.start();

  engine.mousePos = { x: 500, y: 300 };
  engine.shootBeam();
  assert.strictEqual(engine.bullets.length, 2); // Twin beams

  const initialX = engine.bullets[0].x;
  engine.update();
  assert.notStrictEqual(engine.bullets[0].x, initialX);
});

test('CyberAuroraEngine - Aurora Shard Collection', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAuroraEngine(canvas);
  engine.start();

  const initialScore = engine.score;
  const initialEnergy = engine.player.energy;
  engine.collectShard({ x: engine.player.x, y: engine.player.y, value: 50, color: '#10b981' });

  assert.strictEqual(engine.score, initialScore + 50);
  assert.strictEqual(engine.player.shardCount, 1);
  assert.ok(engine.player.energy >= initialEnergy);
});

test('CyberAuroraEngine - Game pause & resume toggle', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAuroraEngine(canvas);
  engine.start();

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);
});

test('CyberAuroraEngine - Game Over and high score update', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAuroraEngine(canvas);
  engine.start();

  engine.score = 6400;
  engine.endGame();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.highScore, 6400);
});
