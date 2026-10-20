# Reliability Profiles

Use existing project gates when they are stricter. Thresholds below are defaults for changed production logic, not global repository mandates.

## Lean

Use for low-risk quick changes.

Required:

- regression test for a bug or focused test for new branching behavior;
- relevant existing test suite;
- applicable lint/typecheck/build command;
- QA check for user-visible behavior;
- actual diff inspection;
- no unrelated changes.

Metrics:

- no known uncovered changed branch affecting required behavior;
- preserve existing coverage threshold;
- mutation testing not required.

## Strict

Use for medium changes, shared contracts, important business logic, or explicit high-confidence requests.

Required:

- all Lean gates;
- unit tests for decision logic;
- integration or contract tests for changed boundaries;
- negative and boundary cases;
- reproducible QA mapped to acceptance criteria;
- changed-line coverage target: at least 90% where supported;
- changed-branch coverage target: at least 80% where supported;
- targeted mutation testing for high-value pure logic when tooling already exists or is explicitly approved.

Mutation default:

- target score: at least 70% for the selected mutation scope;
- every surviving mutant reviewed and classified;
- fail when an important survivor demonstrates a missing behavior assertion.

## Critical

Use for authorization, money, destructive operations, sensitive data, concurrency correctness, or explicitly critical software.

Required:

- all Strict gates;
- independent review of requirements and actual diff;
- adversarial negative tests and failure-path tests;
- contract/integration tests across every changed trust boundary;
- property-based, fuzz, concurrency, or invariant tests where applicable;
- rollback, idempotency, observability, and migration validation when applicable;
- changed-line coverage target: at least 95% where supported;
- changed-branch coverage target: at least 90% where supported;
- targeted mutation testing of critical decision logic.

Mutation default:

- target score: at least 80% for the selected critical scope;
- no surviving mutant in authorization, financial calculation, destructive guard, or invariant logic without explicit accepted-risk approval.

## Metrics Interpretation

| Signal | What it demonstrates | What it does not demonstrate |
|---|---|---|
| Passing tests | Specified examples behave as asserted | Missing examples or weak assertions |
| Line coverage | Code was executed | Branches and outcomes were meaningfully checked |
| Branch coverage | Decision paths were executed | Assertions would detect faulty decisions |
| Mutation score | Tests kill injected faults in selected code | Overall system correctness |
| Static analysis | Certain structural/type defects are absent | Runtime and product correctness |
| QA procedure | A user/system flow works in a stated environment | Broad regression safety |

## Additional Risk Triggers

Add the corresponding gate when relevant:

| Risk | Additional evidence |
|---|---|
| Database/schema migration | forward/backward compatibility, dry run, rollback or recovery path, data invariants |
| Public API or event contract | consumer/contract tests, compatibility matrix, versioning behavior |
| Authentication/authorization | deny-by-default tests, cross-tenant tests, privilege escalation attempts |
| Concurrency/state machine | invariant tests, race-focused tests, idempotency/retry behavior |
| Performance-sensitive path | baseline, budget, representative workload, regression threshold |
| Parser/validator/transformer | property-based or fuzz tests, malformed and boundary inputs |
| External dependency | timeout, retry, circuit/failure behavior, deterministic boundary fakes |
| UI workflow | component tests plus reproducible browser/manual QA for critical path |

## Verification Artifact Template

```markdown
# <Change name> Verification

Verdict: Pass | Pass with accepted limitations | Fail | Blocked
Base: `<commit>`
Head/working tree: `<commit or dirty>`
Reliability: lean | strict | critical

## Requirement Evidence
| Requirement / AC | Evidence | Result |
|---|---|---|
| R-1 / AC-1 | `<test/QA/diff reference>` | Pass/Fail |

## Automated Checks
| Command | Result | Notes |
|---|---|---|
| `<command>` | Pass/Fail/Not run | <evidence or blocker> |

## QA Procedure
1. <step>
Expected: <observable result>
Actual: <result>

## Quality Metrics
- Changed-line coverage: <value/N/A>
- Changed-branch coverage: <value/N/A>
- Mutation scope and score: <value/N/A>
- Surviving mutants: <count and classification>
- Flaky/skipped tests affecting scope: <none/details>

## Diff and Scope Review
- Files changed: <paths>
- Unrelated changes: none | <details>
- Contract/lockfile/generated-file review: <result>

## Limitations or Deviations
- None | <explicit accepted limitation and owner>
```
