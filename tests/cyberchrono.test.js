// Node.js Unit Tests for Cyber Chrono Engine logic
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

// Extract CyberChronoEngine from cyberchrono.html
const htmlPath = path.join(__dirname, '..', 'cyberchrono.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberChronoEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberChronoEngine boundaries in cyberchrono.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberChronoEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberChronoEngine = mockModule.exports.CyberChronoEngine;

test('CyberChronoEngine - Initial state', () => {
  const engine = new CyberChronoEngine(null);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.shield, 100);
  assert.strictEqual(engine.player.novas, 3);
  assert.strictEqual(engine.boss, null);
});

test('CyberChronoEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberChronoEngine(null);
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

  engine.setScore(25000);
  assert.strictEqual(engine.score, 25000);
  assert.strictEqual(engine.highScore, 25000);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.enemies.length, 0);
  assert.strictEqual(engine.projectiles.length, 0);
});

test('CyberChronoEngine - Player movement & boundary clamping', () => {
  const engine = new CyberChronoEngine(null);
  engine.start();

  const startX = engine.player.x;
  engine.movePlayer(10, 0);
  assert.ok(engine.player.x > startX);

  // Clamping right boundary
  engine.movePlayer(2000, 0);
  assert.strictEqual(engine.player.x, engine.width - engine.player.radius);

  // Clamping left boundary
  engine.movePlayer(-2000, 0);
  assert.strictEqual(engine.player.x, engine.player.radius);
});

test('CyberChronoEngine - Firing Chrono Pulse Beam & Time Dilation', () => {
  const engine = new CyberChronoEngine(null);
  engine.start();

  assert.strictEqual(engine.projectiles.length, 0);
  engine.fireChronoPulse();
  assert.strictEqual(engine.projectiles.length, 1);

  const initialEnergy = engine.player.energy;
  engine.keys['Space'] = true;
  engine.update();
  assert.strictEqual(engine.timeDilationActive, true);
  assert.ok(engine.player.energy < initialEnergy);

  engine.keys['Space'] = false;
  engine.update();
  assert.strictEqual(engine.timeDilationActive, false);
});

test('CyberChronoEngine - Temporal Rewind Nova detonation', () => {
  const engine = new CyberChronoEngine(null);
  engine.start();

  const initialNovas = engine.player.novas;
  assert.strictEqual(engine.novas.length, 0);

  engine.triggerTemporalRewind();
  assert.strictEqual(engine.player.novas, initialNovas - 1);
  assert.strictEqual(engine.novas.length, 1);
});

test('CyberChronoEngine - Boss spawning & defeat', () => {
  const engine = new CyberChronoEngine(null);
  engine.start();

  engine.spawnBoss();
  assert.notStrictEqual(engine.boss, null);
  assert.ok(engine.boss.hp > 0);

  engine.boss.hp = 0;
  engine.update();
  assert.strictEqual(engine.boss, null);
});

test('CyberChronoEngine - Game over state & high score persistence', () => {
  const engine = new CyberChronoEngine(null);
  engine.start();

  engine.setScore(50000);
  engine.damagePlayer(200);

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.player.hp, 0);
  assert.strictEqual(global.localStorage.getItem('cyberchrono_best'), '50000');
});

test('CyberChronoEngine - Resilient to invalid inputs & NaN edge cases', () => {
  const engine = new CyberChronoEngine(null);
  engine.start();

  engine.aimAt(NaN, undefined);
  assert.ok(!isNaN(engine.player.angle));

  engine.movePlayer(NaN, Infinity);
  assert.ok(!isNaN(engine.player.x));
  assert.ok(!isNaN(engine.player.y));
});
