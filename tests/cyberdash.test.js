// Node.js Unit Tests for Cyber Dash Engine logic
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
const { getBestScore, saveBestScore, checkCollision, checkCircleCollision } = require('../utils.js');
global.getBestScore = getBestScore;
global.saveBestScore = saveBestScore;
global.checkCollision = checkCollision;
global.checkCircleCollision = checkCircleCollision;

// Extract CyberDashEngine from cyberdash.html
const cyberdashPath = path.join(__dirname, '..', 'cyberdash.html');
const fileContent = fs.readFileSync(cyberdashPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberDashEngine');
const endIndex = fileContent.indexOf('// ─── DOM Initialization');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberDashEngine boundaries in cyberdash.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberDashEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore);

const CyberDashEngine = mockModule.exports.CyberDashEngine;

test('CyberDashEngine - Initial state', () => {
  const engine = new CyberDashEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.empCharges, 1);
  assert.strictEqual(engine.shield, false);
  assert.strictEqual(engine.currentLane, 1);
});

test('CyberDashEngine - Start and reset', () => {
  const engine = new CyberDashEngine(null, {});
  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);

  engine.score = 500;
  engine.multiplier = 3;
  engine.reset();

  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.multiplier, 1);
});

test('CyberDashEngine - Movement bounds', () => {
  const engine = new CyberDashEngine(null, {});
  engine.start();

  // Initial lane = 1
  assert.strictEqual(engine.currentLane, 1);

  engine.moveUp();
  assert.strictEqual(engine.currentLane, 0);

  // Cant move up past top lane 0
  engine.moveUp();
  assert.strictEqual(engine.currentLane, 0);

  engine.moveDown();
  assert.strictEqual(engine.currentLane, 1);
  engine.moveDown();
  assert.strictEqual(engine.currentLane, 2);
  engine.moveDown();
  assert.strictEqual(engine.currentLane, 3);

  // Cant move down past bottom lane 3
  engine.moveDown();
  assert.strictEqual(engine.currentLane, 3);
});

test('CyberDashEngine - EMP pulse activation wipes obstacles', () => {
  const engine = new CyberDashEngine(null, {});
  engine.start();

  // Add dummy obstacles
  engine.obstacles.push({ x: 200, y: 100, width: 20, height: 20, type: 'gate', color: '#ff0' });
  engine.obstacles.push({ x: 400, y: 200, width: 20, height: 20, type: 'virus', color: '#f00' });
  assert.strictEqual(engine.obstacles.length, 2);

  assert.strictEqual(engine.empCharges, 1);
  const success = engine.triggerEmpPulse();

  assert.strictEqual(success, true);
  assert.strictEqual(engine.empCharges, 0);
  assert.strictEqual(engine.obstacles.length, 0);
  assert.notStrictEqual(engine.empPulse, null);
});

test('CyberDashEngine - Shield protection absorbs obstacle collision', () => {
  const engine = new CyberDashEngine(null, {});
  engine.start();

  engine.shield = true;
  engine.player.x = 100;
  engine.player.y = engine.lanes[1];
  engine.player.targetY = engine.lanes[1];

  // Obstacle right at player position
  engine.obstacles.push({
    x: 100,
    y: engine.lanes[1],
    width: 30,
    height: 30,
    type: 'gate',
    color: '#ff007f'
  });

  engine.update();

  // Shield absorbed collision, engine is still alive, shield is consumed
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.shield, false);
  assert.strictEqual(engine.obstacles.length, 0);
});

test('CyberDashEngine - Unshielded obstacle collision triggers Game Over', () => {
  const engine = new CyberDashEngine(null, {});
  engine.start();

  engine.shield = false;
  engine.player.x = 100;
  engine.player.y = engine.lanes[1];
  engine.player.targetY = engine.lanes[1];

  engine.obstacles.push({
    x: 100,
    y: engine.lanes[1],
    width: 30,
    height: 30,
    type: 'gate',
    color: '#ff007f'
  });

  engine.update();

  assert.strictEqual(engine.over, true);
});

test('CyberDashEngine - Collectible pickup boosts score and multipliers', () => {
  const engine = new CyberDashEngine(null, {});
  engine.start();

  engine.player.x = 100;
  engine.player.y = engine.lanes[1];
  engine.player.targetY = engine.lanes[1];

  // Add collectible right at player position
  engine.collectibles.push({
    x: 100,
    y: engine.lanes[1],
    radius: 12,
    type: 'node',
    color: '#4ade80'
  });

  assert.strictEqual(engine.score, 0);
  engine.update();

  assert.strictEqual(engine.score, 50); // 50 * 1x multiplier
  assert.strictEqual(engine.collectibles.length, 0);
});
