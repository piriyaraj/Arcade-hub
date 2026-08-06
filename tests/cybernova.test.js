// Node.js Unit Tests for Cyber Nova Engine logic
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

// Extract CyberNovaEngine from cybernova.html
const htmlPath = path.join(__dirname, '..', 'cybernova.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberNovaEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && module.exports)');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberNovaEngine boundaries in cybernova.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberNovaEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberNovaEngine = mockModule.exports.CyberNovaEngine;

test('CyberNovaEngine - Initial state', () => {
  const engine = new CyberNovaEngine(null);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.shield, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.novaCore.hp, 200);
});

test('CyberNovaEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberNovaEngine(null);
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

test('CyberNovaEngine - Player movement, aiming & boundary clamping', () => {
  const engine = new CyberNovaEngine(null);
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

test('CyberNovaEngine - Nova beam firing & tri-nova powerup', () => {
  const engine = new CyberNovaEngine(null);
  engine.start();

  engine.fireNovaBeam();
  assert.strictEqual(engine.projectiles.length, 1);
  assert.strictEqual(engine.projectiles[0].fromPlayer, true);

  // Cooldown prevents immediate spam firing
  engine.fireNovaBeam();
  assert.strictEqual(engine.projectiles.length, 1);

  // Enable tri_nova mode
  engine.player.fireCooldown = 0;
  engine.player.powerupType = 'tri_nova';
  engine.fireNovaBeam();
  assert.strictEqual(engine.projectiles.length, 5); // 1 previous + 4 tri_nova bolts
});

test('CyberNovaEngine - EMP Nova blast & enemy destruction', () => {
  const engine = new CyberNovaEngine(null);
  engine.start();

  assert.strictEqual(engine.player.empCharges, 3);
  // Add weak enemy and hostile projectile
  engine.enemies.push({ x: 200, y: 200, hp: 50, maxHp: 50, type: 'drone', radius: 14, speed: 1.8, color: '#ff00aa', shootCooldown: 50 });
  engine.projectiles.push({ x: 200, y: 200, vx: 0, vy: 0, radius: 4, fromPlayer: false, damage: 10 });

  const success = engine.triggerEMP();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.projectiles.length, 0); // Hostile projectile cleared
  assert.strictEqual(engine.enemies.length, 0); // Weak enemy destroyed by 120 EMP damage
  assert.strictEqual(engine.explosions.length, 1);
});

test('CyberNovaEngine - Boss Supernova Titan spawning & destruction', () => {
  const engine = new CyberNovaEngine(null);
  engine.start();

  engine.spawnBoss(2);
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.hp, 1600);

  // Hit boss with lethal beam
  const p = { x: engine.boss.x, y: engine.boss.y, vx: 0, vy: 0, radius: 5, fromPlayer: true, damage: 1600 };
  engine.projectiles.push(p);
  engine.update();

  assert.strictEqual(engine.boss, null); // Boss destroyed
  assert.ok(engine.score >= 2500);
});

test('CyberNovaEngine - Game over state & high score persistence', () => {
  const engine = new CyberNovaEngine(null);
  engine.start();

  engine.setScore(9500);
  engine.gameOver();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(global.localStorage.getItem('cybernova_best'), '9500');
});

test('CyberNovaEngine - Resilient to invalid inputs & NaN edge cases', () => {
  const engine = new CyberNovaEngine(null);
  engine.start();

  engine.movePlayer(NaN, undefined);
  assert.ok(Number.isFinite(engine.player.x));
  assert.ok(Number.isFinite(engine.player.y));

  engine.aimAt(NaN, null);
  assert.ok(Number.isFinite(engine.player.angle));

  engine.setScore(NaN);
  assert.strictEqual(engine.score, 0);
});
