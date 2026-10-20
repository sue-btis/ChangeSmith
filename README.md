# Software Engineering Skills Bundle

Contains two complementary plugins:

1. `software-design-skills/` (1.2.0) — design package: idea or existing system -> product brief -> focused PRD -> canonical system design -> consistency review -> vertical build plan.
2. `compact-change-skills/` (2.3.1) — execution/change: proportional changes in any repository, plus controlled implementation/verification of one approved build slice. It works without a design package.

## Recommended flow

```text
NEW PRODUCT
software-design-skills
  shaping-product
  -> writing-prd
  -> designing-system
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

## Instalación desde este repositorio

El repo es su propio marketplace (`.claude-plugin/marketplace.json`). Claude Code lee los archivos de la rama que esté activa.

```bash
claude plugin marketplace add "C:\Users\Josue Escobar\Documents\projects\software-engineering-skills"
claude plugin install compact-change-skills@software-engineering-skills
claude plugin install software-design-skills@software-engineering-skills
```

Para tomar cambios nuevos: `claude plugin marketplace update software-engineering-skills` y después una sesión nueva.
