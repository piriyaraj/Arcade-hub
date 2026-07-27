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
        text=True
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
        text=True
    )

    print("STDOUT:")
    print(result.stdout)
    print("STDERR:", file=sys.stderr)
    print(result.stderr, file=sys.stderr)

    assert result.returncode == 0, f"JS test utils.test.js failed with code {result.returncode}"
