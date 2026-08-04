const test = require('node:test');
const assert = require('node:assert');

// Mock browser globals before loading audio.js
global.AudioContext = class {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = {};
  }
  resume() {
    this.state = 'running';
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        linearRampToValueAtTime: () => {}
      },
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        linearRampToValueAtTime: () => {}
      },
      connect: () => {}
    };
  }
};

global.window = {
  sfx: undefined,
  AudioContext: global.AudioContext,
  webkitAudioContext: global.AudioContext
};

// Now import audio.js
const { SoundFX } = require('../audio.js');

test('SoundFX constructor initializes properties correctly', () => {
  const sfx = new SoundFX();
  assert.strictEqual(sfx.ctx, null);
  assert.strictEqual(sfx.muted, false);
});

test('SoundFX init sets up AudioContext and resumes it', () => {
  const sfx = new SoundFX();
  sfx.init();
  assert.ok(sfx.ctx !== null);
  assert.strictEqual(sfx.ctx.state, 'running');
});

test('SoundFX muted state prevents play functions', () => {
  const sfx = new SoundFX();
  sfx.muted = true;
  sfx.playEat();
  assert.strictEqual(sfx.ctx, null); // should not trigger init/ctx creation
});

test('SoundFX unmuted state plays sound and initializes ctx', () => {
  const sfx = new SoundFX();
  sfx.playEat();
  assert.ok(sfx.ctx !== null);
  assert.strictEqual(sfx.ctx.state, 'running');
});

test('SoundFX plays other sound effects without error', () => {
  const sfx = new SoundFX();
  sfx.playBounce();
  sfx.playGameOver();
  sfx.playScoreSlot();
  sfx.playNitro();
  sfx.playPowerup();
  sfx.playShield();
  sfx.playLevelUp();
  sfx.playCombo();
  assert.ok(sfx.ctx !== null);
});

