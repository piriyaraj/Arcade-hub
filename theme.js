// Global Theme Engine

const ThemeManager = {
  themes: {
    dark: {
      '--bg': '#0b0f1a',
      '--board-bg': '#111827',
      '--card-bg': '#111827',
      '--card-hover': '#1f293d',
      '--text': '#e8eaed',
      '--text-dim': '#9aa0a6',
      '--border': 'rgba(255, 255, 255, 0.1)',
      '--accent-neon': '#00f0ff',
      '--accent-pink': '#ff007f',
      '--accent-green': '#4ade80',
      '--racer-glow': '#00f0ff',
      '--obstacle-glow': '#ff007f',
      '--node-glow': '#4ade80',
      '--paddle-glow': '#00f0ff',
      '--cpu-glow': '#ff007f',
      '--ball-glow': '#facc15',
      '--theme-neon': '#00f0ff',
      '--theme-yellow': '#facc15',
      '--theme-pink': '#ff007f',
      '--theme-green': '#4ade80'
    },
    light: {
      '--bg': '#f3f4f6',
      '--board-bg': '#e5e7eb',
      '--card-bg': '#ffffff',
      '--card-hover': '#f9fafb',
      '--text': '#000000',
      '--text-dim': '#4b5563',
      '--border': '#cccccc',
      '--accent-neon': '#0080ff',
      '--accent-pink': '#e60073',
      '--accent-green': '#00994d',
      '--racer-glow': '#0080ff',
      '--obstacle-glow': '#e60073',
      '--node-glow': '#00994d',
      '--paddle-glow': '#0080ff',
      '--cpu-glow': '#e60073',
      '--ball-glow': '#e6b800',
      '--theme-neon': '#0080ff',
      '--theme-yellow': '#d4af37',
      '--theme-pink': '#e60073',
      '--theme-green': '#00994d'
    },
    'retro-neon': {
      '--bg': '#05000a',
      '--board-bg': '#0c0014',
      '--card-bg': '#0c0014',
      '--card-hover': '#170026',
      '--text': '#39ff14',
      '--text-dim': '#ff007f',
      '--border': '#ff00ff',
      '--accent-neon': '#00ffff',
      '--accent-pink': '#ff00ff',
      '--accent-green': '#39ff14',
      '--racer-glow': '#00ffff',
      '--obstacle-glow': '#ff0055',
      '--node-glow': '#39ff14',
      '--paddle-glow': '#00ffff',
      '--cpu-glow': '#ff00ff',
      '--ball-glow': '#ffff00',
      '--theme-neon': '#00ffff',
      '--theme-yellow': '#ffff00',
      '--theme-pink': '#ff00ff',
      '--theme-green': '#39ff14'
    }
  },
  currentTheme: 'dark',
  init() {
    this.currentTheme = localStorage.getItem('arcade-theme') || 'dark';
    if (!this.themes[this.currentTheme]) {
      this.currentTheme = 'dark';
    }
    this.applyTheme(this.currentTheme);
    this.setupUI();
  },
  getTheme() {
    return this.currentTheme;
  },
  setTheme(theme) {
    if (this.themes[theme]) {
      const oldTheme = this.currentTheme;
      this.currentTheme = theme;
      localStorage.setItem('arcade-theme', theme);
      this.applyTheme(theme);
      window.dispatchEvent(new CustomEvent('themechange', {
        detail: {
          theme,
          oldTheme,
          newTheme: theme
        }
      }));
    }
  },
  cycleTheme() {
    const list = Object.keys(this.themes);
    const currentIndex = list.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % list.length;
    const nextTheme = list[nextIndex];
    this.setTheme(nextTheme);
    return nextTheme;
  },
  applyTheme(theme) {
    const root = document.documentElement;
    const themeData = this.themes[theme];
    for (const [key, value] of Object.entries(themeData)) {
      root.style.setProperty(key, value);
    }

    if (document.body) {
      document.body.classList.remove('theme-dark', 'theme-light', 'theme-retro-neon');
      document.body.classList.add('theme-' + theme);
    }
  },
  getColor(variableName) {
    const key = variableName.startsWith('var(')
      ? variableName.substring(4, variableName.length - 1).trim()
      : variableName;
    return this.themes[this.currentTheme][key] || '';
  },
  setupUI() {
    // Look for container or append select dynamically
    const header = document.querySelector('header');
    if (header && !document.querySelector('.theme-selector-container')) {
      const container = document.createElement('div');
      container.className = 'theme-selector-container';

      const label = document.createElement('span');
      label.style.fontSize = '0.75rem';
      label.style.color = 'var(--text-dim)';
      label.textContent = 'THEME:';

      const select = document.createElement('select');
      select.className = 'theme-select';
      select.ariaLabel = 'Select Theme';

      ['dark', 'light', 'retro-neon'].forEach(t => {
        const option = document.createElement('option');
        option.value = t;
        option.textContent = t.toUpperCase().replace('-', ' ');
        option.selected = t === this.currentTheme;
        select.appendChild(option);
      });

      select.addEventListener('change', (e) => {
        this.setTheme(e.target.value);
      });

      container.appendChild(label);
      container.appendChild(select);
      header.appendChild(container);
    }
  }
};

// Auto initialize on DOMContentLoaded if inside browser
if (typeof window !== 'undefined') {
  window.ThemeManager = ThemeManager;
  // If document is already loaded or is loading, init/setup UI
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
  } else {
    ThemeManager.init();
  }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { ThemeManager };
}
