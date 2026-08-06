// Node.js Unit Tests for Cyber Tempest Engine logic
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

// Extract CyberTempestEngine from cybertempest.html
const htmlPath = path.join(__dirname, '..', 'cybertempest.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberTempestEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberTempestEngine boundaries in cybertempest.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberTempestEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberTempestEngine = mockModule.exports.CyberTempestEngine;

test('CyberTempestEngine - Initial state', () => {
  const engine = new CyberTempestEngine(null);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.shield, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.boss, null);
});

test('CyberTempestEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberTempestEngine(null);
  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);

  engine.pause();
  assert.strictEqual(engine.paused, true);

  engine.resume();
  assert.strictEqual(engine.paused, false);

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);

  engine.setScore(18000);
  assert.strictEqual(engine.score, 18000);
  assert.strictEqual(engine.highScore, 18000);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.enemies.length, 0);
  assert.strictEqual(engine.projectiles.length, 0);
});

test('CyberTempestEngine - Player movement & boundary clamping', () => {
  const engine = new CyberTempestEngine(null);
  engine.start();

  const startX = engine.player.x;
  engine.movePlayer(10, 0);
  assert.ok(engine.player.x > startX);

  // Clamping right boundary
  engine.movePlayer(1000, 0);
  assert.ok(engine.player.x <= engine.width - engine.player.radius);

  // Clamping top boundary
  engine.movePlayer(0, -2000);
  assert.ok(engine.player.y >= engine.player.radius);

  // Aiming logic
  engine.aimAt(400, 200);
  assert.ok(Number.isFinite(engine.player.angle));
});

test('CyberTempestEngine - Firing Thunderbolt & Overdrive triple stream', () => {
  const engine = new CyberTempestEngine(null);
  engine.start();

  const fired = engine.fireThunderbolt();
  assert.strictEqual(fired, true);
  assert.ok(engine.projectiles.length >= 1);
  assert.strictEqual(engine.projectiles[0].fromPlayer, true);

  // Cooldown prevents immediate refire
  const refired = engine.fireThunderbolt();
  assert.strictEqual(refired, false);

  // Activate tempest overdrive
  engine.player.fireCooldown = 0;
  engine.activateTempestOverdrive();
  assert.strictEqual(engine.player.inTempestOverdrive, true);

  engine.fireThunderbolt();
  assert.ok(engine.projectiles.length >= 4); // Standard + triple spread
});

test('CyberTempestEngine - EMP Shockwave Nova detonation', () => {
  const engine = new CyberTempestEngine(null);
  engine.start();

  assert.strictEqual(engine.player.empCharges, 3);
  engine.enemies.push({ x: 200, y: 200, hp: 80, maxHp: 80, type: 'drone', radius: 14, speed: 2, color: '#38bdf8' });
  engine.projectiles.push({ x: 200, y: 200, vx: 0, vy: 0, radius: 4, fromPlayer: false, damage: 10 });

  const success = engine.triggerEMP();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.projectiles.length, 0); // Hostile projectile destroyed
  assert.ok(engine.empShockwaves.length > 0);
  assert.ok(engine.particles.length > 0);
});

test('CyberTempestEngine - Boss spawning & defeat', () => {
  const engine = new CyberTempestEngine(null);
  engine.start();

  engine.spawnBoss(3);
  assert.ok(engine.boss !== null);
  assert.ok(engine.boss.hp > 0);

  // Hit boss with lethal projectile
  const p = { x: engine.boss.x, y: engine.boss.y, vx: 0, vy: 0, radius: 5, fromPlayer: true, damage: 10000 };
  engine.projectiles.push(p);
  engine.update();

  assert.strictEqual(engine.boss, null); // Boss vanquished
  assert.ok(engine.score >= 3000);
});

test('CyberTempestEngine - Game over state & high score persistence', () => {
  const engine = new CyberTempestEngine(null);
  engine.start();

  engine.setScore(25000);
  engine.gameOver();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(global.localStorage.getItem('cybertempest_best'), '25000');
});

test('CyberTempestEngine - Resilient to invalid inputs & NaN edge cases', () => {
  const engine = new CyberTempestEngine(null);
  engine.start();

  engine.movePlayer(NaN, undefined);
  assert.ok(Number.isFinite(engine.player.x));
  assert.ok(Number.isFinite(engine.player.y));

  engine.aimAt(NaN, null);
  assert.ok(Number.isFinite(engine.player.angle));

  engine.setScore(NaN);
  assert.strictEqual(engine.score, 0);
});
