// Node.js Unit Tests for Cyber Striker Engine logic
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
const { getBestScore, saveBestScore, checkCollision, checkCircleCollision, clamp, formatScore } = require('../utils.js');
global.getBestScore = getBestScore;
global.saveBestScore = saveBestScore;
global.checkCollision = checkCollision;
global.checkCircleCollision = checkCircleCollision;
global.clamp = clamp;
global.formatScore = formatScore;

// Extract CyberStrikerEngine from cyberstriker.html
const strikerPath = path.join(__dirname, '..', 'cyberstriker.html');
const fileContent = fs.readFileSync(strikerPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberStrikerEngine {');
const endIndex = fileContent.indexOf('// ─── DOM Initialization');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberStrikerEngine boundaries in cyberstriker.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberStrikerEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore);

const CyberStrikerEngine = mockModule.exports.CyberStrikerEngine;

test('CyberStrikerEngine - Initial state', () => {
  const engine = new CyberStrikerEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.player.health, 100);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.player.shield, false);
  assert.strictEqual(engine.level, 1);
});

test('CyberStrikerEngine - Start, pause, resume, and reset', () => {
  const engine = new CyberStrikerEngine(null, {});
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

  engine.setScore(150);
  assert.strictEqual(engine.score, 150);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.player.health, 100);
});

test('CyberStrikerEngine - Player movement & canvas boundary clamping', () => {
  const engine = new CyberStrikerEngine(null, {});
  engine.start();

  // Move right and down
  engine.movePlayer(1, 1);
  assert.ok(engine.player.vx > 0);
  assert.ok(engine.player.vy > 0);

  // Update multiple frames to reach border
  for (let i = 0; i < 200; i++) {
    engine.update();
  }

  // Bounds check (CANVAS_WIDTH = 600, CANVAS_HEIGHT = 400)
  assert.ok(engine.player.x <= 600 - engine.player.width - 10);
  assert.ok(engine.player.y <= 400 - engine.player.height - 10);

  // Move far left and up
  engine.movePlayer(-1, -1);
  for (let i = 0; i < 200; i++) {
    engine.update();
  }
  assert.ok(engine.player.x >= 10);
  assert.ok(engine.player.y >= 10);
});

test('CyberStrikerEngine - Firing plasma bullets and cooldown', () => {
  const engine = new CyberStrikerEngine(null, {});
  engine.start();

  const fired1 = engine.fireBullet();
  assert.strictEqual(fired1, true);
  assert.strictEqual(engine.playerBullets.length, 1);

  // Immediate second fire attempt should be blocked by cooldown
  const fired2 = engine.fireBullet();
  assert.strictEqual(fired2, false);
  assert.strictEqual(engine.playerBullets.length, 1);

  // Advance frames past cooldown (fireRate = 10)
  for (let i = 0; i < 12; i++) {
    engine.update();
  }

  const fired3 = engine.fireBullet();
  assert.strictEqual(fired3, true);
  assert.strictEqual(engine.playerBullets.length, 2);
});

test('CyberStrikerEngine - EMP Shockwave deployment & charge consumption', () => {
  const engine = new CyberStrikerEngine(null, {});
  engine.start();

  // Initial EMP charges = 2
  assert.strictEqual(engine.player.empCharges, 2);

  // Add an enemy bullet and an enemy
  engine.enemyBullets.push({ x: 200, y: 200, vx: -5, vy: 0, radius: 4, damage: 10 });
  engine.spawnEnemy('scout');
  assert.strictEqual(engine.enemyBullets.length, 1);

  const empUsed = engine.triggerEmpPulse();
  assert.strictEqual(empUsed, true);
  assert.strictEqual(engine.player.empCharges, 1);
  assert.strictEqual(engine.enemyBullets.length, 0); // Enemy bullets cleared
  assert.ok(engine.empPulse !== null);

  // Deplete remaining charges
  engine.triggerEmpPulse();
  assert.strictEqual(engine.player.empCharges, 0);

  // Attempting third EMP with 0 charges should return false
  const empFailed = engine.triggerEmpPulse();
  assert.strictEqual(empFailed, false);
});

test('CyberStrikerEngine - Shield activation & damage absorption', () => {
  const engine = new CyberStrikerEngine(null, {});
  engine.start();

  engine.activateShield(100);
  assert.strictEqual(engine.player.shield, true);

  // Taking damage with shield active should absorb hit without dropping health
  const initialHealth = engine.player.health;
  engine.takeDamage(30);
  assert.strictEqual(engine.player.health, initialHealth);

  // Expire shield by updating frames
  for (let i = 0; i < 110; i++) {
    engine.update();
  }
  assert.strictEqual(engine.player.shield, false);

  // Taking damage after shield expires reduces health
  engine.takeDamage(30);
  assert.strictEqual(engine.player.health, initialHealth - 30);
});

test('CyberStrikerEngine - Dreadnought Boss spawn & defeat', () => {
  const engine = new CyberStrikerEngine(null, {});
  engine.start();

  assert.strictEqual(engine.boss, null);
  engine.spawnBoss();
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.name, 'CYBER DREADNOUGHT');
  assert.ok(engine.boss.health > 0);

  // Defeat boss by placing it inside canvas area and dealing direct damage
  engine.boss.x = 450;
  engine.boss.health = 10;
  engine.playerBullets.push({ x: engine.boss.x + 10, y: engine.boss.y + 10, vx: 10, vy: 0, radius: 4, damage: 25 });
  engine.update();

  assert.strictEqual(engine.boss, null); // Boss destroyed
  assert.ok(engine.score >= 250);
});

test('CyberStrikerEngine - Powerup collection & multiplier scaling', () => {
  const engine = new CyberStrikerEngine(null, {});
  engine.start();

  assert.strictEqual(engine.multiplier, 1);
  engine.collectPowerup('multiplier');
  assert.strictEqual(engine.multiplier, 2);

  engine.collectPowerup('emp');
  assert.strictEqual(engine.player.empCharges, 3); // Capped at maxEmp (3)

  engine.takeDamage(40);
  assert.strictEqual(engine.player.health, 60);

  engine.collectPowerup('repair');
  assert.strictEqual(engine.player.health, 90);
});

test('CyberStrikerEngine - High score saving & NaN edge-case resilience', () => {
  const engine = new CyberStrikerEngine(null, {});
  engine.start();

  // Test setScore with valid and invalid inputs
  engine.setScore(450);
  assert.strictEqual(engine.score, 450);

  engine.setScore(NaN);
  assert.strictEqual(engine.score, 0);

  engine.takeDamage(NaN);
  assert.strictEqual(engine.player.health, 90); // 100 - 10 safe fallback

  // Game over state test
  engine.takeDamage(100);
  assert.strictEqual(engine.player.health, 0);
  assert.strictEqual(engine.over, true);
});
