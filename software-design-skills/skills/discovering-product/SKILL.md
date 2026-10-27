---
name: discovering-product
description: Discover Product. Use when a product brief has status Needs discovery, or the user wants to research, compare, or explore approaches before writing the PRD. Answer the brief's evidence questions by auditing what exists, researching sources, generating distinct options, probing them with measured spikes, challenging them, and explaining them so the user can understand and decide.
---

# Discover Before Requirements

Read `references/findings-template.md`.

Shaping records what the user wants. Discovery answers what nobody in the room knows yet: what exists, what is feasible, and which approaches have not been considered. Without it, unknowns get answered from the model's memory, which favors the most common solution.

The user decides. This skill gathers evidence, widens the option set, and explains it until the user can choose and defend the choice. Never convert a recommendation into a decision.

## Preconditions

Require `docs/product/brief.md` with status `Needs discovery` and its Discovery section: evidence questions (`DQ-###`) and a depth of `light` or `deep`.

Load `explaining-skills:lenguaje` before writing anything the user reads. If the `explaining-skills` plugin is not installed, stop and ask the user to install it; do not improvise an explanation format.

Depth decides the steps:

| Step | light | deep |
|---|---|---|
| 1. Frame | yes | yes |
| 2. Audit | yes | yes |
| 3. Explore | sourced answers only | full option map |
| 4. Ideate with the user | no | yes |
| 5. Probe | no | yes |
| 6. Challenge | no | yes |
| 7. Explain | findings table in the conversation | book with diagrams |
| 8. Decide | yes | yes |

## 1. Frame

For each `DQ-###`, write:

- the question;
- the decision it unblocks;
- the kill or change criterion: which answer cancels, cuts, or reshapes the product.

Before any option is shown, agree with the user on the comparison criteria (`CR-###`): what matters, and which criteria are musts. Record each with the user's quote. Criteria fixed after seeing the options bend toward the favorite.

## 2. Audit

Inventory what already exists and constrains the answer: the user's repositories, neighboring systems the product integrates with, data, hardware, time, and budget. Cite code as `path:line`. A neighboring system is evidence only; it is not redesigned here.

## 3. Explore

Research primary sources first: official documentation, papers, standards, source code, datasets with their licenses. Label every claim with the evidence labels of `explaining-skills:lenguaje`. A vendor's accuracy or performance claim stays a hypothesis until a primary source or a measurement confirms it.

At deep depth, build an option map for each question with at least three options that differ in their underlying mechanism, not variants of one mechanism. Look in places the obvious answer does not come from:

- adjacent fields that solved the same problem under other names;
- the user's own domains and experience;
- what became possible recently and changes the old trade-off;
- buying or reusing something that already exists, and doing nothing.

Include the option the user brought. Record each option's origin.

## 4. Ideate With the User

Show the option map in a few lines per option, then work it with the user: combine options, invert a constraint, borrow from a field the user knows. Add every idea worth comparing as an option with origin `user` or `session`. Then screen the options against the must criteria; the rest go to the probe.

## 5. Probe

For each option that survives screening and still has an open kill criterion, build the smallest throwaway probe that measures that criterion: a spike for technical feasibility, an HTML prototype for interaction. Probes live in `docs/discovery/spikes/DQ-###-<slug>/` and are never promoted to production code.

Record setup, what was measured, and the result against the criterion. A probe that does not measure the criterion answers nothing.

## 6. Challenge

Launch a fresh-context agent with only `docs/discovery/findings.md`, the probe results, and the sources. Instruct it to assume each option is wrong until evidence says otherwise, and to report, with evidence:

- claims stronger than their evidence;
- a source that does not say what the finding cites;
- criteria that favor one option without a stated reason;
- a probe that does not measure its criterion;
- a missing option with a different mechanism.

Fix what it finds and re-run only the challenged parts. Record what changed in the Challenge section.

## 7. Explain

The user must understand the options well enough to choose and defend the choice.

At deep depth, write the explanation with `explaining-skills:libro` in `docs/discovery/<slug>.html`:

- the reader is the user; the promise is "Al terminar, <user> puede elegir <decision> y defender por qué";
- chapters: the problem and its mechanism, one chapter per option that survived screening, the comparison against the agreed criteria, and what is still unknown;
- each option chapter uses the libro chapter template, with a real case and numbers from the probes when they exist;
- any recommendation is labeled as a recommendation and placed after the comparison.

At light depth, present the findings table in the conversation in the voice of `explaining-skills:lenguaje`.

## 8. Decide

Ask the user to decide each question. Record in `findings.md` the decision, who, the date, and the verbatim quote, and route it:

- a product decision goes to the brief's Approved Product Decisions;
- a technical decision stays in `findings.md` as input for an ADR in `designing-system`;
- a kill criterion that was hit sets the brief to `Escalate` with the options the user has: cut scope, pivot, or stop.

## Output

Write `docs/discovery/findings.md` and, at deep depth, the book and the probes.

Set the brief status:

- `Ready for PRD` when every question is answered and decided;
- `Blocked` when a question needs evidence that cannot be obtained now;
- `Escalate` when a kill criterion was hit.

Do not write the PRD or technical architecture in this skill.
