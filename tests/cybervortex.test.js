// Node.js Unit Tests for Cyber Vortex Engine logic
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mock browser globals before requiring script code
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

// Extract CyberVortexEngine from cybervortex.html
const vortexPath = path.join(__dirname, '..', 'cybervortex.html');
const fileContent = fs.readFileSync(vortexPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberVortexEngine {');
const endIndex = fileContent.indexOf('// Export for Node unit testing environments');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberVortexEngine boundaries in cybervortex.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberVortexEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberVortexEngine = mockModule.exports.CyberVortexEngine;

test('CyberVortexEngine - Initial state', () => {
  const engine = new CyberVortexEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.player.health, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.player.triBeamActive, false);
  assert.strictEqual(engine.level, 1);
});

test('CyberVortexEngine - Start, pause, resume, togglePause, and reset', () => {
  const engine = new CyberVortexEngine(null, {});
  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.player.health, 100);

  engine.pause();
  assert.strictEqual(engine.paused, true);

  engine.resume();
  assert.strictEqual(engine.paused, false);

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);

  engine.setScore(600);
  assert.strictEqual(engine.score, 600);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.enemies.length, 0);
});

test('CyberVortexEngine - Player movement & boundary clamping', () => {
  const engine = new CyberVortexEngine(null, {});
  engine.start();

  engine.movePlayer(1, 1);
  assert.ok(engine.player.vx > 0);
  assert.ok(engine.player.vy > 0);

  // Update multiple frames to reach border
  for (let i = 0; i < 100; i++) {
    engine.update();
  }

  // Bounds check (CANVAS_WIDTH = 600, CANVAS_HEIGHT = 400)
  assert.ok(engine.player.x <= 600 - engine.player.radius);
  assert.ok(engine.player.y <= 400 - engine.player.radius);

  // Move left and up
  engine.movePlayer(-1, -1);
  for (let i = 0; i < 100; i++) {
    engine.update();
  }
  assert.ok(engine.player.x >= engine.player.radius);
  assert.ok(engine.player.y >= engine.player.radius);
});

test('CyberVortexEngine - Plasma firing & cooldown', () => {
  const engine = new CyberVortexEngine(null, {});
  engine.start();

  assert.strictEqual(engine.playerBullets.length, 0);
  const fired = engine.fireBullet();
  assert.strictEqual(fired, true);
  assert.strictEqual(engine.playerBullets.length, 1);

  // Subsequent immediate fire should fail due to cooldown
  const firedAgain = engine.fireBullet();
  assert.strictEqual(firedAgain, false);
  assert.strictEqual(engine.playerBullets.length, 1);

  // Advance frames past cooldown
  for (let i = 0; i < 10; i++) {
    engine.update();
  }
  const firedThird = engine.fireBullet();
  assert.strictEqual(firedThird, true);
  assert.strictEqual(engine.playerBullets.length, 2);
});

test('CyberVortexEngine - EMP Vortex Pulse deployment & charge consumption', () => {
  const engine = new CyberVortexEngine(null, {});
  engine.start();
  engine.spawnEnemy();
  assert.strictEqual(engine.enemies.length, 1);

  assert.strictEqual(engine.player.empCharges, 3);
  const success = engine.triggerEmpPulse();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.empPulses.length, 1);
});

test('CyberVortexEngine - Powerup Collection', () => {
  const engine = new CyberVortexEngine(null, {});
  engine.start();

  assert.strictEqual(engine.player.triBeamActive, false);
  engine.collectPowerup('triBeam');
  assert.strictEqual(engine.player.triBeamActive, true);

  assert.strictEqual(engine.player.shieldActive, false);
  engine.collectPowerup('shield');
  assert.strictEqual(engine.player.shieldActive, true);
  assert.strictEqual(engine.player.shieldHealth, 70);

  engine.damagePlayer(30);
  assert.strictEqual(engine.player.shieldHealth, 40);
  assert.strictEqual(engine.player.health, 100); // Shield absorbed damage
});

test('CyberVortexEngine - Boss Singularity Spawning & Defeat', () => {
  const engine = new CyberVortexEngine(null, {});
  engine.start();

  assert.strictEqual(engine.boss, null);
  engine.spawnBoss();
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.name, 'VORTEX SINGULARITY');
  assert.ok(engine.boss.health > 0);

  // Defeat Boss
  engine.boss.y = 85;
  engine.boss.health = 10;
  engine.playerBullets.push({
    x: engine.boss.x,
    y: engine.boss.y,
    vx: 0,
    vy: 0,
    radius: 10,
    damage: 20,
    color: '#a855f7'
  });

  engine.update();
  assert.strictEqual(engine.boss, null);
  assert.strictEqual(engine.wave, 2);
});

test('CyberVortexEngine - Game Over State & High Score Persistence', () => {
  global.localStorage.store = {};
  const engine = new CyberVortexEngine(null, {});
  engine.start();

  engine.setScore(2400);
  engine.damagePlayer(100);

  assert.strictEqual(engine.player.health, 0);
  assert.strictEqual(engine.over, true);
  assert.strictEqual(global.localStorage.getItem('cybervortex_best'), '2400');
});

test('CyberVortexEngine - NaN and invalid input resilience', () => {
  const engine = new CyberVortexEngine(null, {});
  engine.start();

  engine.setScore(NaN);
  assert.strictEqual(engine.score, 0);

  engine.movePlayer('invalid', null);
  assert.strictEqual(engine.player.vx, 0);
  assert.strictEqual(engine.player.vy, 0);

  engine.damagePlayer(undefined);
  assert.strictEqual(engine.player.health, 90); // Default damage 10
});
