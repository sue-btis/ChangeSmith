---
name: diagramming-architecture
description: "Diagram Architecture. Draw an architecture or cloud deployment diagram as an offline HTML page with SVG and PNG exports, from a design package's architecture.md or by reading a repository's real external dependencies. Use when designing-system needs the architecture view, or when someone wants to document infrastructure, review a proposed architecture, ask how to deploy a project, prepare an infrastructure resource request, estimate monthly cost, or replicate an environment (dev, QA, staging)."
---

# Diagram Architecture

A diagram is useful when infrastructure can act on it and the team recognizes it as their system. Every box and arrow comes from an **inventory** that can be checked: a box that is not in the inventory is invented, and an inventory entry missing from the diagram is an omission.

Pick the mode by where the inventory comes from:

- **Design mode**: a design package exists and `docs/design/architecture/architecture.md` (format in `../designing-system/references/architecture-template.md`) is the authority. Its People, Containers and Relations tables are the inventory; skip to step 4. Output: `docs/design/architecture/diagram.html`.
- **Repository mode**: the system exists in code, either standalone or for a retroactive package. Run steps 1 to 3 to build the inventory from the code. In a retroactive package, write the inventory as `architecture.md` first, then draw it.

## 1. Inventory the External Destinations

Before asking anything, read the repository and list every connection string, hostname, IP address, port, base URL, queue, bucket and SDK client that appears in configuration or code. `references/repo-analysis.md` says which files to open per stack and what each signal means; read it first.

Two facts shape everything else:

- **What each component really is.** An Angular folder may be a standalone SPA or a microfrontend mounted inside another application; the federation manifest says which, and the diagram changes completely. A project with a `main` may be an API, a worker or a job.
- **Which destinations live in no cloud.** A private IP (`10.x`, `172.16–172.31.x`, `192.168.x`) or an internal hostname needs hybrid connectivity (VPN, ExpressRoute, Direct Connect): a deployment blocker. Only `172.16` to `172.31` is private; an organization using `172.168.x` internally needs explicit routes.

The step is done when every destination in the code is a row of the inventory with where it appears, protocol and port, type, and where it is reachable from.

## 2. Report Findings Before Drawing

Present the findings **before** the diagram, so the conversation is about the system and not about boxes. Report only what changes the deployment or someone's decision:

- the component is not what it seems (microfrontend, worker, two services where one was assumed);
- destinations outside the cloud, with the exact range, because it fixes the virtual network addressing for good;
- committed secrets: they are in git history and must be rotated, not just deleted;
- what the description claims and the code does not do (telemetry without the SDK, authentication without middleware, a cache without a client);
- configuration that does not survive deployment (localhost URLs, development ports, wildcard origins).

One sentence for what happens, one for why it matters. When the developer reaffirms a decision you flagged, it is their decision: note it in the diagram and move on.

## 3. Ask Only What the Repository Cannot Know

If reading the repository answers it, it is not a question. The code cannot say:

- names of resources that already exist and must be integrated;
- environment and region, and whether this deployment is new or replicates one;
- who owns the private network and how to reach it;
- what is shared between environments (registry, log workspace, gateway);
- cost decisions: service tier, database pooling, redundancy.

Group the questions in one message with a reasonable default for each, so answering is confirming. When one answer is clearly better, say so and why in one line.

## 4. Draw Without Blocking

Draw with what you have. A missing value is marked pending (the pending color and the words "to confirm") and does not stop delivery: a diagram with two orange boxes turns an abstract question into one you can point at.

Start from `assets/template.html` and read `references/visual-system.md` before writing SVG. When the target is Azure, read `references/azure.md`; for another cloud apply the same criteria with what you know.

**Draw the state, not the destination.** A diagram reads as "this is how it is". A telemetry box beside the others says there are metrics; if the code is not instrumented, mark it to create, even when it is decided and budgeted.

The page holds one view per question, each a `<section class="view">` with its own `<svg data-view="…">`, all drawn from the same inventory:

| View | Answers | Draw it |
|---|---|---|
| `context` | What is the system, who uses it, which outside systems it talks to | Always: people, the system as one box, outside systems |
| `containers` | Which deployable pieces exist, where each runs, how they talk | Always: every person, container and relation, in its zone |
| `components` | How one container is organized inside | When an architecture rule in `quality-attributes.md` names its components |
| `deployment` | Where each piece runs, per node or environment | When one container runs in several places or environments; otherwise the zones of `containers` already answer it |

In the `containers` view, every box that stands for a person or container carries `data-node="<ID>"` and every arrow that stands for a relation carries `data-edge="<From>><To>"`, with the IDs of the inventory. In design mode the package verifier compares that view with `architecture.md`, so the diagram cannot drift from the authority unnoticed. The other views summarize it: everything they show must be true of the tables, and the reviewer checks them by reading.

The step is done when every item of the checklist at the end of `references/visual-system.md` holds.

## 5. Export and Deliver

Open the page in a browser to review it. When someone needs an image for a document, export it:

```bash
node <this skill's directory>/scripts/export-diagram.mjs <diagram.html> <out-dir> --png
```

It writes `<view>.svg` per view, standalone, and rasterizes each to `<view>.png` with headless Chrome or Edge at twice the resolution. Look at every PNG before delivering: text overlaps are invisible in the source and obvious in the image.

In design mode, `render-package.mjs` embeds `diagram.html` in the package page; the exports are optional.

## Iterate

Regenerating is cheap: edit the HTML and reopen it. Say so when delivering, so the reviewer starts pointing at things instead of treating the diagram as final.

- **A substantive error** (an arrow from the wrong component, a box that misrepresents a relation): fix it and say in one line what the error implied. In design mode the fix starts in `architecture.md`.
- **A cosmetic one** (an overlap, a broken line of text, a gap): fix it without ceremony.

If your own visual encoding is inconsistent, say so before anyone notices: a dashed border meaning two things in one diagram is a real error, even when it looks fine.

## Cost Estimates

When the diagram goes with a resource or budget request, offer a tiered cost estimate; `references/costs.md` has the method. The estimate comes after the findings, never before, and every architecture premise is stated next to its figure. In a design package the figures belong in the Capacity and cost section of `quality-attributes.md`, not in the diagram.

## Replicating an Environment

The topology does not change; names and a few sizing decisions do. Ask for the names of what already exists in that environment and check:

- **What is shared with production.** Share the container registry, so the exact image that was tested is promoted; rebuilding it for production deploys something nobody validated.
- **What gets simpler.** Resource pooling, redundancy and high service tiers are usually unnecessary outside production; removing them is real savings.
- **What is shared and should not be.** A test environment pointing at production data should at least use read-only credentials. Flag it once.

Follow the naming convention already in place, even when it differs from the developer's word: if every resource says `dev` and they asked for "testing", use `dev` and say so.
