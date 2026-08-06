// Node.js Unit Tests for Cyber Pulsar Engine logic
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

// Extract CyberPulsarEngine from cyberpulsar.html
const htmlPath = path.join(__dirname, '..', 'cyberpulsar.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberPulsarEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberPulsarEngine boundaries in cyberpulsar.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberPulsarEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberPulsarEngine = mockModule.exports.CyberPulsarEngine;

test('CyberPulsarEngine - Initial state', () => {
  const engine = new CyberPulsarEngine(null);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.shield, 100);
  assert.strictEqual(engine.player.phase, 'cyan');
  assert.strictEqual(engine.empCharges, 3);
  assert.strictEqual(engine.boss, null);
});

test('CyberPulsarEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberPulsarEngine(null);
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

  engine.setScore(18000);
  assert.strictEqual(engine.score, 18000);
  assert.strictEqual(engine.highScore, 18000);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.enemies.length, 0);
  assert.strictEqual(engine.projectiles.length, 0);
});

test('CyberPulsarEngine - Player movement & boundary clamping', () => {
  const engine = new CyberPulsarEngine(null);
  engine.start();

  const startX = engine.player.x;
  engine.movePlayer(1, 0, 0.1);
  assert.ok(engine.player.x > startX);

  engine.setPlayerPosition(-100, -100);
  assert.strictEqual(engine.player.x, engine.player.radius);
  assert.strictEqual(engine.player.y, engine.player.radius);

  engine.setPlayerPosition(2000, 2000);
  assert.strictEqual(engine.player.x, engine.width - engine.player.radius);
  assert.strictEqual(engine.player.y, engine.height - engine.player.radius);
});

test('CyberPulsarEngine - Frequency Shift & EMP Nova', () => {
  const engine = new CyberPulsarEngine(null);
  engine.start();

  assert.strictEqual(engine.player.phase, 'cyan');
  engine.togglePhase();
  assert.strictEqual(engine.player.phase, 'gold');
  engine.togglePhase();
  assert.strictEqual(engine.player.phase, 'cyan');

  const empResult = engine.triggerEmpNova();
  assert.strictEqual(empResult, true);
  assert.strictEqual(engine.empCharges, 2);
  assert.ok(engine.player.empCooldown > 0);

  const repeatEmp = engine.triggerEmpNova();
  assert.strictEqual(repeatEmp, false);
});

test('CyberPulsarEngine - Shooting & Projectile mechanics', () => {
  const engine = new CyberPulsarEngine(null);
  engine.start();

  assert.strictEqual(engine.projectiles.length, 0);
  const shotSuccess = engine.shoot(400, 100);
  assert.strictEqual(shotSuccess, true);
  assert.ok(engine.projectiles.length >= 1);
  assert.strictEqual(engine.projectiles[0].isPlayer, true);

  const repeatShot = engine.shoot(400, 100);
  assert.strictEqual(repeatShot, false);
});

test('CyberPulsarEngine - Boss Spawning and Wave Advancement', () => {
  const engine = new CyberPulsarEngine(null);
  engine.start();
  engine.enemies = [];
  engine.wave = 5;
  engine.spawnWave();

  assert.notStrictEqual(engine.boss, null);
  assert.ok(engine.boss.hp > 0);

  engine.boss.hp = 0;
  engine.projectiles.push({
    x: engine.boss.x,
    y: engine.boss.y,
    vx: 0,
    vy: 0,
    radius: 10,
    isPlayer: true,
    damage: 100,
    phase: 'cyan'
  });
  engine.update(0.1);
  assert.strictEqual(engine.boss, null);
});

test('CyberPulsarEngine - Player damage and Game Over', () => {
  const engine = new CyberPulsarEngine(null);
  engine.start();

  assert.strictEqual(engine.player.hp, 100);
  engine.takePlayerDamage(50);
  assert.strictEqual(engine.player.shield, 50);
  assert.strictEqual(engine.player.hp, 100);

  engine.player.invulnerableTimer = 0;
  engine.takePlayerDamage(100);
  assert.strictEqual(engine.player.shield, 0);
  assert.strictEqual(engine.player.hp, 50);

  engine.player.invulnerableTimer = 0;
  engine.takePlayerDamage(60);
  assert.strictEqual(engine.player.hp, 0);
  assert.strictEqual(engine.over, true);
});
