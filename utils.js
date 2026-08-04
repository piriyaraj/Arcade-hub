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

function clamp(value, min, max) {
  if (typeof value !== 'number' || Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function checkCollision(r1, r2) {
  if (!r1 || !r2) return false;
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}

function checkCircleCollision(c1, c2) {
  if (!c1 || !c2) return false;
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  const distance = Math.hypot(dx, dy);
  return distance < (c1.radius + c2.radius);
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
    distance
  };
}


