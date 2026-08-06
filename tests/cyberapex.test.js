// Node.js Unit Tests for Cyber Apex Engine logic
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

// Extract CyberApexEngine from cyberapex.html
const htmlPath = path.join(__dirname, '..', 'cyberapex.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberApexEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberApexEngine boundaries in cyberapex.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberApexEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberApexEngine = mockModule.exports.CyberApexEngine;

test('CyberApexEngine - Initial state', () => {
  const engine = new CyberApexEngine(null);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.shield, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.barriers.length, 0);
  assert.strictEqual(engine.boss, null);
});

test('CyberApexEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberApexEngine(null);
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

  engine.setScore(9400);
  assert.strictEqual(engine.score, 9400);
  assert.strictEqual(engine.highScore, 9400);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.enemies.length, 0);
  assert.strictEqual(engine.projectiles.length, 0);
});

test('CyberApexEngine - Player movement, aiming & boundary clamping', () => {
  const engine = new CyberApexEngine(null);
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
  engine.aimAt(600, 300);
  assert.ok(Number.isFinite(engine.player.angle));
});

test('CyberApexEngine - Firing twin apex beams & tri-beam powerup', () => {
  const engine = new CyberApexEngine(null);
  engine.start();

  engine.fireApexBeam();
  assert.strictEqual(engine.projectiles.length, 2); // Twin parallel beams
  assert.strictEqual(engine.projectiles[0].fromPlayer, true);

  // Cooldown prevents immediate spam
  engine.fireApexBeam();
  assert.strictEqual(engine.projectiles.length, 2);

  // Enable tri-beam powerup
  engine.player.fireCooldown = 0;
  engine.player.powerupType = 'tri_beam';
  engine.fireApexBeam();
  assert.strictEqual(engine.projectiles.length, 5); // 2 previous + 3 tri-beams
});

test('CyberApexEngine - Phase barrier deployment', () => {
  const engine = new CyberApexEngine(null);
  engine.start();

  assert.strictEqual(engine.barriers.length, 0);
  const success = engine.deployApexBarrier();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.barriers.length, 1);
  assert.strictEqual(engine.player.barrierCooldown, 200);

  // Repeated deploy fails while on cooldown
  const repeatSuccess = engine.deployApexBarrier();
  assert.strictEqual(repeatSuccess, false);
});

test('CyberApexEngine - EMP Nova shockwave', () => {
  const engine = new CyberApexEngine(null);
  engine.start();

  assert.strictEqual(engine.player.empCharges, 3);
  engine.enemies.push({ x: 200, y: 200, hp: 50, maxHp: 50, type: 'drone', radius: 14, speed: 2, color: '#ec4899' });
  engine.projectiles.push({ x: 200, y: 200, vx: 0, vy: 0, radius: 4, fromPlayer: false, damage: 10 });

  const success = engine.triggerEMP();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.projectiles.length, 0); // Hostile projectile destroyed
  assert.strictEqual(engine.enemies.length, 0); // Enemy destroyed
  assert.strictEqual(engine.explosions.length, 1);
});

test('CyberApexEngine - Boss Apex Titan spawning & defeat', () => {
  const engine = new CyberApexEngine(null);
  engine.start();

  engine.spawnBoss(1);
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.hp, 2000);

  // Hit boss with lethal projectile
  const p = { x: engine.boss.x, y: engine.boss.y, vx: 0, vy: 0, radius: 5, fromPlayer: true, damage: 2000 };
  engine.projectiles.push(p);
  engine.update();

  assert.strictEqual(engine.boss, null); // Boss destroyed
  assert.ok(engine.score >= 2500);
});

test('CyberApexEngine - Game over state & high score persistence', () => {
  const engine = new CyberApexEngine(null);
  engine.start();

  engine.setScore(10500);
  engine.gameOver();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(global.localStorage.getItem('cyberapex_best'), '10500');
});

test('CyberApexEngine - Resilient to invalid inputs & NaN edge cases', () => {
  const engine = new CyberApexEngine(null);
  engine.start();

  engine.movePlayer(NaN, undefined);
  assert.ok(Number.isFinite(engine.player.x));
  assert.ok(Number.isFinite(engine.player.y));

  engine.aimAt(NaN, null);
  assert.ok(Number.isFinite(engine.player.angle));

  engine.setScore(NaN);
  assert.strictEqual(engine.score, 0);
});
