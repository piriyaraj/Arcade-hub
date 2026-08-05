import os
import re
import subprocess
import sys

def get_repo_root():
    """Returns the path to the repository root directory."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(tests_dir, ".."))

def test_cyberrunner_html_exists():
    """Verify that cyberrunner.html exists in the repository root."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberrunner.html")
    assert os.path.isfile(path), "cyberrunner.html does not exist at the repository root"

def test_cyberrunner_dependencies():
    """Verify that cyberrunner.html imports theme.js, input.js, utils.js, and audio.js scripts and theme.css stylesheet."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberrunner.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert re.search(r'<script\s+src=["\']theme\.js["\']\s*></script>', content), "Missing script tag for theme.js"
    assert re.search(r'<script\s+src=["\']input\.js["\']\s*></script>', content), "Missing script tag for input.js"
    assert re.search(r'<script\s+src=["\']utils\.js["\']\s*></script>', content), "Missing script tag for utils.js"
    assert re.search(r'<script\s+src=["\']audio\.js["\']\s*></script>', content), "Missing script tag for audio.js"
    assert re.search(r'<link\s+rel=["\']stylesheet["\']\s+href=["\']styles/theme\.css["\']', content), "Missing stylesheet link for styles/theme.css"

def test_cyberrunner_local_storage_bindings():
    """Verify that cyberrunner.html references getBestScore/saveBestScore for 'cyberrunner'."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberrunner.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "getBestScore('cyberrunner')" in content or 'getBestScore("cyberrunner")' in content, (
        "cyberrunner.html must load high score with gameKey 'cyberrunner'"
    )
    assert "saveBestScore('cyberrunner'" in content or 'saveBestScore("cyberrunner"' in content, (
        "cyberrunner.html must save high score with gameKey 'cyberrunner'"
    )

def test_index_links_to_cyberrunner():
    """Verify index.html exists and links to cyberrunner.html."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "index.html")
    assert os.path.isfile(path), "index.html does not exist at the repository root"

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert 'href="cyberrunner.html"' in content or "href='cyberrunner.html'" in content, (
        "index.html must link to cyberrunner.html"
    )

def test_readme_links_to_cyberrunner():
    """Verify README.md exists and contains links to cyberrunner.html."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "README.md")
    assert os.path.isfile(path), "README.md does not exist at the repository root"

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "cyberrunner.html" in content, "README.md must link to cyberrunner.html"
    assert "Cyber Runner" in content, "README.md must list Cyber Runner game name"

def test_cyberrunner_emp_pulse_mechanics():
    """Verify that cyberrunner.html contains EMP pulse features and trigger function."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberrunner.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "empCharges" in content, "cyberrunner.html must track empCharges"
    assert "triggerEmpPulse" in content, "cyberrunner.html must contain triggerEmpPulse function"

def test_cyberrunner_shield_mechanics():
    """Verify that cyberrunner.html contains shield powerup logic."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberrunner.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "shield" in content, "cyberrunner.html must track shield property"

def test_cyberrunner_key_events():
    """Verify keydown listeners handle action key and pause key."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberrunner.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "KeyManager.isKey(e, 'action')" in content, "cyberrunner.html must use KeyManager.isKey for action"
    assert "KeyManager.isKey(e, 'pause')" in content, "cyberrunner.html must use KeyManager.isKey for pause"

def test_js_cyberrunner_unit_tests():
    """Runs the JavaScript Node.js unit tests for cyberrunner.test.js and asserts success."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    test_file = os.path.join(tests_dir, "cyberrunner.test.js")

    result = subprocess.run(
        ["node", "--test", test_file],
        capture_output=True,
        text=True,
        timeout=60
    )

    assert result.returncode == 0, f"JS test cyberrunner.test.js failed with code {result.returncode}\n{result.stderr}\n{result.stdout}"
