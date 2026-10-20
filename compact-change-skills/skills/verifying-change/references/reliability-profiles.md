# Reliability Profiles

Use existing project gates when they are stricter. Coverage and mutation numbers below are reference targets for changed production logic. They become gates only when the repository already has the tool; without it, record `no tool` and use the manual mutation protocol where the profile asks for mutation testing.

## Lean

Use for low-risk changes.

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

Use for shared contracts, important business logic, persistence, non-trivial integration, or explicit high-confidence requests.

Required:

- all Lean gates;
- unit tests for decision logic;
- integration or contract tests for changed boundaries;
- negative and boundary cases;
- reproducible QA mapped to acceptance criteria;
- changed-line coverage target: at least 90%;
- changed-branch coverage target: at least 80%;
- targeted mutation testing for high-value pure logic.

Mutation reference:

- target score: at least 70% for the selected mutation scope;
- every surviving mutant reviewed and classified;
- a survivor that shows a missing behavior assertion is a defect finding.

## Critical

Use for authorization, money, destructive operations, sensitive data, concurrency correctness, or explicitly critical software.

Required:

- all Strict gates;
- independent review of requirements and actual diff, unless the user asked for self-verification in the session (then labeled as such; see `verifying-change` §1);
- adversarial negative tests and failure-path tests;
- contract/integration tests across every changed trust boundary;
- property-based, fuzz, concurrency, or invariant tests where applicable;
- rollback, idempotency, observability, and migration validation when applicable;
- changed-line coverage target: at least 95%;
- changed-branch coverage target: at least 90%;
- targeted mutation testing of critical decision logic.

Mutation reference:

- target score: at least 80% for the selected critical scope;
- a surviving mutant in authorization, financial calculation, destructive guard, or invariant logic is a defect finding unless the user accepts it as a limitation.

## Manual Mutation Protocol

When no mutation tool exists, mutate the selected decision logic by hand:

1. write each mutant as a minimal edit (flip a condition, drop a guard, change a boundary, swap a return value) and list it;
2. run the focused tests against each mutant;
3. record each mutant as killed, equivalent (with the reason), or survived;
4. classify every survivor as a finding;
5. restore the original code and rerun the focused tests.

Report `written / killed / equivalent / survived`. This is valid mutation evidence; a percentage computed from it is a reference, not a gate.

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
