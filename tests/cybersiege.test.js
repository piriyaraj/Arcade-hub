// Node.js Unit Tests for Cyber Siege Engine logic
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

// Extract CyberSiegeEngine from cybersiege.html
const siegePath = path.join(__dirname, '..', 'cybersiege.html');
const fileContent = fs.readFileSync(siegePath, 'utf8');

const startIndex = fileContent.indexOf('class CyberSiegeEngine {');
const endIndex = fileContent.indexOf('// ─── DOM Initialization');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberSiegeEngine boundaries in cybersiege.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberSiegeEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberSiegeEngine = mockModule.exports.CyberSiegeEngine;

test('CyberSiegeEngine - Initial state', () => {
  const engine = new CyberSiegeEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.player.health, 100);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.player.shieldActive, false);
  assert.strictEqual(engine.player.weaponLevel, 1);
});

test('CyberSiegeEngine - Start, pause, resume, togglePause, and reset', () => {
  const engine = new CyberSiegeEngine(null, {});
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

  engine.setScore(300);
  assert.strictEqual(engine.score, 300);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.player.health, 100);
});

test('CyberSiegeEngine - Player movement & boundary clamping', () => {
  const engine = new CyberSiegeEngine(null, {});
  engine.start();

  // Move right and down
  engine.movePlayer(1, 1);
  assert.ok(engine.player.vx > 0);
  assert.ok(engine.player.vy > 0);

  // Update over many frames to hit right border
  for (let i = 0; i < 200; i++) {
    engine.update();
  }

  assert.ok(engine.player.x <= engine.width - engine.player.width / 2);
});

test('CyberSiegeEngine - Weapon Firing and Upgrades', () => {
  const engine = new CyberSiegeEngine(null, {});
  engine.start();

  const fired1 = engine.fireBullet();
  assert.strictEqual(fired1, true);
  assert.strictEqual(engine.bullets.length, 1);

  // Immediate fire should fail due to cooldown
  const fired2 = engine.fireBullet();
  assert.strictEqual(fired2, false);

  // Apply weapon upgrade powerup
  engine.applyPowerup('weapon');
  assert.strictEqual(engine.player.weaponLevel, 2);

  // Fast forward cooldown frames
  for (let i = 0; i < 20; i++) engine.update();

  engine.fireBullet();
  // Level 2 fires double bullets!
  assert.ok(engine.bullets.length >= 3);
});

test('CyberSiegeEngine - Kinetic Shield Mechanics & Reflection', () => {
  const engine = new CyberSiegeEngine(null, {});
  engine.start();

  const activated = engine.activateShield();
  assert.strictEqual(activated, true);
  assert.strictEqual(engine.player.shieldActive, true);
  assert.ok(engine.player.shieldTime > 0);

  // Spawn enemy bullet heading towards player
  engine.enemyBullets.push({
    x: engine.player.x,
    y: engine.player.y - 10,
    vx: 0,
    vy: 5,
    color: '#ff007f'
  });

  engine.update();

  // Bullet should be reflected upward!
  assert.strictEqual(engine.enemyBullets.length, 1);
  assert.strictEqual(engine.enemyBullets[0].reflected, true);
  assert.ok(engine.enemyBullets[0].vy < 0);
});

test('CyberSiegeEngine - EMP Shockwave Mechanics', () => {
  const engine = new CyberSiegeEngine(null, {});
  engine.start();

  // Populate enemy bullets & enemies
  engine.enemyBullets.push({ x: 100, y: 200, vx: 0, vy: 5 });
  engine.enemyBullets.push({ x: 300, y: 400, vx: 0, vy: 5 });
  engine.enemies.push({ type: 'scout', x: 200, y: 100, radius: 16, health: 50, color: '#ff007f' });

  const initialCharges = engine.player.empCharges;
  const triggered = engine.triggerEmpPulse();

  assert.strictEqual(triggered, true);
  assert.strictEqual(engine.player.empCharges, initialCharges - 1);
  assert.strictEqual(engine.enemyBullets.length, 0); // All enemy bullets cleared!
  assert.strictEqual(engine.enemies[0].health, 0); // Enemy damaged by 50
  assert.strictEqual(engine.empPulses.length, 1);
});

test('CyberSiegeEngine - Power-up Application', () => {
  const engine = new CyberSiegeEngine(null, {});
  engine.start();

  engine.player.health = 50;
  engine.applyPowerup('repair');
  assert.strictEqual(engine.player.health, 80);

  engine.applyPowerup('multiplier');
  assert.strictEqual(engine.multiplier, 3);

  engine.applyPowerup('emp');
  assert.strictEqual(engine.player.empCharges, 3);
});

test('CyberSiegeEngine - Boss Spawn, Damage, and Defeat', () => {
  const engine = new CyberSiegeEngine(null, {});
  engine.start();

  engine.spawnBoss();
  assert.ok(engine.boss !== null);
  engine.boss.y = 100; // Position boss onscreen
  assert.ok(engine.boss.health > 0);

  const initialBossHp = engine.boss.health;

  // Add player bullet directly on boss
  engine.bullets.push({
    x: engine.boss.x,
    y: 100,
    vx: 0,
    vy: -10,
    width: 10,
    height: 10,
    color: '#00f0ff',
    damage: 100
  });

  engine.update();
  assert.strictEqual(engine.boss.health, initialBossHp - 100);
});

test('CyberSiegeEngine - Game Over state & High Score Persistence', () => {
  const engine = new CyberSiegeEngine(null, {});
  engine.start();

  engine.setScore(500);
  engine.damagePlayer(150);

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.player.health, 0);
  assert.strictEqual(global.localStorage.getItem('cybersiege_best'), '500');
});
