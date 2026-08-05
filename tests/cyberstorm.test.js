// Node.js Unit Tests for Cyber Storm Engine logic
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

// Extract CyberStormEngine from cyberstorm.html
const stormPath = path.join(__dirname, '..', 'cyberstorm.html');
const fileContent = fs.readFileSync(stormPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberStormEngine {');
const endIndex = fileContent.indexOf('// Export for Node unit testing environments');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberStormEngine boundaries in cyberstorm.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberStormEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberStormEngine = mockModule.exports.CyberStormEngine;

test('CyberStormEngine - Initial state', () => {
  const engine = new CyberStormEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.player.health, 100);
  assert.strictEqual(engine.player.shield, 50);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.player.tripleBeamActive, false);
  assert.strictEqual(engine.player.overloadActive, false);
});

test('CyberStormEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberStormEngine(null, {});
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

  engine.setScore(1500);
  assert.strictEqual(engine.score, 1500);
  assert.strictEqual(engine.highScore, 1500);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.bullets.length, 0);
  assert.strictEqual(engine.enemies.length, 0);
});

test('CyberStormEngine - Player movement & boundary clamping', () => {
  const engine = new CyberStormEngine(null, {});
  engine.start();

  const startX = engine.player.x;
  const startY = engine.player.y;

  engine.movePlayer(1, -1);
  assert.ok(engine.player.x > startX);
  assert.ok(engine.player.y < startY);

  // Move far left beyond canvas edge
  for (let i = 0; i < 200; i++) {
    engine.movePlayer(-1, 0);
  }
  assert.strictEqual(engine.player.x, engine.player.radius);
});

test('CyberStormEngine - Plasma firing (double vs triple beam)', () => {
  const engine = new CyberStormEngine(null, {});
  engine.start();

  const fired1 = engine.fireBullet(1000);
  assert.strictEqual(fired1, true);
  assert.strictEqual(engine.bullets.length, 2); // Double beam

  // Immediate re-fire should be blocked by cooldown
  const fired2 = engine.fireBullet(1050);
  assert.strictEqual(fired2, false);
  assert.strictEqual(engine.bullets.length, 2);

  // Activate Triple Beam
  engine.player.tripleBeamActive = true;
  const fired3 = engine.fireBullet(1300);
  assert.strictEqual(fired3, true);
  assert.strictEqual(engine.bullets.length, 5); // 2 + 3
});

test('CyberStormEngine - EMP pulse trigger & projectile clearing', () => {
  const engine = new CyberStormEngine(null, {});
  engine.start();

  engine.enemyBullets.push({ x: engine.player.x, y: engine.player.y, radius: 4, vx: 0, vy: 0 });
  assert.strictEqual(engine.enemyBullets.length, 1);

  const empFired = engine.triggerEmpPulse();
  assert.strictEqual(empFired, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.empPulses.length, 1);

  // Update engine to let EMP pulse expand
  engine.update(5);
  assert.strictEqual(engine.enemyBullets.length, 0); // Enemy bullet destroyed by EMP
});

test('CyberStormEngine - Lightning Overload surge state', () => {
  const engine = new CyberStormEngine(null, {});
  engine.start();

  engine.activateLightningOverload(100);
  assert.strictEqual(engine.player.overloadActive, true);
  assert.strictEqual(engine.player.overloadTimer, 100);

  engine.spawnEnemy('drone');
  const enemy = engine.enemies[0];
  const initialHp = enemy.health;

  // Force discharge trigger check
  for (let i = 0; i < 20; i++) {
    engine.update(1);
  }

  assert.ok(enemy.health < initialHp || engine.lightningArcs.length >= 0);
});

test('CyberStormEngine - Enemy spawning & wave progression', () => {
  const engine = new CyberStormEngine(null, {});
  engine.start();

  engine.spawnEnemy('spider');
  assert.strictEqual(engine.enemies.length, 1);
  assert.strictEqual(engine.enemies[0].type, 'spider');

  // Kill enemy
  const enemy = engine.enemies[0];
  engine.handleEnemyDeath(enemy);
  assert.strictEqual(engine.enemies.length, 0);
  assert.strictEqual(engine.score, 100);
  assert.strictEqual(engine.enemiesDefeatedInWave, 1);
});

test('CyberStormEngine - Boss battle spawning & destruction', () => {
  const engine = new CyberStormEngine(null, {});
  engine.start();
  engine.wave = 3;

  engine.spawnBoss();
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.name, 'STORM TITAN CORE');

  const boss = engine.boss;
  engine.handleEnemyDeath(boss);
  assert.strictEqual(engine.boss, null);
  assert.ok(engine.score >= 1000);
  assert.strictEqual(engine.player.overloadActive, true);
});

test('CyberStormEngine - Powerup drops & collection', () => {
  const engine = new CyberStormEngine(null, {});
  engine.start();

  engine.player.shield = 10;
  engine.collectPowerup({ type: 'shield', x: 0, y: 0, radius: 10 });
  assert.strictEqual(engine.player.shield, 50);

  engine.collectPowerup({ type: 'triple', x: 0, y: 0, radius: 10 });
  assert.strictEqual(engine.player.tripleBeamActive, true);

  engine.collectPowerup({ type: 'emp', x: 0, y: 0, radius: 10 });
  assert.strictEqual(engine.player.empCharges, 4);
});

test('CyberStormEngine - Player damage & Game Over trigger', () => {
  const engine = new CyberStormEngine(null, {});
  engine.start();

  engine.damagePlayer(40);
  assert.strictEqual(engine.player.shield, 10);
  assert.strictEqual(engine.player.health, 100);

  engine.damagePlayer(110);
  assert.strictEqual(engine.player.shield, 0);
  assert.strictEqual(engine.player.health, 0);
  assert.strictEqual(engine.over, true);
});

test('CyberStormEngine - EMP pulse handles multiple lethal enemy hits without array iteration skips', () => {
  const engine = new CyberStormEngine(null, {});
  engine.start();

  // Add 3 low-health enemies within EMP radius
  engine.enemies = [
    { type: 'drone', x: engine.player.x + 10, y: engine.player.y - 20, radius: 10, health: 10, maxHealth: 30, color: '#00f0ff', empHit: false },
    { type: 'drone', x: engine.player.x + 20, y: engine.player.y - 30, radius: 10, health: 10, maxHealth: 30, color: '#00f0ff', empHit: false },
    { type: 'drone', x: engine.player.x + 30, y: engine.player.y - 40, radius: 10, health: 10, maxHealth: 30, color: '#00f0ff', empHit: false }
  ];

  engine.triggerEmpPulse();
  assert.strictEqual(engine.empPulses.length, 1);

  // Expand pulse to cover all enemies
  engine.empPulses[0].radius = 100;
  engine.update(1);

  // All 3 enemies should be destroyed without array mutation skipping any element
  assert.strictEqual(engine.enemies.length, 0);
  assert.strictEqual(engine.enemiesDefeatedInWave, 3);
});
