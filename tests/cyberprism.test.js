// Node.js Unit Tests for Cyber Prism Engine logic
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

// Extract CyberPrismEngine from cyberprism.html
const htmlPath = path.join(__dirname, '..', 'cyberprism.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberPrismEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && module.exports)');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberPrismEngine boundaries in cyberprism.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberPrismEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberPrismEngine = mockModule.exports.CyberPrismEngine;

test('CyberPrismEngine - Initial state', () => {
  const engine = new CyberPrismEngine(null);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.shield, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.prismCore.hp, 200);
});

test('CyberPrismEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberPrismEngine(null);
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

  engine.setScore(5000);
  assert.strictEqual(engine.score, 5000);
  assert.strictEqual(engine.highScore, 5000);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.enemies.length, 0);
  assert.strictEqual(engine.projectiles.length, 0);
});

test('CyberPrismEngine - Player movement, aiming & boundary clamping', () => {
  const engine = new CyberPrismEngine(null);
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
  engine.aimAt(400, 100);
  assert.ok(Number.isFinite(engine.player.angle));
});

test('CyberPrismEngine - Prism beam firing & tri-prism powerup', () => {
  const engine = new CyberPrismEngine(null);
  engine.start();

  engine.firePrismBeam();
  assert.strictEqual(engine.projectiles.length, 1);
  assert.strictEqual(engine.projectiles[0].fromPlayer, true);

  // Cooldown prevents immediate spam firing
  engine.firePrismBeam();
  assert.strictEqual(engine.projectiles.length, 1);

  // Enable triple_prism mode
  engine.player.fireCooldown = 0;
  engine.player.powerupType = 'triple_prism';
  engine.firePrismBeam();
  assert.strictEqual(engine.projectiles.length, 4); // 1 previous + 3 triple_prism bolts
});

test('CyberPrismEngine - EMP Prism Nova blast & enemy destruction', () => {
  const engine = new CyberPrismEngine(null);
  engine.start();

  assert.strictEqual(engine.player.empCharges, 3);
  // Add weak enemy and hostile projectile
  engine.enemies.push({ x: 200, y: 200, hp: 50, maxHp: 50, type: 'drone', radius: 14, speed: 1.8, color: '#ff0055', shootCooldown: 50 });
  engine.projectiles.push({ x: 200, y: 200, vx: 0, vy: 0, radius: 4, fromPlayer: false, damage: 10 });

  const success = engine.triggerEMP();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.projectiles.length, 0); // Hostile projectile cleared
  assert.strictEqual(engine.enemies.length, 0); // Weak enemy destroyed by 120 EMP damage
  assert.strictEqual(engine.explosions.length, 1);
});

test('CyberPrismEngine - Boss Prism Overlord spawning & destruction', () => {
  const engine = new CyberPrismEngine(null);
  engine.start();

  engine.spawnBoss(2);
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.hp, 1000);

  // Hit boss with lethal beam
  const p = { x: engine.boss.x, y: engine.boss.y, vx: 0, vy: 0, radius: 5, fromPlayer: true, damage: 1000 };
  engine.projectiles.push(p);
  engine.update();

  assert.strictEqual(engine.boss, null); // Boss destroyed
  assert.ok(engine.score >= 2500);
});

test('CyberPrismEngine - Game over state & high score persistence', () => {
  const engine = new CyberPrismEngine(null);
  engine.start();

  engine.setScore(9500);
  engine.gameOver();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(global.localStorage.getItem('cyberprism_best'), '9500');
});

test('CyberPrismEngine - Resilient to invalid inputs & NaN edge cases', () => {
  const engine = new CyberPrismEngine(null);
  engine.start();

  engine.movePlayer(NaN, undefined);
  assert.ok(Number.isFinite(engine.player.x));
  assert.ok(Number.isFinite(engine.player.y));

  engine.aimAt(NaN, null);
  assert.ok(Number.isFinite(engine.player.angle));

  engine.setScore(NaN);
  assert.strictEqual(engine.score, 0);
});
