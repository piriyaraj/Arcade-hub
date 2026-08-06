// Node.js Unit Tests for Cyber Nebula Engine logic
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

// Extract CyberNebulaEngine from cybernebula.html
const htmlPath = path.join(__dirname, '..', 'cybernebula.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberNebulaEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberNebulaEngine boundaries in cybernebula.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberNebulaEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberNebulaEngine = mockModule.exports.CyberNebulaEngine;

test('CyberNebulaEngine - Initial state', () => {
  const engine = new CyberNebulaEngine(null);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.shield, 100);
  assert.strictEqual(engine.player.singularityCharges, 3);
  assert.strictEqual(engine.boss, null);
});

test('CyberNebulaEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberNebulaEngine(null);
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

  engine.setScore(30000);
  assert.strictEqual(engine.score, 30000);
  assert.strictEqual(engine.highScore, 30000);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.enemies.length, 0);
  assert.strictEqual(engine.projectiles.length, 0);
});

test('CyberNebulaEngine - Player movement & boundary clamping', () => {
  const engine = new CyberNebulaEngine(null);
  engine.start();

  const startX = engine.player.x;
  engine.movePlayer(10, 0);
  assert.ok(engine.player.x > startX);

  // Clamping right boundary
  engine.movePlayer(2000, 0);
  assert.strictEqual(engine.player.x, engine.width - engine.player.radius);

  // Clamping left boundary
  engine.movePlayer(-4000, 0);
  assert.strictEqual(engine.player.x, engine.player.radius);
});

test('CyberNebulaEngine - Firing laser & Singularity Nova activation', () => {
  const engine = new CyberNebulaEngine(null);
  engine.start();

  assert.strictEqual(engine.projectiles.length, 0);
  engine.fireLaser();
  assert.strictEqual(engine.projectiles.length, 1);

  // Cooldown prevents immediate rapid-fire
  engine.fireLaser();
  assert.strictEqual(engine.projectiles.length, 1);

  // Trigger Singularity Nova
  assert.strictEqual(engine.player.singularityCharges, 3);
  engine.triggerSingularity();
  assert.strictEqual(engine.player.singularityCharges, 2);
  assert.strictEqual(engine.singularityNovas.length, 1);
});

test('CyberNebulaEngine - Boss spawning and destruction', () => {
  const engine = new CyberNebulaEngine(null);
  engine.start();
  engine.spawnBoss();

  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.type, 'NebulaOverlord');

  const initialScore = engine.score;
  engine.destroyBoss();
  assert.strictEqual(engine.boss, null);
  assert.ok(engine.score > initialScore);
});

test('CyberNebulaEngine - Game over triggering', () => {
  const engine = new CyberNebulaEngine(null);
  engine.start();

  engine.damagePlayer(200);
  assert.strictEqual(engine.player.hp, 0);
  assert.strictEqual(engine.over, true);
});
