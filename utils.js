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
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    getBestScore,
    saveBestScore,
    loadHighScore,
    saveHighScore,
    getMuteState,
    saveMuteState,
    resetScore
  };
}
