// Node.js Unit Tests for Cyber Valkyrie Engine logic
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
  DOMContentLoaded: 'DOMContentLoaded',
  getElementById: () => ({
    textContent: '',
    classList: { add: () => {}, remove: () => {} },
    addEventListener: () => {}
  })
};
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = val.toString(); },
  removeItem(key) { delete this.store[key]; }
};

global.playSound = global.playSound || (() => {});

// Require shared utilities
const { getBestScore, saveBestScore, checkCollision, checkCircleCollision, clamp, formatScore, randomRange } = require('../utils.js');
global.getBestScore = getBestScore;
global.saveBestScore = saveBestScore;
global.checkCollision = checkCollision;
global.checkCircleCollision = checkCircleCollision;
global.clamp = clamp;
global.formatScore = formatScore;
global.randomRange = randomRange;

// Extract CyberValkyrieEngine from cybervalkyrie.html
const htmlPath = path.join(__dirname, '..', 'cybervalkyrie.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberValkyrieEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberValkyrieEngine boundaries in cybervalkyrie.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberValkyrieEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberValkyrieEngine = mockModule.exports.CyberValkyrieEngine;

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
      globalAlpha: 1,
      font: '',
      textAlign: '',
      textBaseline: ''
    }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    addEventListener: () => {}
  };
}

test('CyberValkyrieEngine - Initial state', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);

  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.energy, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.drones.length, 0);
});

test('CyberValkyrieEngine - Start game & wave initialization', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);

  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.ok(engine.enemiesToSpawn > 0);
});

test('CyberValkyrieEngine - Player movement & boundary clamping', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  const startX = engine.player.x;
  const startY = engine.player.y;

  // Move right and up
  engine.keys['KeyD'] = true;
  engine.keys['KeyW'] = true;
  engine.update();

  assert.ok(engine.player.x > startX);
  assert.ok(engine.player.y < startY);

  // Push player beyond left edge
  engine.player.x = -500;
  engine.keys['KeyA'] = true;
  engine.keys['KeyD'] = false;
  engine.update();
  assert.ok(engine.player.x >= engine.player.radius);

  // Push player beyond bottom edge
  engine.player.y = 1200;
  engine.keys['KeyS'] = true;
  engine.keys['KeyW'] = false;
  engine.update();
  assert.ok(engine.player.y <= 600 - engine.player.radius);
});

test('CyberValkyrieEngine - Dual photon wing-cannon firing', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  engine.mousePos = { x: 400, y: 100 };
  engine.fireWeapon();

  // Dual wing cannons fire 2 converging bullets
  assert.strictEqual(engine.bullets.length, 2);

  const initialY = engine.bullets[0].y;
  engine.update();
  assert.ok(engine.bullets[0].y < initialY);
});

test('CyberValkyrieEngine - Hypersonic Phase Dash', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  const initialEnergy = engine.player.energy;
  const success = engine.performDash();

  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.isDashing, true);
  assert.strictEqual(engine.player.energy, initialEnergy - 20);
  assert.ok(engine.player.dashCooldown > 0);

  // Invulnerable during dash
  const prevHp = engine.player.hp;
  engine.takeDamage(30);
  assert.strictEqual(engine.player.hp, prevHp);
});

test('CyberValkyrieEngine - Deploy Wing Drone', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  const initialEnergy = engine.player.energy;
  const success = engine.deployDrone();

  assert.strictEqual(success, true);
  assert.strictEqual(engine.drones.length, 1);
  assert.strictEqual(engine.player.energy, initialEnergy - 25);

  // Add enemy to verify drone auto-targeting
  engine.enemies.push({
    x: 400,
    y: 100,
    hp: 40,
    maxHp: 40,
    radius: 14,
    vx: 0,
    vy: 0,
    scoreValue: 60,
    color: '#06b6d4'
  });

  // Fast forward drone cooldown
  engine.drones[0].shootCooldown = 1;
  engine.update();
  assert.ok(engine.droneBullets.length >= 1);
});

