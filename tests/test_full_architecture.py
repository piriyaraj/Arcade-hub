import os
import re

def get_repo_root():
    """Returns the path to the repository root directory."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(tests_dir, ".."))

def test_files_exist():
    """Verify that all architecture files exist."""
    root = get_repo_root()
    files = [
        "styles/theme.css",
        "theme.js",
        "input.js",
        "leaderboard.js",
        "leaderboard.html"
    ]
    for file_rel in files:
        full_path = os.path.join(root, file_rel)
        assert os.path.isfile(full_path), f"Required file {file_rel} is missing"

def test_html_script_and_css_links():
    """Verify that index, games, and leaderboard html files import the expected scripts and CSS."""
    root = get_repo_root()
    html_files = [
        "index.html",
        "pong.html",
        "flappybird.html",
        "cyberracer.html",
        "cyberhacker.html",
        "cyberdash.html",
        "cyberrunner.html",
        "frogger.html",
        "cyberstriker.html",
        "cybersiege.html",
        "cyberbreaker.html",
        "cyberdefense.html",
        "cybersurge.html",
        "cyberoverdrive.html",
        "cybervortex.html",
        "cyberpulse.html",
        "cybermatrix.html",
        "cybercircuit.html",
        "cybernexus.html",
        "cyberstorm.html",
        "leaderboard.html"
    ]

    for file_rel in html_files:
        path = os.path.join(root, file_rel)
        assert os.path.isfile(path)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        # Check standard stylesheet inclusion
        assert "styles/theme.css" in content or "styles\\theme.css" in content, f"{file_rel} is missing styles/theme.css link"

        # Check theme script inclusion
        assert re.search(r'src=["\']theme\.js["\']', content), f"{file_rel} is missing theme.js script tag"

        # leaderboard lacks keyboard controls rebinding so keymanager script is optional for it, but games/index need input.js
        if file_rel != "leaderboard.html":
            assert re.search(r'src=["\']input\.js["\']', content), f"{file_rel} is missing input.js script tag"

def test_local_storage_keys():
    """Verify that correct localStorage keys are referenced in theme.js and input.js."""
    root = get_repo_root()

    # 1. theme.js key
    theme_path = os.path.join(root, "theme.js")
    with open(theme_path, "r", encoding="utf-8") as f:
        theme_content = f.read()
    assert "arcade-theme" in theme_content, "theme.js should reference 'arcade-theme' localStorage key"

    # 2. input.js key
    input_path = os.path.join(root, "input.js")
    with open(input_path, "r", encoding="utf-8") as f:
        input_content = f.read()
    assert "arcade-keybindings" in input_content, "input.js should reference 'arcade-keybindings' localStorage key"

def test_css_variables_defined():
    """Verify theme variables are defined in styles/theme.css."""
    root = get_repo_root()
    css_path = os.path.join(root, "styles/theme.css")
    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()

    expected_vars = [
        "--bg",
        "--board-bg",
        "--text",
        "--text-dim",
        "--border",
        "--accent-neon",
        "--accent-pink",
        "--accent-green",
        "--racer-glow",
        "--obstacle-glow",
        "--node-glow",
        "--paddle-glow",
        "--cpu-glow",
        "--ball-glow",
        "--theme-neon",
        "--theme-yellow",
        "--theme-pink",
        "--theme-green"
    ]
    for var in expected_vars:
        assert var in css_content, f"CSS variable {var} must be defined in theme.css"

def test_index_links_and_readme():
    """Verify index.html links to leaderboard.html, and README.md documents the modules."""
    root = get_repo_root()

    # 1. index link
    index_path = os.path.join(root, "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        index_content = f.read()
    assert "leaderboard.html" in index_content, "index.html must link to leaderboard.html"

    # 2. README.md documentation
    readme_path = os.path.join(root, "README.md")
    with open(readme_path, "r", encoding="utf-8") as f:
        readme_content = f.read()

    assert "ThemeManager" in readme_content, "README must document ThemeManager"
    assert "KeyManager" in readme_content, "README must document KeyManager"
    assert "Leaderboard" in readme_content, "README must document Leaderboard"
    assert "theme.js" in readme_content, "README must mention theme.js"
    assert "input.js" in readme_content, "README must mention input.js"
    assert "leaderboard.js" in readme_content, "README must mention leaderboard.js"
