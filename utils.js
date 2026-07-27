// Shared Game Utilities and Score Storage Helper

function getBestScore(gameKey) {
  try {
    const raw = localStorage.getItem(gameKey + '_best');
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch (e) {
    return 0;
  }
}

function saveBestScore(gameKey, score) {
  try {
    localStorage.setItem(gameKey + '_best', score.toString());
    return true;
  } catch (e) {
    return false;
  }
}

function getMuteState(gameKey) {
  try {
    return localStorage.getItem(gameKey + '_muted') === 'true';
  } catch (e) {
    return false;
  }
}

function saveMuteState(gameKey, muted) {
  try {
    localStorage.setItem(gameKey + '_muted', muted.toString());
    return true;
  } catch (e) {
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.getBestScore = getBestScore;
  window.saveBestScore = saveBestScore;
  window.getMuteState = getMuteState;
  window.saveMuteState = saveMuteState;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    getBestScore,
    saveBestScore,
    getMuteState,
    saveMuteState
  };
}