test('CyberValkyrieEngine - Activate Aegis Wing Barrier Shield', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  const initialEnergy = engine.player.energy;
  const success = engine.activateAegisShield();

  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.shieldActive, true);
  assert.strictEqual(engine.player.energy, initialEnergy - 30);
  assert.strictEqual(engine.player.shieldTimer, engine.player.shieldMaxTimer);

  // When shielded, taking damage absorbs hits and restores energy
  const prevEnergy = engine.player.energy;
  engine.takeDamage(20);
  assert.strictEqual(engine.player.hp, 100);
  assert.ok(engine.player.energy > prevEnergy);
});

test('CyberValkyrieEngine - EMP Valkyrie Nova Shockwave', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  // Add enemy bullets and enemies
  engine.enemyBullets.push({ x: 200, y: 200, vx: 0, vy: 1, damage: 15, radius: 4, color: '#ef4444' });
  engine.enemies.push({ x: 300, y: 200, hp: 40, maxHp: 40, radius: 14, vx: 0, vy: 0, scoreValue: 80, color: '#38bdf8' });

  const initialCharges = engine.player.empCharges;
  const success = engine.triggerEMP();

  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.empCharges, initialCharges - 1);
  assert.strictEqual(engine.enemyBullets.length, 0); // Enemy bullets cleared
  assert.strictEqual(engine.empWaves.length, 1);
  assert.strictEqual(engine.enemies.length, 0); // Enemy wiped out
  assert.ok(engine.score >= 80);
});

test('CyberValkyrieEngine - Powerup Collection & Tri-Beam Spread', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  // Heal pickup
  engine.player.hp = 40;
  engine.pickups.push({
    x: engine.player.x,
    y: engine.player.y,
    vy: 0,
    radius: 10,
    type: 'heal',
    life: 300
  });
  engine.checkCollisions();
  assert.strictEqual(engine.player.hp, 75);

  // Triple Beam pickup
  engine.pickups.push({
    x: engine.player.x,
    y: engine.player.y,
    vy: 0,
    radius: 10,
    type: 'triple',
    life: 300
  });
  engine.checkCollisions();
  assert.strictEqual(engine.player.powerupType, 'triple');

  engine.player.lastShot = 0;
  engine.bullets = [];
  engine.fireWeapon();
  assert.strictEqual(engine.bullets.length, 3);
});

test('CyberValkyrieEngine - Boss Wave Spawning & Defeat', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  // Wave 5 Boss
  engine.initWave(5);
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.name, 'VALKYRIE ARCHON MK-1');

  // Defeat boss
  engine.boss.hp = 10;
  engine.boss.shield = 0;
  engine.bullets.push({
    x: engine.boss.x,
    y: engine.boss.y,
    vx: 0,
    vy: 0,
    damage: 25,
    radius: 5,
    color: '#38bdf8'
  });

  engine.update();
  assert.strictEqual(engine.boss, null);
  assert.strictEqual(engine.waveState, 'cleared');
  assert.ok(engine.score >= 1000);
});

test('CyberValkyrieEngine - Game Pause & Resume', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);

  engine.pause();
  assert.strictEqual(engine.paused, true);

  engine.resume();
  assert.strictEqual(engine.paused, false);
});

test('CyberValkyrieEngine - Game Over & High Score Persistence', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  engine.score = 8200;
  engine.gameOver();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.highScore, 8200);
  assert.strictEqual(localStorage.getItem('cybervalkyrie_best'), '8200');
});

test('CyberValkyrieEngine - Canvas drawing does not throw', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();
  engine.spawnEnemy();
  engine.deployDrone();
  engine.activateAegisShield();
  engine.fireWeapon();
  engine.update();
  assert.doesNotThrow(() => engine.draw());
});

test('CyberValkyrieEngine - Resilience to NaN and edge cases', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  engine.player.x = NaN;
  engine.player.y = NaN;
  engine.update();

  assert.strictEqual(Number.isFinite(engine.player.x), true);
  assert.strictEqual(Number.isFinite(engine.player.y), true);
});
