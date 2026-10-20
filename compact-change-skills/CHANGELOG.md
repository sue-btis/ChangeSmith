# Changelog

## 2.2.0

- Size (`quick`/`medium`/`large`) now picks the spec template only. `audit.md`, `plan.md`, and `execution.md` each have their own trigger in `change-sizing.md`.
- `large` requires at least two structural criteria (parallel writers, contract frozen before parallel work, staged migration/rollout), one of them recorded in `plan.md`.
- `audit.md` is created for every `strict` or `critical` change, and for a `lean` change when shaping cannot establish three evidence facts: entry point, covering tests, and consumers of each altered contract with the search command used. Basis: 56 of 61 past audits found something that changed the spec, and every audit of a critical change found a permission, tenant, or contract issue.
- Verdicts are `Pass`, `Fail`, or `Blocked`. `Pass with accepted limitations` is removed. Findings are typed `defect` or `decision`. A pending decision never yields `Fail`: one that changes required behavior yields `Blocked`, and any other leaves `Pass` with `Acceptance: Pending`.
- New fixed header in `verification.md` (`Verdict`, `Acceptance`, `Verified by`, `Open limitations`) holds the current state of a change; one documented `grep` lists the state of every change.
- User acceptance is recorded separately from the verdict, with a verbatim quote, only by the session that received it.
- Defined correction rounds (`execution.md`) and follow-up passes in the same `verification.md`, plus the closing rule.
- Self-verification is allowed by default only for `quick` + `lean`, otherwise only when the user asks; it is labeled with the checks rerun.
- Coverage and mutation thresholds are reference targets unless the repository has the tool; added a manual mutation protocol.
- Removed the duplicate verification template from `reliability-profiles.md`.
- Specs gain evidence facts, triggered artifacts, an "Other Repositories" section, and `Parent:` for amendments. IDs are local to the change folder.
- Implementation records the full preflight once and deltas afterwards, supports a baseline without version control, and in build-slice mode checks that the slice is complete before editing.
- The verifier never edits canonical design artifacts or the manifest.

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