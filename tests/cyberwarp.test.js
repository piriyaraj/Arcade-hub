// Node.js Unit Tests for Cyber Warp Engine logic
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

// Extract CyberWarpEngine from cyberwarp.html
const htmlPath = path.join(__dirname, '..', 'cyberwarp.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberWarpEngine {');
const endIndex = fileContent.indexOf('// Export for Node unit testing environments');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberWarpEngine boundaries in cyberwarp.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberWarpEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberWarpEngine = mockModule.exports.CyberWarpEngine;

test('CyberWarpEngine - Initial state', () => {
  const engine = new CyberWarpEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.player.health, 100);
  assert.strictEqual(engine.player.shield, 50);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.player.warpCooldown, 0);
});

test('CyberWarpEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberWarpEngine(null, {});
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

  engine.setScore(7500);
  assert.strictEqual(engine.score, 7500);
  assert.strictEqual(engine.highScore, 7500);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.drones.length, 0);
  assert.strictEqual(engine.projectiles.length, 0);
});

test('CyberWarpEngine - Movement and arena boundaries', () => {
  const engine = new CyberWarpEngine(null, {});
  engine.start();

  engine.movePlayer(1, 0);
  assert.ok(engine.player.x > 400);

  // Boundary clamping
  engine.movePlayer(100, 100);
  assert.strictEqual(engine.player.x, 800 - engine.player.radius);
  assert.strictEqual(engine.player.y, 600 - engine.player.radius);

  engine.movePlayer(-200, -200);
  assert.strictEqual(engine.player.x, engine.player.radius);
  assert.strictEqual(engine.player.y, engine.player.radius);
});

test('CyberWarpEngine - Pulse firing & tri-pulse powerup', () => {
  const engine = new CyberWarpEngine(null, {});
  engine.start();

  engine.firePulse();
  assert.strictEqual(engine.projectiles.length, 1);
  assert.strictEqual(engine.player.shootCooldown, engine.player.maxShootCooldown);

  // Cooldown prevents immediate re-fire
  engine.firePulse();
  assert.strictEqual(engine.projectiles.length, 1);

  // Enable tri-pulse powerup
  engine.player.shootCooldown = 0;
  engine.player.triPulseTimer = 100;
  engine.firePulse();
  assert.strictEqual(engine.projectiles.length, 4); // 1 + 3 new spread projectiles
});

test('CyberWarpEngine - Phase Warp teleportation', () => {
  const engine = new CyberWarpEngine(null, {});
  engine.start();
  const startX = engine.player.x;

  engine.setPlayerAngle(0); // Facing right
  engine.triggerPhaseWarp();

  assert.ok(engine.player.x > startX);
  assert.strictEqual(engine.warpRifts.length, 1);
  assert.strictEqual(engine.player.warpCooldown, engine.player.maxWarpCooldown);
});

test('CyberWarpEngine - EMP Nova shockwave', () => {
  const engine = new CyberWarpEngine(null, {});
  engine.start();

  engine.enemyProjectiles.push({ x: 100, y: 100, vx: 1, vy: 1, radius: 4 });
  engine.drones.push({ x: 200, y: 200, hp: 100, maxHp: 100, radius: 14, speed: 2, color: '#ec4899' });

  engine.triggerEMP();

  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.enemyProjectiles.length, 0);
  assert.strictEqual(engine.empNovas.length, 1);
  assert.ok(engine.drones[0].hp < 100);
});

test('CyberWarpEngine - Powerup collection', () => {
  const engine = new CyberWarpEngine(null, {});
  engine.start();

  engine.collectPowerup({ type: 'emp', x: 100, y: 100 });
  assert.strictEqual(engine.player.empCharges, 4);

  engine.collectPowerup({ type: 'shield', x: 100, y: 100 });
  assert.strictEqual(engine.player.shield, 90);

  engine.collectPowerup({ type: 'multiplier', x: 100, y: 100 });
  assert.strictEqual(engine.multiplier, 2);
});

test('CyberWarpEngine - Boss Titan spawning & defeat', () => {
  const engine = new CyberWarpEngine(null, {});
  engine.start();
  engine.wave = 5;
  engine.spawnWave();

  assert.notStrictEqual(engine.boss, null);
  assert.strictEqual(engine.boss.color, '#ff007f');

  engine.onBossKilled();
  assert.strictEqual(engine.boss, null);
  assert.ok(engine.score >= 3000);
});

test('CyberWarpEngine - Game over and high score persistence', () => {
  global.localStorage.store = {};
  const engine = new CyberWarpEngine(null, {});
  engine.start();

  engine.damagePlayer(200);
  assert.strictEqual(engine.player.health, 0);
  assert.strictEqual(engine.over, true);
  assert.strictEqual(global.localStorage.getItem('cyberwarp_best'), '0');

  engine.reset();
  engine.start();
  engine.setScore(9200);
  engine.damagePlayer(200);
  assert.strictEqual(global.localStorage.getItem('cyberwarp_best'), '9200');
});

test('CyberWarpEngine - Resilient to invalid inputs & NaN edge cases', () => {
  const engine = new CyberWarpEngine(null, {});
  engine.start();

  engine.setScore(NaN);
  assert.strictEqual(engine.score, 0);

  engine.setPlayerAngle(NaN);
  assert.strictEqual(engine.player.angle, 0);

  engine.movePlayer(NaN, undefined);
  assert.strictEqual(engine.player.x, 400);

  engine.update();
  engine.draw();
  assert.strictEqual(engine.over, false);
});
