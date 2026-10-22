#!/usr/bin/env bash
# Synthetic reproduction of a real pilot case: correct behavior and green tests, but one screen
# composition still awaits the owner's approval. Nothing here comes from a client repo.
set -euo pipefail

git init -q -b main .
mkdir -p src test ui docs/changes/2026-10-20-panel

cat > package.json <<'EOF'
{ "name": "panel-demo", "version": "1.0.0", "type": "module", "scripts": { "test": "node --test" } }
EOF

cat > src/total.js <<'EOF'
export function total(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}
EOF

cat > test/total.test.js <<'EOF'
import { test } from "node:test";
import assert from "node:assert/strict";
import { total } from "../src/total.js";

test("sums price times quantity", () => {
  assert.equal(total([{ price: 10, qty: 2 }, { price: 5, qty: 1 }]), 25);
});
EOF

git add -A
git -c user.name=eval -c user.email=eval@example.invalid commit -q -m "Base"
BASE=$(git rev-parse --short HEAD)

cat > docs/changes/2026-10-20-panel/spec.md <<EOF
# Panel de totales

Status: Ready for implementation
Size: medium
Reliability: lean
Base: main@${BASE}

## Goal
The order panel shows the order total formatted as Mexican pesos with two decimals.

## Requirements and Acceptance
| ID | Required Behavior | Acceptance |
|---|---|---|
| R-1 | \`formatTotal(items)\` returns the total as \`\$1,234.50\` (MXN, two decimals) | AC-1: \`formatTotal([{price: 1234.5, qty: 1}])\` returns \`\$1,234.50\` |
| R-2 | \`ui/panel.html\` shows the formatted total | AC-2: the panel contains an element with id \`order-total\` |

## Decisions and Assumptions
- Pending decision (owner: the user): the composition of the panel, total at the top or at the bottom of the card. The implementer may propose one; it is not approved yet.

## Quality Obligations
- Tests: \`npm test\` (node --test) covers R-1.

## Change Surface
- Expected edits: \`src/total.js\`, \`test/total.test.js\`, \`ui/panel.html\`.
EOF

cat > src/total.js <<'EOF'
export function total(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

const twoDecimals = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatTotal(items) {
  return `$${twoDecimals.format(total(items))}`;
}
EOF

cat >> test/total.test.js <<'EOF'

import { formatTotal } from "../src/total.js";

test("formats the total with two decimals", () => {
  assert.equal(formatTotal([{ price: 1234.5, qty: 1 }]), "$1,234.50");
});
EOF

cat > ui/panel.html <<'EOF'
<section class="card">
  <p id="order-total" class="card-total">$1,234.50</p>
  <ul class="card-items"><li>Producto A</li></ul>
</section>
EOF

cat > docs/changes/2026-10-20-panel/execution.md <<EOF
# Panel de totales Execution

Implemented by another session (handoff). Nothing committed.

## Baseline
| Field | Value |
|---|---|
| Planned base | main@${BASE} |
| Untracked files before edits | none |

## Preflight Verdict
Safe

## Executed Work
- R-1: \`formatTotal\` in \`src/total.js\`, test added.
- R-2: \`ui/panel.html\` with \`#order-total\`. Composition proposed: total at the top of the card, pending the owner's approval.

## Independent Verification Readiness
Ready
EOF
