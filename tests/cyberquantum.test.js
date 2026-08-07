// Node.js Unit Tests for Cyber Quantum Engine logic
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
  DOMContentLoaded: 'DOMContentLoaded',
  getElementById: () => ({ textContent: '', style: {}, classList: { add: () => {}, remove: () => {} } })
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

global.Leaderboard = {
  saveScore: () => {}
};

// Extract CyberQuantumEngine from cyberquantum.html
const htmlPath = path.join(__dirname, '..', 'cyberquantum.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberQuantumEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberQuantumEngine boundaries in cyberquantum.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberQuantumEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', 'Leaderboard', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange, global.Leaderboard);

const CyberQuantumEngine = mockModule.exports.CyberQuantumEngine;

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

test('CyberQuantumEngine - Initial state', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuantumEngine(canvas);

  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.empCharges, 3);
});

test('CyberQuantumEngine - Start game & enemy spawning', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuantumEngine(canvas);

  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.ok(engine.enemies.length > 0);
});

test('CyberQuantumEngine - Phase Shift trigger & energy consumption', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuantumEngine(canvas);
  engine.start();

  const initialEnergy = engine.player.quantumEnergy;
  engine.triggerPhaseShift();
  assert.strictEqual(engine.player.isPhasing, true);
  assert.strictEqual(engine.player.quantumEnergy, initialEnergy - 20);
});

test('CyberQuantumEngine - EMP Nova trigger', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuantumEngine(canvas);
  engine.start();

  const initialCharges = engine.player.empCharges;
  engine.triggerEMP();
  assert.strictEqual(engine.player.empCharges, initialCharges - 1);
  assert.strictEqual(engine.empNovas.length, 1);
});

test('CyberQuantumEngine - Shooting bullets and position update', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuantumEngine(canvas);
  engine.start();

  engine.mousePos = { x: 600, y: 300 };
  engine.shootQuantumPulse();
  assert.strictEqual(engine.bullets.length, 1);

  const initialX = engine.bullets[0].x;
  engine.update();
  assert.notStrictEqual(engine.bullets[0].x, initialX);
});

test('CyberQuantumEngine - Game pause & resume toggle', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuantumEngine(canvas);
  engine.start();

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);
});

test('CyberQuantumEngine - Game Over and high score update', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuantumEngine(canvas);
  engine.start();

  engine.score = 5000;
  engine.endGame();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.highScore, 5000);
});
