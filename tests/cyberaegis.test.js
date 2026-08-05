// Node.js Unit Tests for Cyber Aegis Engine logic
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

// Extract CyberAegisEngine from cyberaegis.html
const aegisPath = path.join(__dirname, '..', 'cyberaegis.html');
const fileContent = fs.readFileSync(aegisPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberAegisEngine {');
const endIndex = fileContent.indexOf('// Export for Node unit testing environments');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberAegisEngine boundaries in cyberaegis.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberAegisEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberAegisEngine = mockModule.exports.CyberAegisEngine;

test('CyberAegisEngine - Initial state', () => {
  const engine = new CyberAegisEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.player.health, 100);
  assert.strictEqual(engine.player.shield, 60);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.player.aegisEnergy, 0);
  assert.strictEqual(engine.player.overdriveActive, false);
});

test('CyberAegisEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberAegisEngine(null, {});
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

  engine.setScore(3200);
  assert.strictEqual(engine.score, 3200);
  assert.strictEqual(engine.highScore, 3200);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.bullets.length, 0);
  assert.strictEqual(engine.enemies.length, 0);
});

test('CyberAegisEngine - Player movement & boundary clamping', () => {
  const engine = new CyberAegisEngine(null, {});
  engine.start();

  engine.movePlayer(1, 0);
  assert.ok(engine.player.x > 400);

  // Drive far left past bound
  engine.player.x = -100;
  engine.movePlayer(0, 0);
  assert.strictEqual(engine.player.x, engine.player.radius);
});

test('CyberAegisEngine - Aiming & Plasma Pulse firing', () => {
  const engine = new CyberAegisEngine(null, {});
  engine.start();

  engine.aimAt(400, 200);
  assert.ok(engine.player.shieldAngle < 0);

  const fired = engine.shootPulse();
  assert.strictEqual(fired, true);
  assert.strictEqual(engine.bullets.length, 1);
  assert.ok(engine.player.shootCooldown > 0);

  // Cooldown active
  const fireAgain = engine.shootPulse();
  assert.strictEqual(fireAgain, false);
});

test('CyberAegisEngine - Dual Kinetic Shield deflection & energy absorption', () => {
  const engine = new CyberAegisEngine(null, {});
  engine.start();

  engine.player.x = 400;
  engine.player.y = 300;
  engine.aimAt(400, 200); // Shield pointing UP

  // Enemy bullet flying towards player shield from UP
  engine.enemyBullets = [{
    x: 400,
    y: 270,
    vx: 0,
    vy: 4,
    radius: 5,
    color: '#ff007f'
  }];

  engine.update(1);

  // Enemy bullet should be absorbed/deflected, adding energy to aegisEnergy & creating reflected bullet
  assert.strictEqual(engine.enemyBullets.length, 0);
  assert.strictEqual(engine.bullets.length, 1);
  assert.strictEqual(engine.player.aegisEnergy, 15);
});

test('CyberAegisEngine - Overdrive Forcefield activation', () => {
  const engine = new CyberAegisEngine(null, {});
  engine.start();

  assert.strictEqual(engine.triggerOverdrive(), false); // Not enough energy

  engine.player.aegisEnergy = 100;
  const triggered = engine.triggerOverdrive();
  assert.strictEqual(triggered, true);
  assert.strictEqual(engine.player.aegisEnergy, 0);
  assert.strictEqual(engine.player.overdriveActive, true);
  assert.strictEqual(engine.empNovas.length, 1);
});

test('CyberAegisEngine - EMP Aegis Nova blast', () => {
  const engine = new CyberAegisEngine(null, {});
  engine.start();

  engine.enemyBullets = [{ x: 400, y: 300, vx: 0, vy: 0, radius: 4 }];
  engine.enemies = [{ type: 'drone', x: 410, y: 300, vx: 0, vy: 0, radius: 10, health: 30, maxHealth: 30, empHit: false }];

  const triggered = engine.triggerEmpNova();
  assert.strictEqual(triggered, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.empNovas.length, 1);

  // Expand nova radius
  engine.empNovas[0].radius = 100;
  engine.update(1);

  assert.strictEqual(engine.enemyBullets.length, 0);
  assert.strictEqual(engine.enemies.length, 0);
  assert.ok(engine.score > 0);
});

test('CyberAegisEngine - Boss battle spawning & destruction', () => {
  const engine = new CyberAegisEngine(null, {});
  engine.start();
  engine.wave = 3;

  engine.spawnBoss();
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.name, 'ROGUE OVERLORD');

  const boss = engine.boss;
  engine.handleEnemyDeath(boss);
  assert.strictEqual(engine.boss, null);
  assert.ok(engine.score >= 1500);
});

test('CyberAegisEngine - Powerup drops & collection', () => {
  const engine = new CyberAegisEngine(null, {});
  engine.start();

  engine.player.shield = 10;
  engine.collectPowerup({ type: 'shield', x: 0, y: 0, radius: 10 });
  assert.strictEqual(engine.player.shield, 50);

  engine.player.health = 40;
  engine.collectPowerup({ type: 'health', x: 0, y: 0, radius: 10 });
  assert.strictEqual(engine.player.health, 70);

  engine.collectPowerup({ type: 'emp', x: 0, y: 0, radius: 10 });
  assert.strictEqual(engine.player.empCharges, 4);

  engine.collectPowerup({ type: 'energy', x: 0, y: 0, radius: 10 });
  assert.strictEqual(engine.player.aegisEnergy, 40);
});

test('CyberAegisEngine - Player damage & Game Over trigger', () => {
  const engine = new CyberAegisEngine(null, {});
  engine.start();

  engine.damagePlayer(40);
  assert.strictEqual(engine.player.shield, 20);
  assert.strictEqual(engine.player.health, 100);

  engine.damagePlayer(120);
  assert.strictEqual(engine.player.shield, 0);
  assert.strictEqual(engine.player.health, 0);
  assert.strictEqual(engine.over, true);
});
