// Node.js Unit Tests for Cyber Eclipse Engine logic
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

// Extract CyberEclipseEngine from cybereclipse.html
const htmlPath = path.join(__dirname, '..', 'cybereclipse.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberEclipseEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberEclipseEngine boundaries in cybereclipse.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberEclipseEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberEclipseEngine = mockModule.exports.CyberEclipseEngine;

test('CyberEclipseEngine - Initial state', () => {
  const engine = new CyberEclipseEngine(null);
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

test('CyberEclipseEngine - start() and wave setup', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.enemies.length > 0, true);
});

test('CyberEclipseEngine - movePlayer() and clamp', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();
  engine.movePlayer(10, -20);
  assert.strictEqual(engine.player.x, 410);
  assert.strictEqual(engine.player.y, 280);

  // Bounds clamping
  engine.movePlayer(-1000, -1000);
  assert.strictEqual(engine.player.x, engine.player.radius);
  assert.strictEqual(engine.player.y, engine.player.radius);
});

test('CyberEclipseEngine - rotatePlayer()', () => {
  const engine = new CyberEclipseEngine(null);
  engine.rotatePlayer(500, 300);
  assert.strictEqual(typeof engine.player.angle, 'number');
});

test('CyberEclipseEngine - firePlayerWeapon()', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();
  engine.firePlayerWeapon();
  assert.strictEqual(engine.projectiles.length, 1);

  engine.player.weaponLevel = 2;
  engine.firePlayerWeapon();
  assert.strictEqual(engine.projectiles.length, 3); // 1 + 2

  engine.player.weaponLevel = 3;
  engine.firePlayerWeapon();
  assert.strictEqual(engine.projectiles.length, 6); // 3 + 3
});

test('CyberEclipseEngine - triggerEmp()', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();
  engine.triggerEmp();
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.empShockwaves.length, 1);
});

test('CyberEclipseEngine - setScore() and LocalStorage', () => {
  const engine = new CyberEclipseEngine(null);
  engine.setScore(500);
  assert.strictEqual(engine.score, 500);
  assert.strictEqual(engine.highScore, 500);
  assert.strictEqual(global.localStorage.getItem('cybereclipse_best'), '500');
});

test('CyberEclipseEngine - togglePause()', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();
  engine.togglePause();
  assert.strictEqual(engine.paused, true);
  engine.togglePause();
  assert.strictEqual(engine.paused, false);
});

test('CyberEclipseEngine - Boss spawning on wave 5', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();
  engine.startWave(5);
  assert.strictEqual(engine.boss !== null, true);
  assert.strictEqual(engine.enemies.length, 0);
});

test('CyberEclipseEngine - Player damage and Game Over', () => {
  const engine = new CyberEclipseEngine(null);
  engine.start();
  engine.player.hp = 5;
  engine.player.shield = 0;

  // Add enemy right on top of player
  engine.enemies = [{
    x: engine.player.x,
    y: engine.player.y,
    radius: 15,
    hp: 10,
    maxHp: 10,
    speed: 1,
    type: 'chaser',
    color: '#ec4899',
    fireCooldown: 0
  }];

  engine.update();
  assert.strictEqual(engine.over, true);
});
