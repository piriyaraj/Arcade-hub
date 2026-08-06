// Node.js Unit Tests for Cyber Shadow Engine logic
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

// Extract CyberShadowEngine from cybershadow.html
const htmlPath = path.join(__dirname, '..', 'cybershadow.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberShadowEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberShadowEngine boundaries in cybershadow.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberShadowEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberShadowEngine = mockModule.exports.CyberShadowEngine;

test('CyberShadowEngine - Initial state', () => {
  const engine = new CyberShadowEngine(null);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.shield, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.shadowClones.length, 0);
  assert.strictEqual(engine.boss, null);
});

test('CyberShadowEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberShadowEngine(null);
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

  engine.setScore(7800);
  assert.strictEqual(engine.score, 7800);
  assert.strictEqual(engine.highScore, 7800);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.enemies.length, 0);
  assert.strictEqual(engine.projectiles.length, 0);
});

test('CyberShadowEngine - Player movement, aiming & boundary clamping', () => {
  const engine = new CyberShadowEngine(null);
  engine.start();

  const startX = engine.player.x;
  engine.movePlayer(10, 0);
  assert.ok(engine.player.x > startX);

  // Push beyond right edge
  engine.movePlayer(1000, 0);
  assert.ok(engine.player.x <= engine.width - engine.player.radius);

  // Push beyond top edge
  engine.movePlayer(0, -2000);
  assert.ok(engine.player.y >= engine.player.radius);

  // Aiming logic
  engine.aimAt(500, 200);
  assert.ok(Number.isFinite(engine.player.angle));
});

test('CyberShadowEngine - Shuriken firing & astral blade powerup', () => {
  const engine = new CyberShadowEngine(null);
  engine.start();

  engine.fireShuriken();
  assert.strictEqual(engine.projectiles.length, 1);
  assert.strictEqual(engine.projectiles[0].fromPlayer, true);

  // Cooldown prevents immediate spam
  engine.fireShuriken();
  assert.strictEqual(engine.projectiles.length, 1);

  // Enable astral blade powerup
  engine.player.fireCooldown = 0;
  engine.player.powerupType = 'astral_blade';
  engine.fireShuriken();
  assert.strictEqual(engine.projectiles.length, 4); // 1 previous + 3 triple blade shurikens
});

test('CyberShadowEngine - Shadow Dash execution & clone creation', () => {
  const engine = new CyberShadowEngine(null);
  engine.start();

  assert.strictEqual(engine.shadowClones.length, 0);
  const success = engine.executeShadowDash();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.shadowClones.length, 1);
  assert.strictEqual(engine.player.dashActiveTimer, 18);
  assert.strictEqual(engine.player.invulnerableTimer, 30);

  // Repeated dash fails while on cooldown
  const repeatSuccess = engine.executeShadowDash();
  assert.strictEqual(repeatSuccess, false);
});

test('CyberShadowEngine - EMP Shadow Nova blast', () => {
  const engine = new CyberShadowEngine(null);
  engine.start();

  assert.strictEqual(engine.player.empCharges, 3);
  engine.enemies.push({ x: 200, y: 200, hp: 50, maxHp: 50, type: 'void_ninja', radius: 14, speed: 2, color: '#a855f7' });
  engine.projectiles.push({ x: 200, y: 200, vx: 0, vy: 0, radius: 4, fromPlayer: false, damage: 10 });

  const success = engine.triggerEMP();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.projectiles.length, 0); // Hostile projectile destroyed
  assert.strictEqual(engine.enemies.length, 0); // Weak enemy destroyed
  assert.strictEqual(engine.explosions.length, 1);
});

test('CyberShadowEngine - Boss Shadow Emperor Overlord spawning & defeat', () => {
  const engine = new CyberShadowEngine(null);
  engine.start();

  engine.spawnBoss(1);
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.hp, 1650);

  // Hit boss with lethal projectile
  const p = { x: engine.boss.x, y: engine.boss.y, vx: 0, vy: 0, radius: 5, fromPlayer: true, damage: 1650 };
  engine.projectiles.push(p);
  engine.update();

  assert.strictEqual(engine.boss, null); // Boss destroyed
  assert.ok(engine.score >= 1000);
});

test('CyberShadowEngine - Game over state & high score persistence', () => {
  const engine = new CyberShadowEngine(null);
  engine.start();

  engine.setScore(9400);
  engine.gameOver();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(global.localStorage.getItem('cybershadow_best'), '9400');
});

test('CyberShadowEngine - Resilient to invalid inputs & NaN edge cases', () => {
  const engine = new CyberShadowEngine(null);
  engine.start();

  engine.movePlayer(NaN, undefined);
  assert.ok(Number.isFinite(engine.player.x));
  assert.ok(Number.isFinite(engine.player.y));

  engine.aimAt(NaN, null);
  assert.ok(Number.isFinite(engine.player.angle));

  engine.setScore(NaN);
  assert.strictEqual(engine.score, 0);
});
