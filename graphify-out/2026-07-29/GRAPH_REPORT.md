# Graph Report - test-repo  (2026-07-29)

## Corpus Check
- 8 files · ~40,714 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 39 nodes · 38 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0a764e96`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- README.md
- SoundFX
- audio.test.js
- test_js_utilities.py
- utils.test.js

## God Nodes (most connected - your core abstractions)
1. `SoundFX` - 8 edges
2. `Arcade Game Portal` - 3 edges
3. `test_js_audio_utilities()` - 2 edges
4. `test_js_general_utilities()` - 2 edges
5. `🎮 Live Arcade Site (GitHub Pages)` - 2 edges
6. `test` - 1 edges
7. `assert` - 1 edges
8. `{ SoundFX }` - 1 edges
9. `Runs the JavaScript Node.js unit tests for audio.js and asserts success.` - 1 edges
10. `Runs the JavaScript Node.js unit tests for utils.js and asserts success.` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (8 total, 1 thin omitted)

### Community 0 - "README.md"
Cohesion: 0.40
Nodes (4): Arcade Game Portal, Available Games:, 🎮 Live Arcade Site (GitHub Pages), 🚀 Setting Up GitHub Pages

### Community 4 - "audio.test.js"
Cohesion: 0.22
Nodes (3): assert, { SoundFX }, test

### Community 5 - "test_js_utilities.py"
Cohesion: 0.40
Nodes (4): Runs the JavaScript Node.js unit tests for utils.js and asserts success., Runs the JavaScript Node.js unit tests for audio.js and asserts success., test_js_audio_utilities(), test_js_general_utilities()

### Community 6 - "utils.test.js"
Cohesion: 0.40
Nodes (4): assert, mockStorage, test, utils

## Knowledge Gaps
- **9 isolated node(s):** `test`, `assert`, `{ SoundFX }`, `test`, `assert` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SoundFX` connect `SoundFX` to `audio.test.js`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **What connects `test`, `assert`, `{ SoundFX }` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._