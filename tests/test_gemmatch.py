import os
import re

def get_repo_root():
    """Returns the path to the repository root directory."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(tests_dir, ".."))

def test_gemmatch_html_exists():
    """Verify that gemmatch.html exists in the repository root."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "gemmatch.html")
    assert os.path.isfile(path), "gemmatch.html does not exist at the repository root"

def test_gemmatch_dependencies():
    """Verify that gemmatch.html imports both utils.js and audio.js scripts."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "gemmatch.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Search for utils.js and audio.js via script tag imports
    assert re.search(r'<script\s+src=["\']utils\.js["\']\s*></script>', content), "Missing script tag for utils.js"
    assert re.search(r'<script\s+src=["\']audio\.js["\']\s*></script>', content), "Missing script tag for audio.js"
    assert re.search(r'<script\s+src=["\']theme\.js["\']', content), "Missing script tag for theme.js"
    assert re.search(r'<script\s+src=["\']input\.js["\']', content), "Missing script tag for input.js"

def test_gemmatch_local_storage_bindings():
    """Verify that gemmatch.html references getBestScore/saveBestScore for 'gemmatch'."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "gemmatch.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "getBestScore('gemmatch')" in content or 'getBestScore("gemmatch")' in content, (
        "gemmatch.html must load high score with gameKey 'gemmatch'"
    )
    assert "saveBestScore('gemmatch'" in content or 'saveBestScore("gemmatch"' in content, (
        "gemmatch.html must save high score with gameKey 'gemmatch'"
    )

def test_index_links_to_gemmatch():
    """Verify index.html exists and links to gemmatch.html."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "index.html")
    assert os.path.isfile(path), "index.html does not exist at the repository root"

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert 'href="gemmatch.html"' in content or "href='gemmatch.html'" in content, (
        "index.html must link to gemmatch.html"
    )

def test_readme_links_to_gemmatch():
    """Verify README.md exists and contains links to gemmatch.html."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "README.md")
    assert os.path.isfile(path), "README.md does not exist at the repository root"

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "gemmatch.html" in content, "README.md must link to gemmatch.html"
    assert "Gem Match" in content, "README.md must list Gem Match game name"
