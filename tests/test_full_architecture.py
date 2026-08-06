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
        "cyberblade.html",
        "cyberaegis.html",
        "cyberphantom.html",
        "cyberecho.html",
        "cyberwarp.html",
        "cyberforge.html",
        "cyberrift.html",
        "cybercore.html",
        "cybergrid.html",
        "cyberflare.html",
        "cyberprism.html",
        "cybernova.html",
        "cyberspectre.html",
        "cybershadow.html",
        "cyberhelix.html",
        "cyberapex.html",
        "cybertitan.html",
        "cyberzenith.html",
        "cybervanguard.html",
        "cybereclipse.html",
        "cyberhorizon.html",
        "cyberfusion.html",
        "cybertempest.html",
        "cyberchrono.html",
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

def test_seo_implementation():
    """Verify SEO elements across all HTML pages, sitemap.xml, and robots.txt."""
    import xml.etree.ElementTree as ET
    root = get_repo_root()

    # 1. robots.txt
    robots_path = os.path.join(root, "robots.txt")
    assert os.path.isfile(robots_path), "robots.txt must exist"
    with open(robots_path, "r", encoding="utf-8") as f:
        robots_content = f.read()
    assert "Sitemap: https://arcadehub.telekit.link/sitemap.xml" in robots_content, "robots.txt must reference sitemap.xml"

    # 2. sitemap.xml
    sitemap_path = os.path.join(root, "sitemap.xml")
    assert os.path.isfile(sitemap_path), "sitemap.xml must exist"
    tree = ET.parse(sitemap_path)
    sitemap_root = tree.getroot()
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    locs = [url.find('s:loc', ns).text for url in sitemap_root.findall('s:url', ns)]
    
    html_files = [f for f in os.listdir(root) if f.endswith(".html")]
    for hf in html_files:
        expected_loc = "https://arcadehub.telekit.link/" if hf == "index.html" else f"https://arcadehub.telekit.link/{hf}"
        assert expected_loc in locs, f"{hf} ({expected_loc}) missing from sitemap.xml"

    # 3. HTML Meta Tags and SEO attributes
    for hf in html_files:
        path = os.path.join(root, hf)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        assert "<!DOCTYPE html>" in content or "<!doctype html>" in content, f"{hf} missing DOCTYPE"
        assert '<html lang="en">' in content or "<html lang='en'>" in content, f"{hf} missing lang='en'"
        assert "<title>" in content and "</title>" in content, f"{hf} missing <title>"
        assert 'name="description"' in content or "name='description'", f"{hf} missing meta description"
        assert 'rel="canonical"' in content or "rel='canonical'", f"{hf} missing canonical link"
        assert 'property="og:title"' in content or "property='og:title'", f"{hf} missing og:title"
        assert 'property="og:description"' in content or "property='og:description'", f"{hf} missing og:description"
        assert 'property="og:url"' in content or "property='og:url'", f"{hf} missing og:url"
        assert 'property="og:image"' in content or "property='og:image'", f"{hf} missing og:image"
        assert 'name="twitter:card"' in content or "name='twitter:card'", f"{hf} missing twitter:card"
        assert 'name="twitter:title"' in content or "name='twitter:title'", f"{hf} missing twitter:title"
        assert 'name="twitter:description"' in content or "name='twitter:description'", f"{hf} missing twitter:description"
        assert 'name="twitter:image"' in content or "name='twitter:image'", f"{hf} missing twitter:image"
        assert 'type="application/ld+json"' in content or "type='application/ld+json'", f"{hf} missing JSON-LD script"

