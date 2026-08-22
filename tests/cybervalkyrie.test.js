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

test('CyberValkyrieEngine - Initial State', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);

  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.player.hp, 100);
  assert.strictEqual(engine.player.shield, 100);
  assert.strictEqual(engine.player.energy, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.javelin.state, 'ready');
});

test('CyberValkyrieEngine - Start Game & Wave Progression', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);

  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.ok(engine.enemiesToSpawn > 0);
  assert.strictEqual(engine.javelin.state, 'ready');
});

test('CyberValkyrieEngine - Player Movement and Bounds Clamping', () => {
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

  // Push beyond bounds
  engine.player.x = -500;
  engine.keys['KeyA'] = true;
  engine.keys['KeyD'] = false;
  engine.update();
  assert.ok(engine.player.x >= engine.player.radius);

  engine.player.y = 1000;
  engine.keys['KeyS'] = true;
  engine.keys['KeyW'] = false;
  engine.update();
  assert.ok(engine.player.y <= 600 - engine.player.radius);
});

test('CyberValkyrieEngine - Primary Photon Cannon Firing', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  engine.player.lastShot = 0;
  engine.shoot();

  // Dual wing cannons create 2 bullets
  assert.strictEqual(engine.bullets.length, 2);
  assert.strictEqual(engine.bullets[0].color, '#ffd700');

  // Triple powerup
  engine.player.powerupType = 'triple';
  engine.player.lastShot = 0;
  engine.shoot();
  assert.strictEqual(engine.bullets.length, 5); // 2 + 3

  // Overdrive powerup
  engine.player.powerupType = 'overdrive';
  engine.player.lastShot = 0;
  engine.shoot();
  assert.strictEqual(engine.bullets.length, 9); // 5 + 4
});

test('CyberValkyrieEngine - Tactical Javelin Throw, Embed, and Recall', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  assert.strictEqual(engine.javelin.state, 'ready');
  const initEnergy = engine.player.energy;

  // Throw Javelin
  engine.throwOrRecallJavelin();
  assert.strictEqual(engine.javelin.state, 'thrown');
  assert.strictEqual(engine.player.energy, initEnergy - 15);

  // Add enemy in javelin path
  const enemy = {
    type: 'drone',
    x: engine.javelin.x + 30,
    y: engine.javelin.y - 30,
    radius: 15,
    hp: 100,
    maxHp: 100,
    scoreValue: 100,
    color: '#ef4444'
  };
  engine.enemies.push(enemy);

  // Update javelin travel
  engine.update();
  assert.ok(engine.javelin.traveledDist > 0);

  // Trigger recall
  engine.throwOrRecallJavelin();
  assert.strictEqual(engine.javelin.state, 'recalling');

  // Simulate returning to player
  engine.javelin.x = engine.player.x + 5;
  engine.javelin.y = engine.player.y + 5;
  engine.update();

  assert.strictEqual(engine.javelin.state, 'ready');
});

test('CyberValkyrieEngine - Celestial Phase Dash', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  const initEnergy = engine.player.energy;
  engine.keys['KeyD'] = true;
  engine.performDash();

  assert.strictEqual(engine.player.isDashing, true);
  assert.strictEqual(engine.player.invulnerable, true);
  assert.strictEqual(engine.player.energy, initEnergy - 20);
  assert.ok(engine.player.dashCooldown > 0);

  // Step through dash duration
  for (let i = 0; i < 20; i++) {
    engine.update();
  }

  assert.strictEqual(engine.player.isDashing, false);
});

test('CyberValkyrieEngine - Einherjar EMP Shockwave', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  // Populate enemy bullets and enemies
  engine.enemyBullets.push({ x: 200, y: 200, vx: 1, vy: 1, radius: 4, damage: 10 });
  engine.enemyBullets.push({ x: 300, y: 300, vx: 1, vy: 1, radius: 4, damage: 10 });

  const enemy = {
    type: 'dreadnought',
    x: 400,
    y: 200,
    radius: 34,
    hp: 200,
    maxHp: 200,
    scoreValue: 800,
    color: '#a855f7'
  };
  engine.enemies.push(enemy);

  const initialEmp = engine.player.empCharges;
  engine.triggerEMP();

  assert.strictEqual(engine.player.empCharges, initialEmp - 1);
  assert.strictEqual(engine.empWaves.length, 1);
  assert.strictEqual(engine.enemyBullets.length, 0); // Cleared bullets
  assert.strictEqual(enemy.hp, 80); // 200 - 120
});

test('CyberValkyrieEngine - Damage taking, shield absorption, and Game Over', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  assert.strictEqual(engine.player.shield, 100);
  assert.strictEqual(engine.player.hp, 100);

  // Shield absorbs first 40 damage
  engine.takeDamage(40);
  assert.strictEqual(engine.player.shield, 60);
  assert.strictEqual(engine.player.hp, 100);

  // Deal 80 damage: 60 shield absorbed + 20 HP damage
  engine.takeDamage(80);
  assert.strictEqual(engine.player.shield, 0);
  assert.strictEqual(engine.player.hp, 80);

  // Fatal damage
  engine.takeDamage(150);
  assert.strictEqual(engine.player.hp, 0);
  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
});

test('CyberValkyrieEngine - Powerup pickups and stat modifiers', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  // Test Repair Pickup
  engine.player.hp = 50;
  engine.pickups.push({
    x: engine.player.x,
    y: engine.player.y,
    type: 'repair',
    icon: '💚',
    radius: 14,
    vy: 1.2,
    life: 600
  });
  engine.update();
  assert.strictEqual(engine.player.hp, 85);

  // Test Shield Pickup
  engine.player.shield = 20;
  engine.pickups.push({
    x: engine.player.x,
    y: engine.player.y,
    type: 'shield',
    icon: '🛡️',
    radius: 14,
    vy: 1.2,
    life: 600
  });
  engine.update();
  assert.strictEqual(Math.floor(engine.player.shield), 70);

  // Test Multiplier Pickup
  engine.pickups.push({
    x: engine.player.x,
    y: engine.player.y,
    type: 'multiplier',
    icon: '⭐',
    radius: 14,
    vy: 1.2,
    life: 600
  });
  engine.update();
  assert.strictEqual(engine.player.scoreMultiplier, 2);
});

test('CyberValkyrieEngine - Boss Spawning and Combat', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  // Wave 5 is a boss wave
  engine.initWave(5);
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.name, 'Ragnarok Archon');
  assert.ok(engine.boss.hp > 1000);

  // Damage boss
  engine.boss.hp = 100;
  engine.boss.hp -= 150;
  engine.update();

  // Boss defeated
  assert.strictEqual(engine.boss, null);
  assert.strictEqual(engine.waveState, 'cleared');
});

test('CyberValkyrieEngine - Pause and Resume', () => {
  const canvas = createMockCanvas();
  const engine = new CyberValkyrieEngine(canvas);
  engine.start();

  assert.strictEqual(engine.paused, false);
  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  // Updates should be frozen while paused
  const playerX = engine.player.x;
  engine.keys['KeyD'] = true;
  engine.update();
  assert.strictEqual(engine.player.x, playerX);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);
});
