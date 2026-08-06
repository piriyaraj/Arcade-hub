import os
import re
import subprocess

def get_repo_root():
    """Returns the path to the repository root directory."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(tests_dir, ".."))

def test_cyberhorizon_html_exists():
    """Verify that cyberhorizon.html exists in the repository root."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberhorizon.html")
    assert os.path.isfile(path), "cyberhorizon.html does not exist at the repository root"

def test_cyberhorizon_dependencies():
    """Verify that cyberhorizon.html imports required scripts and theme stylesheet."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberhorizon.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert re.search(r'<script\s+src=["\']theme\.js["\']\s*></script>', content), "Missing script tag for theme.js"
    assert re.search(r'<script\s+src=["\']input\.js["\']\s*></script>', content), "Missing script tag for input.js"
    assert re.search(r'<script\s+src=["\']utils\.js["\']\s*></script>', content), "Missing script tag for utils.js"
    assert re.search(r'<script\s+src=["\']audio\.js["\']\s*></script>', content), "Missing script tag for audio.js"
    assert re.search(r'<script\s+src=["\']leaderboard\.js["\']\s*></script>', content), "Missing script tag for leaderboard.js"
    assert re.search(r'<link\s+rel=["\']stylesheet["\']\s+href=["\']styles/theme\.css["\']', content), "Missing stylesheet link for styles/theme.css"

def test_cyberhorizon_local_storage_bindings():
    """Verify that cyberhorizon.html references high score with 'cyberhorizon_best' or 'cyberhorizon'."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberhorizon.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "cyberhorizon_best" in content or "cyberhorizon" in content, (
        "cyberhorizon.html must reference localStorage key 'cyberhorizon_best' or 'cyberhorizon'"
    )

def test_index_links_to_cyberhorizon():
    """Verify index.html exists and links to cyberhorizon.html."""
    repo_root = get_repo_root()
    index_path = os.path.join(repo_root, "index.html")
    assert os.path.isfile(index_path)

    with open(index_path, "r", encoding="utf-8") as f:
        index_content = f.read()

    assert re.search(r'href=["\']cyberhorizon\.html["\']', index_content), "index.html must link to cyberhorizon.html"

def test_cyberhorizon_node_unit_tests():
    """Run node --test tests/cyberhorizon.test.js and ensure exit code 0."""
    repo_root = get_repo_root()
    test_path = os.path.join(repo_root, "tests", "cyberhorizon.test.js")
    assert os.path.isfile(test_path), "cyberhorizon.test.js must exist"

    res = subprocess.run(["node", "--test", test_path], cwd=repo_root, capture_output=True, text=True)
    assert res.returncode == 0, f"Node unit tests failed:\n{res.stdout}\n{res.stderr}"
