import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { erDiagram, indexIds, installGitHook, isSource, outline, outputPath, parseDbml, render } from "./render-package.mjs";
import { onEdit } from "../../../hooks/render-on-edit.mjs";

const DBML = `Project demo {
  database_type: 'SQLite'
  Note: 'demo project'
}

// lecturas
Table user {
  id integer [pk]
  name text [not null, note: 'display, name']
  indexes {
    (name) [unique]
  }
}

Table post {
  id integer [pk]
  author_id integer [not null, ref: > user.id]
  status post_status
}

Enum post_status {
  draft
  published
}

Ref: post.id - user.id
`;

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
  architecture:
    path: docs/design/architecture/architecture.dsl
    owns: [system_structure]
  architecture_decisions:
    path: docs/design/architecture/adr/
    owns: [technical_decision_rationale]
  data:
    path: docs/design/data/schema.dbml
    owns: [persistent_schema]
  http_api:
    path: docs/design/api/openapi.yaml
    owns: [http_contract]

not_applicable:
  - http_api
`;

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), "render-package-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

const packageFiles = () => ({
  "docs/spec/manifest.yaml": MANIFEST,
  "docs/product/prd.md": "# PRD\n\n```mermaid\ngraph LR\n  a --> b\n```\n\nText with </script> inside.\n",
  "docs/design/architecture/architecture.dsl": 'workspace "demo" {}\n',
  "docs/design/architecture/adr/ADR-001-store.md": "# ADR-001 — Store\n",
  "docs/design/data/schema.dbml": DBML,
  "docs/design/review.md": "# Review\n",
});

test("parseDbml reads tables, column settings, inline and standalone refs, and enums", () => {
  const model = parseDbml(DBML);
  assert.deepEqual(model.tables.map((t) => t.name), ["user", "post"]);
  const name = model.tables[0].columns[1];
  assert.deepEqual(name.flags, ["not null"]);
  assert.equal(name.note, "display, name");
  assert.deepEqual(model.tables[0].indexes, ["(name) [unique]"]);
  assert.deepEqual(model.refs.map((r) => `${r.from.table}.${r.from.column} ${r.op} ${r.to.table}.${r.to.column}`),
    ["post.author_id > user.id", "post.id - user.id"]);
  assert.deepEqual(model.enums, [{ name: "post_status", values: ["draft", "published"] }]);
  assert.equal(model.project.note, "demo project");
});

test("erDiagram marks keys and maps DBML relation operators to Mermaid cardinality", () => {
  const er = erDiagram(parseDbml(DBML));
  assert.match(er, /integer author_id FK/);
  assert.match(er, /integer id PK/);
  assert.match(er, /post \}o--\|\| user : "author_id"/);
  assert.match(er, /post \|\|--\|\| user : "id"/);
});

test("parseDbml refuses what it does not know instead of guessing", () => {
  assert.throws(() => parseDbml("TablePartial base {\n  id int\n}\n"), /unrecognized top-level line/);
});

test("render builds one page from the applicable authorities and leaves out not_applicable ones", (t) => {
  const root = fixture(packageFiles());
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { out, changed } = render(root);
  assert.equal(changed, true);
  const html = readFileSync(out, "utf8");
  const data = JSON.parse(html.match(/<script type="application\/json" id="package">(.*?)<\/script>/s)[1]);
  assert.deepEqual(data.sections.map((s) => s.id), ["product", "architecture", "architecture_decisions", "data", "review"]);
  assert.equal(data.sections.find((s) => s.id === "data").items[0].kind, "dbml");
  assert.ok(!html.includes("Text with </script> inside"), "source text must not close the data script");
  assert.match(html, /mermaid\.initialize/);
});

test("render without the Structurizr CLI shows the DSL source with a note", (t) => {
  const root = fixture(packageFiles());
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const saved = process.env.STRUCTURIZR_CLI;
  delete process.env.STRUCTURIZR_CLI;
  try {
    render(root);
  } finally {
    if (saved !== undefined) process.env.STRUCTURIZR_CLI = saved;
  }
  const html = readFileSync(join(root, "docs/site/demo-architecture.html"), "utf8");
  const data = JSON.parse(html.match(/id="package">(.*?)<\/script>/s)[1]);
  const dsl = data.sections.find((s) => s.id === "architecture").items[0];
  assert.equal(dsl.views, null);
  assert.match(dsl.note, /STRUCTURIZR_CLI/);
});

test("render embeds an architecture view after its tables, titled by the page title", (t) => {
  const files = packageFiles();
  delete files["docs/design/architecture/architecture.dsl"];
  const root = fixture({
    ...files,
    "docs/spec/manifest.yaml": MANIFEST.replace("    path: docs/design/architecture/architecture.dsl\n",
      "    path: docs/design/architecture/architecture.md\n    view: docs/design/architecture/diagram.html\n"),
    "docs/design/architecture/architecture.md": "# Architecture — Demo\n",
    "docs/design/architecture/diagram.html": "<!doctype html><title>Demo architecture</title><svg></svg>",
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const html = readFileSync(render(root).out, "utf8");
  const data = JSON.parse(html.match(/id="package">(.*?)<\/script>/s)[1]);
  const items = data.sections.find((s) => s.id === "architecture").items;
  assert.deepEqual(items.map((i) => [i.kind, i.title]), [["markdown", "Architecture — Demo"], ["html", "Demo architecture"]]);
});

test("render does not rewrite the page when the sources did not change", (t) => {
  const root = fixture(packageFiles());
  t.after(() => rmSync(root, { recursive: true, force: true }));
  render(root);
  assert.equal(render(root).changed, false);
  writeFileSync(join(root, "docs/product/prd.md"), "# PRD v2\n");
  assert.equal(render(root).changed, true);
});

test("outputPath names the page after the project so it is easy to find", () => {
  assert.equal(outputPath("/p", "Polyquack").replace(/\\/g, "/"), "/p/docs/site/polyquack-architecture.html");
  assert.equal(outputPath("/p", "My App 2").replace(/\\/g, "/"), "/p/docs/site/my-app-2-architecture.html");
  assert.equal(outputPath("/p", null).replace(/\\/g, "/"), "/p/docs/site/package-architecture.html");
});

test("isSource covers docs/ except the generated site", () => {
  assert.equal(isSource("/p", "/p/docs/design/domain.md"), true);
  assert.equal(isSource("/p", "/p/docs/site/demo-architecture.html"), false);
  assert.equal(isSource("/p", "/p/src/app.py"), false);
});

test("the edit hook renders only for sources inside a package", (t) => {
  const root = fixture(packageFiles());
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.equal(onEdit({ tool_input: { file_path: join(root, "src/app.py") } }), null);
  assert.equal(onEdit({ tool_input: { file_path: join(root, "docs/site/demo-architecture.html") } }), null);
  assert.equal(onEdit({ tool_input: { file_path: join(root, "docs/product/prd.md") } }).changed, true);
});

test("installGitHook writes its own hook but never overwrites someone else's", (t) => {
  const root = fixture(packageFiles());
  t.after(() => rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "-q", root]);
  const hook = installGitHook(root);
  assert.match(readFileSync(hook, "utf8"), /--pre-commit/);
  assert.equal(installGitHook(root), hook);
  writeFileSync(hook, "#!/bin/sh\necho mine\n");
  assert.throws(() => installGitHook(root), /already exists/);
});

const PRD = `# PRD — Demo

