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

function createMockCanvas() {
  return {
    width: 800,
    height: 600,
    getContext: () => ({
      clearRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      setLineDash: () => {},
      shadowColor: '',
      shadowBlur: 0,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1
    }),
    addEventListener: () => {}
  };
}

test('CyberNebulaEngine - Initial state', () => {
  const canvas = createMockCanvas();
  const engine = new CyberNebulaEngine(canvas);

  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.novaReady, true);
});

test('CyberNebulaEngine - Lifecycle start & wave spawn', () => {
  const canvas = createMockCanvas();
  const engine = new CyberNebulaEngine(canvas);

  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.ok(engine.enemies.length > 0);
  assert.ok(engine.energyNodes.length > 0);
});

test('CyberNebulaEngine - Bullet firing & energy node harvesting', () => {
  const canvas = createMockCanvas();
  const engine = new CyberNebulaEngine(canvas);
  engine.start();

  assert.strictEqual(engine.bullets.length, 0);
  engine.fireBullet();
  assert.strictEqual(engine.bullets.length, 1);

  // Position an energy node right next to player
  engine.energyNodes.push({
    x: engine.player.x + 5,
    y: engine.player.y,
    radius: 8,
    pulse: 0,
    value: 150
  });

  const initialNodesCount = engine.energyNodes.length;
  engine.update(0.016, {});
  assert.ok(engine.score >= 150);
});

test('CyberNebulaEngine - Pulsar Nova trigger & cooldown', () => {
  const canvas = createMockCanvas();
  const engine = new CyberNebulaEngine(canvas);
  engine.start();

  assert.strictEqual(engine.player.novaReady, true);
  engine.triggerPulsarNova();
  assert.strictEqual(engine.player.novaReady, false);
  assert.ok(engine.shockwaves.length > 0);

  // Advance time to pass cooldown
  engine.update(8.5, {});
  assert.strictEqual(engine.player.novaReady, true);
});

test('CyberNebulaEngine - Enemy damage & game over', () => {
  const canvas = createMockCanvas();
  const engine = new CyberNebulaEngine(canvas);
  engine.start();

  // Set low player HP and place enemy at player position
  engine.player.hp = 10;
  engine.enemies.push({
    x: engine.player.x,
    y: engine.player.y,
    radius: 15,
    hp: 1,
    maxHp: 1,
    speed: 50,
    color: '#ec4899'
  });

  engine.update(0.016, {});
  assert.strictEqual(engine.over, true);
});
