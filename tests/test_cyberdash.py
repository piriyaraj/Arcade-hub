import os
import re
import subprocess
import sys

def get_repo_root():
    """Returns the path to the repository root directory."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(tests_dir, ".."))

def test_cyberdash_html_exists():
    """Verify that cyberdash.html exists in the repository root."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberdash.html")
    assert os.path.isfile(path), "cyberdash.html does not exist at the repository root"

def test_cyberdash_dependencies():
    """Verify that cyberdash.html imports theme.js, input.js, utils.js, and audio.js scripts and theme.css stylesheet."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberdash.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert re.search(r'<script\s+src=["\']theme\.js["\']\s*></script>', content), "Missing script tag for theme.js"
    assert re.search(r'<script\s+src=["\']input\.js["\']\s*></script>', content), "Missing script tag for input.js"
    assert re.search(r'<script\s+src=["\']utils\.js["\']\s*></script>', content), "Missing script tag for utils.js"
    assert re.search(r'<script\s+src=["\']audio\.js["\']\s*></script>', content), "Missing script tag for audio.js"
    assert re.search(r'<link\s+rel=["\']stylesheet["\']\s+href=["\']styles/theme\.css["\']', content), "Missing stylesheet link for styles/theme.css"

def test_cyberdash_local_storage_bindings():
    """Verify that cyberdash.html references getBestScore/saveBestScore for 'cyberdash'."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberdash.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "getBestScore('cyberdash')" in content or 'getBestScore("cyberdash")' in content, (
        "cyberdash.html must load high score with gameKey 'cyberdash'"
    )
    assert "saveBestScore('cyberdash'" in content or 'saveBestScore("cyberdash"' in content, (
        "cyberdash.html must save high score with gameKey 'cyberdash'"
    )

def test_index_links_to_cyberdash():
    """Verify index.html exists and links to cyberdash.html."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "index.html")
    assert os.path.isfile(path), "index.html does not exist at the repository root"

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert 'href="cyberdash.html"' in content or "href='cyberdash.html'" in content, (
        "index.html must link to cyberdash.html"
    )

def test_readme_links_to_cyberdash():
    """Verify README.md exists and contains links to cyberdash.html."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "README.md")
    assert os.path.isfile(path), "README.md does not exist at the repository root"

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "cyberdash.html" in content, "README.md must link to cyberdash.html"
    assert "Cyber Dash" in content, "README.md must list Cyber Dash game name"

def test_cyberdash_emp_pulse_mechanics():
    """Verify that cyberdash.html contains EMP pulse features and trigger function."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberdash.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "empCharges" in content, "cyberdash.html must track empCharges"
    assert "triggerEmpPulse" in content, "cyberdash.html must contain triggerEmpPulse function"

def test_cyberdash_key_events():
    """Verify keydown listeners handle action key and pause key."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberdash.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "KeyManager.isKey(e, 'action')" in content, "cyberdash.html must use KeyManager.isKey for action"
    assert "KeyManager.isKey(e, 'pause')" in content, "cyberdash.html must use KeyManager.isKey for pause"

def test_js_cyberdash_unit_tests():
    """Runs the JavaScript Node.js unit tests for cyberdash.test.js and asserts success."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    test_file = os.path.join(tests_dir, "cyberdash.test.js")

    result = subprocess.run(
        ["node", "--test", test_file],
        capture_output=True,
        text=True,
        timeout=30
    )

    assert result.returncode == 0, f"JS test cyberdash.test.js failed with code {result.returncode}\n{result.stderr}\n{result.stdout}"