## 7. Functional Requirements

### FR-001
The author registers a method.

### FR-002
Depends on FR-001 and on BR-001.

## 9. Business Rules

- BR-001 — A missing value stays missing (CON-001).

## 15. Product Decisions

| ID | Question | Decision | Affects |
|---|---|---|---|
| PD-001 | Snapshot interval? | 60 s | FR-001, FR-002 |

\`\`\`text
FR-001 inside a fence is not a mention
\`\`\`
`;

const PLAN = `# Build plan

## Milestone M01

- FR-001, FR-002
- FR-404 is not defined anywhere

## Requirement Coverage Matrix

| Requirement | Milestone |
|---|---|
| FR-001 | M01 |
`;

const index = () => indexIds([
  { id: "product", title: "Product (PRD)", outline: outline(PRD) },
  { id: "plan", title: "Build plan", outline: outline(PLAN) },
]);

test("outline anchors a heading that defines an ID by the ID and other headings by slug", () => {
  const { headings } = outline(PRD);
  assert.deepEqual(headings.map((h) => h.anchor), ["prd-demo", "7-functional-requirements", "FR-001", "FR-002", "9-business-rules", "15-product-decisions"]);
});

test("indexIds finds definitions as heading, list line and first table cell, the strongest form winning", () => {
  const { ids } = index();
  assert.deepEqual(Object.keys(ids).sort(), ["BR-001", "FR-001", "FR-002", "PD-001"]);
  assert.equal(ids["FR-001"].doc, "product", "the plan's matrix row must not take FR-001 from the PRD heading");
  assert.match(ids["FR-001"].preview, /The author registers a method/);
  assert.match(ids["BR-001"].preview, /A missing value stays missing/);
  assert.match(ids["PD-001"].preview, /\*\*Decision:\*\* 60 s/);
});

test("indexIds groups citations by document under the heading or definition that cites them", () => {
  const { cited } = index();
  assert.deepEqual(cited["FR-001"], [
    { doc: "product", refs: [{ anchor: "FR-002", label: "FR-002" }, { anchor: "PD-001", label: "PD-001" }] },
    { doc: "plan", refs: [{ anchor: "milestone-m01", label: "Milestone M01" }, { anchor: "requirement-coverage-matrix", label: "Requirement Coverage Matrix" }] },
  ]);
  assert.deepEqual(cited["BR-001"], [{ doc: "product", refs: [{ anchor: "FR-002", label: "FR-002" }] }]);
});

test("indexIds ignores undefined IDs and mentions inside code", () => {
  const { ids, cited } = index();
  assert.equal(ids["FR-404"], undefined);
  assert.equal(cited["CON-001"], undefined, "CON-001 is cited but never defined, so it is not listed");
  const fenced = cited["FR-001"].flatMap((g) => g.refs).filter((r) => r.label === "15. Product Decisions");
  assert.deepEqual(fenced, [], "the fenced FR-001 must not count as a citation");
});
