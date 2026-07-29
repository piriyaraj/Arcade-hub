import os
import re

def get_repo_root():
    """Returns the path to the repository root directory."""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(tests_dir, ".."))

def test_pong_html_exists():
    """Verify that pong.html exists in the repository root."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "pong.html")
    assert os.path.isfile(path), "pong.html does not exist at the repository root"

def test_pong_mobile_controls_elements():
    """Verify that pong.html contains the mobile-controls container and the two touch buttons with proper ids, role and aria-labels."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "pong.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Verify container existence
    assert 'id="mobile-controls"' in content or "id='mobile-controls'" in content, (
        "pong.html is missing the mobile-controls container element"
    )

    # Verify styling for mobile controls
    assert '#mobile-controls' in content, "pong.html styling should contain '#mobile-controls'"
    assert '#pong-up-btn' in content, "pong.html styling should contain '#pong-up-btn'"
    assert '#pong-down-btn' in content, "pong.html styling should contain '#pong-down-btn'"

    # Verify buttons exist in HTML content
    assert 'id="pong-up-btn"' in content or "id='pong-up-btn'" in content, (
        "pong.html is missing the up button element #pong-up-btn"
    )
    assert 'id="pong-down-btn"' in content or "id='pong-down-btn'" in content, (
        "pong.html is missing the down button element #pong-down-btn"
    )

    # Check for accessibility tags (role="button" and aria-labels)
    assert 'role="button"' in content or "role='button'" in content, (
        "pong.html buttons must have role='button'"
    )
    assert 'aria-label="Move paddle up"' in content or "aria-label='Move paddle up'" in content, (
        "pong.html up button must have aria-label='Move paddle up'"
    )
    assert 'aria-label="Move paddle down"' in content or "aria-label='Move paddle down'" in content, (
        "pong.html down button must have aria-label='Move paddle down'"
    )

def test_pong_mobile_touch_event_listeners():
    """Verify that event listeners for touch/pointer events are wired up to toggle mobile controls."""
    repo_root = get_repo_root()
    path = os.path.join(repo_root, "pong.html")
    assert os.path.isfile(path)

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Verify variable initialization
    assert 'let mobileUp = false;' in content, "pong.html lacks 'let mobileUp = false;' state variable setup"
    assert 'let mobileDown = false;' in content, "pong.html lacks 'let mobileDown = false;' state variable setup"

    # Verify physics update links keys and mobile direction flags
    assert 'keys.ArrowUp || keys.w || mobileUp' in content, (
        "pong.html physics engine is missing mobileUp in the paddle movement logic"
    )
    assert 'keys.ArrowDown || keys.s || mobileDown' in content, (
        "pong.html physics engine is missing mobileDown in the paddle movement logic"
    )

    # Verify touch event listeners setup call
    assert 'setupMoveButton(btnUp, \'up\');' in content or "setupMoveButton(btnUp, \"up\");" in content, (
        "pong.html lacks setupMoveButton call for btnUp"
    )
    assert 'setupMoveButton(btnDown, \'down\');' in content or "setupMoveButton(btnDown, \"down\");" in content, (
        "pong.html lacks setupMoveButton call for btnDown"
    )
    assert 'touchstart' in content, "pong.html must listen to 'touchstart' events"
    assert 'touchend' in content, "pong.html must listen to 'touchend' events"
