// Centralized Input & Keybindings Manager

const KeyManager = {
  bindings: {
    pause: 'KeyP',
    action: 'Space'
  },
  init() {
    const saved = localStorage.getItem('arcade-keybindings');
    if (saved) {
      try {
        this.bindings = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse keybindings, resetting', e);
      }
    }
    this.setupUI();
  },
  save() {
    localStorage.setItem('arcade-keybindings', JSON.stringify(this.bindings));
  },
  isKey(e, action) {
    const bound = this.bindings[action];
    if (!bound) return false;

    const codeLower = e.code ? e.code.toLowerCase() : '';
    const keyLower = e.key ? e.key.toLowerCase() : '';
    const boundLower = bound.toLowerCase();

    // Special handling for Space
    if (boundLower === 'space') {
      return codeLower === 'space' || keyLower === ' ' || keyLower === 'space';
    }

    // Remove 'key' prefix if code is e.g. 'KeyP' or 'KeyW' to match plain 'p' or 'w'
    const cleanCode = codeLower.startsWith('key') ? codeLower.substring(3) : codeLower;
    const cleanBound = boundLower.startsWith('key') ? boundLower.substring(3) : boundLower;

    return codeLower === boundLower ||
           keyLower === boundLower ||
           cleanCode === cleanBound ||
           keyLower === cleanBound;
  },
  showModal() {
    // Create styling if not present
    if (!document.getElementById('keybindings-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'keybindings-modal-styles';
      style.innerHTML = `
        .kb-modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .kb-modal {
          background: var(--board-bg, #111827);
          border: 2px solid var(--border, #00f0ff);
          padding: 24px;
          border-radius: 12px;
          width: 320px;
          color: var(--text, #fff);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
        }
        .kb-header {
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 16px;
          text-align: center;
          border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.1));
          padding-bottom: 8px;
        }
        .kb-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .kb-label {
          font-size: 0.9rem;
          color: var(--text-dim, #9aa0a6);
        }
        .kb-key-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border, #ff007f);
          color: var(--accent-neon, #00f0ff);
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          min-width: 100px;
          text-align: center;
        }
        .kb-key-btn.waiting {
          background: var(--accent-pink, #ff007f);
          color: #fff;
          border-color: var(--accent-pink);
          animation: pulse 1s infinite alternate;
        }
        .kb-footer {
          margin-top: 20px;
          display: flex;
          gap: 12px;
        }
        .kb-btn {
          flex: 1;
          padding: 8px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }
        .kb-btn-close {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text, #fff);
        }
        .kb-btn-reset {
          background: rgba(255, 0, 127, 0.2);
          color: var(--accent-pink, #ff007f);
          border: 1px solid var(--accent-pink, #ff007f);
        }
        @keyframes pulse {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    const overlay = document.createElement('div');
    overlay.className = 'kb-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'kb-modal';

    const header = document.createElement('div');
    header.className = 'kb-header';
    header.textContent = 'KEYSETTINGS';
    modal.appendChild(header);

    const createRow = (actionName, bindingKey) => {
      const row = document.createElement('div');
      row.className = 'kb-row';

      const label = document.createElement('div');
      label.className = 'kb-label';
      label.textContent = actionName.toUpperCase() + ':';

      const button = document.createElement('button');
      button.className = 'kb-key-btn';
      button.textContent = this.bindings[bindingKey];

      button.addEventListener('click', () => {
        button.classList.add('waiting');
        button.textContent = 'PRESS KEY';

        const handleKeypress = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.bindings[bindingKey] = e.code || e.key;
          this.save();
          button.classList.remove('waiting');
          button.textContent = this.bindings[bindingKey];
          window.removeEventListener('keydown', handleKeypress, true);
        };

        window.addEventListener('keydown', handleKeypress, true);
      });

      row.appendChild(label);
      row.appendChild(button);
      return row;
    };

    modal.appendChild(createRow('Action / Jump', 'action'));
    modal.appendChild(createRow('Pause Game', 'pause'));

    const footer = document.createElement('div');
    footer.className = 'kb-footer';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'kb-btn kb-btn-reset';
    resetBtn.textContent = 'RESET';
    resetBtn.addEventListener('click', () => {
      this.bindings = { pause: 'KeyP', action: 'Space' };
      this.save();
      overlay.remove();
      this.showModal(); // Reopen
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'kb-btn kb-btn-close';
    closeBtn.textContent = 'CLOSE';
    closeBtn.addEventListener('click', () => {
      overlay.remove();
    });

    footer.appendChild(resetBtn);
    footer.appendChild(closeBtn);
    modal.appendChild(footer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  },
  setupUI() {
    const header = document.querySelector('header');
    if (header && !document.querySelector('.keybindings-trigger-btn')) {
      const btn = document.createElement('button');
      btn.className = 'keybindings-trigger-btn';
      btn.textContent = 'KEYS';
      btn.ariaLabel = 'Open Keybindings Settings';
      btn.style.background = 'transparent';
      btn.style.color = 'var(--text-dim)';
      btn.style.border = 'none';
      btn.style.fontSize = '0.85rem';
      btn.style.fontWeight = '600';
      btn.style.cursor = 'pointer';
      btn.style.marginLeft = '8px';
      btn.style.transition = 'all 0.2s ease';

      btn.addEventListener('mouseenter', () => {
        btn.style.color = 'var(--accent-pink)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.color = 'var(--text-dim)';
      });
      btn.addEventListener('click', () => this.showModal());

      const themeContainer = document.querySelector('.theme-selector-container');
      if (themeContainer) {
        themeContainer.appendChild(btn);
      } else {
        header.appendChild(btn);
      }
    }
  }
};

if (typeof window !== 'undefined') {
  window.KeyManager = KeyManager;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KeyManager.init());
  } else {
    KeyManager.init();
  }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { KeyManager };
}
