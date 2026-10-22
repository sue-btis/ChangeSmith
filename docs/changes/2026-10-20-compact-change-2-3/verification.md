# compact-change-skills 2.3.0 Verification

Verdict: Pass
Acceptance: Pending — Josue confirms 2.3 in real use; the hooks take effect only after the plugin is re-uploaded and the comment-hook entry is removed from `~/.claude/settings.json`
Verified by: reviewer subagent (medium)
Open limitations: None

Size: medium
Reliability: strict

## Pass History
- Pass 1 (2026-10-20): Fail — F-1 to F-6 open; F-7 decision.
- Pass 2 (2026-10-20): Pass — F-1 to F-6 fixed in Round 1; F-7 settled in `verifying-change §11`; 18/18 hook tests; 44 end-to-end cases, 43 as expected plus note N-1.

## Baseline
| Field | Value |
|---|---|
| Repository | `<repo>` |
| Declared base | `development` @ f21e77d (HEAD is the same commit; nothing committed) |
| Verified head / working tree | branch `feat/compact-change-2-3/Josue`; 11 modified files and 2 untracked dirs |
| Untracked before edits | none recorded |
| Diff range | `git diff development` + `git ls-files --others --exclude-standard` (`compact-change-skills/hooks/*`, `docs/changes/2026-10-20-compact-change-2-3/`) |
| Verification date | 2026-10-20 |

## Deviations
- Round 1 recorded a decision in spec R4: `git branch -c|-C|-m|-M` validates the new name. It replaces the earlier no-op test for `git branch -m x`.
- Spec R5 and R6 were reworded to the single round-cap rule.

## Correction Rounds
- Round 1: F-1 to F-6 and the Pass 1 notes. Files: `hooks/git-guard.mjs`, `hooks/git-guard.test.mjs` (12 → 18 tests), `implementing-change §8`, `verifying-change §8/§10/§11`, `verification-template.md`, `CHANGELOG.md`, `pressure-scenarios.md §27`, spec R4–R6, root `README.md`.

## Findings
| ID | Type | Finding | Evidence | Status |
|---|---|---|---|---|
| F-1 | defect | Option-value parsing: the allowed merge into `main` is denied whenever the command has a value-taking option. | `hooks/git-guard.mjs:74-75` treats every arg that does not start with `-` as a ref. On `main`, `git merge --no-ff -m "Merge development" development` and `git merge -X theirs development` are both denied. | Fixed (Round 1) |
| F-2 | defect | False branch creation: read-only `git branch` queries are denied. | `hooks/git-guard.mjs:9,60`. `--merged main`, `--no-merged development`, `--contains abc123` and `-u origin/main` are denied. `branch -c main mi-copia` validates the source branch instead of the new one. | Fixed (Round 1) |
| F-3 | defect | Path resolution: the target directory of `cd <dir>` and `git -C <dir>` resolves wrongly when the path is a double-quoted Windows path or a Git Bash `/c/...` path. | (a) `git-guard.mjs:23` treats every `\` inside double quotes as an escape. (b) `git-guard.mjs:91,96` resolves `/c/...` to `C:\c\...`. A merge into `main` gets no decision, and a commit on `main` gets `ask` instead of `deny`. | Fixed (Round 1) |
| F-4 | defect | Rule conflict: the new `Blocked` reason "reconsider approach" contradicts existing 2.2 rules. | The `Blocked` definition in `verifying-change` does not include that case. `implementing-change §8` says to fix the blocker after any `Blocked`, which conflicts with the new stop rule. | Fixed (Round 1) |
| F-5 | defect | Round counting: the three-round cap is counted differently in different files. | `implementing-change:147`, `CHANGELOG.md:8` and `pressure-scenarios.md:221` say "third `Fail`"; `verifying-change:148` says "third round still ends in `Fail`". The verifier has no rule matching "second `Fail` at `high`". | Fixed (Round 1) |
| F-6 | defect | R6 acceptance gap: the template does not state the round cap. | `verification-template.md` has no cap and no `reconsider approach`. | Fixed (Round 1) |
| F-7 | decision | Closing a change: one with a `pre-existing` finding cannot be closed without the user accepting it. | `verifying-change` Closed rule and `implementing-change:149`. | Accepted: `pre-existing` findings stay recorded and do not block Closed |

Non-blocking notes:
- Pass 1 notes (`--create`, `--force-create`, `--orphan`, env prefix, `git.exe`, root README) fixed in Round 1.
- N-1: creation names written as an attached value (`--create=name`, `-bname`) get no decision.
- N-2: `cd ~`, `cd -`, `pushd` and `Set-Location` are not resolved; a protected-branch commit through them asks instead of denying.

## Requirement Compliance
| Requirement / AC | Implementation Evidence | Independent Check | Result |
|---|---|---|---|
| R1 | `implementing-change/SKILL.md:72`; `verifying-change/SKILL.md:59` | read + grep | Pass |
| R2 | `spec-template.md:48,115,216`; `writing-change-spec/SKILL.md:116` | read + grep | Pass |
| R3 | `hooks/hooks.json` exec form | `cmp` shows the file identical to `~/.claude/hooks/presupuesto-comentarios.mjs` | Pass |
| R4 | `hooks/git-guard.mjs`, `git-guard.test.mjs` (18 tests) | unit tests + 44 end-to-end cases | Pass (notes N-1, N-2) |
| R5 | `change-sizing.md`, `implementing-change`, `verifying-change`, both templates | grep | Pass |
| R6 | `verifying-change §10`, `verification-template.md`, `implementing-change §8` | read | Pass |
| R7 | `verifying-change`, `verification-template.md` | read | Pass |
| R8 | both `plugin.json` at 2.3.0, CHANGELOG, README | diff | Pass |
| R9 | `pressure-scenarios.md` §25–29 | read | Pass |

## Automated Checks
| Command / Check | Result | Covers | Evidence / Notes |
|---|---|---|---|
| `node --test compact-change-skills/hooks/*.test.mjs` (Node v24.14.0) | 18/18 pass (Pass 2) | R4 | Covers merge option values, branch queries, copy and move, long and orphan forms, env prefix, `git.exe`, quoted Windows paths and Git Bash paths |
| `cmp hooks/presupuesto-comentarios.mjs ~/.claude/hooks/presupuesto-comentarios.mjs` | identical | R3 | |
| PreToolUse JSON piped into `node git-guard.mjs` against throwaway repos | exit 0 in every case | R4 end to end | Cases that pass: protected-branch commit is denied, push asks, invalid branch names are denied, and malformed input exits silently |

## What could not be verified
- The live hook firing inside Claude Code. The plugin has to be re-uploaded first.
- Whether Codex runs Claude plugin hooks.
