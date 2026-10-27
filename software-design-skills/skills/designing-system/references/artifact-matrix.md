# Canonical Artifact Matrix

| Concern | Preferred Authority | Create When | Do Not Duplicate In |
|---|---|---|---|
| Product intent/behavior | `docs/product/prd.md` | Always | architecture/ADR/contracts |
| Domain language/invariants | `docs/design/domain.md` | Always | DBML as prose |
| Architecture structure | `architecture.dsl` | Standard/complex or useful compact | PRD |
| Technical rationale | ADR | Consequential decision | PRD/contracts |
| NFR design response, tradeoffs, threats, capacity, operations, architecture rules | `quality-attributes.md` | An NFR needs a design response or the system runs unattended | PRD (targets stay in the PRD) |
| Persistent schema | `schema.dbml` | Structured persistence exists | PRD/domain prose |
| HTTP contract | `openapi.yaml` | HTTP API exists | PRD/ADR |
| Async/event contract | `asyncapi.yaml` | Async/event boundary exists | PRD/ADR |
| User/system flow | `flows.mmd` | Non-trivial flow exists | long prose duplicates |
| Visual interaction | `prototype.html` | UI behavior needs validation | architecture |
| Build sequence | `docs/build/plan.md` | After design review | PRD/architecture |

## Format Rules

- Prefer standard schemas/contracts over prose when the standard can own the detail.
- Keep prose for semantics, rationale, invariants, and constraints.
- Never create an artifact solely because the template lists it.
- Generated diagrams may be derived from canonical text; generated output is not the source of truth unless explicitly declared.
- In a retroactive package an authority may be code (for example controllers or SQL scripts). Declare it in the manifest with its path, and mark any generated snapshot as non-authoritative.
- Consumer-facing contracts (OpenAPI `info.version`, AsyncAPI, a registry schema) keep their own semver, bumped by the change folder that alters them. No other artifact carries a version.
