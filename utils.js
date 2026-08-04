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
    checkCollision
  };
}

