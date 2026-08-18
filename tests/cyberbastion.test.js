// Node.js Unit Tests for Cyber Bastion Engine logic
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

// Extract CyberBastionEngine from cyberbastion.html
const htmlPath = path.join(__dirname, '..', 'cyberbastion.html');
const fileContent = fs.readFileSync(htmlPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberBastionEngine {');
const endIndex = fileContent.indexOf('if (typeof module !== \'undefined\' && typeof module.exports !== \'undefined\')');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberBastionEngine boundaries in cyberbastion.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberBastionEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberBastionEngine = mockModule.exports.CyberBastionEngine;

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

test('CyberBastionEngine - Initial state', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBastionEngine(canvas);

  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.player.hp, 120);
  assert.strictEqual(engine.player.energy, 100);
  assert.strictEqual(engine.player.empCharges, 3);
  assert.strictEqual(engine.turrets.length, 0);
});

test('CyberBastionEngine - Start game & wave progression', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBastionEngine(canvas);

  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.wave, 1);
  assert.strictEqual(engine.enemiesToSpawn > 0, true);
});

test('CyberBastionEngine - Player movement & boundary clamping', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBastionEngine(canvas);
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

test('CyberBastionEngine - Primary Twin Railgun Firing', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBastionEngine(canvas);
  engine.start();

  engine.mousePos = { x: 400, y: 100 };
  engine.shootLaser();

  // Primary mode shoots twin bolts
  assert.strictEqual(engine.bullets.length, 2);

  const initialY = engine.bullets[0].y;
  engine.update();
  assert.ok(engine.bullets[0].y < initialY);
});

test('CyberBastionEngine - Deploy Sentinel Turret Drone', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBastionEngine(canvas);
  engine.start();

  const initialEnergy = engine.player.energy;
  const success = engine.deployTurret();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.turrets.length, 1);
  assert.strictEqual(engine.player.energy, initialEnergy - 25);

  // Add enemy to verify turret targeting & shooting
  engine.enemies.push({
    x: 400,
    y: 100,
    hp: 50,
    maxHp: 50,
    radius: 15,
    vx: 0,
    vy: 0,
    scoreVal: 100,
    color: '#06b6d4'
  });

  // Fast forward turret fire cooldown
  engine.turrets[0].fireCooldown = 25;
  engine.update();
  assert.strictEqual(engine.turretBullets.length, 1);
});

test('CyberBastionEngine - Fortify Kinetic Barrier Shield', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBastionEngine(canvas);
  engine.start();

  const initialEnergy = engine.player.energy;
  const success = engine.fortifyShield();
  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.shieldActive, true);
  assert.strictEqual(engine.player.energy, initialEnergy - 30);
  assert.strictEqual(engine.player.shieldTimer, engine.player.shieldMaxTimer);

  // Spawn incoming enemy bullet and verify it is deflected/absorbed
  engine.enemyBullets.push({
    x: engine.player.x,
    y: engine.player.y + 10,
    vx: 0,
    vy: -2,
    damage: 20,
    radius: 4,
    color: '#ef4444'
  });

  engine.update();
  assert.strictEqual(engine.enemyBullets.length, 0);
  assert.strictEqual(engine.player.hp, 120); // No damage taken
});

test('CyberBastionEngine - Orbital EMP Shockwave Barrage', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBastionEngine(canvas);
  engine.start();

  // Add enemy bullets and enemies
  engine.enemyBullets.push({ x: 200, y: 200, vx: 0, vy: 1, damage: 15, radius: 4, color: '#ef4444' });
  engine.enemies.push({ x: 300, y: 200, hp: 50, maxHp: 50, radius: 15, vx: 0, vy: 0, scoreVal: 120, color: '#38bdf8' });

  const initialCharges = engine.player.empCharges;
  const success = engine.triggerEMP();

  assert.strictEqual(success, true);
  assert.strictEqual(engine.player.empCharges, initialCharges - 1);
  assert.strictEqual(engine.enemyBullets.length, 0); // Bullets vaporized
  assert.strictEqual(engine.empWaves.length, 1);
  assert.strictEqual(engine.enemies.length, 0); // 50hp enemy killed by 120 EMP damage
  assert.strictEqual(engine.score, 120);
});

test('CyberBastionEngine - Pickups and Overdrive Upgrades', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBastionEngine(canvas);
  engine.start();

  // Test Repair Pickup
  engine.player.hp = 50;
  engine.player.energy = 20;
  engine.applyPickup({ type: 'repair' });
  assert.strictEqual(engine.player.hp, 85);
  assert.strictEqual(engine.player.energy, 60);

  // Test Overcharge (Triple Railgun)
  engine.applyPickup({ type: 'overcharge' });
  assert.strictEqual(engine.player.powerupType, 'triple');
  engine.player.lastShot = 0;
  engine.bullets = [];
  engine.shootLaser();
  assert.strictEqual(engine.bullets.length, 3);

  // Test Overdrive
  engine.applyPickup({ type: 'overdrive' });
  assert.strictEqual(engine.player.powerupType, 'overdrive');
  assert.strictEqual(engine.player.scoreMultiplier, 2);
  engine.player.lastShot = 0;
  engine.bullets = [];
  engine.shootLaser();
  assert.strictEqual(engine.bullets.length, 4);
});

test('CyberBastionEngine - Boss Battle & Defeat', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBastionEngine(canvas);
  engine.start();

  // Trigger Wave 5 (Boss Wave)
  engine.initWave(5);
  assert.ok(engine.boss !== null);
  assert.strictEqual(engine.boss.name, 'TITAN JUGGERNAUT MK-1');

  // Damage and defeat Boss
  engine.boss.hp = 10;
  engine.bullets.push({
    x: engine.boss.x,
    y: engine.boss.y,
    vx: 0,
    vy: 0,
    damage: 25,
    radius: 5,
    color: '#f59e0b'
  });

  engine.update();
  assert.strictEqual(engine.boss, null);
  assert.strictEqual(engine.waveState, 'cleared');
  assert.ok(engine.score >= 2500);
});

test('CyberBastionEngine - Game pause & resume toggle', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBastionEngine(canvas);
  engine.start();

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);
});

test('CyberBastionEngine - Game Over and high score persistence', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBastionEngine(canvas);
  engine.start();

  engine.score = 7500;
  engine.endGame();

  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.highScore, 7500);
  assert.strictEqual(localStorage.getItem('cyberbastion_best'), '7500');
});

test('CyberBastionEngine - Canvas drawing does not crash', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBastionEngine(canvas);
  engine.start();
  engine.spawnEnemy();
  engine.deployTurret();
  engine.fortifyShield();
  engine.shootLaser();
  engine.update();
  assert.doesNotThrow(() => engine.draw());
});

test('CyberBastionEngine - Resilience to NaN and edge cases', () => {
  const canvas = createMockCanvas();
  const engine = new CyberBastionEngine(canvas);
  engine.start();

  // Corrupt player position with NaN
  engine.player.x = NaN;
  engine.player.y = NaN;
  engine.update();

  assert.strictEqual(Number.isFinite(engine.player.x), true);
  assert.strictEqual(Number.isFinite(engine.player.y), true);
});
