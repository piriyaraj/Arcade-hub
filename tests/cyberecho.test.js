// Node.js Unit Tests for Cyber Echo Engine logic
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

// Extract CyberEchoEngine from cyberecho.html
const htmlPath = path.join(__dirname, '..', 'cyberecho.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberEchoEngine {');
const endIndex = fileContent.indexOf('// Export for Node unit testing environments');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberEchoEngine boundaries in cyberecho.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberEchoEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberEchoEngine = mockModule.exports.CyberEchoEngine;

test('CyberEchoEngine - Initial state', () => {
  const engine = new CyberEchoEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.player.health, 100);
  assert.strictEqual(engine.player.shield, 50);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.player.echoCharges, 3);
});

test('CyberEchoEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberEchoEngine(null, {});
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
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.enemies.length, 0);
  assert.strictEqual(engine.projectiles.length, 0);
  assert.strictEqual(engine.echoes.length, 0);
});

test('CyberEchoEngine - Movement and arena boundaries', () => {
  const engine = new CyberEchoEngine(null, {});
  engine.start();

  const startX = engine.player.x;
  engine.movePlayer(1, 0);
  assert.ok(engine.player.x > startX);

  // Boundary check
  engine.player.x = 9999;
  engine.movePlayer(1, 0);
  assert.strictEqual(engine.player.x, 800 - engine.player.radius);

  engine.player.x = -9999;
  engine.movePlayer(-1, 0);
  assert.strictEqual(engine.player.x, engine.player.radius);
});

test('CyberEchoEngine - Firing primary weapon', () => {
  const engine = new CyberEchoEngine(null, {});
  engine.start();

  const fired = engine.fireWeapon();
  assert.strictEqual(fired, true);
  assert.strictEqual(engine.projectiles.length, 1);
  assert.strictEqual(engine.projectiles[0].isPlayer, true);

  // Firing while cooldown active returns false
  const firedAgain = engine.fireWeapon();
  assert.strictEqual(firedAgain, false);
  assert.strictEqual(engine.projectiles.length, 1);
});

test('CyberEchoEngine - Deploying Echo Ghost Clones', () => {
  const engine = new CyberEchoEngine(null, {});
  engine.start();

  // Populate history
  for (let i = 0; i < 25; i++) {
    engine.movePlayer(1, 1);
    engine.update();
  }

  const initialCharges = engine.player.echoCharges;
  const deployed = engine.deployEcho();
  assert.strictEqual(deployed, true);
  assert.strictEqual(engine.player.echoCharges, initialCharges - 1);
  assert.strictEqual(engine.echoes.length, 1);
  assert.strictEqual(engine.echoes[0].duration, 360);
});

test('CyberEchoEngine - Triggering EMP shockwave', () => {
  const engine = new CyberEchoEngine(null, {});
  engine.start();

  // Add enemy and enemy projectile
  engine.spawnEnemy();
  engine.projectiles.push({
    x: 400,
    y: 300,
    vx: 1,
    vy: 1,
    radius: 4,
    isPlayer: false,
    damage: 15
  });

  const empTriggered = engine.triggerEmp();
  assert.strictEqual(empTriggered, true);
  assert.strictEqual(engine.player.empCharges, 2);
  // Enemy projectiles cleared by EMP
  assert.strictEqual(engine.projectiles.filter(p => !p.isPlayer).length, 0);
});

test('CyberEchoEngine - Boss spawn & combat logic', () => {
  const engine = new CyberEchoEngine(null, {});
  engine.start();

  engine.spawnBoss();
  assert.notStrictEqual(engine.boss, null);
  assert.strictEqual(engine.boss.radius, 38);
  assert.ok(engine.boss.health > 500);

  // Update boss
  engine.update();
  assert.ok(engine.boss.y > -60);
});

test('CyberEchoEngine - High Score persistence', () => {
  const engine = new CyberEchoEngine(null, {});
  engine.setScore(8800);
  assert.strictEqual(global.localStorage.getItem('cyberecho_best'), '8800');
});
