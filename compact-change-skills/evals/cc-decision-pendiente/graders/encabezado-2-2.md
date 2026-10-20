---
type: regex
weight: 1
target: { source: file, path: docs/changes/2026-10-20-panel/verification.md }
pattern: "^Verdict: Pass\\s*\\n+Acceptance: Pending"
flags: m
---

The fixed 2.2 header: a plain Pass verdict followed by a pending acceptance. Version 2.1 has no such header, so this grader is expected to fail there.
