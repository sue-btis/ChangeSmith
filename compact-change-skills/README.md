# Compact Change Skills

Plugin to shape, specify, plan, implement and verify software changes, from small fixes to large but bounded changes.

Compatible with **OpenAI Codex** and **Claude Code**. The `SKILL.md` files are in English for portability across agents and runtimes; artifacts can be written in the user's language. Release notes are in [CHANGELOG.md](./CHANGELOG.md).

It works on its own in any repository. When the repository has a design package from `software-design-skills`, it respects that too.

## Flow

```text
shaping-change ── size, reliability and artifact triggers
   │
   ├─ [auditing-change]      always for strict and critical; for lean when an evidence fact is missing
   ├─ writing-change-spec    always
   ├─ [writing-change-plan]  when writers run in parallel or a migration lands in stages
   ├─ implementing-change    always; execution.md when there is a handoff
   └─ verifying-change       always
         ├─ Fail or Blocked → correction round → follow-up pass
         └─ Pass → user acceptance → closed

escalate → stop and report why the change cannot be bounded safely
```

Committing is outside the flow: the user decides and does it.

## Classification

Size, artifacts and reliability are independent decisions. The detail is in `skills/shaping-change/references/change-sizing.md`.

### Size

- `quick`: one observable behavior, one area, no contract, migration or trust-boundary change; one writer in one sitting.
- `medium`: every bounded change that is neither quick nor large. A broad change by a single writer working in sequence is medium.
- `large`: at least two structural criteria: several writers at the same time, a contract frozen before parallel work, or a migration or rollout in stages.
- `escalate`: the work cannot be bounded safely by evidence, ownership, repository, decisions or risk.

### Artifacts

| Artifact | When it is created |
|---|---|
| `spec.md` | Always |
| `verification.md` | Always |
| `audit.md` | Always for `strict` and `critical`. For `lean`, only if shaping cannot establish with evidence the entry point, the tests that cover it, or the consumers of each contract that changes |
| `plan.md` | When several writers work at the same time, or an ordered migration or rollout spans sessions |
| `execution.md` | When there is a handoff: another tool or session verifies, implementation continues in another session, or waves hand their work to an integrator |

### Reliability

- `lean`: low risk.
- `strict`: shared contracts, relevant regressions or non-trivial business logic.
- `critical`: authorization, money, sensitive data, destructive operations, concurrency or critical invariants.

A change can be `quick + critical` or `large + strict`.

## Change folder

If the repository already has a convention, it is followed. In new repositories:

```text
docs/changes/YYYY-MM-DD-<slug>/          standalone change
docs/changes/YYYY-MM-DD-Mxx-<slug>/      milestone of a design plan
```

- An amendment to an already implemented change is a new folder whose spec names the earlier one as `Parent:`.
- IDs are local to the folder and cited as `<folder>#AC-1`.
- No separate copies of draft, review, freeze or sanity check are produced. Review hardens the same `spec.md`; the preflight and the rounds update the same `execution.md`.

## Change status

The current status lives in the first lines of `verification.md`:

```text
Verdict: Pass | Fail | Blocked
Acceptance: Pending — <what it waits for> | Accepted — <who>, <date>, «verbatim quote»
Verified by: <other session or agent> | Self-verification (<reason>)
Open limitations: L-1, L-2 | None
```

The status of every change in the repository:

```bash
grep -H -m4 -E '^(Verdict|Acceptance|Verified by|Open limitations):' docs/changes/*/verification.md
```

If the repository keeps its changes in another folder, change `docs/changes` in the command. Each worktree shows the status of its own branch. Folders verified before 2.2 have another format; the command to read them is in `skills/verifying-change/references/verification-template.md`.

A change is closed when the verdict is `Pass`, every finding is fixed or accepted, and the acceptance is recorded. Only the session where the user gave it writes the acceptance, with their verbatim quote.

## Integration with software-design-skills

If the repository contains a canonical design manifest (by default `docs/spec/manifest.yaml`, or an equivalent path found by inspection), treat it as an index of authorities, not as a copy of content.

For brownfield changes:

```text
manifest -> canonical sources -> audit/spec -> plan -> implement -> verify
```

`spec.md` declares which canonical sources are affected and whether they must be updated. Closing requires that code and the applicable canonical sources are aligned again. Implementation updates those sources; verification reviews them and never edits the manifest.

For the initial build of a system designed with `software-design-skills`, `implementing-change` can be invoked directly on **a single approved build slice**, followed by `verifying-change`. The preflight first checks that the slice is complete: no open decisions, and contracts, UI compositions and acceptance criteria approved. If something is missing, the work goes to `writing-change-spec` to freeze it.

## Context authority

Each phase consumes the minimum necessary package.

| Moment | Authoritative source |
|---|---|
| Before auditing | request + `shaping-change` result |
| After auditing | `audit.md` for repository facts |
| Before implementing | `spec.md` for behavior and contracts |
| During planned execution | `spec.md` + `plan.md` |
| Before declaring done | actual diff + `spec.md` + reproducible evidence |
| Current change status | `verification.md` header |

Do not pass full histories to implementation agents. For a workstream, use only the frozen spec, the relevant plan section and the allowed paths.

## Skills

