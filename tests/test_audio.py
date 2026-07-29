import subprocess
import os
import sys

def test_audio_manager_state_initialization():
    """Verify default volume and mute states when localStorage is empty."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(tests_dir, ".."))

    js_code = """
global.window = {};
global.localStorage = {
  getItem: (key) => null,
  setItem: (key, val) => {}
};

const { AudioManager } = require('./audio.js');
const manager = new AudioManager();

if (manager.masterVolume !== 1.0) {
  console.error('Expected default master volume to be 1.0, got', manager.masterVolume);
  process.exit(1);
}
if (manager.sfxVolume !== 1.0) {
  console.error('Expected default sfx volume to be 1.0, got', manager.sfxVolume);
  process.exit(1);
}
if (manager.musicVolume !== 1.0) {
  console.error('Expected default music volume to be 1.0, got', manager.musicVolume);
  process.exit(1);
}
if (manager.muted !== false) {
  console.error('Expected default muted to be false, got', manager.muted);
  process.exit(1);
}
console.log('Success');
"""
    result = subprocess.run(
        ["node", "-e", js_code],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=10
    )
    assert result.returncode == 0, f"Node process failed: {result.stderr}\nSTDOUT: {result.stdout}"


def test_audio_manager_persistence_clamping_load():
    """Verify that loading invalid settings from localStorage clamps them safely."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(tests_dir, ".."))

    js_code = """
global.window = {};
const mockStorage = {
  'audio_master_volume': '1.5',
  'audio_sfx_volume': '-0.5',
  'audio_music_volume': 'invalid_vol',
  'audio_muted': 'true'
};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = val; }
};

const { AudioManager } = require('./audio.js');
const manager = new AudioManager();

if (manager.masterVolume !== 1.0) {
  console.error('Expected master volume to be clamped to 1.0, got', manager.masterVolume);
  process.exit(1);
}
if (manager.sfxVolume !== 0.0) {
  console.error('Expected sfx volume to be clamped to 0.0, got', manager.sfxVolume);
  process.exit(1);
}
if (manager.musicVolume !== 1.0) {
  console.error('Expected invalid music volume to default to 1.0, got', manager.musicVolume);
  process.exit(1);
}
if (manager.muted !== true) {
  console.error('Expected muted to be true, got', manager.muted);
  process.exit(1);
}
console.log('Success');
"""
    result = subprocess.run(
        ["node", "-e", js_code],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=10
    )
    assert result.returncode == 0, f"Node process failed: {result.stderr}\nSTDOUT: {result.stdout}"


def test_audio_manager_persistence_clamping_set():
    """Verify that setters clamp values to [0.0, 1.0] and update localStorage."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(tests_dir, ".."))

    js_code = """
global.window = {};
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = val.toString(); }
};

const { AudioManager } = require('./audio.js');
const manager = new AudioManager();

manager.masterVolume = 1.3;
if (manager.masterVolume !== 1.0) {
  console.error('Expected set master volume > 1 to clamp to 1.0, got', manager.masterVolume);
  process.exit(1);
}
if (mockStorage['audio_master_volume'] !== '1') {
  console.error('Expected stored master volume to be 1, got', mockStorage['audio_master_volume']);
  process.exit(1);
}

manager.sfxVolume = -0.5;
if (manager.sfxVolume !== 0.0) {
  console.error('Expected set sfx volume < 0 to clamp to 0.0, got', manager.sfxVolume);
  process.exit(1);
}
if (mockStorage['audio_sfx_volume'] !== '0') {
  console.error('Expected stored sfx volume to be 0, got', mockStorage['audio_sfx_volume']);
  process.exit(1);
}

manager.musicVolume = 0.5;
if (manager.musicVolume !== 0.5) {
  console.error('Expected set music volume to be 0.5, got', manager.musicVolume);
  process.exit(1);
}
if (mockStorage['audio_music_volume'] !== '0.5') {
  console.error('Expected stored music volume to be 0.5, got', mockStorage['audio_music_volume']);
  process.exit(1);
}
console.log('Success');
"""
    result = subprocess.run(
        ["node", "-e", js_code],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=10
    )
    assert result.returncode == 0, f"Node process failed: {result.stderr}\nSTDOUT: {result.stdout}"


def test_audio_manager_mute_toggle_logic():
    """Verify that toggleMute works as expected and updates state and localStorage."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(tests_dir, ".."))

    js_code = """
global.window = {};
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = val.toString(); }
};

const { AudioManager } = require('./audio.js');
const manager = new AudioManager();

if (manager.muted !== false) {
  console.error('Expected muted to start as false');
  process.exit(1);
}

const res1 = manager.toggleMute();
if (res1 !== true || manager.muted !== true) {
  console.error('Expected toggleMute to return true and set muted to true');
  process.exit(1);
}
if (mockStorage['audio_muted'] !== 'true') {
  console.error('Expected audio_muted in storage to be "true"');
  process.exit(1);
}

const res2 = manager.toggleMute();
if (res2 !== false || manager.muted !== false) {
  console.error('Expected toggleMute to return false and set muted to false');
  process.exit(1);
}
if (mockStorage['audio_muted'] !== 'false') {
  console.error('Expected audio_muted in storage to be "false"');
  process.exit(1);
}
console.log('Success');
"""
    result = subprocess.run(
        ["node", "-e", js_code],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=10
    )
    assert result.returncode == 0, f"Node process failed: {result.stderr}\nSTDOUT: {result.stdout}"
