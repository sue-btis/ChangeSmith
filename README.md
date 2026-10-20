# Software Engineering Skills Bundle

Contains two complementary plugins:

1. `software-design-skills-1.0.0` — greenfield: idea -> product brief -> focused PRD -> canonical system design -> consistency review -> vertical build plan.
2. `compact-change-skills-2.1.0` — execution/change: proportional brownfield changes plus controlled implementation/verification of one approved greenfield build slice.

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

EXISTING PRODUCT
compact-change-skills
  shaping-change
  -> quick | medium | large
  -> spec / audit / plan as needed
  -> implementing-change
  -> verifying-change
```

The design plugin deliberately separates the PRD from technical authorities. `docs/spec/manifest.yaml` declares which artifact owns each kind of decision.
