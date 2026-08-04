// Web Audio API Synthesizer Helper for Retro Game Sound Effects

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

function safeSet(key, val) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
    }
  } catch (e) {
    // Ignore write errors
  }
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

class AudioManager {
  constructor() {
    this.ctx = null;
    this._masterVolume = 1.0;
    this._sfxVolume = 1.0;
    this._musicVolume = 1.0;
    this._muted = false;

    this.loadSettings();
  }

  clampVolume(val) {
    const num = parseFloat(val);
    if (isNaN(num)) return 1.0;
    return Math.max(0.0, Math.min(1.0, num));
  }

  loadSettings() {
    try {
      const master = safeGet('audio_master_volume');
      this._masterVolume = master !== null ? this.clampVolume(master) : 1.0;

      const sfx = safeGet('audio_sfx_volume');
      this._sfxVolume = sfx !== null ? this.clampVolume(sfx) : 1.0;

      const music = safeGet('audio_music_volume');
      this._musicVolume = music !== null ? this.clampVolume(music) : 1.0;

      const muted = safeGet('audio_muted');
      this._muted = muted !== null ? muted === 'true' : false;
    } catch (e) {
      this._masterVolume = 1.0;
      this._sfxVolume = 1.0;
      this._musicVolume = 1.0;
      this._muted = false;
    }
  }

  saveSettings() {
    try {
      safeSet('audio_master_volume', this._masterVolume.toString());
      safeSet('audio_sfx_volume', this._sfxVolume.toString());
      safeSet('audio_music_volume', this._musicVolume.toString());
      safeSet('audio_muted', this._muted.toString());
    } catch (e) {
      // Ignore storage write errors
    }
  }

  get masterVolume() {
    return this._masterVolume;
  }

  set masterVolume(val) {
    this._masterVolume = this.clampVolume(val);
    this.saveSettings();
  }

  get sfxVolume() {
    return this._sfxVolume;
  }

  set sfxVolume(val) {
    this._sfxVolume = this.clampVolume(val);
    this.saveSettings();
  }

  get musicVolume() {
    return this._musicVolume;
  }

  set musicVolume(val) {
    this._musicVolume = this.clampVolume(val);
    this.saveSettings();
  }

  get muted() {
    return this._muted;
  }

  set muted(val) {
    this._muted = !!val;
    this.saveSettings();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playEat() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);

    const volume = 0.2 * this._masterVolume * this._sfxVolume;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.05), this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playBounce() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.05);

    const volume = 0.15 * this._masterVolume * this._sfxVolume;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.07), this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playGameOver() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.4);

    const volume = 0.2 * this._masterVolume * this._sfxVolume;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(Math.max(0.001, volume * 0.05), this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playScoreSlot() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      const volume = 0.15 * this._masterVolume * this._sfxVolume;
      gain.gain.setValueAtTime(volume, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.07), now + i * 0.06 + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.1);
    });
  }

  playNitro() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.25);

    const volume = 0.25 * this._masterVolume * this._sfxVolume;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.05), this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playPowerup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.15);

    const volume = 0.2 * this._masterVolume * this._sfxVolume;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.05), this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playShield() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);

    const volume = 0.22 * this._masterVolume * this._sfxVolume;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.05), this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playLevelUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);

      const volume = 0.18 * this._masterVolume * this._sfxVolume;
      gain.gain.setValueAtTime(volume, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.05), now + i * 0.05 + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.12);
    });
  }

  playCombo() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [440.00, 880.00].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);

      const volume = 0.12 * this._masterVolume * this._sfxVolume;
      gain.gain.setValueAtTime(volume, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.05), now + i * 0.04 + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.08);
    });
  }
}

class SoundFX extends AudioManager {}


if (typeof window !== 'undefined') {
  if (typeof window.audioManager === 'undefined') {
    window.audioManager = new AudioManager();
  }
  if (typeof window.sfx === 'undefined') {
    window.sfx = window.audioManager;
  }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { AudioManager, SoundFX };
}
