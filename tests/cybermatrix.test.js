// Node.js Unit Tests for Cyber Matrix Engine logic
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mock browser globals before evaluating code
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

// Extract CyberMatrixEngine from cybermatrix.html
const matrixPath = path.join(__dirname, '..', 'cybermatrix.html');
const fileContent = fs.readFileSync(matrixPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberMatrixEngine {');
const endIndex = fileContent.indexOf('// Node module export compatibility');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberMatrixEngine boundaries in cybermatrix.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberMatrixEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberMatrixEngine = mockModule.exports.CyberMatrixEngine;

test('CyberMatrixEngine - Initial state', () => {
  const engine = new CyberMatrixEngine(800, 600);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.comboMultiplier, 1.0);
  assert.strictEqual(engine.phaseState, 'CYAN');
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.empCharges, 3);
});

test('CyberMatrixEngine - Start, pause, resume, togglePause, and reset', () => {
  const engine = new CyberMatrixEngine(800, 600);
  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.player.hp, 100);

  engine.pause();
  assert.strictEqual(engine.paused, true);

  engine.resume();
  assert.strictEqual(engine.paused, false);

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);

  engine.setScore(1200);
  assert.strictEqual(engine.score, 1200);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.enemies.length, 0);
  assert.strictEqual(engine.phaseState, 'CYAN');
});

test('CyberMatrixEngine - Player movement & boundary clamping', () => {
  const engine = new CyberMatrixEngine(800, 600);
  engine.start();

  engine.movePlayer(1, 1);
  assert.ok(engine.player.vx > 0);
  assert.ok(engine.player.vy > 0);

  for (let i = 0; i < 100; i++) {
    engine.update(1.0);
  }

  assert.ok(engine.player.x <= 800 - engine.player.radius);
  assert.ok(engine.player.y <= 600 - engine.player.radius);
});

test('CyberMatrixEngine - Phase shift toggle mechanics', () => {
  const engine = new CyberMatrixEngine(800, 600);
  engine.start();

  assert.strictEqual(engine.phaseState, 'CYAN');
  const res = engine.togglePhase();
  assert.strictEqual(res, true);
  assert.strictEqual(engine.phaseState, 'MAGENTA');

  // Cooldown check (should prevent immediate re-toggle)
  const res2 = engine.togglePhase();
  assert.strictEqual(res2, false);
  assert.strictEqual(engine.phaseState, 'MAGENTA');
});

test('CyberMatrixEngine - Weapon firing & bullet creation', () => {
  const engine = new CyberMatrixEngine(800, 600);
  engine.start();

  const fired = engine.fireWeapon(0);
  assert.strictEqual(fired, true);
  assert.strictEqual(engine.bullets.length, 1);
  assert.strictEqual(engine.bullets[0].phase, 'CYAN');
});

test('CyberMatrixEngine - EMP Shockwave deployment & charge consumption', () => {
  const engine = new CyberMatrixEngine(800, 600);
  engine.start();

  engine.enemyBullets.push({ x: 100, y: 100, vx: 1, vy: 1, radius: 4, damage: 10, phase: 'CYAN', color: '#00f0ff' });
  assert.strictEqual(engine.player.empCharges, 3);

  const empRes = engine.triggerEmpPulse();
  assert.strictEqual(empRes, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.enemyBullets.length, 0);
  assert.strictEqual(engine.empPulses.length, 1);
});

test('CyberMatrixEngine - Matrix Overlord Boss spawning & Phase 2 transition', () => {
  const engine = new CyberMatrixEngine(800, 600);
  engine.start();

  engine.setScore(1000);
  engine.update(1.0);
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.phase, 1);

  // Reduce boss HP below 50%
  engine.boss.hp = 250;
  engine.update(1.0);
  assert.strictEqual(engine.boss.phase, 2);
  assert.strictEqual(engine.boss.color, '#facc15');
});

test('CyberMatrixEngine - Max particle count bounding', () => {
  const engine = new CyberMatrixEngine(800, 600);
  engine.start();

  for (let i = 0; i < 40; i++) {
    engine.spawnParticle(100, 100, '#00f0ff', 5);
  }

  assert.ok(engine.particles.length <= engine.maxParticles);
});

test('CyberMatrixEngine - NaN and invalid input resilience', () => {
  const engine = new CyberMatrixEngine(800, 600);
  engine.start();

  engine.setScore(NaN);
  assert.strictEqual(engine.score, 0);

  engine.movePlayer(NaN, undefined);
  engine.clampVelocity(engine.player, 15);
  assert.strictEqual(Number.isNaN(engine.player.vx), false);
  assert.strictEqual(Number.isNaN(engine.player.vy), false);

  engine.update(NaN);
  assert.strictEqual(engine.over, false);
});
