import subprocess
import os
import sys

def test_js_audio_utilities():
    """Runs the JavaScript Node.js unit tests for audio.js and asserts success."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    test_file = os.path.join(tests_dir, "audio.test.js")

    result = subprocess.run(
        ["node", "--test", test_file],
        capture_output=True,
        text=True,
        timeout=60
    )

    print("STDOUT:")
    print(result.stdout)
    print("STDERR:", file=sys.stderr)
    print(result.stderr, file=sys.stderr)

    assert result.returncode == 0, f"JS test audio.test.js failed with code {result.returncode}"


def test_js_general_utilities():
    """Runs the JavaScript Node.js unit tests for utils.js and asserts success."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    test_file = os.path.join(tests_dir, "utils.test.js")

    result = subprocess.run(
        ["node", "--test", test_file],
        capture_output=True,
        text=True,
        timeout=60
    )

    print("STDOUT:")
    print(result.stdout)
    print("STDERR:", file=sys.stderr)
    print(result.stderr, file=sys.stderr)

    assert result.returncode == 0, f"JS test utils.test.js failed with code {result.returncode}"


def test_js_architecture_utilities():
    """Runs the JavaScript Node.js unit tests for theme.js, input.js, and leaderboard.js and asserts success."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    test_file = os.path.join(tests_dir, "architecture.test.js")

    result = subprocess.run(
        ["node", "--test", test_file],
        capture_output=True,
        text=True,
        timeout=60
    )

    print("STDOUT:")
    print(result.stdout)
    print("STDERR:", file=sys.stderr)
    print(result.stderr, file=sys.stderr)

    assert result.returncode == 0, f"JS test architecture.test.js failed with code {result.returncode}"


def test_js_leaderboard_utilities():
    """Runs the JavaScript Node.js unit tests for leaderboard.js and asserts success."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    test_file = os.path.join(tests_dir, "leaderboard.test.js")

    result = subprocess.run(
        ["node", "--test", test_file],
        capture_output=True,
        text=True,
        timeout=60
    )

    print("STDOUT:")
    print(result.stdout)
    print("STDERR:", file=sys.stderr)
    print(result.stderr, file=sys.stderr)

    assert result.returncode == 0, f"JS test leaderboard.test.js failed with code {result.returncode}"


def test_js_utils_html_exists():
    """Verify that utils.test.html exists and references progress assertions and utils.js."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    html_file = os.path.join(tests_dir, "utils.test.html")
    assert os.path.isfile(html_file), "utils.test.html file does not exist"

    with open(html_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Verify that it imports the shared utils.js script properly
    assert "../utils.js" in content or "..\\utils.js" in content, "utils.test.html should reference the shared utils.js"
    # Verify it covers loadHighScore/saveHighScore and mute states
    assert "loadHighScore" in content, "utils.test.html should cover loadHighScore"
    assert "saveHighScore" in content, "utils.test.html should cover saveHighScore"
    assert "getMuteState" in content, "utils.test.html should cover getMuteState"
    assert "saveMuteState" in content, "utils.test.html should cover saveMuteState"


def test_js_cybercircuit_utilities():
    """Runs the JavaScript Node.js unit tests for cybercircuit.test.js and asserts success."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    test_file = os.path.join(tests_dir, "cybercircuit.test.js")

    result = subprocess.run(
        ["node", "--test", test_file],
        capture_output=True,
        text=True,
        timeout=60
    )

    print("STDOUT:")
    print(result.stdout)
    print("STDERR:", file=sys.stderr)
    print(result.stderr, file=sys.stderr)

    assert result.returncode == 0, f"JS test cybercircuit.test.js failed with code {result.returncode}"


def test_js_cyberdynamo_utilities():
    """Runs the JavaScript Node.js unit tests for cyberdynamo.test.js and asserts success."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    test_file = os.path.join(tests_dir, "cyberdynamo.test.js")

    result = subprocess.run(
        ["node", "--test", test_file],
        capture_output=True,
        text=True,
        timeout=60
    )

    print("STDOUT:")
    print(result.stdout)
    print("STDERR:", file=sys.stderr)
    print(result.stderr, file=sys.stderr)

    assert result.returncode == 0, f"JS test cyberdynamo.test.js failed with code {result.returncode}"


def test_js_cyberkinetic_utilities():
    """Runs the JavaScript Node.js unit tests for cyberkinetic.test.js and asserts success."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    test_file = os.path.join(tests_dir, "cyberkinetic.test.js")

    result = subprocess.run(
        ["node", "--test", test_file],
        capture_output=True,
        text=True,
        timeout=60
    )

    print("STDOUT:")
    print(result.stdout)
    print("STDERR:", file=sys.stderr)
    print(result.stderr, file=sys.stderr)

    assert result.returncode == 0, f"JS test cyberkinetic.test.js failed with code {result.returncode}"


def test_js_cyberflux_utilities():
    """Runs the JavaScript Node.js unit tests for cyberflux.test.js and asserts success."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    test_file = os.path.join(tests_dir, "cyberflux.test.js")

    result = subprocess.run(
        ["node", "--test", test_file],
        capture_output=True,
        text=True,
        timeout=60
    )

    print("STDOUT:")
    print(result.stdout)
    print("STDERR:", file=sys.stderr)
    print(result.stderr, file=sys.stderr)

    assert result.returncode == 0, f"JS test cyberflux.test.js failed with code {result.returncode}"




