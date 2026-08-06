// Node.js Unit Tests for Cyber Eclipse Engine logic
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

// Extract CyberEclipseEngine from cybereclipse.html
const htmlPath = path.join(__dirname, '..', 'cybereclipse.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberEclipseEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberEclipseEngine boundaries in cybereclipse.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberEclipseEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberEclipseEngine = mockModule.exports.CyberEclipseEngine;

test('CyberEclipseEngine - Initial state', () => {
  const engine = new CyberEclipseEngine(null);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.shield, 100);
  assert.strictEqual(engine.player.phase, 'solar');
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.boss, null);
});

test('CyberEclipseEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberEclipseEngine(null);
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

  engine.setScore(12500);
  assert.strictEqual(engine.score, 12500);
  assert.strictEqual(engine.highScore, 12500);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.enemies.length, 0);
  assert.strictEqual(engine.projectiles.length, 0);
});

test('CyberEclipseEngine - Player movement & boundary clamping', () => {
  const engine = new CyberEclipseEngine(null);
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

test('CyberEclipseEngine - Solar / Lunar Phase Toggle', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();

  assert.strictEqual(engine.player.phase, 'solar');
  const toggled = engine.togglePhase();
  assert.strictEqual(toggled, true);
  assert.strictEqual(engine.player.phase, 'lunar');

  // Cooldown prevents immediate spam toggling
  const spamToggled = engine.togglePhase();
  assert.strictEqual(spamToggled, false);
  assert.strictEqual(engine.player.phase, 'lunar');

  // Reset phaseCooldown and toggle back
  engine.phaseCooldown = 0;
  engine.togglePhase();
  assert.strictEqual(engine.player.phase, 'solar');
});

test('CyberEclipseEngine - Firing dark matter plasma & tri-beam powerup', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();

  const fired = engine.fireDarkMatter();
  assert.strictEqual(fired, true);
  assert.strictEqual(engine.projectiles.length, 2); // Twin streams
  assert.strictEqual(engine.projectiles[0].fromPlayer, true);

  // Cooldown prevents immediate refire
  const refired = engine.fireDarkMatter();
  assert.strictEqual(refired, false);
  assert.strictEqual(engine.projectiles.length, 2);

  // Activate tri_beam powerup
  engine.player.fireCooldown = 0;
  engine.player.powerupType = 'tri_beam';
  engine.fireDarkMatter();
  assert.strictEqual(engine.projectiles.length, 5); // 2 previous + 3 tri-beams
});

test('CyberEclipseEngine - EMP Eclipse Nova detonation', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();

  assert.strictEqual(engine.player.empCharges, 3);
  engine.enemies.push({ x: 200, y: 200, hp: 80, maxHp: 80, type: 'solar_drone', radius: 14, speed: 2, color: '#fbbf24' });
  engine.projectiles.push({ x: 200, y: 200, vx: 0, vy: 0, radius: 4, fromPlayer: false, damage: 10 });

  const success = engine.triggerEMP();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.projectiles.length, 0); // Hostile projectile destroyed
  assert.strictEqual(engine.explosions.length, 1);
});

test('CyberEclipseEngine - Boss Eclipse Dreadnought spawning & defeat', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();

  engine.spawnBoss(5);
  assert.ok(engine.boss !== null);
  assert.ok(engine.boss.hp > 0);

  // Hit boss with lethal projectile
  const p = { x: engine.boss.x, y: engine.boss.y, vx: 0, vy: 0, radius: 5, fromPlayer: true, damage: 10000, phase: 'solar' };
  engine.projectiles.push(p);
  engine.update();

  assert.strictEqual(engine.boss, null); // Boss vanquished
  assert.ok(engine.score >= 2500);
});

test('CyberEclipseEngine - Game over state & high score persistence', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();

  engine.setScore(18400);
  engine.gameOver();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(global.localStorage.getItem('cybereclipse_best'), '18400');
});

test('CyberEclipseEngine - Resilient to invalid inputs & NaN edge cases', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();

  engine.movePlayer(NaN, undefined);
  assert.ok(Number.isFinite(engine.player.x));
  assert.ok(Number.isFinite(engine.player.y));

  engine.aimAt(NaN, null);
  assert.ok(Number.isFinite(engine.player.angle));

  engine.setScore(NaN);
  assert.strictEqual(engine.score, 0);
});