- `shaping-change`: initial inspection, size and reliability classification, artifact triggers and audit of decisions.
- `auditing-change`: persistent read-only audit, always for `strict` and `critical` and for `lean` when an evidence fact is missing, with baseline, behavior trace, contracts, consumers, commands, candidate ownership and hotspots.
- `writing-change-spec`: proportional specification with evidence facts, stable IDs, provenance, frozen contracts and a self-review before it is marked approved.
- `writing-change-plan`: plan when writers run in parallel or a migration lands in stages. For large changes it adds dependencies, optional Gate 0, topology, write-set ownership, waves, integration gates and a sequential fallback.
- `implementing-change`: preflight against the current repository, controlled execution by workstream/wave, write boundaries, tests, correction rounds and an evidence record.
- `verifying-change`: independent verification based on the actual diff and spec traceability, with typed findings, a technical verdict, user acceptance and follow-up passes.

## Invocation

### Claude Code

```text
/shape-software-change
/audit-software-change
/write-change-spec
/write-change-plan
/implement-software-change
/verify-software-change
```

Canonical form:

```text
/compact-change-skills:shaping-change
/compact-change-skills:auditing-change
/compact-change-skills:writing-change-spec
/compact-change-skills:writing-change-plan
/compact-change-skills:implementing-change
/compact-change-skills:verifying-change
```

### OpenAI Codex

```text
Use $shaping-change for this request. Inspect the repository and choose the smallest safe workflow.
```

For a change whose audit and plan are already decided:

```text
Use $auditing-change, then $writing-change-spec and $writing-change-plan. Keep the implementation context bounded to the frozen spec and the assigned workstream.
```

To execute:

```text
Use $implementing-change. Run the preflight first and stop if the plan is stale or the write set overlaps unrelated work.
```

To close:

```text
Use $verifying-change in independent audit mode. Inspect the declared diff range and verify every applicable requirement and acceptance criterion.
```

## Hooks (Claude Code only, opt-in)

The plugin ships three hooks. **They do nothing until you enable them** with environment variables, which you can set in your shell or in the `env` block of Claude Code's `settings.json`. Codex ignores hooks.

### `git-guard` (PreToolUse on Bash and PowerShell)

| Variable | Meaning |
|---|---|
| `CHANGESMITH_GIT_GUARD` | `1` turns the guard on. Without it nothing below applies. |
| `CHANGESMITH_GIT_GUARD_PROTECTED` | Comma-separated branches where `git commit` is denied. |
| `CHANGESMITH_GIT_GUARD_BRANCH_PATTERN` | JavaScript regular expression every newly created branch name must match (`switch -c`, `checkout -b`, `branch`, `worktree add -b`, …). An invalid pattern is ignored. |
| `CHANGESMITH_GIT_GUARD_ASK` | Comma-separated subset of `commit,push`: those commands ask for confirmation. |
| `CHANGESMITH_GIT_GUARD_MERGE_ONLY` | Comma-separated `target:source` pairs: a merge into `target` is denied unless every merged ref is `source` or `origin/source`. |

The guard fails open: any parse or git error lets the command through.

Example that protects `main`/`master`/`development`, requires names like `feat/some-change/Alex`, asks before every commit and push, and lets only `development` merge into `main`/`master`:

```text
CHANGESMITH_GIT_GUARD=1
CHANGESMITH_GIT_GUARD_PROTECTED=main,master,development
CHANGESMITH_GIT_GUARD_BRANCH_PATTERN=^(feat|fix|docs|refactor|chore|test)/[a-z0-9]+(-[a-z0-9]+)*/[A-Za-z][A-Za-z0-9]*$
CHANGESMITH_GIT_GUARD_ASK=commit,push
CHANGESMITH_GIT_GUARD_MERGE_ONLY=main:development,master:development
```

### `config-guard` (PreToolUse on Edit, Write and MultiEdit)

Set `CHANGESMITH_CONFIG_GUARD=1` to ask for confirmation before the agent edits an existing lint, format or type-check config (`eslint`, `prettier`, `biome`, `ruff`, `tsconfig*.json`, `analysis_options.yaml`, `.editorconfig` and similar; the full list is the regular expression in `hooks/config-guard.mjs`). The point is that loosening a rule must be a decision, not the way a red check turns green. Creating a new config file is not asked about, and neither is `package.json` or `pyproject.toml`, which mix config with everything else. A shell command that rewrites the file (`sed -i`) is not seen. Like `git-guard`, it fails open.

### `comment-budget` (PostToolUse after edits)

Set `CHANGESMITH_COMMENT_BUDGET=1` to flag untagged doc blocks over 40 words and section-header banners in edited source files. Tagged docs (`@param`, `<summary>`, `Args:`) are never flagged. Exempt a file with `comment-budget: exempt — <reason>` in its first five lines (the older `presupuesto-comentarios: exento` spelling is still accepted). Audit a directory with `node hooks/comment-budget.mjs --calibrate <dir>`. Measured basis: [hooks/comment-budget.md](./hooks/comment-budget.md).

Tests: `node --test hooks/*.test.mjs`.

## Principles

- Do not make a small change big.
- Do not make a big change small.
- Each artifact earns its place with its trigger, not with size.
- Ask only about decisions that change correctness, scope, contract, security, rollout or testability.
- Resolve by inspection everything the repository can answer.
- Recommendations are not approvals.
- Do not let an implementation agent invent architecture or contracts.
- No writer writes outside its write set.
- Generated files, migrations, project files and lockfiles always have an explicit owner when they may change.
- The integration owner reviews the actual diff and runs the combined checks.
- Do not declare `Pass` using only the implementing agent's report.
- A verdict says whether there are defects; acceptance says what the user accepted.
