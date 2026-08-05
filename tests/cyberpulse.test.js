// Node.js Unit Tests for Cyber Pulse Engine logic
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

// Extract CyberPulseEngine from cyberpulse.html
const pulsePath = path.join(__dirname, '..', 'cyberpulse.html');
const fileContent = fs.readFileSync(pulsePath, 'utf8');

const startIndex = fileContent.indexOf('class CyberPulseEngine {');
const endIndex = fileContent.indexOf('// Export for Node unit testing environments');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberPulseEngine boundaries in cyberpulse.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberPulseEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberPulseEngine = mockModule.exports.CyberPulseEngine;

test('CyberPulseEngine - Initial state', () => {
  const engine = new CyberPulseEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.player.health, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.level, 1);
});

test('CyberPulseEngine - Start, pause, resume, togglePause, and reset', () => {
  const engine = new CyberPulseEngine(null, {});
  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.player.health, 100);

  engine.pause();
  assert.strictEqual(engine.paused, true);

  engine.resume();
  assert.strictEqual(engine.paused, false);

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);

  engine.setScore(800);
  assert.strictEqual(engine.score, 800);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.enemies.length, 0);
});

test('CyberPulseEngine - Player movement & boundary clamping', () => {
  const engine = new CyberPulseEngine(null, {});
  engine.start();

  engine.movePlayer(1, 1);
  assert.ok(engine.player.vx > 0);
  assert.ok(engine.player.vy > 0);

  // Update multiple frames to reach border
  for (let i = 0; i < 100; i++) {
    engine.update();
  }

  // Bounds check (CANVAS_WIDTH = 800, CANVAS_HEIGHT = 600)
  assert.ok(engine.player.x <= 800 - engine.player.radius);
  assert.ok(engine.player.y <= 600 - engine.player.radius);

  // Move left and up
  engine.movePlayer(-1, -1);
  for (let i = 0; i < 100; i++) {
    engine.update();
  }
  assert.ok(engine.player.x >= engine.player.radius);
  assert.ok(engine.player.y >= engine.player.radius);
});

test('CyberPulseEngine - Weapon Firing & Cooldown', () => {
  const engine = new CyberPulseEngine(null, {});
  engine.start();

  assert.strictEqual(engine.bullets.length, 0);
  const fired = engine.fireWeapon();
  assert.strictEqual(fired, true);
  assert.strictEqual(engine.bullets.length, 1);

  // Immediate repeat fire blocked by cooldown
  const firedAgain = engine.fireWeapon();
  assert.strictEqual(firedAgain, false);
  assert.strictEqual(engine.bullets.length, 1);

  // Advance frames past cooldown
  for (let i = 0; i < 12; i++) {
    engine.update();
  }
  const firedThird = engine.fireWeapon();
  assert.strictEqual(firedThird, true);
  assert.strictEqual(engine.bullets.length, 2);
});

test('CyberPulseEngine - EMP Shockwave pulse deployment & charge consumption', () => {
  const engine = new CyberPulseEngine(null, {});
  engine.start();

  assert.strictEqual(engine.player.empCharges, 3);
  const success = engine.triggerEmpPulse();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.empPulses.length, 1);

  // Deplete charges
  engine.triggerEmpPulse();
  engine.triggerEmpPulse();
  assert.strictEqual(engine.player.empCharges, 0);

  const failOnEmpty = engine.triggerEmpPulse();
  assert.strictEqual(failOnEmpty, false);
});

test('CyberPulseEngine - Powerup Collection & Kinetic Shield', () => {
  const engine = new CyberPulseEngine(null, {});
  engine.start();

  assert.strictEqual(engine.player.shieldTime, 120); // Initial start shield
  engine.applyPowerup('kinetic-shield');
  assert.strictEqual(engine.player.shieldTime, 350);

  engine.takeDamage(40);
  assert.strictEqual(engine.player.health, 100); // Absorbed by shield!

  engine.applyPowerup('tri-shot');
  assert.strictEqual(engine.player.triShotTime, 400);

  engine.applyPowerup('emp-charge');
  assert.strictEqual(engine.player.empCharges, 4);
});

