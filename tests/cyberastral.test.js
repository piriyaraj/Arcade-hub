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

test('CyberAstralEngine - Lifecycle controls & state resets', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);

  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);

  engine.pause();
  assert.strictEqual(engine.paused, true);

  engine.resume();
  assert.strictEqual(engine.paused, false);

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.reset();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.paused, false);
});

test('CyberAstralEngine - Player movement & boundary clamping', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);
  engine.start();

  engine.keys['KeyW'] = true;
  engine.update(5);
  assert.ok(engine.player.y < 300);

  // Move far left beyond boundary
  engine.keys['KeyW'] = false;
  engine.keys['KeyA'] = true;
  for (let i = 0; i < 50; i++) {
    engine.update(5);
  }
  assert.strictEqual(engine.player.x, engine.player.radius);
});

test('CyberAstralEngine - Firing bullets & Tri-beam powerup', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);
  engine.start();

  engine.fire();
  assert.strictEqual(engine.bullets.length, 1);

  engine.player.triBeamTimer = 100;
  engine.fire();
  assert.strictEqual(engine.bullets.length, 4);
});

test('CyberAstralEngine - Shockwave deployment & charge consumption', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);
  engine.start();

  const initialCharges = engine.player.empCharges;
  engine.triggerShockwave();
  assert.strictEqual(engine.player.empCharges, initialCharges - 1);
  assert.strictEqual(engine.shockwaves.length, 1);
});

test('CyberAstralEngine - Powerup collection', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);
  engine.start();

  engine.player.hp = 50;
  engine.powerups.push({
    x: engine.player.x,
    y: engine.player.y,
    type: 'health',
    radius: 12,
    life: 500
  });

  engine.update(1);
  assert.strictEqual(engine.player.hp, 80);
});

test('CyberAstralEngine - Boss spawning & defeat', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);
  engine.start();

  engine.spawnBoss();
  assert.ok(engine.boss !== null);
  const bossHp = engine.boss.hp;

  engine.bullets.push({
    x: engine.boss.x,
    y: engine.boss.y,
    vx: 0, vy: 0,
    radius: 5,
    color: '#38bdf8'
  });

  engine.update(1);
  assert.ok(engine.boss.hp < bossHp);

  engine.boss.hp = 5;
  engine.bullets.push({
    x: engine.boss.x,
    y: engine.boss.y,
    vx: 0, vy: 0,
    radius: 5,
    color: '#38bdf8'
  });
  engine.update(1);
  assert.strictEqual(engine.boss, null);
  assert.ok(engine.score >= 2000);
});

test('CyberAstralEngine - Game Over state & High score persistence', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);
  engine.start();

  engine.score = 5000;
  engine.gameOver();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.bestScore, 5000);
  assert.strictEqual(global.localStorage.getItem('cyberastral_best'), '5000');
});

test('CyberAstralEngine - NaN and invalid input resilience', () => {
  const canvas = createMockCanvas();
  const engine = new CyberAstralEngine(canvas);
  engine.start();

  // Test updating with invalid dt
  assert.doesNotThrow(() => {
    engine.update(NaN);
    engine.update(null);
    engine.update(undefined);
    engine.draw();
  });
});
