// Node.js Unit Tests for Cyber Defense Matrix Engine logic
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mock browser globals before requiring script code
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

// Extract CyberDefenseEngine from cyberdefense.html
const defensePath = path.join(__dirname, '..', 'cyberdefense.html');
const fileContent = fs.readFileSync(defensePath, 'utf8');

const startIndex = fileContent.indexOf('class CyberDefenseEngine {');
const endIndex = fileContent.indexOf('// Export for Node unit testing environments');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberDefenseEngine boundaries in cyberdefense.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberDefenseEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberDefenseEngine = mockModule.exports.CyberDefenseEngine;

test('CyberDefenseEngine - Initial state', () => {
  const engine = new CyberDefenseEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.health, 100);
  assert.strictEqual(engine.turret.empCharges, 3);
  assert.strictEqual(engine.turret.triShotActive, false);
  assert.strictEqual(engine.level, 1);
});

test('CyberDefenseEngine - Start, pause, resume, togglePause, and reset', () => {
  const engine = new CyberDefenseEngine(null, {});
  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.health, 100);

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

test('CyberDefenseEngine - Turret Aiming & Angle Clamping', () => {
  const engine = new CyberDefenseEngine(null, {});
  engine.start();

  const initialAngle = engine.turret.angle;
  engine.aimTurret(1);
  assert.ok(engine.turret.angle > initialAngle);

  // Test angle clamping bounds
  engine.setTurretAngle(-10);
  assert.ok(engine.turret.angle >= -Math.PI);

  engine.setTurretAngle(10);
  assert.ok(engine.turret.angle <= 0);
});

test('CyberDefenseEngine - Plasma Cannon Firing & Cooldown', () => {
  const engine = new CyberDefenseEngine(null, {});
  engine.start();

  assert.strictEqual(engine.bullets.length, 0);
  const fired = engine.firePlasma();
  assert.strictEqual(fired, true);
  assert.strictEqual(engine.bullets.length, 1);
  assert.ok(engine.turret.fireCooldown > 0);

  // Subsequent fire during cooldown should fail
  const firedAgain = engine.firePlasma();
  assert.strictEqual(firedAgain, false);
  assert.strictEqual(engine.bullets.length, 1);
});

test('CyberDefenseEngine - EMP Shockwave deployment & charge consumption', () => {
  const engine = new CyberDefenseEngine(null, {});
  engine.start();
  engine.spawnEnemy();
  assert.strictEqual(engine.enemies.length, 1);

  assert.strictEqual(engine.turret.empCharges, 3);
  const success = engine.triggerEMP();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.turret.empCharges, 2);
  assert.strictEqual(engine.empPulses.length, 1);
  assert.strictEqual(engine.enemies.length, 0); // Enemy wiped
});

test('CyberDefenseEngine - Powerup Collection & Tri-Shot / Overdrive', () => {
  const engine = new CyberDefenseEngine(null, {});
  engine.start();

  assert.strictEqual(engine.turret.triShotActive, false);
  engine.collectPowerup('triShot');
  assert.strictEqual(engine.turret.triShotActive, true);

  assert.strictEqual(engine.turret.shieldActive, false);
  engine.collectPowerup('shield');
  assert.strictEqual(engine.turret.shieldActive, true);
  assert.strictEqual(engine.turret.shieldHealth, 50);

  assert.strictEqual(engine.turret.overdriveActive, false);
  engine.collectPowerup('overdrive');
  assert.strictEqual(engine.turret.overdriveActive, true);

  engine.damageCore(30);
  assert.strictEqual(engine.turret.shieldHealth, 20);
  assert.strictEqual(engine.health, 100); // Shield absorbed damage
});

test('CyberDefenseEngine - Titan Virus Boss Core Spawning & Defeat', () => {
  const engine = new CyberDefenseEngine(null, {});
  engine.start();

  assert.strictEqual(engine.boss, null);
  engine.spawnBoss();
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.type, 'boss');
  assert.ok(engine.boss.health > 0);

  // Damage boss
  engine.boss.health = 10;
  engine.bullets.push({
    x: engine.boss.x,
    y: engine.boss.y,
    vx: 0,
    vy: 0,
    radius: 10,
    damage: 20,
    color: '#00f0ff'
  });

  engine.update();
  assert.strictEqual(engine.boss, null);
  assert.strictEqual(engine.level, 2);
});

test('CyberDefenseEngine - Game Over State & High Score Persistence', () => {
  global.localStorage.store = {};
  const engine = new CyberDefenseEngine(null, {});
  engine.start();

  engine.setScore(1250);
  engine.damageCore(100);

  assert.strictEqual(engine.health, 0);
  assert.strictEqual(engine.over, true);
  assert.strictEqual(global.localStorage.getItem('cyberdefense_best'), '1250');
});
