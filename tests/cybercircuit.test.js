// Node.js Unit Tests for Cyber Circuit Engine logic
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
const { getBestScore, saveBestScore, clamp } = require('../utils.js');
global.getBestScore = getBestScore;
global.saveBestScore = saveBestScore;
global.clamp = clamp;

// Extract CyberCircuitEngine from cybercircuit.html
const circuitPath = path.join(__dirname, '..', 'cybercircuit.html');
const fileContent = fs.readFileSync(circuitPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberCircuitEngine {');
const endIndex = fileContent.indexOf('// Export for Node unit testing environments');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberCircuitEngine boundaries in cybercircuit.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberCircuitEngine };';
const evalFn = new Function('module', 'exports', 'clamp', 'getBestScore', 'saveBestScore', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, clamp, getBestScore, saveBestScore);

const CyberCircuitEngine = mockModule.exports.CyberCircuitEngine;

test('CyberCircuitEngine - Initial state', () => {
  const engine = new CyberCircuitEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.lives, 3);
  assert.strictEqual(engine.level, 1);
  assert.strictEqual(engine.empCharge, 100);
});

test('CyberCircuitEngine - Start, pause, resume, togglePause, and reset', () => {
  const engine = new CyberCircuitEngine(null, {});
  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.ok(engine.nodes.length > 0);
  assert.ok(engine.viruses.length > 0);

  engine.pause();
  assert.strictEqual(engine.paused, true);

  engine.resume();
  assert.strictEqual(engine.paused, false);

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);

  engine.setScore(500);
  assert.strictEqual(engine.score, 500);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.nodes.length, 0);
  assert.strictEqual(engine.viruses.length, 0);
});

test('CyberCircuitEngine - Pulse navigation and boundary clamping', () => {
  const engine = new CyberCircuitEngine(null, {});
  engine.start();

  engine.pulse.x = -100;
  engine.pulse.y = -100;
  engine.update(0.01);

  assert.ok(engine.pulse.x >= engine.pulse.radius);
  assert.ok(engine.pulse.y >= engine.pulse.radius);

  engine.pulse.x = 2000;
  engine.pulse.y = 2000;
  engine.update(0.01);

  assert.ok(engine.pulse.x <= engine.width - engine.pulse.radius);
  assert.ok(engine.pulse.y <= engine.height - engine.pulse.radius);
});

test('CyberCircuitEngine - EMP Shockwave trigger and virus purge', () => {
  const engine = new CyberCircuitEngine(null, {});
  engine.start();
  assert.strictEqual(engine.empCharge, 100);

  const triggered = engine.triggerEmp();
  assert.strictEqual(triggered, true);
  assert.strictEqual(engine.empCharge, 0);
  assert.strictEqual(engine.empShockwaves.length, 1);

  // Position virus within EMP range
  engine.viruses = [{
    x: engine.pulse.x + 5,
    y: engine.pulse.y + 5,
    vx: 0,
    vy: 0,
    radius: 10,
    hp: 1
  }];

  engine.update(0.05);
  assert.strictEqual(engine.viruses.length, 0);
});

test('CyberCircuitEngine - Score accumulation & Multipliers', () => {
  const engine = new CyberCircuitEngine(null, {});
  engine.start();
  engine.setScore(0);
  engine.multiplier = 2;

  engine.addScore(100);
  assert.strictEqual(engine.score, 200);

  engine.takeDamage();
  assert.strictEqual(engine.lives, 2);
  assert.strictEqual(engine.multiplier, 1);
});

test('CyberCircuitEngine - Boss Core encounter and level progression', () => {
  const engine = new CyberCircuitEngine(null, {});
  engine.start();
  engine.level = 5;
  engine.update(0.01);

  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.maxHp, 20);

  engine.boss.hp = 0;
  engine.update(0.01);

  assert.strictEqual(engine.boss, null);
  assert.strictEqual(engine.level, 6);
});

test('CyberCircuitEngine - Game Over state & score persistence', () => {
  global.localStorage.store = {};
  const engine = new CyberCircuitEngine(null, {});
  engine.start();
  engine.setScore(1500);

  engine.takeDamage();
  engine.takeDamage();
  engine.takeDamage();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.score, 1500);
  assert.strictEqual(engine.bestScore, 1500);
});

test('CyberCircuitEngine - Phase Dash, Shield Overcharge, Surge Overdrive & NaN resilience', () => {
  const engine = new CyberCircuitEngine(null, {});
  engine.start();

  // Test Phase Dash
  assert.strictEqual(engine.dashActive, false);
  const dashTriggered = engine.triggerDash();
  assert.strictEqual(dashTriggered, true);
  assert.strictEqual(engine.dashActive, true);

  // Dash grants invulnerability to damage
  const initialLives = engine.lives;
  engine.takeDamage();
  assert.strictEqual(engine.lives, initialLives); // No life lost

  // Expire dash over frames
  for (let i = 0; i < 10; i++) {
    engine.update(0.05);
  }
  assert.strictEqual(engine.dashActive, false);

  // Test Shield Overcharge
  assert.strictEqual(engine.shieldActive, false);
  engine.activateShield(300);
  assert.strictEqual(engine.shieldActive, true);

  // Shield absorbs hit
  engine.takeDamage();
  assert.strictEqual(engine.lives, initialLives);
  assert.strictEqual(engine.shieldActive, false);

  // Test Surge Overdrive
  assert.strictEqual(engine.overdriveActive, false);
  engine.triggerOverdrive(400);
  assert.strictEqual(engine.overdriveActive, true);
  assert.ok(engine.multiplier >= 4);

  // Test NaN resilience
  engine.pulse.x = NaN;
  engine.pulse.y = NaN;
  engine.update(NaN);
  assert.strictEqual(engine.pulse.x, engine.width / 2);
  assert.strictEqual(engine.pulse.y, engine.height / 2);
});

