# Architecture Template

`docs/design/architecture/architecture.md` is the architecture authority: the tables an implementation agent reads. `diagram.html` draws them for people and is never an authority. The package verifier checks that every person, container and relation appears in the diagram's containers view and nothing else does.

```markdown
# Architecture — <Product>

## People
| ID | Name | Role |
|---|---|---|
| user | User | <who they are and what they do with the system> |

## Containers
| ID | Name | Responsibility | Technology | Zone | Boundary | State |
|---|---|---|---|---|---|---|
| web | Web app | <what it owns, one line> | <runtime, framework> | <network or hosting zone> | inside | to_create |

## Relations
| From | To | Purpose | Protocol | Kind |
|---|---|---|---|---|
| web | api | <what flows and why> | HTTPS/JSON | public |

## Notes
<only what the tables cannot carry: a constraint on a zone, a boundary rule, a pending confirmation>
```

## Columns

- **ID**: lowercase kebab-case, unique across People and Containers, stable across baselines. Relations, the diagram and other authorities cite people and containers by it.
- **Zone**: the network or hosting area the container lives in (`public internet`, `private network`, `corporate network`, `third party`). Containers that share a zone are drawn inside one zone box.
- **Boundary**: `inside` when this system deploys it, `outside` when it already exists or belongs to someone else (a third-party API, a shared registry, a corporate server).
- **State**: `exists` or `to_create`. Draw the state, not the destination: something decided and budgeted but not built yet is still `to_create`.
- **Kind**: `public` (user traffic over the internet), `deploy` (pipelines, image publishing), `private` (virtual network, private endpoints), `dependency` (existing services, egress to the internet), `internal` (corporate network through a tunnel), `telemetry` (logs and metrics), `local` (same host or process: a file database on the same machine, browser storage).

A container is a separately deployable or separately run unit (an app, a service, a database, a queue, a bucket, an external system it talks to), as in the C4 container level. Components inside a container belong in the domain model or the code, not here. When a boundary between components is an architecture rule, the rule lives in the Architecture rules section of `quality-attributes.md`, and the diagram may draw the components nested inside their container, without `data-node`.

A pending value is written `to confirm: <question>` in its cell; the diagram shows it in the pending color.
