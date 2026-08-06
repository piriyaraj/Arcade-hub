// Node.js Unit Tests for Cyber Eclipse Engine logic
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

// Extract CyberEclipseEngine from cybereclipse.html
const htmlPath = path.join(__dirname, '..', 'cybereclipse.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberEclipseEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberEclipseEngine boundaries in cybereclipse.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberEclipseEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberEclipseEngine = mockModule.exports.CyberEclipseEngine;

test('CyberEclipseEngine - Initial state', () => {
  const engine = new CyberEclipseEngine(null);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.shield, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.boss, null);
});

test('CyberEclipseEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberEclipseEngine(null);
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
});

test('CyberEclipseEngine - Player movement & boundary clamping', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();
  engine.keys.left = true;
  engine.keys.up = true;

  for (let i = 0; i < 200; i++) {
    engine.update();
  }

  assert.ok(engine.player.x >= engine.player.radius, `Player X (${engine.player.x}) should be clamped at left bound`);
  assert.ok(engine.player.y >= engine.player.radius, `Player Y (${engine.player.y}) should be clamped at top bound`);
  assert.ok(!isNaN(engine.player.x));
  assert.ok(!isNaN(engine.player.y));
});

test('CyberEclipseEngine - Weapon firing & Corona EMP Shockwaves', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();
  engine.keys.fire = true;
  engine.player.lastFired = 0;

  engine.update();
  assert.ok(engine.projectiles.length > 0, 'Firing should generate player projectiles');

  const empResult = engine.triggerEmp();
  assert.strictEqual(empResult, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.ok(engine.empShockwave !== null, 'EMP shockwave should be active');
  assert.ok(engine.particles.length > 0, 'EMP should generate particles');
});

test('CyberEclipseEngine - Enemy spawning & collision resolution', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();
  const initialEnemies = engine.enemies.length;
  assert.ok(initialEnemies > 0);

  // Position player projectile directly over first enemy
  const targetEnemy = engine.enemies[0];
  engine.projectiles.push({
    x: targetEnemy.x,
    y: targetEnemy.y,
    vx: 0,
    vy: 0,
    radius: 10,
    damage: 500,
    color: '#f59e0b'
  });

  engine.update();
  assert.ok(engine.enemies.length < initialEnemies || engine.score > 0, 'Enemy should be destroyed or take damage');
});

test('CyberEclipseEngine - Boss Wave Spawning', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();
  engine.wave = 5;
  engine.spawnWave();

  assert.ok(engine.boss !== null, 'Wave 5 should spawn Sol Eclipse Titan boss');
  assert.strictEqual(engine.boss.name, 'Sol Eclipse Titan');
  assert.strictEqual(engine.boss.phase, 1);

  // Damage boss to trigger phase 2
  engine.boss.hp = engine.boss.maxHp * 0.4;
  engine.update();
  assert.strictEqual(engine.boss.phase, 2, 'Boss should shift to phase 2 when HP falls below 50%');
});
