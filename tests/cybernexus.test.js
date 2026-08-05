// Node.js Unit Tests for Cyber Nexus Engine logic
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

// Extract CyberNexusEngine from cybernexus.html
const nexusPath = path.join(__dirname, '..', 'cybernexus.html');
const fileContent = fs.readFileSync(nexusPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberNexusEngine {');
const endIndex = fileContent.indexOf('// Export for Node unit testing environments');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberNexusEngine boundaries in cybernexus.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberNexusEngine };';
const evalFn = new Function('module', 'exports', 'clamp', 'getBestScore', 'saveBestScore', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, clamp, getBestScore, saveBestScore);

const CyberNexusEngine = mockModule.exports.CyberNexusEngine;

test('CyberNexusEngine - Initial state', () => {
  const engine = new CyberNexusEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.lives, 3);
  assert.strictEqual(engine.level, 1);
  assert.strictEqual(engine.empCharge, 100);
});

test('CyberNexusEngine - Start, pause, resume, togglePause, and reset', () => {
  const engine = new CyberNexusEngine(null, {});
  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.ok(engine.enemies.length > 0);

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

test('CyberNexusEngine - Player Movement & Shooting', () => {
  const engine = new CyberNexusEngine(null, {});
  engine.start();

  engine.movePlayer(1, 0);
  assert.ok(engine.player.vx > 0);

  engine.update(0.01);
  assert.ok(engine.player.x > engine.width / 2);

  assert.strictEqual(engine.bullets.length, 0);
  const shot = engine.shoot();
  assert.strictEqual(shot, true);
  assert.strictEqual(engine.bullets.length, 1);
});

test('CyberNexusEngine - EMP Shockwave trigger and virus purge', () => {
  const engine = new CyberNexusEngine(null, {});
  engine.start();
  assert.strictEqual(engine.empCharge, 100);

  const triggered = engine.triggerEmp();
  assert.strictEqual(triggered, true);
  assert.strictEqual(engine.empCharge, 0);
  assert.strictEqual(engine.empShockwaves.length, 1);

  // Position enemy within EMP range
  engine.enemies = [{
    x: engine.player.x + 10,
    y: engine.player.y + 10,
    radius: 10,
    hp: 1,
    speed: 50
  }];

  engine.update(0.05);
  assert.strictEqual(engine.enemies.length, 0);
});

test('CyberNexusEngine - Boss Core encounter and level progression', () => {
  const engine = new CyberNexusEngine(null, {});
  engine.start();
  engine.level = 4;
  engine.update(0.01);

  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.maxHp, 30);

  engine.boss.hp = 0;
  engine.update(0.01);

  assert.strictEqual(engine.boss, null);
  assert.strictEqual(engine.level, 5);
});

test('CyberNexusEngine - Game Over state & score persistence', () => {
  global.localStorage.store = {};
  const engine = new CyberNexusEngine(null, {});
  engine.start();
  engine.setScore(2500);

  engine.takeDamage();
  engine.takeDamage();
  engine.takeDamage();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.score, 2500);
  assert.strictEqual(engine.bestScore, 2500);
});

test('CyberNexusEngine - Shield, Overdrive & NaN resilience', () => {
  const engine = new CyberNexusEngine(null, {});
  engine.start();

  assert.strictEqual(engine.shieldActive, false);
  engine.activateShield(300);
  assert.strictEqual(engine.shieldActive, true);

  const initialLives = engine.lives;
  engine.takeDamage();
  assert.strictEqual(engine.lives, initialLives);
  assert.strictEqual(engine.shieldActive, false);

  assert.strictEqual(engine.overdriveActive, false);
  engine.triggerOverdrive(200);
  assert.strictEqual(engine.overdriveActive, true);
  assert.ok(engine.multiplier >= 4);

  // NaN protection
  engine.update(NaN);
  assert.strictEqual(engine.started, true);
});
