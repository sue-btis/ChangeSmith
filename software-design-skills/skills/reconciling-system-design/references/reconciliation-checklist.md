# Reconciliation Checklist

## Scope
- [ ] Work is limited to OPEN BLOCKER/MAJOR findings from the current review baseline.
- [ ] No unrelated improvement backlog was invented.
- [ ] MINOR/NOTE debt remains non-blocking unless explicitly requested.

## Ownership
- [ ] Each correction edits the canonical owner of the disputed concern.
- [ ] Directly affected authorities are updated only when semantic consistency requires it.
- [ ] Product requirements were not silently changed to make the technical design easier.
- [ ] Every PRD edit cites the decided PRD §15 row that authorizes it.
- [ ] New or changed ADRs start `Proposed`; none was marked `Accepted` without the owner's quote.
- [ ] No duplicate reconciliation specification was created.

## Change Safety
- [ ] The impact cone was identified before editing.
- [ ] Changes are the smallest coherent set that satisfies the finding.
- [ ] Consequential architecture changes use or update ADRs when appropriate.

## Handoff
- [ ] Attempted findings are READY_FOR_VERIFICATION, not self-declared RESOLVED.
- [ ] Changed paths and expected verification evidence are recorded.
- [ ] Reconciliation cycle count was incremented once, in `review.md`.
- [ ] Manifest status is ready_for_verification, blocked, or escalate.
