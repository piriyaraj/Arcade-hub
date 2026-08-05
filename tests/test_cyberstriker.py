import os
import re
import subprocess
import sys

def get_repo_root():
    """Returns the path to the repository root directory."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(tests_dir, ".."))

def test_cyberstriker_html_exists():
    """Verify that cyberstriker.html exists in the repository root."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberstriker.html")
    assert os.path.isfile(path), "cyberstriker.html does not exist at the repository root"

def test_cyberstriker_dependencies():
    """Verify that cyberstriker.html imports required scripts and theme stylesheet."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberstriker.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert re.search(r'<script\s+src=["\']theme\.js["\']\s*></script>', content), "Missing script tag for theme.js"
    assert re.search(r'<script\s+src=["\']input\.js["\']\s*></script>', content), "Missing script tag for input.js"
    assert re.search(r'<script\s+src=["\']utils\.js["\']\s*></script>', content), "Missing script tag for utils.js"
    assert re.search(r'<script\s+src=["\']audio\.js["\']\s*></script>', content), "Missing script tag for audio.js"
    assert re.search(r'<script\s+src=["\']leaderboard\.js["\']\s*></script>', content), "Missing script tag for leaderboard.js"
    assert re.search(r'<link\s+rel=["\']stylesheet["\']\s+href=["\']styles/theme\.css["\']', content), "Missing stylesheet link for styles/theme.css"

def test_cyberstriker_local_storage_bindings():
    """Verify that cyberstriker.html references getBestScore/saveBestScore for 'cyberstriker'."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberstriker.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "getBestScore('cyberstriker')" in content or 'getBestScore("cyberstriker")' in content, (
        "cyberstriker.html must load high score with gameKey 'cyberstriker'"
    )
    assert "saveBestScore('cyberstriker'" in content or 'saveBestScore("cyberstriker"' in content, (
        "cyberstriker.html must save high score with gameKey 'cyberstriker'"
    )

def test_index_links_to_cyberstriker():
    """Verify index.html exists and links to cyberstriker.html."""
    repo_root = get_repo_root()
    index_path = os.path.join(repo_root, "index.html")
    assert os.path.isfile(index_path)

    with open(index_path, "r", encoding="utf-8") as f:
        index_content = f.read()

    assert re.search(r'href=["\']cyberstriker\.html["\']', index_content), "index.html must link to cyberstriker.html"

def test_cyberstriker_node_unit_tests():
    """Run node --test tests/cyberstriker.test.js and ensure exit code 0."""
    repo_root = get_repo_root()
    test_path = os.path.join(repo_root, "tests", "cyberstriker.test.js")
    assert os.path.isfile(test_path), "cyberstriker.test.js must exist"

    res = subprocess.run(["node", "--test", test_path], cwd=repo_root, capture_output=True, text=True)
    assert res.returncode == 0, f"Node unit tests failed:\n{res.stdout}\n{res.stderr}"
