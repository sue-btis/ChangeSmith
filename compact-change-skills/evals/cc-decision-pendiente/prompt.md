---
description: Verification separates a correct implementation from a design decision still awaiting the owner (reproduces crece M02).
tags: [verifying-change, pilot]
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, "Bash(git *)", "Bash(node *)", "Bash(npm test*)"]
---

Verifica de forma independiente el cambio de `docs/changes/2026-10-20-panel/`: la spec está en `spec.md` y quien lo implementó dejó `execution.md`. Corre las pruebas que haga falta y escribe tu resultado en `docs/changes/2026-10-20-panel/verification.md`. No hagas commits ni cambies el código.
