import os
import re

def get_repo_root():
    """Returns the path to the repository root directory."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(tests_dir, ".."))

def test_cyberracer_html_exists():
    """Verify that cyberracer.html exists in the repository root."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberracer.html")
    assert os.path.isfile(path), "cyberracer.html does not exist at the repository root"

def test_cyberracer_dependencies():
    """Verify that cyberracer.html imports both utils.js and audio.js scripts."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberracer.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Search for utils.js and audio.js via script tag imports
    assert re.search(r'<script\s+src=["\']utils\.js["\']\s*></script>', content), "Missing script tag for utils.js"
    assert re.search(r'<script\s+src=["\']audio\.js["\']\s*></script>', content), "Missing script tag for audio.js"

def test_cyberracer_local_storage_bindings():
    """Verify that cyberracer.html references getBestScore/saveBestScore for 'cyberracer' and keys are bound."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberracer.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Check for calls to getBestScore / saveBestScore for gameKey 'cyberracer'
    assert "getBestScore('cyberracer')" in content or 'getBestScore("cyberracer")' in content, (
        "cyberracer.html components must load high score with gameKey 'cyberracer'"
    )
    assert "saveBestScore('cyberracer'" in content or 'saveBestScore("cyberracer"' in content, (
        "cyberracer.html components must save high score with gameKey 'cyberracer'"
    )

def test_index_links_to_cyberracer():
    """Verify index.html exists and links to cyberracer.html."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "index.html")
    assert os.path.isfile(path), "index.html does not exist at the repository root"

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Check for reference link to cyberracer.html
    assert 'href="cyberracer.html"' in content or "href='cyberracer.html'" in content, (
        "index.html must link to cyberracer.html"
    )

def test_readme_links_to_cyberracer():
    """Verify README.md exists and contains links to cyberracer.html."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "README.md")
    assert os.path.isfile(path), "README.md does not exist at the repository root"

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Check that it links to cyberracer.html
    assert "cyberracer.html" in content, "README.md must link to cyberracer.html"
    assert "CyberRacer" in content, "README.md must list CyberRacer game name"

def test_cyberracer_shield_mechanics():
    """Verify that cyberracer.html contains shield power-up features and logic."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberracer.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "shield: false" in content or "shield:" in content, "racer object must track shield property"
    assert "type === 'shield'" in content or "collectibles[i].type === 'shield'" in content, "Collectible items must support shield type"
    assert "racer.shield = true" in content or "racer.shield = false" in content, "racer shield status must be updated on pickup/collision"

def test_cyberracer_nitro_mechanics():
    """Verify that cyberracer.html contains nitro boost power-up features and audio triggers."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberracer.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "nitroTimer" in content, "racer object must track nitroTimer property"
    assert "type = 'nitro'" in content or "type === 'nitro'" in content, "Collectible items must support nitro type"
    assert "playNitro" in content, "cyberracer.html must trigger playNitro synthesizer audio"

def test_cyberracer_emp_pulse_mechanics():
    """Verify that cyberracer.html contains EMP pulse features and charge state."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "cyberracer.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "empCharges" in content, "racer object must track empCharges property"
    assert "triggerEmpPulse" in content, "cyberracer.html must contain triggerEmpPulse function"



