import os
import re

def get_repo_root():
    """Returns the path to the repository root directory."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(tests_dir, ".."))

def test_cybercircuit_html_exists():
    """Verify that cybercircuit.html exists in the repository root."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cybercircuit.html")
    assert os.path.isfile(path), "cybercircuit.html does not exist at the repository root"

def test_cybercircuit_dependencies():
    """Verify that cybercircuit.html imports required scripts and theme stylesheet."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cybercircuit.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert re.search(r'<script\s+src=["\']theme\.js["\']\s*></script>', content), "Missing script tag for theme.js"
    assert re.search(r'<script\s+src=["\']input\.js["\']\s*></script>', content), "Missing script tag for input.js"
    assert re.search(r'<script\s+src=["\']utils\.js["\']\s*></script>', content), "Missing script tag for utils.js"
    assert re.search(r'<script\s+src=["\']audio\.js["\']\s*></script>', content), "Missing script tag for audio.js"
    assert re.search(r'<script\s+src=["\']leaderboard\.js["\']\s*></script>', content), "Missing script tag for leaderboard.js"
    assert re.search(r'<link\s+rel=["\']stylesheet["\']\s+href=["\']styles/theme\.css["\']', content), "Missing stylesheet link for styles/theme.css"

def test_cybercircuit_local_storage_bindings():
    """Verify that cybercircuit.html references getBestScore/saveBestScore for 'cybercircuit'."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cybercircuit.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "getBestScore('cybercircuit')" in content or 'getBestScore("cybercircuit")' in content, (
        "cybercircuit.html must load high score with gameKey 'cybercircuit'"
    )
    assert "saveBestScore('cybercircuit'" in content or 'saveBestScore("cybercircuit"' in content, (
        "cybercircuit.html must save high score with gameKey 'cybercircuit'"
    )

def test_index_links_to_cybercircuit():
    """Verify index.html exists and links to cybercircuit.html."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "index.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert 'href="cybercircuit.html"' in content or "href='cybercircuit.html'" in content, (
        "index.html must contain a link to cybercircuit.html"
    )
