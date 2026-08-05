import os
import re

def get_repo_root():
    """Returns the path to the repository root directory."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(tests_dir, ".."))

def test_cybernexus_html_exists():
    """Verify that cybernexus.html exists in the repository root."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cybernexus.html")
    assert os.path.isfile(path), "cybernexus.html does not exist at the repository root"

def test_cybernexus_dependencies():
    """Verify that cybernexus.html imports required scripts and theme stylesheet."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cybernexus.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert re.search(r'<script\s+src=["\']theme\.js["\']\s*></script>', content), "Missing script tag for theme.js"
    assert re.search(r'<script\s+src=["\']input\.js["\']\s*></script>', content), "Missing script tag for input.js"
    assert re.search(r'<script\s+src=["\']utils\.js["\']\s*></script>', content), "Missing script tag for utils.js"
    assert re.search(r'<script\s+src=["\']audio\.js["\']\s*></script>', content), "Missing script tag for audio.js"
    assert re.search(r'<script\s+src=["\']leaderboard\.js["\']\s*></script>', content), "Missing script tag for leaderboard.js"
    assert re.search(r'<link\s+rel=["\']stylesheet["\']\s+href=["\']styles/theme\.css["\']', content), "Missing stylesheet link for styles/theme.css"

def test_cybernexus_local_storage_bindings():
    """Verify that cybernexus.html references getBestScore/saveBestScore for 'cybernexus'."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cybernexus.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "getBestScore('cybernexus')" in content or 'getBestScore("cybernexus")' in content, (
        "cybernexus.html must load high score with gameKey 'cybernexus'"
    )
    assert "saveBestScore('cybernexus'" in content or 'saveBestScore("cybernexus"' in content, (
        "cybernexus.html must save high score with gameKey 'cybernexus'"
    )

def test_index_links_to_cybernexus():
    """Verify index.html exists and links to cybernexus.html."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "index.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert 'href="cybernexus.html"' in content or "href='cybernexus.html'" in content, (
        "index.html must contain a link to cybernexus.html"
    )

def test_cybernexus_abilities():
    """Verify cybernexus.html contains shoot, triggerEmp, activateShield, triggerOverdrive methods."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cybernexus.html")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "shoot()" in content, "cybernexus.html must include shoot method"
    assert "triggerEmp()" in content, "cybernexus.html must include triggerEmp method"
    assert "activateShield(" in content, "cybernexus.html must include activateShield method"
    assert "triggerOverdrive(" in content, "cybernexus.html must include triggerOverdrive method"
