// Leaderboard Score Manager

// Safe localStorage wrappers to handle cases where localStorage is disabled or throws (e.g., Safari private mode)
function safeGet(key) {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (e) {
    // Ignore read errors
  }
  return null;
}

function safeRemove(key) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch (e) {
    // Ignore remove errors
  }
}

const Leaderboard = {
  games: [
    { id: 'snake', name: 'Snake Game', key: 'snake_best', icon: '🐍' },
    { id: 'bingball', name: 'Bing Ball', key: 'bingball_best', icon: '🎰' },
    { id: 'breakout', name: 'Breakout', key: 'breakout_best', icon: '🧱' },
    { id: 'spaceinvaders', name: 'Space Invaders', key: 'spaceinvaders_best', icon: '👾' },
    { id: 'tetris', name: 'Tetris', key: 'tetris_best', icon: '🧩' },
    { id: 'flappybird', name: 'Flappy Neon', key: 'flappy_best', icon: '🐤' },
    { id: '2048', name: '2048', key: '2048_best', icon: '🔢' },
    { id: 'pong', name: 'Pong', key: 'pong_best_streak', icon: '🏓' },
    { id: 'flappybyte', name: 'Flappy Byte', key: 'flappy_byte_best', icon: '💻' },
    { id: 'asteroids', name: 'Asteroids', key: 'asteroids_best', icon: '🚀' },
    { id: 'towerdefense', name: 'Tower Defense', key: 'towerdefense_best', icon: '🛡️' },
    { id: 'cyberrunner', name: 'Cyber Runner', key: 'cyberrunner_best', icon: '🏃‍♂️' },
    { id: 'cyberracer', name: 'CyberRacer', key: 'cyberracer_best', icon: '🏎️' },
    { id: 'frogger', name: 'Neon Crossing', key: 'frogger_best', icon: '🐸' },
    { id: 'neonsimon', name: 'Neon Simon', key: 'neonsimon.highscore', icon: '🎮' },
    { id: 'sokoban', name: 'Sokoban', key: 'sokoban_best', icon: '📦' }
  ],

  getScores() {
    return this.games.map(game => {
      let score = 0;
      const raw = safeGet(game.key);
      if (raw !== null) {
        const parsed = parseInt(raw, 10);
        if (Number.isFinite(parsed)) {
          score = parsed;
        } else {
          try {
            const obj = JSON.parse(raw);
            if (obj && typeof obj === 'object') {
              score = Object.keys(obj).length;
            }
          } catch (jsonErr) {
            // Ignore and default to 0
          }
        }
      }
      return {
        id: game.id,
        name: game.name,
        icon: game.icon,
        score: score
      };
    });
  },

  resetAllScores() {
    this.games.forEach(game => {
      safeRemove(game.key);
    });
  }
};

if (typeof window !== 'undefined') {
  window.Leaderboard = Leaderboard;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { Leaderboard };
}
