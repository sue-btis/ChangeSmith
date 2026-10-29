# changesmith

Spec-driven change workflow for coding agents, shipped as three complementary plugins.

## Why

Agents that go straight from a request to a diff skip the decisions that matter: what is in scope, which contracts change, and how anyone will know it works. changesmith makes that explicit but proportional. A one-line fix gets a short spec and a verification note; a risky or parallel change gets an audit and a plan. A separate verification step checks the actual diff against the spec instead of trusting the implementer’s report.

## Supported harnesses and prerequisites

- **Claude Code**: skills, slash commands and the optional hooks.
- **OpenAI Codex**: skills only (manifests in `.codex-plugin/`). The hooks are Claude Code only.
- **Node.js** (CI runs 24) is needed only for the optional hooks and the design-package checker script; the skills themselves need nothing.

## What is inside


1. `software-design-skills/` (1.5.0) — design package: idea or existing system -> product brief -> discovery when the unknowns need evidence -> focused PRD -> canonical system design -> consistency review -> vertical build plan.
2. `compact-change-skills/` (3.3.0) — execution/change: proportional changes in any repository, plus controlled implementation/verification of one approved build slice. It works without a design package.
3. `explaining-skills/` (0.2.0) — explanation for a human reader: plain-language voice, books checked by a cold reader, explanatory diagrams, and indicator diagnostics. Discovery and design use it to explain options before the user decides. Its skills are written in Spanish.

## Recommended flow

```text
NEW PRODUCT
software-design-skills
  shaping-product
  -> discovering-product (when the brief says Needs discovery; uses explaining-skills)
  -> writing-prd
  -> designing-system (candidate architectures; uses explaining-skills)
  -> reviewing-system-design
  -> writing-build-plan
  -> compact-change-skills:implementing-change (one milestone)
  -> compact-change-skills:verifying-change
  -> repeat next milestone

EXISTING PRODUCT THAT NEEDS A DESIGN BASELINE
software-design-skills in retroactive mode (same sequence as a new product)

EVERY LATER CHANGE, WITH OR WITHOUT A DESIGN PACKAGE
compact-change-skills
  shaping-change
  -> quick | medium | large, plus the artifacts each trigger requires
  -> spec / audit / plan as needed
  -> implementing-change
  -> verifying-change
```

The design plugin deliberately separates the PRD from technical authorities. `docs/spec/manifest.yaml` declares which artifact owns each kind of decision.

## Install

The repository is its own marketplace (`.claude-plugin/marketplace.json`).

```bash
claude plugin marketplace add sue-btis/changesmith
claude plugin install compact-change-skills@changesmith
claude plugin install software-design-skills@changesmith
claude plugin install explaining-skills@changesmith
```

To pick up new changes: `claude plugin marketplace update changesmith`, then start a new session.

## Worked example: a first change

```text
You:      /compact-change-skills:shaping-change  Add a --json flag to the "report" command
Shaping:  quick + lean. Entry point src/cli/report.ts:42, tests: tests/report.test.ts,
          consumers: none outside the CLI. No audit or plan needed.
          -> docs/changes/2026-03-14-report-json/spec.md
spec.md:  Goal, Scope, R-1 "--json prints the report as JSON", AC-1 "output parses with
          JSON.parse and matches the table values", Done when: `npm test` + run the command
You:      /compact-change-skills:implementing-change     (preflight, tests first, minimal diff)
You:      /compact-change-skills:verifying-change        (ideally in a fresh session)
          -> docs/changes/2026-03-14-report-json/verification.md
            Verdict: Pass
            Acceptance: Pending — waiting for your OK
You:      "looks good" -> the verifier records your acceptance with your quote. You commit.
```

The example is illustrative; the exact templates are in `compact-change-skills/skills/*/references/`.

## Optional hooks

`compact-change-skills` ships a git guard, a config guard and a comment-budget check for Claude Code. They are off until you enable them with `CHANGESMITH_*` environment variables; see [the hooks section](./compact-change-skills/README.md#hooks-claude-code-only-opt-in).

`software-design-skills` ships a hook that rebuilds the design package offline HTML view after each edit, off until `CHANGESMITH_RENDER_PACKAGE=1`; see [Package view](./software-design-skills/README.md#package-view).

## License

[MIT](./LICENSE)
