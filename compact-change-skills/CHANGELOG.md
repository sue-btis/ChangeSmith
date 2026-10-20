# Changelog

## 2.1.0

- Added optional discovery of a canonical design manifest and authoritative product/architecture/API/data/UX artifacts.
- Change specs now declare canonical artifacts affected by the requested change.
- Implementation preflight checks whether governing canonical artifacts conflict with the frozen change spec.
- Verification now checks code-to-canonical-design synchronization when those artifacts apply.
- `implementing-change` and `verifying-change` may execute/verify a single approved greenfield build slice produced by `software-design-skills`, avoiding duplicated execution skills.
- Preserved all quick/medium/large/escalate routing and the compact artifact model from 2.0.

## 2.0.0

- Added first-class `large` change routing instead of automatically delegating all large changes to an external workflow.
- Added `auditing-change` for persistent focused repository evidence on large work.
- Added `implementing-change` so implementation and final verification are separate responsibilities.
- Expanded `writing-change-spec` with large-change provenance, stable `REQ-*` / `AC-*` / `TST-*` traceability, frozen decisions, and in-place self-review.
- Expanded `writing-change-plan` with dependency graphs, optional Gate 0, execution topology, exact write-set ownership, generated/migration/project/lockfile ownership, waves, integration gates, and sequential fallback.
- Added mandatory pre-implementation staleness/overlap preflight inside `implementing-change` instead of creating a separate sanity-check artifact.
- Strengthened `verifying-change` as an independent audit of the declared diff range rather than a continuation of implementation self-report.
- Added explicit context-control and artifact-authority rules to keep large workflows bounded.
- Preserved the compact artifact model by hardening `spec.md` in place instead of producing separate draft/review/freeze documents.
- Added human-friendly Claude aliases for audit and implementation.


## 1.2.0

- Added Claude Code human-friendly aliases: `shape-software-change`, `write-change-spec`, `write-change-plan`, and `verify-software-change`.
- Added the exact Codex display labels to each canonical skill description so Claude can match requests such as `Shape Software Change` and `Verify Software Change` implicitly.
- Preserved the canonical cross-host skill IDs (`shaping-change`, `writing-change-spec`, `writing-change-plan`, `verifying-change`) to avoid breaking Codex compatibility.
- Declared the Claude `commands/` directory explicitly and documented short, namespaced, and natural-language invocation forms.
- Bumped both plugin manifests to version `1.2.0` so Claude Code does not retain the cached `1.1.0` package.

## 1.1.0

- Added Claude Code support with `.claude-plugin/plugin.json`.
- Kept the shared `skills/<name>/SKILL.md` layout for both Claude Code and Codex.
- Replaced runtime-specific cross-skill references inside skill instructions with portable skill names.
- Added Claude Code local testing, personal installation, invocation, reload, and disable instructions.

## 1.0.0

- Packaged the four skills as a Codex plugin with `.codex-plugin/plugin.json`.
- Added `agents/openai.yaml` UI metadata for every skill.
- Replaced the 12-stage workflow with four composable skills.
- Added quick, medium, and escalate routing with risk-first classification.
- Made clarification conditional and retained an autonomous fallback protocol.
- Reduced normal artifacts to a spec, an optional plan, and verification evidence.
- Added lean, strict, and critical reliability profiles.
- Scoped coverage and mutation testing to changed, risk-relevant logic.
- Added pressure scenarios for proportionality and safety.