test('CyberPulseEngine - Titan Pulse Boss Spawning & Defeat', () => {
  const engine = new CyberPulseEngine(null, {});
  engine.start();

  assert.strictEqual(engine.boss, null);
  engine.spawnBoss();
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.name, 'TITAN PULSE CORE');
  assert.ok(engine.boss.health > 0);

  // Defeat Boss
  engine.boss.health = 10;
  engine.bullets.push({
    x: engine.boss.x,
    y: engine.boss.y,
    vx: 0,
    vy: 0,
    radius: 10,
    damage: 20,
    color: '#a855f7'
  });

  engine.update();
  assert.strictEqual(engine.boss, null);
  assert.strictEqual(engine.level, 2);
});

test('CyberPulseEngine - Game Over State & High Score Persistence', () => {
  global.localStorage.store = {};
  const engine = new CyberPulseEngine(null, {});
  engine.start();

  engine.setScore(3200);
  engine.player.shieldTime = 0;
  engine.takeDamage(150);

  assert.strictEqual(engine.player.health, 0);
  assert.strictEqual(engine.over, true);
  assert.strictEqual(global.localStorage.getItem('cyberpulse_best'), '3200');
});

test('CyberPulseEngine - NaN and invalid input resilience', () => {
  const engine = new CyberPulseEngine(null, {});
  engine.start();
  engine.player.shieldTime = 0; // Disable start shield for damage test

  engine.setScore(NaN);
  assert.strictEqual(engine.score, 0);

  engine.movePlayer('invalid', null);
  assert.strictEqual(engine.player.vx, 0);
  assert.strictEqual(engine.player.vy, 0);

  engine.takeDamage('invalid');
  assert.strictEqual(engine.player.health, 90); // Default damage 10
});

test('CyberPulseEngine - Combo multiplier accumulation and damage reset', () => {
  const engine = new CyberPulseEngine(null, {});
  engine.start();
  engine.player.shieldTime = 0;

  assert.strictEqual(engine.comboCount, 0);
  assert.strictEqual(engine.comboMultiplier, 1);

  // Spawn an enemy and hit with bullet to trigger destruction & combo
  engine.enemies.push({
    type: 'seeker',
    x: 200,
    y: 200,
    vx: 0,
    vy: 0,
    radius: 14,
    health: 10,
    maxHealth: 25,
    points: 100,
    color: '#ff007f'
  });
  engine.bullets.push({
    x: 200,
    y: 200,
    vx: 0,
    vy: 0,
    radius: 5,
    damage: 20,
    color: '#00f0ff'
  });

  engine.update();
  assert.strictEqual(engine.comboCount, 1);
  assert.strictEqual(engine.comboMultiplier, 1);
  assert.ok(engine.score > 0);

  // Trigger damage to reset combo
  engine.takeDamage(10);
  assert.strictEqual(engine.comboCount, 0);
  assert.strictEqual(engine.comboMultiplier, 1);
});

test('CyberPulseEngine - Max particle count bounding', () => {
  const engine = new CyberPulseEngine(null, {});
  engine.start();

  // Create excess explosions
  for (let i = 0; i < 35; i++) {
    engine.createExplosion(400, 300, '#00f0ff', 10);
  }

  assert.ok(engine.particles.length <= engine.maxParticles);
});

test('CyberPulseEngine - Titan Pulse Boss Phase 2 transition below 50% HP', () => {
  const engine = new CyberPulseEngine(null, {});
  engine.start();
  engine.spawnBoss();

  assert.strictEqual(engine.boss.phase, 1);
  const initialMaxHp = engine.boss.maxHealth;

  // Reduce boss health below 50%
  engine.boss.health = Math.floor(initialMaxHp * 0.4);
  engine.update();

  assert.strictEqual(engine.boss.phase, 2);
  assert.strictEqual(engine.boss.color, '#ff007f');
});
