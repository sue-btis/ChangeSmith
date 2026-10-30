import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSvgs } from "./export-diagram.mjs";

const TEMPLATE = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "template.html"), "utf8");

test("each view of the template exports to its own standalone SVG", () => {
  const views = buildSvgs(TEMPLATE);
  assert.deepEqual(views.map((v) => [v.view, v.width, v.height]), [["context", 1560, 520], ["containers", 1560, 1160]]);
  for (const { svg } of views) {
    assert.match(svg, /^<\?xml/);
    assert.match(svg, /svg \{[^}]*--dg-bg: #FFFFFF;/);
    assert.match(svg, /\.halo \{/);
    assert.doesNotMatch(svg, /\.foot \{/);
    assert.doesNotMatch(svg, /prefers-color-scheme/);
  }
});

test("every exported view carries the shared icons and markers it references", () => {
  for (const { svg } of buildSvgs(TEMPLATE)) {
    assert.match(svg, /<g id="ic-users">/);
    assert.match(svg, /<marker id="ar-blue"/);
    assert.match(svg, /<use xlink:href="#ic-users" href="#ic-users"/);
  }
});

test("a page with a single unnamed svg exports it as diagram", () => {
  const page = TEMPLATE.slice(0, TEMPLATE.indexOf('<div class="wrap">')) + '<svg viewBox="0 0 10 20"><rect/></svg>';
  assert.deepEqual(buildSvgs(page).map((v) => [v.view, v.width, v.height]), [["diagram", 10, 20]]);
});

test("a page without the diagram style block is rejected", () => {
  assert.throws(() => buildSvgs('<svg viewBox="0 0 10 10"></svg>'), /style block/);
});
