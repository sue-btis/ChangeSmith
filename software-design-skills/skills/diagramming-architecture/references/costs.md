# Cost Estimates

Only when the diagram supports a budget request. For technical documentation skip this phase: figures turn the conversation toward them.

## Estimate After the Findings, Never Before

The most expensive error of this phase, and it is not arithmetic.

An estimate is built on architecture premises: how many replicas, how many databases, what is shared. Built on the architecture you were told instead of the one you found in the code, it is a convincing, wrong table, and worse, a promise. A "scalable" tier with several replicas for a service that keeps state in memory is not a miscalculated cost: it is a capability that does not exist, sold.

Always derive from the corrected architecture. When a finding changes a premise, say it next to the figure: *"this tier assumes moving session state to Redis, which is separate code work"*.

## Line Items

Do not quote prices from memory; they change. Identify **what drives each item** and look up current figures in the provider's pricing calculator or the service page.

| Item | What drives the cost | Notes |
|---|---|---|
| **Compute** (Container Apps, App Service) | Replicas × (vCPU, memory) × hours | Usually the largest item with the database. Consumption scales to zero; dedicated does not |
| **Database** | Tier + vCores + storage + backup retention | The second large item. Many small databases cost differently from one large one |
| **Static hosting** | Plan (free or standard) | Nearly fixed and low |
| **Container registry** | Tier + storage + geo-replication | Low unless you replicate across regions |
| **Storage** | GB stored + transactions + egress | Transactions surprise in workloads with many small files |
| **Observability** | **GB ingested per day** × retention | The most underestimated. See below |
| **Network** | VPN gateway per hour · private endpoints per hour and per endpoint · egress | See below |
| **Key Vault** | Operations | Almost always negligible |
| **DevOps** | Parallel jobs + users | Low in small teams |

## The Forgotten Ones

**Log Analytics charges for ingestion, not storage.** With verbose logging, telemetry can cost more than the compute that produces it. Estimate GB per day and state it: it is where a configuration decision (lowering the log level) gives the largest saving for the least effort.

**Private endpoints are charged per endpoint and per hour**, plus processed data. Four services behind private endpoints are four charges, not one.

**The VPN gateway is a flat rate** and runs with or without traffic. In a small deployment it is often the largest line in the table, which justifies sharing a hub gateway between environments instead of one per environment.

**Internet egress** is charged per GB. It matters when the system serves files or images to users.

**Per-tenant databases multiply.** N databases mean N times the minimum storage and, depending on the engine, N base charges. Here a shared resource pool changes the arithmetic completely, and stops paying off when there are few.

## How to Present

**Three tiers anchored to something real.** Not "small, medium, large" but the number the business recognizes: concurrent users, tenants, sites, devices. Whoever approves can place themselves.

**Ranges, not point figures.** A range communicates the uncertainty honestly; an exact number invites treating it as a quote.

**Date and an estimate label.** Prices change and vary by region and contract discounts.

**Say what is not included.** Licenses, support plan, cross-region transfer, and above all the **development work** any premise you flagged requires.

**Mark the current tier.** If something is already deployed, show which tier it is in today: it turns the table from a list of options into a path.

A format that works, one row per item:

```
Tier           | Service         | Suggested SKU           | USD/month
Initial        | Container Apps  | 1 replica · 1 vCPU/2 GB | 40 – 80
production     | MySQL Flexible  | B2s + 64 GB             | 50 – 80
50–300         | Log Analytics   | ~3 GB/day · 30 days     | 20 – 40
users          | ...
               | TOTAL                                     | 140 – 250
```

## Before Delivering the Table

- Every architecture premise behind a tier is stated.
- No tier promises capacity the code cannot deliver today.
- The forgotten items (log ingestion, private endpoints, gateway, egress) are included or explicitly excluded.
- It is dated and labeled as an estimate.
- For figures going to approval, point to the provider's pricing calculator with the SKUs you proposed.
