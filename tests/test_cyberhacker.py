import os
import re

def get_repo_root():
    """Returns the path to the repository root directory."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(tests_dir, ".."))

def test_cyberhacker_html_exists():
    """Verify that cyberhacker.html exists in the repository root."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberhacker.html")
    assert os.path.isfile(path), "cyberhacker.html does not exist at the repository root"

def test_cyberhacker_dependencies():
    """Verify that cyberhacker.html imports theme.js, input.js, utils.js, and audio.js scripts."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberhacker.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert re.search(r'<script\s+src=["\']theme\.js["\']\s*></script>', content), "Missing script tag for theme.js"
    assert re.search(r'<script\s+src=["\']input\.js["\']\s*></script>', content), "Missing script tag for input.js"
    assert re.search(r'<script\s+src=["\']utils\.js["\']\s*></script>', content), "Missing script tag for utils.js"
    assert re.search(r'<script\s+src=["\']audio\.js["\']\s*></script>', content), "Missing script tag for audio.js"
    assert re.search(r'<link\s+rel=["\']stylesheet["\']\s+href=["\']styles/theme\.css["\']', content), "Missing stylesheet link for styles/theme.css"

def test_cyberhacker_local_storage_bindings():
    """Verify that cyberhacker.html references getBestScore/saveBestScore for 'cyberhacker'."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberhacker.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "getBestScore('cyberhacker')" in content or 'getBestScore("cyberhacker")' in content, (
        "cyberhacker.html must load high score with gameKey 'cyberhacker'"
    )
    assert "saveBestScore('cyberhacker'" in content or 'saveBestScore("cyberhacker"' in content, (
        "cyberhacker.html must save high score with gameKey 'cyberhacker'"
    )

def test_index_links_to_cyberhacker():
    """Verify index.html exists and links to cyberhacker.html."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "index.html")
    assert os.path.isfile(path), "index.html does not exist at the repository root"

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert 'href="cyberhacker.html"' in content or "href='cyberhacker.html'" in content, (
        "index.html must link to cyberhacker.html"
    )

def test_readme_links_to_cyberhacker():
    """Verify README.md exists and contains links to cyberhacker.html."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "README.md")
    assert os.path.isfile(path), "README.md does not exist at the repository root"

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "cyberhacker.html" in content, "README.md must link to cyberhacker.html"
    assert "Cyber Hacker" in content, "README.md must list Cyber Hacker game name"

def test_cyberhacker_emp_pulse_mechanics():
    """Verify that cyberhacker.html contains EMP pulse feature and trigger function."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberhacker.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "empCharges" in content, "cyberhacker.html must track empCharges"
    assert "triggerEmpPulse" in content, "cyberhacker.html must contain triggerEmpPulse function"

def test_cyberhacker_key_events():
    """Verify keydown listeners handle action key and pause key."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberhacker.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "KeyManager.isKey(e, 'action')" in content, "cyberhacker.html must use KeyManager.isKey for action"
    assert "KeyManager.isKey(e, 'pause')" in content, "cyberhacker.html must use KeyManager.isKey for pause"

def test_js_cyberhacker_unit_tests():
    """Runs the JavaScript Node.js unit tests for cyberhacker.test.js and asserts success."""
    import subprocess
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    test_file = os.path.join(tests_dir, "cyberhacker.test.js")

    result = subprocess.run(
        ["node", "--test", test_file],
        capture_output=True,
        text=True,
        timeout=60
    )

    assert result.returncode == 0, f"JS test cyberhacker.test.js failed with code {result.returncode}\n{result.stderr}\n{result.stdout}"

