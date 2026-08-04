// Node.js Unit Tests for Cyber Hacker Engine logic
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

// Extract CyberHackerEngine from cyberhacker.html
const cyberhackerPath = path.join(__dirname, '..', 'cyberhacker.html');
const fileContent = fs.readFileSync(cyberhackerPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberHackerEngine');
const endIndex = fileContent.indexOf('// ─── DOM Initialization');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberHackerEngine boundaries in cyberhacker.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberHackerEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'clamp', 'randomRange', 'getBestScore', 'saveBestScore', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, clamp, randomRange, getBestScore, saveBestScore);

const CyberHackerEngine = mockModule.exports.CyberHackerEngine;

test('CyberHackerEngine - Initial state', () => {
  const engine = new CyberHackerEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.empCharges, 1);
  assert.strictEqual(engine.level, 1);
  assert.strictEqual(engine.player.shield, false);
});

test('CyberHackerEngine - Start and reset', () => {
  const engine = new CyberHackerEngine(null, {});
  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);

  engine.score = 300;
  engine.empCharges = 3;
  engine.level = 3;
  engine.player.shield = true;

  engine.reset();
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.empCharges, 1);
  assert.strictEqual(engine.level, 1);
  assert.strictEqual(engine.player.shield, false);
});

test('CyberHackerEngine - Player movement and boundary clamping', () => {
  const engine = new CyberHackerEngine(null, {});
  engine.start();

  const initialX = engine.player.x;
  engine.movePlayer(10);
  assert.strictEqual(engine.player.x, initialX + 10);

  // Move far right beyond screen width
  engine.movePlayer(1000);
  assert.strictEqual(engine.player.x, engine.CANVAS_WIDTH - engine.player.width);

  // Move far left beyond 0
  engine.movePlayer(-2000);
  assert.strictEqual(engine.player.x, 0);

  // Move directly to absolute X coordinate
  engine.movePlayerToX(200);
  assert.strictEqual(engine.player.x, 200 - engine.player.width / 2);
});

test('CyberHackerEngine - EMP pulse wipes screen hazards and awards score', () => {
  const engine = new CyberHackerEngine(null, {});
  engine.start();

  engine.firewalls.push({ x: 100, y: 100, width: 80, height: 12, speed: 3 });
  engine.packets.push({ x: 200, y: 200, radius: 8, speed: 3, type: 'data' });

  assert.strictEqual(engine.firewalls.length, 1);
  assert.strictEqual(engine.packets.length, 1);
  assert.strictEqual(engine.empCharges, 1);

  const triggered = engine.triggerEmpPulse();
  assert.strictEqual(triggered, true);
  assert.strictEqual(engine.empCharges, 0);
  assert.strictEqual(engine.firewalls.length, 0);
  assert.strictEqual(engine.packets.length, 0);
  assert.strictEqual(engine.score, 30); // 2 objects * 15 pts

  // Secondary pulse attempt without charges should fail
  const triggered2 = engine.triggerEmpPulse();
  assert.strictEqual(triggered2, false);
});

test('CyberHackerEngine - Shield absorbs firewall collision', () => {
  const engine = new CyberHackerEngine(null, {});
  engine.start();

  engine.player.shield = true;
  engine.player.shieldTime = 5000;
  engine.player.x = 200;
  engine.player.y = 560;

  engine.firewalls.push({
    x: 200,
    y: 560,
    width: 50,
    height: 14,
    speed: 3
  });

  engine.update();

  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.player.shield, false);
  assert.strictEqual(engine.firewalls.length, 0);
});

test('CyberHackerEngine - Unshielded firewall collision triggers Game Over', () => {
  const engine = new CyberHackerEngine(null, {});
  engine.start();

  engine.player.shield = false;
  engine.player.x = 200;
  engine.player.y = 560;

  engine.firewalls.push({
    x: 200,
    y: 560,
    width: 50,
    height: 14,
    speed: 3
  });

  engine.update();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
});

test('CyberHackerEngine - Data packet pickup increases score and inventory', () => {
  const engine = new CyberHackerEngine(null, {});
  engine.start();

  engine.player.x = 200;
  engine.player.y = 560;

  // Data packet pickup
  engine.packets.push({
    x: 220,
    y: 565,
    radius: 8,
    speed: 1,
    type: 'data'
  });

  assert.strictEqual(engine.score, 0);
  engine.update();
  assert.strictEqual(engine.score, 10);

  // Crypto packet pickup (gives +50 score and +1 EMP charge)
  engine.empCharges = 0;
  engine.packets.push({
    x: 220,
    y: 565,
    radius: 10,
    speed: 1,
    type: 'crypto'
  });

  engine.update();
  assert.strictEqual(engine.score, 60);
  assert.strictEqual(engine.empCharges, 1);
});
