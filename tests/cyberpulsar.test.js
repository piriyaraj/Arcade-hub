// Node.js Unit Tests for Cyber Pulsar Engine logic
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

// Extract CyberPulsarEngine from cyberpulsar.html
const htmlPath = path.join(__dirname, '..', 'cyberpulsar.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberPulsarEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberPulsarEngine boundaries in cyberpulsar.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberPulsarEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberPulsarEngine = mockModule.exports.CyberPulsarEngine;

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
    })
  };
}

test('CyberPulsarEngine - Initial state', () => {
  const canvas = createMockCanvas();
  const engine = new CyberPulsarEngine(canvas);

  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.player.pulsarEnergy, 100);
});

test('CyberPulsarEngine - Lifecycle controls & state resets', () => {
  const canvas = createMockCanvas();
  const engine = new CyberPulsarEngine(canvas);

  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.ok(engine.enemies.length > 0, 'Enemies should spawn on start');

  engine.togglePause();
  assert.strictEqual(engine.paused, true);
  engine.togglePause();
  assert.strictEqual(engine.paused, false);

  engine.gameOver();
  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
});

test('CyberPulsarEngine - Player movement & boundary clamping', () => {
  const canvas = createMockCanvas();
  const engine = new CyberPulsarEngine(canvas);
  engine.start();

  const startX = engine.player.x;
  const startY = engine.player.y;

  engine.keys['KeyD'] = true;
  engine.keys['KeyS'] = true;
  engine.update();

  assert.ok(engine.player.x > startX, 'Player should move right');
  assert.ok(engine.player.y > startY, 'Player should move down');

  engine.player.x = 9999;
  engine.player.y = 9999;
  engine.update();

  assert.ok(engine.player.x <= canvas.width - engine.player.radius, 'Player X clamped');
  assert.ok(engine.player.y <= canvas.height - engine.player.radius, 'Player Y clamped');
});

test('CyberPulsarEngine - Firing Plasma Pulsar & Overcharge', () => {
  const canvas = createMockCanvas();
  const engine = new CyberPulsarEngine(canvas);
  engine.start();

  engine.lastShotTime = 0;
  engine.aimAt(400, 0);
  engine.firePulsar();

  assert.strictEqual(engine.bullets.length, 1);
  assert.strictEqual(engine.bullets[0].damage, 25);

  engine.player.overchargeTimer = 100;
  engine.lastShotTime = 0;
  engine.firePulsar();

  assert.strictEqual(engine.bullets.length, 4);
});

test('CyberPulsarEngine - EMP Nova Shockwave detonation', () => {
  const canvas = createMockCanvas();
  const engine = new CyberPulsarEngine(canvas);
  engine.start();

  const initialEMPs = engine.player.empCharges;
  engine.triggerEMP();

  assert.strictEqual(engine.player.empCharges, initialEMPs - 1);
  assert.strictEqual(engine.empNovas.length, 1);
});

test('CyberPulsarEngine - Relativistic Beam deployment', () => {
  const canvas = createMockCanvas();
  const engine = new CyberPulsarEngine(canvas);
  engine.start();

  engine.player.pulsarEnergy = 100;
  engine.deployRelativisticBeam();

  assert.strictEqual(engine.player.pulsarEnergy, 60);
  assert.strictEqual(engine.relativisticBeams.length, 1);
});

test('CyberPulsarEngine - Boss spawning & defeat', () => {
  const canvas = createMockCanvas();
  const engine = new CyberPulsarEngine(canvas);
  engine.start();

  engine.spawnBoss();
  assert.ok(engine.boss !== null, 'Boss spawned');
  assert.ok(engine.boss.hp > 0, 'Boss has HP');

  engine.boss.hp = 0;
  engine.bullets.push({
    x: engine.boss.x,
    y: engine.boss.y,
    vx: 0, vy: 0,
    radius: 10,
    damage: 100,
    life: 10,
    color: '#ec4899'
  });

  const prevScore = engine.score;
  engine.update();

  assert.strictEqual(engine.boss, null, 'Boss defeated');
  assert.ok(engine.score > prevScore, 'Score increased after boss defeat');
});

test('CyberPulsarEngine - Game over state & high score persistence', () => {
  const canvas = createMockCanvas();
  const engine = new CyberPulsarEngine(canvas);
  engine.start();

  engine.score = 4200;
  engine.gameOver();

  assert.strictEqual(engine.highScore, 4200);
  assert.strictEqual(global.localStorage.store['cyberpulsar_best'], '4200');
});

test('CyberPulsarEngine - Resilient to invalid inputs & NaN edge cases', () => {
  const canvas = createMockCanvas();
  const engine = new CyberPulsarEngine(canvas);
  engine.start();

  engine.aimAt(NaN, Infinity);
  assert.strictEqual(Number.isNaN(engine.player.aimAngle), false);

  engine.update();
  assert.strictEqual(engine.over, false);
});
