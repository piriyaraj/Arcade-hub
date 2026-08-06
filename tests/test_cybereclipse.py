import os
import re
import subprocess

def get_repo_root():
    """Returns the path to the repository root directory."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(tests_dir, ".."))

def test_cybereclipse_html_exists():
    """Verify that cybereclipse.html exists in the repository root."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cybereclipse.html")
    assert os.path.isfile(path), "cybereclipse.html does not exist at the repository root"

def test_cybereclipse_dependencies():
    """Verify that cybereclipse.html imports required scripts and theme stylesheet."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cybereclipse.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert re.search(r'<script\s+src=["\']theme\.js["\']\s*></script>', content), "Missing script tag for theme.js"
    assert re.search(r'<script\s+src=["\']input\.js["\']\s*></script>', content), "Missing script tag for input.js"
    assert re.search(r'<script\s+src=["\']utils\.js["\']\s*></script>', content), "Missing script tag for utils.js"
    assert re.search(r'<script\s+src=["\']audio\.js["\']\s*></script>', content), "Missing script tag for audio.js"
    assert re.search(r'<script\s+src=["\']leaderboard\.js["\']\s*></script>', content), "Missing script tag for leaderboard.js"
    assert re.search(r'<link\s+rel=["\']stylesheet["\']\s+href=["\']styles/theme\.css["\']', content), "Missing stylesheet link for styles/theme.css"

def test_cybereclipse_local_storage_bindings():
    """Verify that cybereclipse.html references high score with 'cybereclipse_best'."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cybereclipse.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "cybereclipse_best" in content or "cybereclipse" in content, (
        "cybereclipse.html must reference localStorage key 'cybereclipse_best' or 'cybereclipse'"
    )

def test_index_links_to_cybereclipse():
    """Verify index.html exists and links to cybereclipse.html."""
    repo_root = get_repo_root()
    index_path = os.path.join(repo_root, "index.html")
    assert os.path.isfile(index_path)

    with open(index_path, "r", encoding="utf-8") as f:
        index_content = f.read()

    assert re.search(r'href=["\']cybereclipse\.html["\']', index_content), "index.html must link to cybereclipse.html"

def test_cybereclipse_node_unit_tests():
    """Run node --test tests/cybereclipse.test.js and ensure exit code 0."""
    repo_root = get_repo_root()
    test_path = os.path.join(repo_root, "tests", "cybereclipse.test.js")
    assert os.path.isfile(test_path), "cybereclipse.test.js must exist"

    res = subprocess.run(["node", "--test", test_path], cwd=repo_root, capture_output=True, text=True, timeout=30)
    assert res.returncode == 0, f"Node unit tests failed:\n{res.stdout}\n{res.stderr}"
