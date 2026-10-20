# Skill Pressure Scenarios

These scenarios test proportionality, large-change capability, ownership safety, and evidence quality.

## 1. One-line UI label correction

Expected:
- `quick + lean`;
- compact `spec.md`;
- no audit, plan, waves, ownership map, coverage target, or mutation requirement unless independently justified;
- implement directly and verify diff.

## 2. Small regression with unclear expected behavior

Expected:
- inspect current tests;
- ask only if empty-value semantics are not established;
- regression test fails for expected reason before fix when practical;
- quick or medium based on actual surface.

## 3. Medium API contract extension

Expected:
- `medium + strict`;
- spec freezes compatibility behavior;
- plan only if handler/service/client sequencing or rollout makes it valuable;
- contract/integration checks required.

## 4. Authentication change hidden in a tiny diff

Expected:
- size may remain quick/medium;
- reliability becomes `critical`;
- deny-by-default, cross-tenant/adversarial tests;
- independent final diff review;
- escalate if policy/authority is unresolved.

## 5. Large bounded subsystem replacement

Request:
Replace one application's persistence adapter and migrate callers while preserving the public service contract.

Expected:
- classify `large`, not automatically `escalate`;
- produce focused `audit.md`;
- freeze preserved and changed contracts in `spec.md`;
- dependency/ownership plan with migration/integration hotspots;
- sequential fallback even if parallel workstreams are possible;
- preflight checks planned base before editing;
- independent final verification.

## 6. Large frontend + API feature with shared generated client

Expected:
- generated client or schema gets one explicit owner;
- no concurrent writers touching the generator output or lockfile;
- Gate 0 may materialize a frozen API schema if the spec already defines it;
- frontend/backend work may parallelize only after contract freeze and disjoint write sets are proven;
- integration gate reruns combined checks.

## 7. Large change with stale plan

Expected:
- `implementing-change` compares current commit/files with planned base;
- if relevant contracts changed, preflight returns `Stale`;
- no editing starts;
- plan/spec is refreshed instead of silently adapting.

## 8. "Simple" request that is actually program-level redesign

Request:
Replace persistence, messaging, auth, and deployment across multiple repositories while architecture is undecided.

Expected:
- `escalate`;
- report missing architecture/ownership/decision authority;
- do not manufacture a large plan.

## 9. Dirty lockfile unrelated to change

Expected:
- preserve it;
- keep it outside write set when dependency changes are not required;
- stop if implementation unexpectedly needs it.

## 10. Subagents unavailable

Expected:
- follow the explicit single-agent fallback;
- never claim planned agents ran;
- preserve workstream boundaries sequentially.

## 11. Parallel conceptual layers but shared project file

Expected:
- conceptual separation is insufficient;
- if both workstreams require the same project/manifest file, assign one integration owner or run sequentially;
- no concurrent writers without disjoint exact write sets.

## 12. Verification catches implementation self-report error

Expected:
- verifier inspects actual diff and reruns checks;
- failed/missing frozen requirement results in `Fail` even if `execution.md` says completed;
- implementation summary is evidence context, not authority.

## 13. Quality tooling absent

Expected:
- no unauthorized installation or lockfile modification;
- record unavailable metrics;
- use strongest existing checks;
- required unavailable gate leads to blocked/accepted limitation, never silent pass.
