# Graph Report - test-repo  (2026-07-29)

## Corpus Check
- 16 files · ~41,728 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 77 nodes · 103 edges · 10 communities
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ee85b4bb`
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

## God Nodes (most connected - your core abstractions)
1. `TaskQueue` - 12 edges
2. `SoundFX` - 8 edges
3. `TaskValidationError` - 8 edges
4. `validate_task_payload()` - 8 edges
5. `DLQHandler` - 7 edges
6. `TaskScheduler` - 5 edges
7. `TaskType` - 5 edges
8. `test_dlq_entry_contains_full_error_context()` - 5 edges
9. `test_empty_title_rejected()` - 4 edges
10. `test_missing_type_rejected()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `test_dlq_entry_contains_full_error_context()` --indirect_call--> `TaskValidationError`  [INFERRED]
  tests/test_task_queue.py → src/tasks/validation.py
- `test_dlq_entry_contains_full_error_context()` --calls--> `TaskQueue`  [EXTRACTED]
  tests/test_task_queue.py → src/queue/handler.py
- `test_empty_title_rejected()` --calls--> `TaskQueue`  [EXTRACTED]
  tests/test_task_queue.py → src/queue/handler.py
- `test_missing_type_rejected()` --calls--> `TaskQueue`  [EXTRACTED]
  tests/test_task_queue.py → src/queue/handler.py
- `test_empty_title_rejected()` --indirect_call--> `TaskValidationError`  [INFERRED]
  tests/test_task_queue.py → src/tasks/validation.py

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "README.md"
Cohesion: 0.40
Nodes (4): Arcade Game Portal, Available Games:, 🎮 Live Arcade Site (GitHub Pages), 🚀 Setting Up GitHub Pages

### Community 3 - "SoundFX"
Cohesion: 0.22
Nodes (13): Enum, Exception, Validates the task payload.     Must contain a non-empty string 'title' and a va, Returns a sanitized copy of the payload with potential secrets/credentials redac, sanitize_payload(), TaskType, TaskValidationError, validate_task_payload() (+5 more)

### Community 4 - "audio.test.js"
Cohesion: 0.17
Nodes (4): SoundFX, assert, { SoundFX }, test

### Community 5 - "test_js_utilities.py"
Cohesion: 0.40
Nodes (4): Runs the JavaScript Node.js unit tests for utils.js and asserts success., Runs the JavaScript Node.js unit tests for audio.js and asserts success., test_js_audio_utilities(), test_js_general_utilities()

### Community 6 - "utils.test.js"
Cohesion: 0.20
Nodes (4): assert, mockStorage, test, utils

### Community 7 - "utils.js"
Cohesion: 0.24
Nodes (5): TaskQueue, Schedules a task by submitting it to the queue., TaskScheduler, (c) valid submission passes through, test_valid_submission_passes_through()

### Community 8 - "DLQHandler"
Cohesion: 0.22
Nodes (6): DLQHandler, DLQ (dead-letter queue) handler.     Stores and formats failed tasks., Processes a task failure and saves it to the DLQ., Submits a task to the queue after validation., (d) DLQ entry contains full error context (original error message, stack trace,, test_dlq_entry_contains_full_error_context()

## Knowledge Gaps
- **9 isolated node(s):** `test`, `assert`, `{ SoundFX }`, `test`, `assert` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TaskQueue` connect `utils.js` to `DLQHandler`, `SoundFX`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `DLQHandler` connect `DLQHandler` to `SoundFX`, `utils.js`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `validate_task_payload()` connect `SoundFX` to `DLQHandler`, `utils.js`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `TaskValidationError` (e.g. with `test_dlq_entry_contains_full_error_context()` and `test_empty_title_rejected()`) actually correct?**
  _`TaskValidationError` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DLQ (dead-letter queue) handler.     Stores and formats failed tasks.`, `Processes a task failure and saves it to the DLQ.`, `Submits a task to the queue after validation.` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._