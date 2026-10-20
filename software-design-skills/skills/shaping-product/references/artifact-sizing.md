# Artifact Sizing

Create an artifact only when it becomes an authority or materially reduces ambiguity.

## Compact

Typical: one deployable, one main actor, limited persistence/integrations.

Prefer:
- brief;
- PRD;
- domain;
- one architecture representation;
- DBML/API only if applicable;
- few or no ADRs;
- short build plan.

## Standard

Typical: frontend + backend + persistence, several capabilities, external integration, meaningful UX flows.

Prefer:
- full core package;
- ADRs for consequential choices;
- OpenAPI/DBML as applicable;
- user/system flow diagrams;
- traceable build slices.

## Complex

Typical: multiple bounded contexts/subsystems, eventing, offline sync, tenancy/security boundaries, migrations, high reliability or compliance.

Add depth to:
- domain boundaries;
- quality-attribute scenarios;
- architecture views;
- ADRs;
- API/event contracts;
- migration/recovery design;
- verification gates.

Complex does not mean generating documents with no authority.
