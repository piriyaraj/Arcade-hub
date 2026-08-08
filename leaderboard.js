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
    { id: 'cyberdash', name: 'Cyber Dash', key: 'cyberdash_best', icon: '⚡' },
    { id: 'cyberstriker', name: 'Cyber Striker', key: 'cyberstriker_best', icon: '🚀' },
    { id: 'cybersiege', name: 'Cyber Siege', key: 'cybersiege_best', icon: '🛡️' },
    { id: 'cyberbreaker', name: 'Cyber Breaker', key: 'cyberbreaker_best', icon: '🧱' },
    { id: 'cyberdefense', name: 'Cyber Defense', key: 'cyberdefense_best', icon: '⚡' },
    { id: 'cybersurge', name: 'Cyber Surge', key: 'cybersurge_best', icon: '🌀' },
    { id: 'cyberoverdrive', name: 'Cyber Overdrive', key: 'cyberoverdrive_best', icon: '⚡' },
    { id: 'cybervortex', name: 'Cyber Vortex', key: 'cybervortex_best', icon: '🌀' },
    { id: 'cyberpulse', name: 'Cyber Pulse', key: 'cyberpulse_best', icon: '⚡' },
    { id: 'cybermatrix', name: 'Cyber Matrix', key: 'cybermatrix_best', icon: '🔮' },
    { id: 'cybercircuit', name: 'Cyber Circuit', key: 'cybercircuit_best', icon: '⚡' },
    { id: 'cybernexus', name: 'Cyber Nexus', key: 'cybernexus_best', icon: '🔮' },
    { id: 'cyberstorm', name: 'Cyber Storm', key: 'cyberstorm_best', icon: '⚡' },
    { id: 'cyberblade', name: 'Cyber Blade', key: 'cyberblade_best', icon: '⚔️' },
    { id: 'cyberaegis', name: 'Cyber Aegis', key: 'cyberaegis_best', icon: '🛡️' },
    { id: 'cyberphantom', name: 'Cyber Phantom', key: 'cyberphantom_best', icon: '🥷' },
    { id: 'cyberecho', name: 'Cyber Echo', key: 'cyberecho_best', icon: '🌀' },
    { id: 'cyberwarp', name: 'Cyber Warp', key: 'cyberwarp_best', icon: '🌀' },
    { id: 'cyberforge', name: 'Cyber Forge', key: 'cyberforge_best', icon: '🔥' },
    { id: 'cyberrift', name: 'Cyber Rift', key: 'cyberrift_best', icon: '🌌' },
    { id: 'cybercore', name: 'Cyber Core', key: 'cybercore_best', icon: '⚛️' },
    { id: 'cybergrid', name: 'Cyber Grid', key: 'cybergrid_best', icon: '⚡' },
    { id: 'cyberflare', name: 'Cyber Flare', key: 'cyberflare_best', icon: '☀️' },
    { id: 'cyberprism', name: 'Cyber Prism', key: 'cyberprism_best', icon: '💎' },
    { id: 'cybernova', name: 'Cyber Nova', key: 'cybernova_best', icon: '🌟' },
    { id: 'cyberspectre', name: 'Cyber Spectre', key: 'cyberspectre_best', icon: '👻' },
    { id: 'cybershadow', name: 'Cyber Shadow', key: 'cybershadow_best', icon: '👤' },
    { id: 'cyberhelix', name: 'Cyber Helix', key: 'cyberhelix_best', icon: '🧬' },
    { id: 'cyberapex', name: 'Cyber Apex', key: 'cyberapex_best', icon: '🔺' },
    { id: 'cybertitan', name: 'Cyber Titan', key: 'cybertitan_best', icon: '🤖' },
    { id: 'cyberzenith', name: 'Cyber Zenith', key: 'cyberzenith_best', icon: '🌌' },
    { id: 'cybervanguard', name: 'Cyber Vanguard', key: 'cybervanguard_best', icon: '🛡️' },
    { id: 'cybereclipse', name: 'Cyber Eclipse', key: 'cybereclipse_best', icon: '🌒' },
    { id: 'cyberhorizon', name: 'Cyber Horizon', key: 'cyberhorizon_best', icon: '🌅' },
    { id: 'cyberfusion', name: 'Cyber Fusion', key: 'cyberfusion_best', icon: '⚛️' },
    { id: 'cybertempest', name: 'Cyber Tempest', key: 'cybertempest_best', icon: '⛈️' },
    { id: 'cybersingularity', name: 'Cyber Singularity', key: 'cybersingularity_best', icon: '🌌' },
    { id: 'cyberpulsar', name: 'Cyber Pulsar', key: 'cyberpulsar_best', icon: '💫' },
    { id: 'cyberdynamo', name: 'Cyber Dynamo', key: 'cyberdynamo_best', icon: '⚡' },
    { id: 'cyberkinetic', name: 'Cyber Kinetic', key: 'cyberkinetic_best', icon: '⚡' },
    { id: 'cyberflux', name: 'Cyber Flux', key: 'cyberflux_best', icon: '🌀' },
    { id: 'cyberspark', name: 'Cyber Spark', key: 'cyberspark_best', icon: '⚡' },
    { id: 'cybervoid', name: 'Cyber Void', key: 'cybervoid_best', icon: '🌌' },
    { id: 'minesweeper', name: 'Minesweeper', key: 'minesweeper_best', icon: '💣' }
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
