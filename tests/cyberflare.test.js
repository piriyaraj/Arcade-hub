// Node.js Unit Tests for Cyber Flare Engine logic
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

// Extract CyberFlareEngine from cyberflare.html
const htmlPath = path.join(__dirname, '..', 'cyberflare.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberFlareEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && module.exports)');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberFlareEngine boundaries in cyberflare.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberFlareEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberFlareEngine = mockModule.exports.CyberFlareEngine;

test('CyberFlareEngine - Initial state', () => {
  const engine = new CyberFlareEngine(null);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.shield, 50);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.solMatrix.hp, 100);
});

test('CyberFlareEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberFlareEngine(null);
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

test('CyberFlareEngine - Player movement & boundary clamping', () => {
  const engine = new CyberFlareEngine(null);
  engine.start();

  const startX = engine.player.x;
  engine.movePlayer(20, 0);
  assert.strictEqual(engine.player.x, startX + 20);

  // Push beyond right edge
  engine.movePlayer(1000, 0);
  assert.ok(engine.player.x <= engine.width - engine.player.radius);

  // Push beyond top edge
  engine.movePlayer(0, -2000);
  assert.ok(engine.player.y >= engine.player.radius);
});

test('CyberFlareEngine - Plasma firing & tri-beam mode', () => {
  const engine = new CyberFlareEngine(null);
  engine.start();

  engine.firePlasma();
  assert.strictEqual(engine.projectiles.length, 1);
  assert.strictEqual(engine.projectiles[0].fromPlayer, true);

  // Cooldown prevents immediate spam firing
  engine.firePlasma();
  assert.strictEqual(engine.projectiles.length, 1);

  // Enable tri-beam mode
  engine.player.fireCooldown = 0;
  engine.player.powerupType = 'tri_beam';
  engine.firePlasma();
  assert.strictEqual(engine.projectiles.length, 4); // 1 previous + 3 tri-beam bolts
});

test('CyberFlareEngine - EMP Solar Flare nova blast', () => {
  const engine = new CyberFlareEngine(null);
  engine.start();

  assert.strictEqual(engine.player.empCharges, 3);
  // Add hostile projectile
  engine.projectiles.push({ x: 200, y: 200, vx: 0, vy: 0, radius: 4, fromPlayer: false, damage: 10 });
  
  const success = engine.triggerEMP();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.projectiles.length, 0); // Hostile projectile cleared
  assert.strictEqual(engine.explosions.length, 1);
});

test('CyberFlareEngine - Boss Sol-Core Overlord spawning & damage', () => {
  const engine = new CyberFlareEngine(null);
  engine.start();

  engine.spawnBoss(3);
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.hp, 600);

  // Hit boss with player beam
  const p = { x: engine.boss.x, y: engine.boss.y, vx: 0, vy: 0, radius: 5, fromPlayer: true, damage: 600 };
  engine.projectiles.push(p);
  engine.update();

  assert.strictEqual(engine.boss, null); // Boss destroyed
  assert.ok(engine.score >= 2000);
});

test('CyberFlareEngine - Game over state & high score persistence', () => {
  const engine = new CyberFlareEngine(null);
  engine.start();

  engine.setScore(8000);
  engine.gameOver();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(global.localStorage.getItem('cyberflare_best'), '8000');
});

test('CyberFlareEngine - Resilient to invalid inputs & NaN edge cases', () => {
  const engine = new CyberFlareEngine(null);
  engine.start();

  engine.movePlayer(NaN, undefined);
  assert.ok(Number.isFinite(engine.player.x));
  assert.ok(Number.isFinite(engine.player.y));

  engine.setScore(NaN);
  assert.strictEqual(engine.score, 0);
});
