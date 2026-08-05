// Node.js Unit Tests for Cyber Blade Engine logic
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

// Extract CyberBladeEngine from cyberblade.html
const bladePath = path.join(__dirname, '..', 'cyberblade.html');
const fileContent = fs.readFileSync(bladePath, 'utf8');

const startIndex = fileContent.indexOf('class CyberBladeEngine {');
const endIndex = fileContent.indexOf('// Export for Node unit testing environments');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberBladeEngine boundaries in cyberblade.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberBladeEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberBladeEngine = mockModule.exports.CyberBladeEngine;

test('CyberBladeEngine - Initial state', () => {
  const engine = new CyberBladeEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.player.health, 100);
  assert.strictEqual(engine.player.shield, 50);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.player.phaseDashActive, false);
  assert.strictEqual(engine.player.bladeActive, false);
});

test('CyberBladeEngine - Lifecycle controls & state resets', () => {
  const engine = new CyberBladeEngine(null, {});
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

  engine.setScore(2500);
  assert.strictEqual(engine.score, 2500);
  assert.strictEqual(engine.highScore, 2500);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.bullets.length, 0);
  assert.strictEqual(engine.enemies.length, 0);
});

test('CyberBladeEngine - Player movement & boundary clamping', () => {
  const engine = new CyberBladeEngine(null, {});
  engine.start();

  engine.movePlayer(1, 0);
  assert.ok(engine.player.x > 400);

  // Drive far left past bound
  engine.player.x = -100;
  engine.movePlayer(0, 0);
  assert.strictEqual(engine.player.x, engine.player.radius);
});

test('CyberBladeEngine - Katana Aiming & Blade Slash Execution', () => {
  const engine = new CyberBladeEngine(null, {});
  engine.start();

  engine.aimAt(400, 200);
  assert.ok(engine.player.bladeAngle < 0); // Aiming upwards

  const slashed = engine.slashBlade();
  assert.strictEqual(slashed, true);
  assert.strictEqual(engine.player.bladeActive, true);
  assert.ok(engine.slashArcEffects.length > 0);

  // Cooldown active
  const slashAgain = engine.slashBlade();
  assert.strictEqual(slashAgain, false);
});

test('CyberBladeEngine - Deflecting enemy laser projectiles into player reflex bolts', () => {
  const engine = new CyberBladeEngine(null, {});
  engine.start();

  // Position player at (400, 300) and aim directly at (400, 200)
  engine.player.x = 400;
  engine.player.y = 300;
  engine.aimAt(400, 200);

  // Add enemy laser bolt flying towards player within slash arc
  engine.enemyBullets = [{
    x: 400,
    y: 250,
    vx: 0,
    vy: 6,
    radius: 5,
    color: '#ff007f'
  }];

  engine.slashBlade();

  // Enemy bullet should be destroyed and converted to reflected player bullet
  assert.strictEqual(engine.enemyBullets.length, 0);
  assert.strictEqual(engine.bullets.length, 1);
  assert.strictEqual(engine.bullets[0].reflected, true);
  assert.ok(engine.bullets[0].vy < 0); // Deflected back upwards
});

test('CyberBladeEngine - Phase Dash invulnerability surge', () => {
  const engine = new CyberBladeEngine(null, {});
  engine.start();

  const dashed = engine.triggerPhaseDash();
  assert.strictEqual(dashed, true);
  assert.strictEqual(engine.player.phaseDashActive, true);

  // Add enemy bullet on top of player during phase dash
  engine.enemyBullets = [{
    x: engine.player.x,
    y: engine.player.y,
    vx: 0,
    vy: 0,
    radius: 5,
    color: '#ff007f'
  }];

  engine.update(1);

  // Player takes 0 damage due to phase dash invulnerability
  assert.strictEqual(engine.player.health, 100);
  assert.strictEqual(engine.player.shield, 50);
});

test('CyberBladeEngine - EMP Katana Storm Nova detonation', () => {
  const engine = new CyberBladeEngine(null, {});
  engine.start();

  engine.enemyBullets = [{ x: 400, y: 300, vx: 0, vy: 0, radius: 4 }];
  engine.enemies = [{ type: 'drone', x: 410, y: 300, vx: 0, vy: 0, radius: 10, health: 30, maxHealth: 30, empHit: false }];

  const triggered = engine.triggerEmpNova();
  assert.strictEqual(triggered, true);
  assert.strictEqual(engine.player.empCharges, 2);
  assert.strictEqual(engine.empNovas.length, 1);

  // Expand nova radius
  engine.empNovas[0].radius = 100;
  engine.update(1);

  assert.strictEqual(engine.enemyBullets.length, 0);
  assert.strictEqual(engine.enemies.length, 0);
  assert.ok(engine.score > 0);
});

test('CyberBladeEngine - Boss battle spawning & destruction', () => {
  const engine = new CyberBladeEngine(null, {});
  engine.start();
  engine.wave = 3;

  engine.spawnBoss();
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.name, 'SHADOW DREADNOUGHT');

  const boss = engine.boss;
  engine.handleEnemyDeath(boss);
  assert.strictEqual(engine.boss, null);
  assert.ok(engine.score >= 1200);
});

test('CyberBladeEngine - Powerup drops & collection', () => {
  const engine = new CyberBladeEngine(null, {});
  engine.start();

  engine.player.shield = 10;
  engine.collectPowerup({ type: 'shield', x: 0, y: 0, radius: 10 });
  assert.strictEqual(engine.player.shield, 50);

  engine.player.health = 40;
  engine.collectPowerup({ type: 'health', x: 0, y: 0, radius: 10 });
  assert.strictEqual(engine.player.health, 70);

  engine.collectPowerup({ type: 'emp', x: 0, y: 0, radius: 10 });
  assert.strictEqual(engine.player.empCharges, 4);
});

test('CyberBladeEngine - Player damage & Game Over trigger', () => {
  const engine = new CyberBladeEngine(null, {});
  engine.start();

  engine.damagePlayer(40);
  assert.strictEqual(engine.player.shield, 10);
  assert.strictEqual(engine.player.health, 100);

  engine.damagePlayer(110);
  assert.strictEqual(engine.player.shield, 0);
  assert.strictEqual(engine.player.health, 0);
  assert.strictEqual(engine.over, true);
});
