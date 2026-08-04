// Node.js Unit Tests for CyberRacer Engine logic
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mock browser globals before requiring HTML script code
global.window = global.window || {};
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
const { getBestScore, saveBestScore, checkCollision, checkCircleCollision, getMuteState, saveMuteState, clamp, randomRange, formatScore } = require('../utils.js');
global.getBestScore = getBestScore;
global.saveBestScore = saveBestScore;
global.checkCollision = checkCollision;
global.checkCircleCollision = checkCircleCollision;
global.getMuteState = getMuteState;
global.saveMuteState = saveMuteState;
global.clamp = clamp;
global.randomRange = randomRange;
global.formatScore = formatScore;
global.getThemeColor = (key, fallback) => fallback;

// Extract CyberRacerEngine from cyberracer.html
const cyberracerPath = path.join(__dirname, '..', 'cyberracer.html');
const fileContent = fs.readFileSync(cyberracerPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberRacerEngine');
const endIndex = fileContent.indexOf('// ─── DOM Initialization');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberRacerEngine boundaries in cyberracer.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberRacerEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'getBestScore', 'saveBestScore', 'getThemeColor', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, getBestScore, saveBestScore, global.getThemeColor);

const CyberRacerEngine = mockModule.exports.CyberRacerEngine;

test('CyberRacerEngine - Initial state', () => {
  const engine = new CyberRacerEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.racer.empCharges, 1);
  assert.strictEqual(engine.racer.shield, false);
});

test('CyberRacerEngine - Start and reset', () => {
  const engine = new CyberRacerEngine(null, {});
  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);

  engine.score = 500;
  engine.racer.empCharges = 3;
  engine.racer.shield = true;

  engine.reset();
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.racer.empCharges, 1);
  assert.strictEqual(engine.racer.shield, false);
});

test('CyberRacerEngine - Steering bounds clamping', () => {
  const engine = new CyberRacerEngine(null, {});
  engine.start();

  const startX = engine.racer.x;
  engine.steer(-10);
  assert.strictEqual(engine.racer.x, startX - 10);

  // Steer far left beyond road left
  engine.steer(-1000);
  assert.strictEqual(engine.racer.x, engine.ROAD_LEFT + 5);

  // Steer far right beyond road right
  engine.steer(2000);
  assert.strictEqual(engine.racer.x, engine.ROAD_RIGHT - 5 - engine.racer.width);
});

test('CyberRacerEngine - EMP pulse activation clears obstacles and awards score', () => {
  const engine = new CyberRacerEngine(null, {});
  engine.start();

  engine.obstacles.push({ x: 200, y: 200, width: 38, height: 64, type: 'traffic', color: '#f00' });
  engine.obstacles.push({ x: 300, y: 250, width: 32, height: 32, type: 'drone', color: '#00f' });

  assert.strictEqual(engine.obstacles.length, 2);
  assert.strictEqual(engine.racer.empCharges, 1);

  const triggered = engine.triggerEmpPulse();
  assert.strictEqual(triggered, true);
  assert.strictEqual(engine.racer.empCharges, 0);
  assert.strictEqual(engine.obstacles.length, 0);
  assert.strictEqual(engine.score, 30);

  const triggered2 = engine.triggerEmpPulse();
  assert.strictEqual(triggered2, false);
});

test('CyberRacerEngine - Shield absorbs obstacle collision', () => {
  const engine = new CyberRacerEngine(null, {});
  engine.start();

  engine.racer.shield = true;
  engine.racer.x = 200;
  engine.racer.y = 350;

  engine.obstacles.push({
    x: 200,
    y: 350,
    width: 40,
    height: 70,
    type: 'traffic',
    color: '#ff007f'
  });

  engine.update();

  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.racer.shield, false);
  assert.strictEqual(engine.obstacles.length, 0);
});

test('CyberRacerEngine - Unshielded obstacle collision triggers Game Over', () => {
  const engine = new CyberRacerEngine(null, {});
  engine.start();

  engine.racer.shield = false;
  engine.racer.x = 200;
  engine.racer.y = 350;

  engine.obstacles.push({
    x: 200,
    y: 350,
    width: 40,
    height: 70,
    type: 'traffic',
    color: '#ff007f'
  });

  engine.update();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
});

test('CyberRacerEngine - Collectibles (energy, shield, nitro) update score and status', () => {
  const engine = new CyberRacerEngine(null, {});
  engine.start();

  engine.racer.x = 200;
  engine.racer.y = 350;

  // Energy collectible
  engine.collectibles.push({
    type: 'energy',
    x: 200,
    y: 350,
    width: 16,
    height: 16,
    color: '#4ade80'
  });

  assert.strictEqual(engine.score, 0);
  engine.update();
  assert.strictEqual(engine.score, 50);

  // Shield collectible
  engine.collectibles.push({
    type: 'shield',
    x: 200,
    y: 350,
    width: 16,
    height: 16,
    color: '#38bdf8'
  });

  assert.strictEqual(engine.racer.shield, false);
  engine.update();
  assert.strictEqual(engine.racer.shield, true);

  // Nitro collectible
  engine.collectibles.push({
    type: 'nitro',
    x: 200,
    y: 350,
    width: 16,
    height: 16,
    color: '#ffaa00'
  });

  engine.update();
  assert.strictEqual(engine.racer.nitroTimer, 180);
});
