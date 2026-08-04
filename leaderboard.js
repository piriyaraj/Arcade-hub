// Leaderboard Score Manager

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
    { id: 'neonsimon', name: 'Neon Simon', key: 'neonsimon.highscore', icon: '🧠' },
    { id: 'sokoban', name: 'Sokoban', key: 'sokoban_best', icon: '📦' },
    { id: 'pacman', name: 'Neon Pac-Man', key: 'pacman_best', icon: '🟡' },
    { id: 'cyberhacker', name: 'Cyber Hacker', key: 'cyberhacker_best', icon: '💻' },
    { id: 'cyberdash', name: 'Cyber Dash', key: 'cyberdash_best', icon: '⚡' }
  ],

  getScores() {
    return this.games.map(game => {
      let score = 0;
      try {
        const raw = localStorage.getItem(game.key);
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
      } catch (e) {
        console.error('Failed to load score for ' + game.id, e);
      }
      return {
        id: game.id,
        name: game.name,
        icon: game.icon,
        score: score
      };
    });
  },

  getGameScore(gameId) {
    const found = this.games.find(g => g.id === gameId);
    if (!found) return 0;
    try {
      const raw = localStorage.getItem(found.key);
      const parsed = parseInt(raw, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch (e) {
      return 0;
    }
  },

  setGameScore(gameId, score) {
    const found = this.games.find(g => g.id === gameId);
    if (!found) return false;
    const current = this.getGameScore(gameId);
    const validScore = parseInt(score, 10);
    if (!Number.isFinite(validScore)) return false;
    if (validScore > current) {
      try {
        localStorage.setItem(found.key, validScore.toString());
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  },

  resetAllScores() {
    this.games.forEach(game => {
      try {
        localStorage.removeItem(game.key);
      } catch (e) {
        console.error('Failed to reset score for ' + game.id, e);
      }
    });
  }
};

if (typeof window !== 'undefined') {
  window.Leaderboard = Leaderboard;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { Leaderboard };
}
