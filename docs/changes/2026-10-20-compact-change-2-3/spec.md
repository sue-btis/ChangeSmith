# compact-change-skills 2.3.0

Status: approved (Josue, 2026-10-20)
Size: medium · Profile: strict · Implementation effort: medium
Base: `development` @ f21e77d · Branch: `feat/compact-change-2-3/Josue`
Origin: `duma-sidon/docs/audits/2026-10-20-flujo-vs-practica.md` (F-2, F-3, B-1, E-1, V-1, V-2) and `2026-10-20-inventario-reglas.md` (H1–H3).

## Goal

Make the rules that the flow depends on enforceable or explicit:

- tests cannot be weakened silently;
- every spec says how done is proven end to end;
- commits and branches follow Josue's convention through plugin hooks;
- effort per stage is stated;
- correction loops are capped;
- pre-existing defects stop blocking a change.

## Evidence and Current Behavior

- There is no rule against deleting, skipping or weakening tests. A grep of `compact-change-skills/skills` and `~/.claude/agents` returns nothing.
- `spec-template.md` has `QA:` (quick) and a test table (large), but no end-to-end "done" check.
- The only hook is `~/.claude/hooks/presupuesto-comentarios.mjs`, wired from `~/.claude/settings.json`. The plugin has no `hooks/`.
- `verifying-change/SKILL.md §10` re-runs passes with no round cap. Findings are typed only `defect | decision` (`verification-template.md:51`).
- There is no effort guidance anywhere in the plugin.

## Scope

Included: `compact-change-skills/` (skills, references, hooks, tests, README, CHANGELOG, both plugin manifests).
Excluded:
- `~/.claude/agents/*.md` and `~/.claude/settings.json`: Josue's files, edited outside this repo;
- software-design-skills;
- duma-web and Data API repos.

## Requirements and Acceptance

| ID | Requirement | Acceptance |
|---|---|---|
| R1 | Implementation must not delete, skip, or weaken an existing test or assertion unless the spec records that decision. Verification inspects the test diff for this. | Rule present in `implementing-change` and `verifying-change`; an unrecorded weakening is a `defect`. |
| R2 | Every spec template (quick, medium, large) has a `Done when:` field. It names the command or walkthrough that proves the behavior end to end, or states why none applies. | Field present in all three templates; `writing-change-spec` requires it. |
| R3 | Plugin hook `hooks/presupuesto-comentarios.mjs` (moved unchanged from `~/.claude/hooks/`), PostToolUse `Edit|Write|MultiEdit|NotebookEdit`. | `hooks/hooks.json` wires it with `${CLAUDE_PLUGIN_ROOT}`; the script is byte-identical apart from its location. |
| R4 | Plugin hook `hooks/git-guard.mjs`, PreToolUse `Bash|PowerShell`. Decision per git command found in `tool_input.command` (split on `&&`, `\|\|`, `;`, newlines; honor `git -C <dir>` and a preceding `cd <dir>`). The strictest decision wins: deny over ask over none. | See R4 rules below; unit tests cover each rule. |
| R5 | Effort guidance: default `medium` everywhere. `implementer` moves to `high` only for a `critical` profile, concurrency or migration work, or the round after a `Fail`; it never goes higher. `reviewer` uses `high` for `critical` or `large` with frozen contracts. The spec records `Implementation effort:`. `verification.md` records the effort used. | Text in `shaping-change` or `change-sizing.md`, `implementing-change`, `verifying-change`, spec template, verification template. |
| R6 | At most 3 correction rounds. If the pass after Round 3 still has an open defect, the verifier records `Blocked` with "reconsider approach" and the change returns to spec or shaping. Follow-up passes read only the diff since the previous pass, and each finding names its bug class. | `verifying-change §10` and the template state it. |
| R7 | New finding type `pre-existing`: a defect present before the change's base. It is reported, but it does not block `Pass` and is not charged to the change. | Type listed in `verifying-change` and `verification-template.md`. |
| R8 | Version 2.3.0 in `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`; CHANGELOG entry; README lists the hooks and how to run their tests. | Present. |
| R9 | `tests/pressure-scenarios.md` gains scenarios for R1, R2, R6, R7. | Present. |

### R4 rules for `git-guard`

- `git commit` on `main`, `master` or `development`: **deny**. Commits belong on `<type>/<description>/<Name>` branches.
- `git commit` elsewhere: **ask**, because Josue confirms each commit. This includes a repo with no commits yet, where the branch cannot be resolved.
- `git push`: **ask**.
- `git merge <ref>` while on `main` or `master`, when `<ref>` is not `development` or `origin/development`: **deny**.
- Creating a branch must match `^(feat|fix|docs|refactor|chore|test)/[a-z0-9]+(-[a-z0-9]+)*/[A-Za-z][A-Za-z0-9]*$`, otherwise **deny**. Creation forms:
  - `git switch -c|-C <name>`;
  - `git checkout -b|-B <name>`;
  - `git branch <name> [<start>]`;
  - `git branch -c|-C|-m|-M [<old>] <new>`, which validates the new name. This decision of Round 1 replaces the earlier no-op test for `git branch -m x`;
  - `git switch --create|--force-create|--orphan <name>` and `git checkout --orphan <name>`;
  - every other `git branch` flag (`--merged`, `--contains`, `-u`, `-d`, `--list`, …) is a query or a deletion and gets no decision.
  - `git worktree add ... -b|-B <name>`.
- Anything else: no output, exit 0.
- Output: the JSON `hookSpecificOutput` with `hookEventName: "PreToolUse"`, `permissionDecision` and `permissionDecisionReason`, per <https://code.claude.com/docs/en/hooks>.
- The decision logic is a pure exported function. Unit tests use `node --test <file>.test.mjs`, as `check-package.mjs` does.
- If the hook itself fails to parse its input, it exits 0 silently and never blocks on its own bug.

## Decisions and Assumptions

- Subagents stay in `~/.claude/agents`. Their `effort:` frontmatter is set there, outside this repo.
- The commit hook asks and does not block.
- Repo-specific overrides of the branch rule are not supported. If one is ever needed, it gets added then.
- Assumption: Codex does not run Claude plugin hooks. In Codex, the hooks' rules remain text in the skills. Not verified.
- Effect only after Josue re-uploads the plugin: `settings.json` loads it from `local-desktop-app-uploads`. Then `~/.claude/settings.json` must drop its own comment-hook entry so the hook does not run twice.

## Done when

- `node --test compact-change-skills/hooks/*.test.mjs` passes.
- Piping a sample PreToolUse JSON for each R4 rule into `node compact-change-skills/hooks/git-guard.mjs` prints the expected decision.
- Grep shows R1, R2 and R5–R7 text in the named files.

## Stop Conditions

- The hook output schema differs from the cited docs.
- A rule conflicts with an existing 2.2 rule.
