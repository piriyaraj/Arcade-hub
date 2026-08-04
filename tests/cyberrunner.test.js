// Node.js Unit Tests for Cyber Runner Engine logic
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
const { getBestScore, saveBestScore, checkCollision, checkCircleCollision, getMuteState, saveMuteState } = require('../utils.js');
global.getBestScore = getBestScore;
global.saveBestScore = saveBestScore;
global.checkCollision = checkCollision;
global.checkCircleCollision = checkCircleCollision;
global.getMuteState = getMuteState;
global.saveMuteState = saveMuteState;

// Extract CyberRunnerEngine from cyberrunner.html
const cyberrunnerPath = path.join(__dirname, '..', 'cyberrunner.html');
const fileContent = fs.readFileSync(cyberrunnerPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberRunnerEngine');
const endIndex = fileContent.indexOf('// ─── DOM Initialization');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberRunnerEngine boundaries in cyberrunner.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberRunnerEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore);

const CyberRunnerEngine = mockModule.exports.CyberRunnerEngine;

test('CyberRunnerEngine - Initial state', () => {
  const engine = new CyberRunnerEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.empCharges, 1);
  assert.strictEqual(engine.shield, false);
  assert.strictEqual(engine.runner.isJumping, false);
  assert.strictEqual(engine.runner.isDucking, false);
});

test('CyberRunnerEngine - Start and reset', () => {
  const engine = new CyberRunnerEngine(null, {});
  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);

  engine.score = 500;
  engine.empCharges = 3;
  engine.shield = true;

  engine.reset();
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.empCharges, 1);
  assert.strictEqual(engine.shield, false);
});

test('CyberRunnerEngine - Jump, Double Jump, and Duck mechanics', () => {
  const engine = new CyberRunnerEngine(null, {});
  engine.start();

  assert.strictEqual(engine.runner.isJumping, false);
  assert.strictEqual(engine.runner.jumpsRemaining, 2);

  // First Jump
  const jumped1 = engine.jump();
  assert.strictEqual(jumped1, true);
  assert.strictEqual(engine.runner.isJumping, true);
  assert.strictEqual(engine.runner.jumpsRemaining, 1);

  // Double Jump while mid-air
  const jumped2 = engine.jump();
  assert.strictEqual(jumped2, true);
  assert.strictEqual(engine.runner.jumpsRemaining, 0);

  // Third jump attempt should fail
  const jumped3 = engine.jump();
  assert.strictEqual(jumped3, false);

  // Reset runner back to ground
  engine.resetRunner();
  assert.strictEqual(engine.runner.isJumping, false);

  // Ducking on ground
  engine.duck(true);
  assert.strictEqual(engine.runner.isDucking, true);
  assert.strictEqual(engine.runner.height, engine.runner.duckHeight);

  // Unducking
  engine.duck(false);
  assert.strictEqual(engine.runner.isDucking, false);
  assert.strictEqual(engine.runner.height, engine.runner.normalHeight);
});

test('CyberRunnerEngine - EMP pulse activation wipes obstacles', () => {
  const engine = new CyberRunnerEngine(null, {});
  engine.start();

  // Add mock obstacles
  engine.obstacles.push({ x: 200, y: 200, width: 20, height: 20, type: 'fence', color: '#f00' });
  engine.obstacles.push({ x: 400, y: 180, width: 20, height: 20, type: 'drone', color: '#00f' });
  assert.strictEqual(engine.obstacles.length, 2);
  assert.strictEqual(engine.empCharges, 1);

  const triggered = engine.triggerEmpPulse();
  assert.strictEqual(triggered, true);
  assert.strictEqual(engine.empCharges, 0);
  assert.strictEqual(engine.obstacles.length, 0);
  assert.notStrictEqual(engine.empPulse, null);
  assert.strictEqual(engine.empPulse.radius, 10);

  // Triggering again without charges should fail
  const triggered2 = engine.triggerEmpPulse();
  assert.strictEqual(triggered2, false);
});

test('CyberRunnerEngine - Shield protection absorbs obstacle collision', () => {
  const engine = new CyberRunnerEngine(null, {});
  engine.start();

  engine.shield = true;
  engine.runner.x = 80;
  engine.runner.y = engine.GROUND_Y - engine.runner.normalHeight;

  // Place obstacle directly colliding with runner
  engine.obstacles.push({
    x: 80,
    y: engine.GROUND_Y - engine.runner.normalHeight,
    width: 25,
    height: 45,
    type: 'fence',
    color: '#ff007f',
    update() {}
  });

  engine.update();

  // Shield absorbs hit, engine stays alive, shield is consumed
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.shield, false);
  assert.strictEqual(engine.obstacles.length, 0);
});

test('CyberRunnerEngine - Unshielded obstacle collision triggers Game Over', () => {
  const engine = new CyberRunnerEngine(null, {});
  engine.start();

  engine.shield = false;
  engine.runner.x = 80;
  engine.runner.y = engine.GROUND_Y - engine.runner.normalHeight;

  engine.obstacles.push({
    x: 80,
    y: engine.GROUND_Y - engine.runner.normalHeight,
    width: 25,
    height: 45,
    type: 'fence',
    color: '#ff007f',
    update() {}
  });

  engine.update();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
});

test('CyberRunnerEngine - Collectibles (node, shield, emp) update score and inventory', () => {
  const engine = new CyberRunnerEngine(null, {});
  engine.start();

  engine.runner.x = 80;
  engine.runner.y = engine.GROUND_Y - engine.runner.normalHeight;

  // Node collectible
  engine.collectibles.push({
    type: 'node',
    x: 80,
    y: engine.GROUND_Y - engine.runner.normalHeight,
    width: 16,
    height: 16,
    update() {}
  });

  assert.strictEqual(engine.score, 0);
  engine.update();
  assert.strictEqual(engine.score, 50);

  // Shield collectible
  engine.collectibles.push({
    type: 'shield',
    x: 80,
    y: engine.GROUND_Y - engine.runner.normalHeight,
    width: 16,
    height: 16,
    update() {}
  });

  assert.strictEqual(engine.shield, false);
  engine.update();
  assert.strictEqual(engine.shield, true);

  // EMP charge collectible
  engine.empCharges = 0;
  engine.collectibles.push({
    type: 'emp',
    x: 80,
    y: engine.GROUND_Y - engine.runner.normalHeight,
    width: 16,
    height: 16,
    update() {}
  });

  engine.update();
  assert.strictEqual(engine.empCharges, 1);
});
