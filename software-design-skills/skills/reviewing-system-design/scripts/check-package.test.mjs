import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { checkPackage } from "./check-package.mjs";

const MANIFEST = `schema_version: 3
project: demo
status: approved

review:
  baseline_id: RV-001
  ledger: docs/design/review.md

authoritative_sources:
  product:
    path: docs/product/prd.md
    owns: [purpose]
  domain:
    path: docs/design/domain.md
    owns: [ubiquitous_language]
  architecture_decisions:
    path: docs/design/architecture/adr/
    owns: [technical_decision_rationale]
  http_api:
    path: docs/design/api/openapi.yaml
    owns: [http_contract]

not_applicable:
  - http_api

change_folders: docs/changes/
`;

const VALID = {
  "docs/spec/manifest.yaml": MANIFEST,
  "docs/product/prd.md": "# PRD\n\n### FR-001\nA.\n### FR-002\nB.\n\n## 12. MVP Scope\n- FR-001, FR-002 — core\n\n## 13. Success\n",
  "docs/design/domain.md": "# Domain\nCovers FR-001 per ADR-001.\n",
  "docs/design/architecture/adr/ADR-001-store.md":
    "# ADR-001\n\nStatus: Accepted\nAccepted by: Josue, 2026-10-19, «va»\n",
  "docs/design/review.md": "## Findings\n- Severity: `MAJOR`\n- Status: `RESOLVED`\n",
  "docs/build/plan.md": "# Plan\n\nBaseline: RV-001\n\n## Milestone M01\n- FR-001\n- FR-002\n",
};

function makePackage(overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), "check-package-"));
  for (const [path, content] of Object.entries({ ...VALID, ...overrides })) {
    if (content === null) continue;
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  return root;
}

