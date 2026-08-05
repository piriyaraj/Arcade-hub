// Node.js Unit Tests for Cyber Breaker Engine logic
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
const { getBestScore, saveBestScore, checkCollision, checkCircleCollision, clamp, formatScore, randomRange } = require('../utils.js');
global.getBestScore = getBestScore;
global.saveBestScore = saveBestScore;
global.checkCollision = checkCollision;
global.checkCircleCollision = checkCircleCollision;
global.clamp = clamp;
global.formatScore = formatScore;
global.randomRange = randomRange;

// Extract CyberBreakerEngine from cyberbreaker.html
const breakerPath = path.join(__dirname, '..', 'cyberbreaker.html');
const fileContent = fs.readFileSync(breakerPath, 'utf8');

const startIndex = fileContent.indexOf('class CyberBreakerEngine {');
const endIndex = fileContent.indexOf('// Export for Node unit testing environments');
if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find CyberBreakerEngine boundaries in cyberbreaker.html');
}

const engineCode = fileContent.substring(startIndex, endIndex) + '\nmodule.exports = { CyberBreakerEngine };';
const evalFn = new Function('module', 'exports', 'checkCollision', 'checkCircleCollision', 'getBestScore', 'saveBestScore', 'clamp', 'formatScore', 'randomRange', engineCode);
const mockModule = { exports: {} };
evalFn(mockModule, mockModule.exports, checkCollision, checkCircleCollision, getBestScore, saveBestScore, clamp, formatScore, randomRange);

const CyberBreakerEngine = mockModule.exports.CyberBreakerEngine;

test('CyberBreakerEngine - Initial state', () => {
  const engine = new CyberBreakerEngine(null, {});
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.multiplier, 1);
  assert.strictEqual(engine.lives, 3);
  assert.strictEqual(engine.paddle.empCharges, 2);
  assert.strictEqual(engine.paddle.laserActive, false);
  assert.strictEqual(engine.level, 1);
});

test('CyberBreakerEngine - Start, pause, resume, togglePause, and reset', () => {
  const engine = new CyberBreakerEngine(null, {});
  engine.start();
  assert.strictEqual(engine.started, true);
  assert.strictEqual(engine.paused, false);
  assert.strictEqual(engine.over, false);
  assert.ok(engine.bricks.length > 0);
  assert.strictEqual(engine.balls.length, 1);
  assert.strictEqual(engine.balls[0].stuck, true);

  engine.pause();
  assert.strictEqual(engine.paused, true);

  engine.resume();
  assert.strictEqual(engine.paused, false);

  engine.togglePause();
  assert.strictEqual(engine.paused, true);

  engine.togglePause();
  assert.strictEqual(engine.paused, false);

  engine.setScore(400);
  assert.strictEqual(engine.score, 400);

  engine.reset();
  assert.strictEqual(engine.score, 0);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(engine.bricks.length, 0);
});

test('CyberBreakerEngine - Paddle movement & boundary clamping', () => {
  const engine = new CyberBreakerEngine(null, {});
  engine.start();

  // Move paddle right
  engine.movePaddle(1);
  assert.ok(engine.paddle.vx > 0);

  // Update over frames to hit right border
  for (let i = 0; i < 50; i++) {
    engine.update();
  }
  assert.ok(engine.paddle.x <= engine.CANVAS_WIDTH - engine.paddle.width);

  // Move paddle far left
  engine.movePaddle(-1);
  for (let i = 0; i < 50; i++) {
    engine.update();
  }
  assert.ok(engine.paddle.x >= 0);

  // Set paddle position directly
  engine.setPaddlePosition(300);
  assert.strictEqual(engine.paddle.x, 300 - engine.paddle.width / 2);
});

test('CyberBreakerEngine - Ball Launching & Paddle Reflection', () => {
  const engine = new CyberBreakerEngine(null, {});
  engine.start();

  assert.strictEqual(engine.balls[0].stuck, true);
  const launched = engine.launchBall();
  assert.strictEqual(launched, true);
  assert.strictEqual(engine.balls[0].stuck, false);
  assert.ok(engine.balls[0].vy < 0);

  // Simulate ball bouncing on paddle
  const ball = engine.balls[0];
  ball.x = engine.paddle.x + engine.paddle.width / 2;
  ball.y = engine.paddle.y - ball.radius;
  ball.vy = 5; // moving down towards paddle

  engine.update();
  assert.ok(engine.balls[0].vy < 0); // Should be deflected upwards
});

test('CyberBreakerEngine - Brick destruction & EMP explosive bricks', () => {
  const engine = new CyberBreakerEngine(null, {});
  engine.start();

  // Set test bricks explicitly
  engine.bricks = [
    {
      x: 100,
      y: 100,
      width: 50,
      height: 20,
      type: 'emp',
      health: 1,
      color: '#ff007f',
      points: 40
    },
    {
      x: 120,
      y: 100,
      width: 50,
      height: 20,
      type: 'standard',
      health: 1,
      color: '#00f0ff',
      points: 10
    }
  ];

  engine.balls[0].stuck = false;
  engine.balls[0].x = 110;
  engine.balls[0].y = 115;
  engine.balls[0].vy = -5;

  engine.update();
  assert.ok(engine.score >= 40);
});

