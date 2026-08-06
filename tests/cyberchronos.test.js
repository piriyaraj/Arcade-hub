// Node.js Unit Tests for Cyber Chronos Engine logic
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

// Extract CyberChronosEngine from cyberchronos.html
const htmlPath = path.join(__dirname, '..', 'cyberchronos.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberChronosEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberChronosEngine boundaries in cyberchronos.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberChronosEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberChronosEngine = mockModule.exports.CyberChronosEngine;

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
    addEventListener: () => {}
  };
}

test('CyberChronosEngine - Initial state', () => {
  const canvas = createMockCanvas();
  const engine = new CyberChronosEngine(canvas);

  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.player.slowEnergy, 100);
});

test('CyberChronosEngine - Lifecycle controls & state resets', () => {
  const canvas = createMockCanvas();
  const engine = new CyberChronosEngine(canvas);

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

test('CyberChronosEngine - Player movement & boundary clamping', () => {
  const canvas = createMockCanvas();
  const engine = new CyberChronosEngine(canvas);
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

test('CyberChronosEngine - Firing Chrono Cannon', () => {
  const canvas = createMockCanvas();
  const engine = new CyberChronosEngine(canvas);
  engine.start();

  engine.lastShotTime = 0;
  engine.aimAt(400, 0);
  engine.fireChronoCannon();

  assert.strictEqual(engine.bullets.length, 1);
  assert.strictEqual(engine.bullets[0].damage, 25);
});

test('CyberChronosEngine - EMP Time-Rift Nova shockwave detonation', () => {
  const canvas = createMockCanvas();
  const engine = new CyberChronosEngine(canvas);
  engine.start();

  const initialEMPs = engine.player.empCharges;
  engine.triggerEMP();

  assert.strictEqual(engine.player.empCharges, initialEMPs - 1);
  assert.strictEqual(engine.empNovas.length, 1);
});

test('CyberChronosEngine - Time-Dilation field activation', () => {
  const canvas = createMockCanvas();
  const engine = new CyberChronosEngine(canvas);
  engine.start();

  engine.player.slowEnergy = 100;
  engine.triggerTimeDilation();

  assert.strictEqual(engine.player.slowEnergy, 0);
  assert.strictEqual(engine.player.isTimeSlowActive, true);
});

test('CyberChronosEngine - Boss spawning & defeat', () => {
  const canvas = createMockCanvas();
  const engine = new CyberChronosEngine(canvas);
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
    color: '#06b6d4'
  });

  const prevScore = engine.score;
  engine.update();

  assert.strictEqual(engine.boss, null, 'Boss defeated');
  assert.ok(engine.score > prevScore, 'Score increased after boss defeat');
});

test('CyberChronosEngine - Game over state & high score persistence', () => {
  const canvas = createMockCanvas();
  const engine = new CyberChronosEngine(canvas);
  engine.start();

  engine.score = 5400;
  engine.gameOver();

  assert.strictEqual(engine.highScore, 5400);
  assert.strictEqual(global.localStorage.store['cyberchronos_best'], '5400');
});

test('CyberChronosEngine - Resilient to invalid inputs & NaN edge cases', () => {
  const canvas = createMockCanvas();
  const engine = new CyberChronosEngine(canvas);
  engine.start();

  engine.aimAt(NaN, Infinity);
  assert.strictEqual(Number.isNaN(engine.player.aimAngle), false);

  engine.update();
  assert.strictEqual(engine.over, false);
});
