# Graph Report - test-repo  (2026-07-29)

## Corpus Check
- 19 files · ~47,003 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 114 nodes · 151 edges · 13 communities (12 shown, 1 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3fdf6bf`
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

## God Nodes (most connected - your core abstractions)
1. `AudioManager` - 15 edges
2. `TaskQueue` - 12 edges
3. `TaskValidationError` - 8 edges
4. `validate_task_payload()` - 8 edges
5. `DLQHandler` - 7 edges
6. `get_repo_root()` - 7 edges
7. `TaskScheduler` - 5 edges
8. `TaskType` - 5 edges
9. `test_dlq_entry_contains_full_error_context()` - 5 edges
10. `test_empty_title_rejected()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `test_dlq_entry_contains_full_error_context()` --indirect_call--> `TaskValidationError`  [INFERRED]
  tests/test_task_queue.py → src/tasks/validation.py
- `test_empty_title_rejected()` --calls--> `TaskQueue`  [EXTRACTED]
  tests/test_task_queue.py → src/queue/handler.py
- `test_missing_type_rejected()` --calls--> `TaskQueue`  [EXTRACTED]
  tests/test_task_queue.py → src/queue/handler.py
- `test_empty_title_rejected()` --indirect_call--> `TaskValidationError`  [INFERRED]
  tests/test_task_queue.py → src/tasks/validation.py
- `test_missing_type_rejected()` --indirect_call--> `TaskValidationError`  [INFERRED]
  tests/test_task_queue.py → src/tasks/validation.py

## Import Cycles
- None detected.

## Communities (13 total, 1 thin omitted)

### Community 0 - "README.md"
Cohesion: 0.40
Nodes (4): Arcade Game Portal, Available Games:, 🎮 Live Arcade Site (GitHub Pages), 🚀 Setting Up GitHub Pages

### Community 3 - "SoundFX"
Cohesion: 0.22
Nodes (13): Enum, Exception, Validates the task payload.     Must contain a non-empty string 'title' and a va, Returns a sanitized copy of the payload with potential secrets/credentials redac, sanitize_payload(), TaskType, TaskValidationError, validate_task_payload() (+5 more)

### Community 4 - "audio.test.js"
Cohesion: 0.22
Nodes (4): SoundFX, assert, { SoundFX }, test

### Community 5 - "test_js_utilities.py"
Cohesion: 0.40
Nodes (4): Runs the JavaScript Node.js unit tests for utils.js and asserts success., Runs the JavaScript Node.js unit tests for audio.js and asserts success., test_js_audio_utilities(), test_js_general_utilities()

### Community 6 - "utils.test.js"
Cohesion: 0.18
Nodes (4): assert, mockStorage, test, utils

### Community 7 - "utils.js"
Cohesion: 0.13
Nodes (11): DLQHandler, DLQ (dead-letter queue) handler.     Stores and formats failed tasks., Processes a task failure and saves it to the DLQ., Submits a task to the queue after validation., TaskQueue, Schedules a task by submitting it to the queue., TaskScheduler, (c) valid submission passes through (+3 more)

### Community 10 - "test_utils_reset.py"
Cohesion: 0.40
Nodes (4): Runs a Node.js snippet to verify that resetScore recovers from localStorage fail, Runs a Node.js snippet to verify that resetScore removes from localStorage and r, test_js_reset_score_failure(), test_js_reset_score_success()

### Community 11 - "test_audio.py"
Cohesion: 0.22
Nodes (8): Verify that toggleMute works as expected and updates state and localStorage., Verify that loading invalid settings from localStorage clamps them safely., Verify default volume and mute states when localStorage is empty., Verify that setters clamp values to [0.0, 1.0] and update localStorage., test_audio_manager_mute_toggle_logic(), test_audio_manager_persistence_clamping_load(), test_audio_manager_persistence_clamping_set(), test_audio_manager_state_initialization()

### Community 12 - "get_repo_root"
Cohesion: 0.22
Nodes (12): get_repo_root(), Verify that cyberracer.html exists in the repository root., Verify that cyberracer.html imports both utils.js and audio.js scripts., Verify that cyberracer.html references getBestScore/saveBestScore for 'cyberrace, Verify index.html exists and links to cyberracer.html., Returns the path to the repository root directory., Verify README.md exists and contains links to cyberracer.html., test_cyberracer_dependencies() (+4 more)

## Knowledge Gaps
- **9 isolated node(s):** `test`, `assert`, `{ SoundFX }`, `test`, `assert` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TaskQueue` connect `utils.js` to `SoundFX`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `AudioManager` connect `DLQHandler` to `audio.test.js`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `DLQHandler` connect `utils.js` to `SoundFX`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `TaskValidationError` (e.g. with `test_dlq_entry_contains_full_error_context()` and `test_empty_title_rejected()`) actually correct?**
  _`TaskValidationError` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DLQ (dead-letter queue) handler.     Stores and formats failed tasks.`, `Processes a task failure and saves it to the DLQ.`, `Submits a task to the queue after validation.` to the rest of the system?**
  _33 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `utils.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._