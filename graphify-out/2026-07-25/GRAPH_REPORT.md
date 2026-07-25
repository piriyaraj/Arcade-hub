# Graph Report - test-repo  (2026-07-25)

## Corpus Check
- 4 files · ~8,879 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 16 nodes · 16 edges · 4 communities (3 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `613a55dd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- README.md
- SoundFX

## God Nodes (most connected - your core abstractions)
1. `SoundFX` - 7 edges
2. `Arcade Game Portal` - 3 edges
3. `🎮 Live Arcade Site (GitHub Pages)` - 2 edges
4. `Available Games:` - 1 edges
5. `🚀 Setting Up GitHub Pages` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (4 total, 1 thin omitted)

### Community 0 - "README.md"
Cohesion: 0.40
Nodes (4): Arcade Game Portal, Available Games:, 🎮 Live Arcade Site (GitHub Pages), 🚀 Setting Up GitHub Pages

## Knowledge Gaps
- **2 isolated node(s):** `Available Games:`, `🚀 Setting Up GitHub Pages`
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `Available Games:`, `🚀 Setting Up GitHub Pages` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._