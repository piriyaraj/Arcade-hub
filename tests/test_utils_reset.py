import subprocess
import os
import sys

def test_js_reset_score_success():
    """Runs a Node.js snippet to verify that resetScore removes from localStorage and returns true."""
    # Find the repo root where utils.js is located
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(tests_dir, ".."))

    js_code = """
const mockStorage = { 'mygame_best': '100' };
global.localStorage = {
  removeItem: (key) => { delete mockStorage[key]; }
};
global.window = {};

const utils = require('./utils.js');
const result = utils.resetScore('mygame');
if (result !== true) {
  console.error('Expected resetScore to return true, got:', result);
  process.exit(1);
}
if ('mygame_best' in mockStorage) {
  console.error('Expected mygame_best to be removed from mockStorage');
  process.exit(1);
}
console.log('Success');
"""
    result = subprocess.run(
        ["node", "-e", js_code],
        cwd=repo_root,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"Node process failed: {result.stderr}\nSTDOUT: {result.stdout}"

def test_js_reset_score_failure():
    """Runs a Node.js snippet to verify that resetScore recovers from localStorage failure and returns false."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(tests_dir, ".."))

    js_code = """
global.localStorage = {
  removeItem: (key) => { throw new Error('Simulated failure'); }
};
global.window = {};

const utils = require('./utils.js');
const result = utils.resetScore('mygame');
if (result !== false) {
  console.error('Expected resetScore to return false on error, got:', result);
  process.exit(1);
}
console.log('Success');
"""
    result = subprocess.run(
        ["node", "-e", js_code],
        cwd=repo_root,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"Node process failed: {result.stderr}\nSTDOUT: {result.stdout}"