function errorsFor(overrides) {
  const root = makePackage(overrides);
  try {
    return checkPackage(root).errors.join("\n");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("a valid package passes", () => {
  assert.equal(errorsFor({}), "");
});

test("an older schema is skipped", () => {
  const root = makePackage({ "docs/spec/manifest.yaml": "schema_version: 2\nstatus: approved\n" });
  try {
    assert.deepEqual(checkPackage(root), { skipped: true, schema: "2", errors: [] });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a missing applicable path is reported, a not-applicable one is not", () => {
  const errors = errorsFor({ "docs/design/domain.md": null });
  assert.match(errors, /\[paths\] domain/);
  assert.doesNotMatch(errors, /http_api/);
});

test("keys outside the template and invalid statuses are reported", () => {
  const errors = errorsFor({
    "docs/spec/manifest.yaml": MANIFEST.replace("status: approved", "status: listo") + "resolved:\n  - D-1\n",
  });
  assert.match(errors, /\[manifest-keys\] key outside the template: resolved/);
  assert.match(errors, /\[manifest-status\] invalid status: listo/);
});

test("a Status line left in the PRD is reported", () => {
  assert.match(errorsFor({ "docs/product/prd.md": "Status: Ready\n" + VALID["docs/product/prd.md"] }),
    /\[status-lines\] docs\/product\/prd.md/);
});

test("an Accepted ADR without a quoted Accepted by line is reported", () => {
  assert.match(errorsFor({ "docs/design/architecture/adr/ADR-001-store.md": "Status: Accepted\n" }),
    /ADR-001: Accepted without/);
});

test("an authority relying on a Proposed ADR is reported", () => {
  assert.match(errorsFor({ "docs/design/architecture/adr/ADR-001-store.md": "Status: Proposed\n" }),
    /relies on ADR-001, which is still Proposed/);
});

test("cited IDs must exist in their owner", () => {
  const errors = errorsFor({ "docs/design/domain.md": "Covers FR-009 and ADR-007.\n" });
  assert.match(errors, /cites FR-009, which the PRD does not define/);
  assert.match(errors, /cites ADR-007, which has no ADR file/);
});

test("an MVP FR missing from the plan and change specs is reported", () => {
  const errors = errorsFor({ "docs/build/plan.md": "# Plan\n- FR-001\n" });
  assert.match(errors, /FR-002 is in the MVP but in no milestone/);
});

test("an MVP FR covered by a change spec counts as planned", () => {
  const errors = errorsFor({
    "docs/build/plan.md": "# Plan\n- FR-001\n",
    "docs/changes/2026-10-19-extra/spec.md": "Covers FR-002.\n",
  });
  assert.equal(errors, "");
});

test("an MVP section without FR IDs is reported", () => {
  const prd = "### FR-001\nA.\n\n## 12. MVP Scope\n- core\n";
  assert.match(errorsFor({ "docs/product/prd.md": prd, "docs/build/plan.md": "# Plan\n- FR-001\n" }),
    /MVP section cites no FR IDs/);
});

test("ledger enums must be in English", () => {
  const errors = errorsFor({ "docs/design/review.md": "- Severity: `Bloqueante`\n- Status: `Abierto`\n" });
  assert.match(errors, /severity not in English enum: Bloqueante/);
  assert.match(errors, /status not in English enum: Abierto/);
});

test("a quoted schema version with a BOM and a comment is still read", () => {
  const manifest = "﻿" + MANIFEST.replace("schema_version: 3", 'schema_version: "3" # current');
  const root = makePackage({ "docs/spec/manifest.yaml": manifest });
  try {
    assert.equal(checkPackage(root).skipped, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("an NFR mention does not count as coverage of the FR with the same number", () => {
  const errors = errorsFor({ "docs/build/plan.md": "# Plan\n- FR-001\n- NFR-002\n" });
  assert.match(errors, /FR-002 is in the MVP but in no milestone/);
});

test("FRs listed under the MVP Out heading are not required in the plan", () => {
  const prd = VALID["docs/product/prd.md"].replace("- FR-001, FR-002 — core", "### In\n- FR-001\n### Out\n- FR-002");
  assert.equal(errorsFor({ "docs/product/prd.md": prd, "docs/build/plan.md": "# Plan\n- FR-001\n" }), "");
});

test("not_applicable accepts the key: and reason forms", () => {
  const withReason = MANIFEST.replace("  - http_api", "  - http_api: no HTTP API");
  const withKey = MANIFEST.replace("  - http_api", "  - key: http_api");
  assert.equal(errorsFor({ "docs/spec/manifest.yaml": withReason }), "");
  assert.equal(errorsFor({ "docs/spec/manifest.yaml": withKey }), "");
});

test("an ADR is identified by its heading when the file name has no ADR id", () => {
  assert.equal(errorsFor({
    "docs/design/architecture/adr/ADR-001-store.md": null,
    "docs/design/architecture/adr/0001-store.md": VALID["docs/design/architecture/adr/ADR-001-store.md"],
  }), "");
});

test("a nested path under an authority does not replace the authority path", () => {
  const manifest = MANIFEST.replace(
    "    path: docs/design/domain.md\n",
    "    path: docs/design/domain.md\n    snapshot:\n      path: docs/missing.json\n",
  );
  assert.equal(errorsFor({ "docs/spec/manifest.yaml": manifest }), "");
});

test("read_first paths must exist", () => {
  const manifest = MANIFEST.replace("authoritative_sources:", "read_first:\n  - docs/nope.md\n\nauthoritative_sources:");
  assert.match(errorsFor({ "docs/spec/manifest.yaml": manifest }), /read_first: docs\/nope.md/);
});

test("PRD §15 statuses must be Open or Decided", () => {
  const prd = VALID["docs/product/prd.md"] + "\n## 15. Product Decisions\n| ID | Question | Status |\n|---|---|---|\n| PD-001 | ¿x? | Abierta |\n";
  assert.match(errorsFor({ "docs/product/prd.md": prd }), /PD-001 status not Open\/Decided: Abierta/);
});

test("change specs are found through change_folders and ADRs cite real PRD ids", () => {
  const manifest = MANIFEST.replace("change_folders: docs/changes/", "change_folders: docs/build/");
  const errors = errorsFor({
    "docs/spec/manifest.yaml": manifest,
    "docs/build/plan.md": "# Plan\n- FR-001\n",
    "docs/build/m02/spec.md": "Covers FR-002.\n",
    "docs/design/architecture/adr/ADR-001-store.md":
      "# ADR-001\n\nStatus: Accepted\nAccepted by: Josue, 2026-10-19, «va»\nRelated: FR-404\n",
  });
  assert.doesNotMatch(errors, /FR-002 is in the MVP/);
  assert.match(errors, /ADR-001-store.md cites FR-404/);
});
