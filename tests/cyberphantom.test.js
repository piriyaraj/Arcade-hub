// Node.js Unit Tests for Cyber Phantom Engine logic
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

// Extract CyberPhantomEngine from cyberphantom.html
const htmlPath = path.join(__dirname, '..', 'cyberphantom.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberPhantomEngine {');
const endIndex = fileContent.indexOf('// Export for Node unit testing environments');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberPhantomEngine boundaries in cyberphantom.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberPhantomEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberPhantomEngine = mockModule.exports.CyberPhantomEngine;

test('CyberPhantomEngine - Initial state', () => {
  const engine = new CyberPhantomEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.player.health, 100);
  assert.strictEqual(engine.player.shield, 50);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.player.dashCooldown, 0);
  assert.strictEqual(engine.player.stealthActive, false);
});

test('CyberPhantomEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberPhantomEngine(null, {});
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

  engine.setScore(4500);
  assert.strictEqual(engine.score, 4500);
  assert.strictEqual(engine.highScore, 4500);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.drones.length, 0);
  assert.strictEqual(engine.projectiles.length, 0);
});

test('CyberPhantomEngine - Movement and arena boundaries', () => {
  const engine = new CyberPhantomEngine(null, {});
  engine.start();

  engine.movePlayer(1, 0);
  assert.ok(engine.player.x > 400);

  engine.movePlayer(-100, 0);
  assert.strictEqual(engine.player.x, engine.player.radius);

  engine.movePlayer(0, 100);
  assert.strictEqual(engine.player.y, engine.height - engine.player.radius);
});

test('CyberPhantomEngine - Phase Dash & Decoy spawning', () => {
  const engine = new CyberPhantomEngine(null, {});
  engine.start();

  const dashed = engine.triggerPhaseDash();
  assert.strictEqual(dashed, true);
  assert.strictEqual(engine.decoys.length, 1);
  assert.strictEqual(engine.player.stealthActive, true);
  assert.ok(engine.player.dashCooldown > 0);

  // Second dash while on cooldown should fail
  const dashedAgain = engine.triggerPhaseDash();
  assert.strictEqual(dashedAgain, false);
});

test('CyberPhantomEngine - EMP Shockwave Pulse', () => {
  const engine = new CyberPhantomEngine(null, {});
  engine.start();

  assert.strictEqual(engine.player.empCharges, 3);
  const triggered = engine.triggerEMP();
  assert.strictEqual(triggered, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.empNovas.length, 1);

  // Trigger until charges depleted
  engine.triggerEMP();
  engine.triggerEMP();
  assert.strictEqual(engine.player.empCharges, 0);
  const emptyTrigger = engine.triggerEMP();
  assert.strictEqual(emptyTrigger, false);
});

test('CyberPhantomEngine - Blade Slicing Projectiles', () => {
  const engine = new CyberPhantomEngine(null, {});
  engine.start();

  const slashed = engine.slashBlade();
  assert.strictEqual(slashed, true);
  assert.strictEqual(engine.playerBlades.length, 1);
});

test('CyberPhantomEngine - Powerup collection & Player damage', () => {
  const engine = new CyberPhantomEngine(null, {});
  engine.start();

  engine.damagePlayer(30);
  assert.strictEqual(engine.player.shield, 20);
  assert.strictEqual(engine.player.health, 100);

  engine.damagePlayer(40);
  assert.strictEqual(engine.player.shield, 0);
  assert.strictEqual(engine.player.health, 80);

  engine.collectPowerup({ type: 'shield', x: 100, y: 100 });
  assert.strictEqual(engine.player.shield, 40);

  engine.collectPowerup({ type: 'health', x: 100, y: 100 });
  assert.strictEqual(engine.player.health, 100);

  engine.collectPowerup({ type: 'emp', x: 100, y: 100 });
  assert.strictEqual(engine.player.empCharges, 4);
});

test('CyberPhantomEngine - Wave progression & Boss Spawning', () => {
  const engine = new CyberPhantomEngine(null, {});
  engine.start();

  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.boss, null);

  engine.startWave(5);
  assert.strictEqual(engine.wave, 5);
  assert.notStrictEqual(engine.boss, null);
  assert.ok(engine.boss.hp > 0);
});
