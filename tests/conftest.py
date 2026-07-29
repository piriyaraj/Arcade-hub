import os
import sys

# Add repository root to python search path so 'src' can be imported by tests
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)