test('CyberBreakerEngine - EMP Shockwave deployment & charge consumption', () => {
  const engine = new CyberBreakerEngine(null, {});
  engine.start();

  assert.strictEqual(engine.paddle.empCharges, 2);

  // Add enemy bullet and a brick
  engine.enemyBullets.push({ x: 200, y: 200, vx: 0, vy: 4, radius: 4, damage: 1 });
  assert.strictEqual(engine.enemyBullets.length, 1);

  const empUsed = engine.triggerEmpPulse();
  assert.strictEqual(empUsed, true);
  assert.strictEqual(engine.paddle.empCharges, 1);
  assert.strictEqual(engine.enemyBullets.length, 0); // Enemy bullets cleared
  assert.strictEqual(engine.empPulses.length, 1);

  // Deplete charges
  engine.triggerEmpPulse();
  assert.strictEqual(engine.paddle.empCharges, 0);

  // Fail on 0 charges
  const empFailed = engine.triggerEmpPulse();
  assert.strictEqual(empFailed, false);
});

test('CyberBreakerEngine - Powerup Collection & Tri-Ball', () => {
  const engine = new CyberBreakerEngine(null, {});
  engine.start();

  assert.strictEqual(engine.balls.length, 1);
  engine.applyPowerup('tri-ball');
  assert.strictEqual(engine.balls.length, 3);

  assert.strictEqual(engine.paddle.laserActive, false);
  engine.applyPowerup('laser-paddle');
  assert.strictEqual(engine.paddle.laserActive, true);
  assert.strictEqual(engine.paddle.laserTime, 400);

  // Stack laser-paddle timer
  engine.applyPowerup('laser-paddle');
  assert.strictEqual(engine.paddle.laserTime, 800);

  engine.applyPowerup('emp-blast');
  assert.strictEqual(engine.paddle.empCharges, 3); // Max emp charges

  engine.takeDamage(1);
  assert.strictEqual(engine.lives, 2);
  engine.applyPowerup('repair');
  assert.strictEqual(engine.lives, 3);
});

test('CyberBreakerEngine - Magnetic Paddle & Matrix Overdrive Surge', () => {
  const engine = new CyberBreakerEngine(null, {});
  engine.start();

  assert.strictEqual(engine.paddle.magneticActive, false);
  engine.applyPowerup('magnetic-paddle');
  assert.strictEqual(engine.paddle.magneticActive, true);
  assert.strictEqual(engine.paddle.magneticTime, 450);

  // Stack magnetic powerup
  engine.applyPowerup('magnetic');
  assert.strictEqual(engine.paddle.magneticTime, 900);

  assert.strictEqual(engine.overdriveActive, false);
  engine.triggerOverdrive(200);
  assert.strictEqual(engine.overdriveActive, true);
  assert.strictEqual(engine.overdriveTimer, 200);
  assert.ok(engine.multiplier >= 3);
});

test('CyberBreakerEngine - Velocity Clamping & NaN Resilience', () => {
  const engine = new CyberBreakerEngine(null, {});
  engine.start();

  const badBall = { x: 100, y: 100, vx: NaN, vy: NaN, speed: 5 };
  engine.clampVelocity(badBall);
  assert.strictEqual(badBall.vx, 2);
  assert.strictEqual(badBall.vy, -4);

  const fastBall = { x: 100, y: 100, vx: 50, vy: 50, speed: 5 };
  engine.clampVelocity(fastBall);
  assert.ok(Math.hypot(fastBall.vx, fastBall.vy) <= 14.1);
});

test('CyberBreakerEngine - Boss Security Core Spawning & Defeat', () => {
  const engine = new CyberBreakerEngine(null, {});
  engine.start();

  assert.strictEqual(engine.boss, null);
  engine.spawnBoss();
  assert.ok(engine.boss !== null);
  assert.ok(engine.boss.name.includes('SECURITY CORE'));
  assert.ok(engine.boss.health > 0);

  // Hit boss with ball
  const ball = engine.balls[0];
  ball.stuck = false;
  ball.x = engine.boss.x;
  ball.y = engine.boss.y + 10;
  ball.vy = -5;

  const initialBossHp = engine.boss.health;
  engine.update();
  assert.strictEqual(engine.boss.health, initialBossHp - 15);
});

test('CyberBreakerEngine - Game Over State & High Score Persistence', () => {
  global.localStorage.store = {};
  const engine = new CyberBreakerEngine(null, {});
  engine.start();

  engine.setScore(750);
  engine.takeDamage(3);

  assert.strictEqual(engine.lives, 0);
  assert.strictEqual(engine.over, true);
  assert.strictEqual(engine.started, false);
  assert.strictEqual(global.localStorage.getItem('cyberbreaker_best'), '750');
});
