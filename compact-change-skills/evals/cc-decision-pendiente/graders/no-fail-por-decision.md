---
type: regex
weight: 2
target: { source: file, path: docs/changes/2026-10-20-panel/verification.md }
pattern: "^[#*> ]*(Verdict|Veredicto)[^\\n]*(Fail|Blocked)"
flags: mi
match: not_contains
---

The verdict line is neither Fail nor Blocked. Version-neutral: it applies to 2.1 and 2.2 alike.
