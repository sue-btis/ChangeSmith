# Design Review Checklist

Use this checklist comprehensively during a baseline review. During a new-baseline review, apply it to the authorities the material change touches plus global contradictions. During follow-up verification, apply only the items relevant to existing findings and the reconciliation impact cone.

## Mechanical Checks
- [ ] `check-package.mjs` ran, with its result recorded.
- [ ] Every manifest `checks:` command ran, with its result recorded.
- [ ] Official validators ran for the artifacts present, or their absence is recorded.

## Decisions
- [ ] Every stakeholder decision lives in PRD §15 with who, date, and verbatim quote.
- [ ] Every Accepted ADR has its "Accepted by" line; no authority relies on a Proposed ADR.
- [ ] `ADR-001 — System shape` compares candidates that differ in mechanism, including one that reuses an existing platform when one could cover a large part of the system.
- [ ] Eliminated options name what eliminated them: a user constraint or the evidence.
- [ ] Every ADR states its reversibility; each one-way ADR cites the evidence it was accepted on.

## Product Coverage
- [ ] MVP capabilities map to FRs.
- [ ] Important NFRs have architectural responses proportional to risk.
- [ ] Business invariants are preserved by domain/contracts/data design.
- [ ] Non-goals are not accidentally implemented by architecture scope.

## Authority
- [ ] One source of truth per concern.
- [ ] Manifest paths exist for applicable authorities.
- [ ] No empty canonical artifacts.
- [ ] ADR statuses and supersession are explicit.
- [ ] Apparent conflicts are classified by semantic impact rather than wording alone.

## Domain / Data
- [ ] Domain concepts are not accidental table mirrors.
- [ ] Persistent schema supports required identity, uniqueness, lifecycle, and integrity.
- [ ] Derived vs stored data is explicit where material.

## Contracts
- [ ] API/event contracts cover required boundaries.
- [ ] Errors, authorization, idempotency/concurrency, pagination/versioning are addressed when materially relevant.
- [ ] Contracts do not expose internal implementation accidentally.

## Architecture
- [ ] Components have clear responsibilities.
- [ ] Dependencies respect boundaries.
- [ ] Architecture complexity is justified by requirements.
- [ ] Failure, recovery, deployment, observability, and security concerns are covered proportional to documented risk and NFRs.
- [ ] Decisions that trade one quality attribute for another are listed as tradeoffs.
- [ ] Every trust-boundary crossing has its threats with a mitigation or a risk the user accepted with their quote.
- [ ] Capacity and cost estimates exist for the chosen shape, each labeled measured or assumed.
- [ ] Each boundary or budget the design depends on is an architecture rule with a check.

## UX
- [ ] Core journeys are realizable by the flows/prototype.
- [ ] Error/empty/loading/offline states are present when material to the product requirements.

## Build Readiness
- [ ] No blocking product decision remains.
- [ ] No unresolved BLOCKER finding remains.
- [ ] No unresolved MAJOR finding remains.
- [ ] No unresolved blocking semantic contradiction remains.
- [ ] Acceptance can be verified incrementally.

## Follow-up Guardrails
- [ ] Existing findings were verified before searching for regressions.
- [ ] Regression inspection stayed inside the impact cone.
- [ ] No new MINOR/NOTE findings were introduced after baseline.
- [ ] Any new finding is either a BLOCKER/MAJOR regression or a previously unseen critical BLOCKER.
- [ ] Convergence counters and verdict thresholds were applied.
