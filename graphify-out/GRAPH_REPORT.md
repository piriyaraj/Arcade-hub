# Graph Report - test-repo  (2026-07-29)

## Corpus Check
- 24 files · ~50,299 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 147 nodes · 190 edges · 15 communities (13 shown, 2 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c4c596f2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- README.md
- SoundFX
- audio.test.js
- test_js_utilities.py
- utils.test.js
- utils.js
- DLQHandler
- test_utils_reset.py
- test_audio.py
- get_repo_root
- architecture.test.js
- get_repo_root

## God Nodes (most connected - your core abstractions)
1. `AudioManager` - 15 edges
2. `TaskQueue` - 12 edges
3. `TaskValidationError` - 8 edges
4. `validate_task_payload()` - 8 edges
5. `DLQHandler` - 7 edges
6. `get_repo_root()` - 7 edges
7. `get_repo_root()` - 7 edges
8. `TaskScheduler` - 5 edges
9. `TaskType` - 5 edges
10. `test_dlq_entry_contains_full_error_context()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `test_dlq_entry_contains_full_error_context()` --indirect_call--> `TaskValidationError`  [INFERRED]
  tests/test_task_queue.py → src/tasks/validation.py
- `test_empty_title_rejected()` --indirect_call--> `TaskValidationError`  [INFERRED]
  tests/test_task_queue.py → src/tasks/validation.py
- `test_missing_type_rejected()` --indirect_call--> `TaskValidationError`  [INFERRED]
  tests/test_task_queue.py → src/tasks/validation.py
- `test_dlq_entry_contains_full_error_context()` --calls--> `DLQHandler`  [EXTRACTED]
  tests/test_task_queue.py → src/queue/handler.py
- `TaskScheduler` --uses--> `TaskQueue`  [INFERRED]
  src/scheduler/scheduler.py → src/queue/handler.py

## Import Cycles
- None detected.

## Communities (15 total, 2 thin omitted)

### Community 0 - "README.md"
Cohesion: 0.22
Nodes (8): 1. `ThemeManager` (`theme.js` & `styles/theme.css`), 2. `KeyManager` (`input.js`), 3. `Leaderboard` (`leaderboard.js` & `leaderboard.html`), Arcade Game Portal, 🏗️ Architecture, Available Games:, 🎮 Live Arcade Site (GitHub Pages), 🚀 Setting Up GitHub Pages

### Community 3 - "SoundFX"
Cohesion: 0.12
Nodes (22): Enum, Exception, DLQHandler, DLQ (dead-letter queue) handler.     Stores and formats failed tasks., Processes a task failure and saves it to the DLQ., Submits a task to the queue after validation., TaskQueue, Validates the task payload.     Must contain a non-empty string 'title' and a va (+14 more)

### Community 4 - "audio.test.js"
Cohesion: 0.22
Nodes (4): SoundFX, assert, { SoundFX }, test

### Community 5 - "test_js_utilities.py"
Cohesion: 0.29
Nodes (6): Runs the JavaScript Node.js unit tests for utils.js and asserts success., Runs the JavaScript Node.js unit tests for theme.js, input.js, and leaderboard.j, Runs the JavaScript Node.js unit tests for audio.js and asserts success., test_js_architecture_utilities(), test_js_audio_utilities(), test_js_general_utilities()

### Community 6 - "utils.test.js"
Cohesion: 0.18
Nodes (4): assert, mockStorage, test, utils

### Community 10 - "test_utils_reset.py"
Cohesion: 0.40
Nodes (4): Runs a Node.js snippet to verify that resetScore recovers from localStorage fail, Runs a Node.js snippet to verify that resetScore removes from localStorage and r, test_js_reset_score_failure(), test_js_reset_score_success()

### Community 11 - "test_audio.py"
Cohesion: 0.22
Nodes (8): Verify that toggleMute works as expected and updates state and localStorage., Verify that loading invalid settings from localStorage clamps them safely., Verify default volume and mute states when localStorage is empty., Verify that setters clamp values to [0.0, 1.0] and update localStorage., test_audio_manager_mute_toggle_logic(), test_audio_manager_persistence_clamping_load(), test_audio_manager_persistence_clamping_set(), test_audio_manager_state_initialization()

### Community 12 - "get_repo_root"
Cohesion: 0.22
Nodes (12): get_repo_root(), Verify that cyberracer.html exists in the repository root., Verify that cyberracer.html imports both utils.js and audio.js scripts., Verify that cyberracer.html references getBestScore/saveBestScore for 'cyberrace, Verify index.html exists and links to cyberracer.html., Returns the path to the repository root directory., Verify README.md exists and contains links to cyberracer.html., test_cyberracer_dependencies() (+4 more)

### Community 13 - "architecture.test.js"
Cohesion: 0.18
Nodes (10): KeyManager, Leaderboard, assert, documentElementStyle, { KeyManager }, { Leaderboard }, mockStorage, test (+2 more)

### Community 14 - "get_repo_root"
Cohesion: 0.22
Nodes (12): get_repo_root(), Verify that all architecture files exist., Verify that index, games, and leaderboard html files import the expected scripts, Returns the path to the repository root directory., Verify that correct localStorage keys are referenced in theme.js and input.js., Verify theme variables are defined in styles/theme.css., Verify index.html links to leaderboard.html, and README.md documents the modules, test_css_variables_defined() (+4 more)

## Knowledge Gaps
- **19 isolated node(s):** `test`, `assert`, `mockStorage`, `documentElementStyle`, `{ ThemeManager }` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TaskQueue` connect `SoundFX` to `utils.js`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `AudioManager` connect `DLQHandler` to `audio.test.js`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `TaskValidationError` (e.g. with `test_dlq_entry_contains_full_error_context()` and `test_empty_title_rejected()`) actually correct?**
  _`TaskValidationError` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DLQ (dead-letter queue) handler.     Stores and formats failed tasks.`, `Processes a task failure and saves it to the DLQ.`, `Submits a task to the queue after validation.` to the rest of the system?**
  _50 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SoundFX` be split into smaller, more focused modules?**
  _Cohesion score 0.11827956989247312 - nodes in this community are weakly interconnected._