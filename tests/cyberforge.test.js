// Node.js Unit Tests for Cyber Forge Engine logic
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

// Extract CyberForgeEngine from cyberforge.html
const forgePath = path.join(__dirname, '..', 'cyberforge.html');
const fileContent = fs.readFileSync(forgePath, 'utf8');

const startIndex = fileContent.indexOf('class CyberForgeEngine {');
const endIndex = fileContent.indexOf('// Export for Node unit testing environments');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberForgeEngine boundaries in cyberforge.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberForgeEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberForgeEngine = mockModule.exports.CyberForgeEngine;

test('CyberForgeEngine - Initial state', () => {
  const engine = new CyberForgeEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.player.health, 100);
  assert.strictEqual(engine.player.shield, 50);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.player.surgeEnergy, 0);
  assert.strictEqual(engine.player.activeElement, 'thermal');
});

test('CyberForgeEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberForgeEngine(null, {});
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

test('CyberForgeEngine - Movement and boundary clamping', () => {
  const engine = new CyberForgeEngine(null, {});
  engine.start();

  const initialX = engine.player.x;
  engine.movePlayer(1, 0);
  assert.ok(engine.player.x > initialX);

  // Boundary clamping
  engine.player.x = 900;
  engine.player.y = 900;
  engine.movePlayer(0, 0);
  assert.strictEqual(engine.player.x, 800 - 100);
  assert.strictEqual(engine.player.y, 600 - 100);

  engine.player.x = -100;
  engine.player.y = -100;
  engine.movePlayer(0, 0);
  assert.strictEqual(engine.player.x, 100);
  assert.strictEqual(engine.player.y, 100);
});

test('CyberForgeEngine - Element switching & plasma firing', () => {
  const engine = new CyberForgeEngine(null, {});
  engine.start();

  // Test element switching
  engine.setElementMode('cryo');
  assert.strictEqual(engine.player.activeElement, 'cryo');

  engine.setElementMode('electro');
  assert.strictEqual(engine.player.activeElement, 'electro');

  engine.cycleElement();
  assert.strictEqual(engine.player.activeElement, 'thermal');

  // Test firing plasma
  const fired = engine.firePlasma();
  assert.strictEqual(fired, true);
  assert.strictEqual(engine.projectiles.length, 1);
  assert.strictEqual(engine.projectiles[0].element, 'thermal');

  // Cooldown check
  const reFired = engine.firePlasma();
  assert.strictEqual(reFired, false);
  assert.strictEqual(engine.projectiles.length, 1);
});

test('CyberForgeEngine - EMP shockwave trigger', () => {
  const engine = new CyberForgeEngine(null, {});
  engine.start();

  assert.strictEqual(engine.player.empCharges, 3);
  const empRes = engine.triggerEMP();
  assert.strictEqual(empRes, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.empShockwaves.length, 1);
});

test('CyberForgeEngine - Elemental Surge trigger', () => {
  const engine = new CyberForgeEngine(null, {});
  engine.start();

  // Not enough surge energy
  assert.strictEqual(engine.triggerSurge(), false);

  // Full surge energy
  engine.player.surgeEnergy = 100;
  assert.strictEqual(engine.triggerSurge(), true);
  assert.strictEqual(engine.player.surgeEnergy, 0);
  assert.strictEqual(engine.player.surgeActiveTimer, 240);
});

test('CyberForgeEngine - Damage matching mechanics & high score persistence', () => {
  global.localStorage.setItem('cyberforge_best', '1000');
  const engine = new CyberForgeEngine(null, {});
  assert.strictEqual(engine.highScore, 1000);

  engine.start();
  engine.waveEnemiesToSpawn = 10; // Prevent wave clear trigger
  engine.enemies = [{
    x: 200,
    y: 200,
    radius: 14,
    element: 'thermal',
    health: 30,
    maxHealth: 30,
    speed: 0,
    isBoss: false
  }];

  engine.projectiles = [{
    x: 200,
    y: 200,
    vx: 0,
    vy: 0,
    element: 'thermal', // Matching element bonus!
    radius: 5,
    life: 90
  }];

  engine.update();
  assert.strictEqual(engine.enemies.length, 0);
  assert.ok(engine.score > 0);
  assert.ok(engine.highScore >= engine.score);
});
