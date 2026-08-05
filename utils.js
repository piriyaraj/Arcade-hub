// Shared Game Utilities and Score Storage Helper

function getBestScore(gameKey) {
  try {
    const raw = localStorage.getItem(gameKey + '_best');
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch (e) {
    console.error('localStorage load failed:', e);
    return 0;
  }
}

function saveBestScore(gameKey, score) {
  try {
    localStorage.setItem(gameKey + '_best', score.toString());
    return true;
  } catch (e) {
    console.error('localStorage save failed:', e);
    return false;
  }
}

function getMuteState(gameKey) {
  try {
    return localStorage.getItem(gameKey + '_muted') === 'true';
  } catch (e) {
    console.error('localStorage load failed:', e);
    return false;
  }
}

function saveMuteState(gameKey, muted) {
  try {
    localStorage.setItem(gameKey + '_muted', muted.toString());
    return true;
  } catch (e) {
    console.error('localStorage save failed:', e);
    return false;
  }
}

function resetScore(gameKey) {
  try {
    localStorage.removeItem(gameKey + '_best');
    return true;
  } catch (e) {
    console.error('localStorage remove failed:', e);
    return false;
  }
}

function formatScore(score) {
  const parsed = parseInt(score, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return '0';
  return parsed.toLocaleString();
}

/**
 * Clamps a numerical value within a given min and max bound.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  if (typeof value !== 'number' || Number.isNaN(value)) return Number.isFinite(min) ? min : 0;
  const actualMin = Math.min(min, max);
  const actualMax = Math.max(min, max);
  return Math.min(Math.max(value, actualMin), actualMax);
}

function checkCollision(r1, r2) {
  if (!r1 || !r2) return false;
  const x1 = Number.isFinite(r1.x) ? r1.x : 0;
  const y1 = Number.isFinite(r1.y) ? r1.y : 0;
  const w1 = Number.isFinite(r1.width) ? r1.width : 0;
  const h1 = Number.isFinite(r1.height) ? r1.height : 0;

  const x2 = Number.isFinite(r2.x) ? r2.x : 0;
  const y2 = Number.isFinite(r2.y) ? r2.y : 0;
  const w2 = Number.isFinite(r2.width) ? r2.width : 0;
  const h2 = Number.isFinite(r2.height) ? r2.height : 0;

  return (
    x1 < x2 + w2 &&
    x1 + w1 > x2 &&
    y1 < y2 + h2 &&
    y1 + h1 > y2
  );
}

function checkCircleCollision(c1, c2) {
  if (!c1 || !c2) return false;
  const x1 = Number.isFinite(c1.x) ? c1.x : 0;
  const y1 = Number.isFinite(c1.y) ? c1.y : 0;
  const r1 = Number.isFinite(c1.radius) ? c1.radius : 0;

  const x2 = Number.isFinite(c2.x) ? c2.x : 0;
  const y2 = Number.isFinite(c2.y) ? c2.y : 0;
  const r2 = Number.isFinite(c2.radius) ? c2.radius : 0;

  const dx = x1 - x2;
  const dy = y1 - y2;
  const distance = Math.hypot(dx, dy);
  return distance < (r1 + r2);
}

function lerp(start, end, amt) {
  if (typeof start !== 'number' || typeof end !== 'number') return 0;
  const clampedAmt = clamp(amt, 0, 1);
  return start + (end - start) * clampedAmt;
}

function distance(p1, p2) {
  if (!p1 || !p2 || typeof p1.x !== 'number' || typeof p1.y !== 'number' || typeof p2.x !== 'number' || typeof p2.y !== 'number') {
    return 0;
  }
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

function normalizeScore(score) {
  const parsed = parseInt(score, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function randomRange(min, max) {
  if (typeof min !== 'number' || typeof max !== 'number' || Number.isNaN(min) || Number.isNaN(max)) return 0;
  const actualMin = Math.min(min, max);
  const actualMax = Math.max(min, max);
  return actualMin + Math.random() * (actualMax - actualMin);
}

function smoothStep(min, max, value) {
  if (typeof min !== 'number' || typeof max !== 'number' || typeof value !== 'number') return 0;
  if (min >= max) return value >= max ? 1 : 0;
  const x = clamp((value - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}

function pointInRect(point, rect) {
  if (!point || !rect || typeof point.x !== 'number' || typeof point.y !== 'number') return false;
  const rx = rect.x || 0;
  const ry = rect.y || 0;
  const rw = rect.width || 0;
  const rh = rect.height || 0;
  return point.x >= rx && point.x <= rx + rw && point.y >= ry && point.y <= ry + rh;
}

function formatTime(seconds) {
  const parsed = parseInt(seconds, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return '00:00';
  const mins = Math.floor(parsed / 60);
  const secs = parsed % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const loadHighScore = getBestScore;
const saveHighScore = saveBestScore;

if (typeof window !== 'undefined') {
  window.getBestScore = getBestScore;
  window.saveBestScore = saveBestScore;
  window.loadHighScore = loadHighScore;
  window.saveHighScore = saveHighScore;
  window.getMuteState = getMuteState;
  window.saveMuteState = saveMuteState;
  window.resetScore = resetScore;
  window.formatScore = formatScore;
  window.clamp = clamp;
  window.checkCollision = checkCollision;
  window.checkCircleCollision = checkCircleCollision;
  window.lerp = lerp;
  window.distance = distance;
  window.normalizeScore = normalizeScore;
  window.randomRange = randomRange;
  window.smoothStep = smoothStep;
  window.pointInRect = pointInRect;
  window.formatTime = formatTime;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    getBestScore,
    saveBestScore,
    loadHighScore,
    saveHighScore,
    getMuteState,
    saveMuteState,
    resetScore,
    formatScore,
    clamp,
    checkCollision,
    checkCircleCollision,
    lerp,
    distance,
    normalizeScore,
    randomRange,
    smoothStep,
    pointInRect,
    formatTime
  };
}



