// Node.js Unit Tests for Cyber Overdrive Engine logic
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

// Extract CyberOverdriveEngine from cyberoverdrive.html
const overdrivePath = path.join(__dirname, '..', 'cyberoverdrive.html');
const fileContent = fs.readFileSync(overdrivePath, 'utf8');

const startIndex = fileContent.indexOf('class CyberOverdriveEngine {');
const endIndex = fileContent.indexOf('// Node.js module export for unit tests');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberOverdriveEngine boundaries in cyberoverdrive.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberOverdriveEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberOverdriveEngine = mockModule.exports.CyberOverdriveEngine;

test('CyberOverdriveEngine - Initial state', () => {
  const engine = new CyberOverdriveEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.lives, 3);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.overdriveActive, false);
  assert.strictEqual(engine.wave, 1);
});

test('CyberOverdriveEngine - Start, pause, resume, togglePause, and reset', () => {
  const engine = new CyberOverdriveEngine(null, {});
  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.ok(engine.enemies.length > 0);

  engine.pause();
  assert.strictEqual(engine.paused, true);

  engine.resume();
  assert.strictEqual(engine.paused, false);

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);

  engine.setScore(500);
  assert.strictEqual(engine.score, 500);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.enemies.length, 0);
});

test('CyberOverdriveEngine - Player movement & boundary clamping', () => {
  const engine = new CyberOverdriveEngine(null, {});
  engine.start();

  // Move right and down
  engine.movePlayer(1, 1);
  assert.ok(engine.player.vx > 0);
  assert.ok(engine.player.vy > 0);

  // Update over multiple frames to hit bounds
  for (let i = 0; i < 50; i++) {
    engine.update();
  }
  assert.ok(engine.player.x <= engine.CANVAS_WIDTH - engine.player.radius);
  assert.ok(engine.player.y <= engine.CANVAS_HEIGHT - engine.player.radius);

  // Set position directly
  engine.setPlayerPosition(400, 300);
  assert.strictEqual(engine.player.x, 400);
  assert.strictEqual(engine.player.y, 300);
});

test('CyberOverdriveEngine - Plasma firing & Tri-shot mode', () => {
  const engine = new CyberOverdriveEngine(null, {});
  engine.start();

  const fired = engine.firePlasma();
  assert.strictEqual(fired, true);
  assert.strictEqual(engine.plasmaBullets.length, 1);

  // Cooldown check
  const firedAgain = engine.firePlasma();
  assert.strictEqual(firedAgain, false); // in cooldown

  engine.player.fireCooldown = 0;
  engine.applyPowerup('tri-shot');
  assert.strictEqual(engine.player.triShotActive, true);

  const triFired = engine.firePlasma();
  assert.strictEqual(triFired, true);
  assert.strictEqual(engine.plasmaBullets.length, 4); // 1 previous + 3 new
});

test('CyberOverdriveEngine - EMP Shockwave deployment', () => {
  const engine = new CyberOverdriveEngine(null, {});
  engine.start();

  assert.strictEqual(engine.player.empCharges, 2);

  // Add enemy bullet
  engine.enemyBullets.push({ x: 200, y: 200, vx: 0, vy: 4, radius: 4 });
  assert.strictEqual(engine.enemyBullets.length, 1);

  const empUsed = engine.triggerEmpPulse();
  assert.strictEqual(empUsed, true);
  assert.strictEqual(engine.player.empCharges, 1);
  assert.strictEqual(engine.enemyBullets.length, 0);
  assert.strictEqual(engine.empPulses.length, 1);

  // Deplete charges
  engine.triggerEmpPulse();
  assert.strictEqual(engine.player.empCharges, 0);

  const empFailed = engine.triggerEmpPulse();
  assert.strictEqual(empFailed, false);
});

test('CyberOverdriveEngine - Overdrive Surge & Energy system', () => {
  const engine = new CyberOverdriveEngine(null, {});
  engine.start();

  assert.strictEqual(engine.overdriveActive, false);
  engine.triggerOverdrive(200);

  assert.strictEqual(engine.overdriveActive, true);
  assert.strictEqual(engine.overdriveTimer, 200);
  assert.ok(engine.multiplier >= 3);

  // Energy powerup
  engine.applyPowerup('energy');
  assert.ok(engine.player.energy > 0);
});

test('CyberOverdriveEngine - Powerup collection & stacking', () => {
  const engine = new CyberOverdriveEngine(null, {});
  engine.start();

  engine.takeDamage(1);
  assert.strictEqual(engine.lives, 2);

  engine.applyPowerup('repair');
  assert.strictEqual(engine.lives, 3);

  engine.applyPowerup('emp-charge');
  assert.strictEqual(engine.player.empCharges, 3); // Max emp

  engine.applyPowerup('matrix-shield');
  assert.strictEqual(engine.player.shieldActive, true);

  engine.applyPowerup('multiplier');
  assert.strictEqual(engine.multiplier, 2);
});

test('CyberOverdriveEngine - Velocity clamping & NaN resilience', () => {
  const engine = new CyberOverdriveEngine(null, {});
  engine.start();

  const badBullet = { x: 100, y: 100, vx: NaN, vy: NaN, radius: 5 };
  engine.clampVelocity(badBullet);
  assert.strictEqual(badBullet.vx, 0);
  assert.strictEqual(badBullet.vy, 0);

  const fastBullet = { x: 100, y: 100, vx: 50, vy: 50, radius: 5 };
  engine.clampVelocity(fastBullet);
  assert.ok(Math.hypot(fastBullet.vx, fastBullet.vy) <= 16.1);
});

test('CyberOverdriveEngine - Boss Dreadnought Spawning & Defeat', () => {
  const engine = new CyberOverdriveEngine(null, {});
  engine.start();

  assert.strictEqual(engine.boss, null);
  engine.spawnBoss();
  assert.ok(engine.boss !== null);
  assert.ok(engine.boss.name.includes('DREADNOUGHT CORE'));
  assert.ok(engine.boss.health > 0);

  // Hit boss with plasma bullet
  engine.plasmaBullets.push({
    x: engine.boss.x,
    y: engine.boss.y,
    vx: 0,
    vy: -10,
    radius: 5,
    damage: 20
  });

  const initialHp = engine.boss.health;
  engine.update();
  assert.strictEqual(engine.boss.health, initialHp - 12);
});

test('CyberOverdriveEngine - Game Over state & High score persistence', () => {
  global.localStorage.store = {};
  const engine = new CyberOverdriveEngine(null, {});
  engine.start();

  engine.setScore(950);
  engine.takeDamage(3);

  assert.strictEqual(engine.lives, 0);
  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(global.localStorage.getItem('cyberoverdrive_best'), '950');
});
