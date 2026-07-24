def test_version():
    with open("main.md", "r") as f:
        content = f.read()
    assert "#Version 1" in content
