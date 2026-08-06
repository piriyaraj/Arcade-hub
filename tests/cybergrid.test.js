// Node.js Unit Tests for Cyber Grid Engine logic
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
const { getBestScore, saveBestScore, checkCollision, checkCircleCollision, clamp, formatScore, randomRange, normalizeScore } = require('../utils.js');
global.getBestScore = getBestScore;
global.saveBestScore = saveBestScore;
global.checkCollision = checkCollision;
global.checkCircleCollision = checkCircleCollision;
global.clamp = clamp;
global.formatScore = formatScore;
global.randomRange = randomRange;
global.normalizeScore = normalizeScore;

// Extract CyberGridEngine from cybergrid.html
const htmlPath = path.join(__dirname, '..', 'cybergrid.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberGridEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && module.exports)');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberGridEngine boundaries in cybergrid.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberGridEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', 'normalizeScore', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange, normalizeScore);

const CyberGridEngine = mockModule.exports.CyberGridEngine;

test('CyberGridEngine - Initial state defaults', () => {
  const engine = new CyberGridEngine(null);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.gridCore.health, 100);
  assert.strictEqual(engine.gridCore.shield, 50);
  assert.strictEqual(engine.player.health, 100);
  assert.strictEqual(engine.player.shield, 60);
  assert.strictEqual(engine.player.empCharges, 3);
});

test('CyberGridEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberGridEngine(null);
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

  engine.setScore(8400);
  assert.strictEqual(engine.score, 8400);
  assert.strictEqual(engine.highScore, 8400);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.drones.length, 0);
  assert.strictEqual(engine.projectiles.length, 0);
});

test('CyberGridEngine - Player movement & arena boundaries', () => {
  const engine = new CyberGridEngine(null);
  engine.start();

  engine.movePlayer(10, 0);
  assert.ok(engine.player.x > 400);

  // Boundary clamping
  engine.movePlayer(1000, 0);
  assert.ok(engine.player.x <= 800 - engine.player.radius);

  engine.movePlayer(-2000, 0);
  assert.ok(engine.player.x >= engine.player.radius);
});

test('CyberGridEngine - Plasma firing & tri-beam powerup', () => {
  const engine = new CyberGridEngine(null);
  engine.start();

  engine.firePlasma();
  assert.strictEqual(engine.projectiles.length, 1);
  assert.strictEqual(engine.projectiles[0].damage, 30);

  // Cooldown prevents spam firing
  engine.firePlasma();
  assert.strictEqual(engine.projectiles.length, 1);

  // Enable tri-beam powerup
  engine.player.shootCooldown = 0;
  engine.player.triBeamTimer = 300;
  engine.firePlasma();
  assert.strictEqual(engine.projectiles.length, 4); // 1 + 3 new projectiles
});

test('CyberGridEngine - EMP Nova shockwave execution', () => {
  const engine = new CyberGridEngine(null);
  engine.start();

  engine.enemyProjectiles.push({ x: 200, y: 200, vx: 1, vy: 1, radius: 4 });
  assert.strictEqual(engine.enemyProjectiles.length, 1);

  engine.triggerEMP();
  assert.strictEqual(engine.empNovas.length, 1);
  assert.strictEqual(engine.enemyProjectiles.length, 0); // Cleared by EMP
  assert.strictEqual(engine.player.empCharges, 2);
});

test('CyberGridEngine - Powerup collection logic', () => {
  const engine = new CyberGridEngine(null);
  engine.start();

  // Test triBeam powerup
  engine.powerups.push({ x: engine.player.x, y: engine.player.y, radius: 10, type: 'triBeam', life: 100 });
  engine.update();
  assert.ok(engine.player.triBeamTimer > 0);

  // Test shield powerup
  engine.player.shield = 10;
  engine.powerups.push({ x: engine.player.x, y: engine.player.y, radius: 10, type: 'shield', life: 100 });
  engine.update();
  assert.strictEqual(engine.player.shield, engine.player.maxShield);

  // Test EMP powerup
  engine.player.empCharges = 1;
  engine.powerups.push({ x: engine.player.x, y: engine.player.y, radius: 10, type: 'emp', life: 100 });
  engine.update();
  assert.strictEqual(engine.player.empCharges, 2);
});

test('CyberGridEngine - Boss Overlord spawning & victory', () => {
  const engine = new CyberGridEngine(null);
  engine.reset();
  engine.started = true;
  engine.wave = 5;
  engine.spawnWave();

  assert.notStrictEqual(engine.boss, null);
  assert.strictEqual(engine.boss.bossType, 'Grid Overlord Titan');

  // Defeat boss
  engine.boss.y = 100;
  engine.boss.shield = 0;
  engine.boss.hp = 10;
  engine.projectiles.push({
    x: engine.boss.x,
    y: engine.boss.y,
    vx: 0, vy: 0,
    radius: 10,
    color: '#00f2fe',
    damage: 50
  });

  engine.update();
  assert.strictEqual(engine.boss, null);
});

test('CyberGridEngine - Game Over & high score persistence', () => {
  global.localStorage.store = {};
  const engine = new CyberGridEngine(null);
  engine.start();

  engine.setScore(5800);
  engine.damagePlayer(500);

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.player.health, 0);
  assert.strictEqual(global.localStorage.getItem('cybergrid_best'), '5800');
});

test('CyberGridEngine - Input resilience & NaN edge cases', () => {
  const engine = new CyberGridEngine(null);
  engine.start();

  engine.movePlayer(NaN, undefined);
  assert.ok(Number.isFinite(engine.player.x));

  engine.setPlayerAngle('invalid');
  assert.ok(Number.isFinite(engine.player.angle));

  engine.setScore(undefined);
  assert.strictEqual(engine.score, 0);

  engine.update();
  engine.draw();
  assert.ok(true);
});
