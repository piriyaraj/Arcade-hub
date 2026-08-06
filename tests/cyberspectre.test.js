// Node.js Unit Tests for Cyber Spectre Engine logic
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

// Extract CyberSpectreEngine from cyberspectre.html
const htmlPath = path.join(__dirname, '..', 'cyberspectre.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberSpectreEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && module.exports)');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberSpectreEngine boundaries in cyberspectre.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberSpectreEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberSpectreEngine = mockModule.exports.CyberSpectreEngine;

test('CyberSpectreEngine - Initial state', () => {
  const engine = new CyberSpectreEngine(null);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.shield, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.decoy, null);
  assert.strictEqual(engine.boss, null);
});

test('CyberSpectreEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberSpectreEngine(null);
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

  engine.setScore(6200);
  assert.strictEqual(engine.score, 6200);
  assert.strictEqual(engine.highScore, 6200);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.enemies.length, 0);
  assert.strictEqual(engine.projectiles.length, 0);
});

test('CyberSpectreEngine - Player movement, aiming & boundary clamping', () => {
  const engine = new CyberSpectreEngine(null);
  engine.start();

  const startX = engine.player.x;
  engine.movePlayer(10, 0);
  assert.ok(engine.player.x > startX);

  // Push beyond right edge
  engine.movePlayer(1000, 0);
  assert.ok(engine.player.x <= engine.width - engine.player.radius);

  // Push beyond top edge
  engine.movePlayer(0, -2000);
  assert.ok(engine.player.y >= engine.player.radius);

  // Aiming logic
  engine.aimAt(400, 100);
  assert.ok(Number.isFinite(engine.player.angle));
});

test('CyberSpectreEngine - Spectral bolt firing & quad powerup', () => {
  const engine = new CyberSpectreEngine(null);
  engine.start();

  engine.fireSpectralBolt();
  assert.strictEqual(engine.projectiles.length, 1);
  assert.strictEqual(engine.projectiles[0].fromPlayer, true);

  // Cooldown prevents immediate spam firing
  engine.fireSpectralBolt();
  assert.strictEqual(engine.projectiles.length, 1);

  // Enable quad spectral powerup
  engine.player.fireCooldown = 0;
  engine.player.powerupType = 'spectral_quad';
  engine.fireSpectralBolt();
  assert.strictEqual(engine.projectiles.length, 5); // 1 previous + 4 quad bolts
});

test('CyberSpectreEngine - Phase Decoy deployment', () => {
  const engine = new CyberSpectreEngine(null);
  engine.start();

  assert.strictEqual(engine.decoy, null);
  const success = engine.deployPhaseDecoy();
  assert.strictEqual(success, true);
  assert.ok(engine.decoy !== null);
  assert.strictEqual(engine.decoy.hp, 250);
  assert.strictEqual(engine.player.stealthTime, 210);

  // Repeated deploy fail on cooldown
  const repeatSuccess = engine.deployPhaseDecoy();
  assert.strictEqual(repeatSuccess, false);
});

test('CyberSpectreEngine - EMP Spectral Nova blast', () => {
  const engine = new CyberSpectreEngine(null);
  engine.start();

  assert.strictEqual(engine.player.empCharges, 3);
  engine.enemies.push({ x: 200, y: 200, hp: 50, maxHp: 50, type: 'spectre_bug', radius: 14, speed: 2, color: '#00f2fe' });
  engine.projectiles.push({ x: 200, y: 200, vx: 0, vy: 0, radius: 4, fromPlayer: false, damage: 10 });

  const success = engine.triggerEMP();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.projectiles.length, 0); // Hostile projectile destroyed
  assert.strictEqual(engine.enemies.length, 0); // Weak enemy destroyed
  assert.strictEqual(engine.explosions.length, 1);
});

test('CyberSpectreEngine - Boss Spectre Apex Overlord spawning & defeat', () => {
  const engine = new CyberSpectreEngine(null);
  engine.start();

  engine.spawnBoss(1);
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.hp, 1500);

  // Hit boss with lethal beam
  const p = { x: engine.boss.x, y: engine.boss.y, vx: 0, vy: 0, radius: 5, fromPlayer: true, damage: 1500 };
  engine.projectiles.push(p);
  engine.update();

  assert.strictEqual(engine.boss, null); // Boss destroyed
  assert.ok(engine.score >= 1000);
});

test('CyberSpectreEngine - Game over state & high score persistence', () => {
  const engine = new CyberSpectreEngine(null);
  engine.start();

  engine.setScore(8900);
  engine.gameOver();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(global.localStorage.getItem('cyberspectre_best'), '8900');
});

test('CyberSpectreEngine - Resilient to invalid inputs & NaN edge cases', () => {
  const engine = new CyberSpectreEngine(null);
  engine.start();

  engine.movePlayer(NaN, undefined);
  assert.ok(Number.isFinite(engine.player.x));
  assert.ok(Number.isFinite(engine.player.y));

  engine.aimAt(NaN, null);
  assert.ok(Number.isFinite(engine.player.angle));

  engine.setScore(NaN);
  assert.strictEqual(engine.score, 0);
});
