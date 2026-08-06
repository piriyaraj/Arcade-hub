// Node.js Unit Tests for Cyber Zenith Engine logic
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

// Extract CyberZenithEngine from cyberzenith.html
const htmlPath = path.join(__dirname, '..', 'cyberzenith.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberZenithEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberZenithEngine boundaries in cyberzenith.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberZenithEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberZenithEngine = mockModule.exports.CyberZenithEngine;

test('CyberZenithEngine - Initial state', () => {
  const engine = new CyberZenithEngine(null);
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

test('CyberZenithEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberZenithEngine(null);
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

  engine.setScore(8800);
  assert.strictEqual(engine.score, 8800);
  assert.strictEqual(engine.highScore, 8800);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.enemies.length, 0);
  assert.strictEqual(engine.projectiles.length, 0);
});

test('CyberZenithEngine - Player movement & boundary clamping', () => {
  const engine = new CyberZenithEngine(null);
  engine.start();

  const startX = engine.player.x;
  engine.movePlayer(10, 0);
  assert.ok(engine.player.x > startX);

  engine.movePlayer(2000, 0);
  assert.strictEqual(engine.player.x, engine.width - engine.player.radius);

  engine.movePlayer(-4000, 0);
  assert.strictEqual(engine.player.x, engine.player.radius);
});

test('CyberZenithEngine - Weapon firing & EMP Zenith Shockwaves', () => {
  const engine = new CyberZenithEngine(null);
  engine.start();

  engine.firePlayerWeapon();
  assert.strictEqual(engine.projectiles.length, 1);

  engine.triggerEmp();
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.empShockwaves.length, 1);
});

test('CyberZenithEngine - Enemy spawning & collision resolution', () => {
  const engine = new CyberZenithEngine(null);
  engine.start();

  engine.spawnEnemy();
  assert.strictEqual(engine.enemies.length, 1);

  const enemy = engine.enemies[0];
  enemy.x = engine.player.x;
  enemy.y = engine.player.y;

  engine.update();
  assert.ok(engine.player.shield < 100 || engine.player.hp < 100);
});

test('CyberZenithEngine - Boss Wave Spawning', () => {
  const engine = new CyberZenithEngine(null);
  engine.startWave(5);
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.radius, 45);
  assert.ok(engine.boss.hp > 0);
});
