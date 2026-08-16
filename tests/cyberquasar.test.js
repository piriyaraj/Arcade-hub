// Node.js Unit Tests for Cyber Quasar Engine logic
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mock browser globals
global.window = global.window || {
  addEventListener: () => {},
  audioManager: {
    playLaser: () => {},
    playExplosion: () => {},
    playHit: () => {},
    playPowerup: () => {},
    playBounce: () => {},
    toggleMute: () => {}
  }
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
      createRadialGradient: () => ({
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

test('CyberQuasarEngine - Initial state', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);

  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.energy, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.player.hyperCharge, 0);
  assert.strictEqual(engine.player.shieldActive, false);
});

test('CyberQuasarEngine - Start game & enemy spawning', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);

  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.ok(engine.enemies.length > 0);
});

test('CyberQuasarEngine - EMP Quasar Nova trigger', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);
  engine.start();

  const initialCharges = engine.player.empCharges;
  engine.triggerEMP();
  assert.strictEqual(engine.player.empCharges, initialCharges - 1);
  assert.strictEqual(engine.empWaves.length, 1);
  assert.strictEqual(engine.enemyBullets.length, 0);
});

test('CyberQuasarEngine - Accretion Kinetic Shield toggle', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);
  engine.start();

  const initialEnergy = engine.player.energy;
  engine.triggerShield();
  assert.strictEqual(engine.player.shieldActive, true);
  assert.strictEqual(engine.player.energy, initialEnergy - 10);

  // Toggle off
  engine.triggerShield();
  assert.strictEqual(engine.player.shieldActive, false);
});

test('CyberQuasarEngine - Hyper-Relativistic Jet Beam trigger', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);
  engine.start();

  engine.player.hyperCharge = 100;
  engine.triggerHyperBeam();
  assert.strictEqual(engine.player.hyperCharge, 0);
  assert.strictEqual(engine.player.hyperBeamActive, true);
  assert.ok(engine.player.hyperBeamTimer > 0);
});

test('CyberQuasarEngine - Shooting beams & projectile updates', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);
  engine.start();

  engine.mousePos = { x: 400, y: 100 };
  engine.shootBeam();
  assert.ok(engine.bullets.length > 0);

  const initialY = engine.bullets[0].y;
  engine.update();
  assert.notStrictEqual(engine.bullets[0].y, initialY);
});

test('CyberQuasarEngine - Tri-beam overcharge shooting', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);
  engine.start();

  engine.player.overchargeTime = 300;
  engine.player.lastShot = 0;
  engine.shootBeam();
  assert.strictEqual(engine.bullets.length, 3);
});

test('CyberQuasarEngine - Game pause & resume toggle', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);
  engine.start();

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);
});

test('CyberQuasarEngine - Game Over and high score update', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);
  engine.start();

  engine.score = 7800;
  engine.endGame();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.highScore, 7800);
});

test('CyberQuasarEngine - Reset functionality', () => {
  const canvas = createMockCanvas();
  const engine = new CyberQuasarEngine(canvas);
  engine.start();
  engine.score = 3000;
  engine.wave = 4;

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
});
