#!/usr/bin/env node
// Builds docs/site/<project>-architecture.html, a single offline page that renders every applicable authority the
// manifest declares. The page is a view, never an authority: the sources win on any difference.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, watch, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseManifest } from "../../reviewing-system-design/scripts/check-package.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const VENDOR = join(HERE, "..", "..", "..", "vendor");
const LIBRARIES = ["marked-18.1.0.umd.js", "mermaid-12.1.0.min.js"];
const FONT = "manrope-5.3.0-latin-wght.woff2";
const HOOK_MARKER = "# changesmith render-package";

const TITLES = {
  product: "Product (PRD)", domain: "Domain", architecture: "Architecture",
  architecture_decisions: "Architecture decisions", quality_attributes: "Quality attributes",
  data: "Data", http_api: "HTTP API", events: "Events", ux_flows: "Flows", ui_prototype: "UI prototype",
};

const read = (path) => readFileSync(path, "utf8").replace(/^﻿/, "");
const slash = (path) => path.replace(/\\/g, "/");

function filesOf(path) {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path).sort().flatMap((name) => filesOf(join(path, name)));
}

// A view-only reader for the DBML subset these packages use (Project, Table, Enum, Ref, TableGroup).
// The review validates DBML with the official @dbml/core; anything this reader does not know
// makes the page fall back to the raw source instead of guessing.

function splitSettings(text) {
  const parts = [];
  let current = "";
  let quote = null;
  for (const c of text) {
    if (quote) { if (c === quote) quote = null; current += c; continue; }
    if (c === "'" || c === '"') { quote = c; current += c; continue; }
    if (c === ",") { parts.push(current.trim()); current = ""; continue; }
    current += c;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const unquote = (value) => value.trim().replace(/^(['"])([\s\S]*)\1$/, "$2");

function parseColumn(line) {
  const match = line.match(/^("[^"]+"|\S+)\s+("[^"]+"|[^\s[]+)\s*(?:\[([\s\S]*)\])?$/);
  if (!match) throw new Error(`unrecognized column: ${line}`);
  const column = { name: unquote(match[1]), type: unquote(match[2]), flags: [], note: null, ref: null, default: null };
  for (const setting of splitSettings(match[3] ?? "")) {
    const [key, ...rest] = setting.split(":");
    const value = rest.join(":").trim();
    const k = key.trim().toLowerCase();
    if (k === "note") column.note = unquote(value);
    else if (k === "ref") column.ref = value;
    else if (k === "default") column.default = unquote(value);
    else column.flags.push(setting.trim());
  }
  return column;
}

function parseRef(text, fallbackTable, fallbackColumn) {
  const match = text.match(/^\s*(?:("?[\w.]+"?)\s*)?(<>|>|<|-)\s*("?[\w"]+"?)\.("?\w+"?)\s*$/);
  if (!match) throw new Error(`unrecognized ref: ${text}`);
  const [table, column] = match[1] ? match[1].replace(/"/g, "").split(".") : [fallbackTable, fallbackColumn];
  return { from: { table, column }, op: match[2], to: { table: match[3].replace(/"/g, ""), column: match[4].replace(/"/g, "") } };
}

function blocks(text) {
  const lines = text.split(/\r?\n/).filter((l) => !/^\s*\/\//.test(l));
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const ref = line.match(/^Ref(?:\s+\w+)?\s*:\s*(.+)$/i);
    if (ref) { result.push({ kind: "ref", text: ref[1] }); continue; }
    const head = line.match(/^(Project|Table|Enum|TableGroup|Note)\b\s*("?[\w.]+"?)?\s*(?:as\s+\w+\s*)?(?:\[[^\]]*\])?\s*\{\s*$/i);
    if (!head) throw new Error(`unrecognized top-level line: ${line}`);
    const body = [];
    let depth = 1;
    while (++i < lines.length) {
      const l = lines[i];
      depth += (l.match(/\{/g) ?? []).length - (l.match(/\}/g) ?? []).length;
      if (depth <= 0) break;
      body.push(l);
    }
    result.push({ kind: head[1].toLowerCase(), name: head[2] ? unquote(head[2]) : null, body });
  }
  return result;
}

export function parseDbml(text) {
  const model = { project: null, tables: [], enums: [], refs: [] };
  for (const block of blocks(text)) {
    if (block.kind === "ref") { model.refs.push(parseRef(block.text)); continue; }
    if (block.kind === "project") {
      const note = block.body.join("\n").match(/Note:\s*('''[\s\S]*?'''|'[^']*'|"[^"]*")/);
      model.project = { name: block.name, note: note ? note[1].replace(/^'''|'''$/g, "").replace(/^['"]|['"]$/g, "") : null };
      continue;
    }
    if (block.kind === "enum") {
      model.enums.push({ name: block.name, values: block.body.map((l) => l.trim()).filter(Boolean).map((l) => unquote(l.replace(/\s*\[.*\]$/, ""))) });
      continue;
    }
    if (block.kind !== "table") continue;
    const table = { name: block.name, note: null, columns: [], indexes: [] };
    let inIndexes = false;
    for (const raw of block.body) {
      const line = raw.trim();
      if (!line) continue;
      if (/^indexes\s*\{/i.test(line)) { inIndexes = true; continue; }
      if (inIndexes) { if (line === "}") inIndexes = false; else table.indexes.push(line); continue; }
      const note = line.match(/^Note:\s*(.+)$/i);
      if (note) { table.note = unquote(note[1]); continue; }
      const column = parseColumn(line);
      table.columns.push(column);
      if (column.ref) model.refs.push(parseRef(column.ref, table.name, column.name));
    }
    model.tables.push(table);
  }
  if (!model.tables.length) throw new Error("no tables found");
  return model;
}

const CARDINALITY = { ">": "}o--||", "<": "||--o{", "-": "||--||", "<>": "}o--o{" };

export function erDiagram(model) {
  const word = (s) => s.replace(/[^\w]/g, "_");
  const lines = ["erDiagram"];
  for (const table of model.tables) {
    lines.push(`  ${word(table.name)} {`);
    for (const c of table.columns) {
      const keys = [c.flags.some((f) => /^pk$|^primary key$/i.test(f)) && "PK", c.ref && "FK"].filter(Boolean).join(",");
      lines.push(`    ${word(c.type)} ${word(c.name)}${keys ? ` ${keys}` : ""}`);
    }
    lines.push("  }");
  }
  for (const r of model.refs) {
    lines.push(`  ${word(r.from.table)} ${CARDINALITY[r.op]} ${word(r.to.table)} : "${r.from.column}"`);
  }
  return lines.join("\n");
}

// The official CLI exports each view to Mermaid. It needs Java, so it runs only when
// STRUCTURIZR_CLI points at the unzipped CLI, and its output is cached by content hash so the
// edit hook does not start Java on every save.

function exportStructurizr(dslPath) {
  const cli = process.env.STRUCTURIZR_CLI;
  if (!cli || !existsSync(join(cli, "lib"))) {
    return { views: null, note: "Set STRUCTURIZR_CLI to the unzipped Structurizr CLI folder to render these views." };
  }
  const hash = createHash("sha256").update(read(dslPath)).update(cli).digest("hex").slice(0, 16);
  const cache = join(tmpdir(), "changesmith-render", hash);
  if (!existsSync(cache)) {
    mkdirSync(cache, { recursive: true });
    try {
      execFileSync("java", ["-Dfile.encoding=UTF-8", "-cp", join(cli, "lib", "*"),
        "com.structurizr.cli.StructurizrCliApplication", "export", "-workspace", dslPath,
        "-format", "mermaid", "-output", cache], { stdio: "pipe" });
    } catch (error) {
      return { views: null, note: `Structurizr export failed: ${String(error.stderr || error.message).trim().split("\n").pop()}` };
    }
  }
  const views = readdirSync(cache).filter((f) => f.endsWith(".mmd")).sort()
    .map((f) => ({ name: f.replace(/^structurizr-/, "").replace(/\.mmd$/, ""), text: read(join(cache, f)) }));
  return { views, note: null };
}


function item(root, path) {
  const rel = slash(relative(root, path));
  const text = read(path);
  const ext = extname(path).toLowerCase();
  if (ext === ".md") return { kind: "markdown", path: rel, text };
  if (ext === ".mmd") return { kind: "mermaid", path: rel, text };
  if (ext === ".dsl") return { kind: "structurizr", path: rel, text, ...exportStructurizr(path) };
  if (ext === ".dbml") {
    try {
      const model = parseDbml(text);
      return { kind: "dbml", path: rel, text, model, er: erDiagram(model) };
    } catch (error) {
      return { kind: "code", path: rel, text, note: `Shown as source: ${error.message}` };
    }
  }
  if (ext === ".html") return { kind: "html", path: rel, text };
  return { kind: "code", path: rel, text, note: null };
}

// The page must assign the same anchors in the browser, so this slug matches the one in page().
export const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const plain = (md) => md.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "").trim();

const ID = "[A-Z][A-Z0-9]{0,5}-\\d{1,4}";
const MENTION = new RegExp(`\\b${ID}\\b`, "g");
// A heading outranks a list line, which outranks a table row, so a traceability matrix that
// repeats FR-001 in its first column never takes the definition away from the PRD heading.
const DEFINES = [
  new RegExp(`^#{1,6}\\s+[*_\`]*(${ID})\\b`),
  new RegExp(`^\\s*(?:[-*+]|\\d+\\.)\\s+[*_\`]*(${ID})[*_\`]*\\s*(?:—|–|:|-\\s)`),
  new RegExp(`^\\|\\s*[*_\`]*(${ID})[*_\`]*\\s*\\|`),
];
const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

function preview(lines, at, rank) {
  if (rank === 2) {
    let head = at;
    while (head > 0 && lines[head - 1].trim().startsWith("|")) head--;
    const names = cells(lines[head]);
    return cells(lines[at]).slice(1).map((v, i) => (v && !/^-+$/.test(v) ? `**${names[i + 1]}:** ${v}` : "")).filter(Boolean).join("  \n");
  }
  const body = [rank === 0
    ? `**${plain(lines[at].replace(/^#+\s*/, ""))}**`
    : lines[at].replace(new RegExp(`^\\s*(?:[-*+]|\\d+\\.)\\s+[*_\`]*${ID}[*_\`]*\\s*(?:—|–|:|-)\\s*`), "")];
  for (let i = at + 1; i < lines.length && body.join("\n").length < 600; i++) {
    if (/^#{1,6}\s/.test(lines[i]) || (rank === 1 && !/^\s{2,}\S/.test(lines[i]))) break;
    body.push(lines[i]);
  }
  return body.join("\n").trim();
}

// One pass over a Markdown document: its headings with stable anchors, the IDs it defines and
// the IDs it mentions outside code, each mention tied to the heading or definition it sits under.
export function outline(text) {
  const lines = text.split(/\r?\n/);
  const headings = [];
  const defs = [];
  const mentions = [];
  const used = new Set();
  let fence = null;
  let context = null;
  let section = null;
  lines.forEach((line, n) => {
    const marker = line.match(/^\s*(```+|~~~+)/);
    if (marker) { fence = fence ? (marker[1][0] === fence ? null : fence) : marker[1][0]; return; }
    if (fence) return;
    const def = DEFINES.map((re, rank) => [line.match(re), rank]).find(([m]) => m);
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      let anchor = def && def[1] === 0 ? def[0][1] : slug(plain(heading[2])) || "section";
      while (used.has(anchor)) anchor += "-2";
      used.add(anchor);
      const level = heading[1].length;
      headings.push({ level, text: plain(heading[2]), anchor });
      // Subheadings such as "In" or "Out" only make sense next to their section.
      if (level <= 2) section = plain(heading[2]);
      context = { anchor, label: level > 2 && section && !def ? `${section} › ${plain(heading[2])}` : plain(heading[2]) };
    }
    if (def) defs.push({ id: def[0][1], rank: def[1], line: n, preview: preview(lines, n, def[1]) });
    const own = def ? def[0][1] : null;
    for (const [id] of line.replace(/`[^`]*`/g, "").matchAll(MENTION)) mentions.push({ id, line: n, own, context });
  });
  return { headings, defs, mentions };
}

// Resolves every ID to its single best definition across the package, then groups the places
// that cite it by document. Only IDs the package defines are linked or listed.
export function indexIds(docs) {
  const ids = {};
  for (const doc of docs) {
    for (const d of doc.outline.defs) {
      const best = ids[d.id];
      if (!best || d.rank < best.rank) ids[d.id] = { doc: doc.id, rank: d.rank, line: d.line, preview: d.preview };
    }
  }
  const cited = {};
  for (const doc of docs) {
    const seen = new Set();
    for (const m of doc.outline.mentions) {
      if (!ids[m.id]) continue;
      // A line shaped like a definition only counts as one when it won; a matrix row that repeats
      // FR-001 is a citation of FR-001, filed under its heading.
      const ownsLine = m.own && ids[m.own]?.doc === doc.id && ids[m.own].line === m.line;
      if (ownsLine && m.id === m.own) continue;
      const ref = ownsLine ? { anchor: m.own, label: m.own } : m.context ?? { anchor: "", label: doc.title };
      if (ref.anchor === m.id || seen.has(`${m.id} ${ref.anchor}`)) continue;
      seen.add(`${m.id} ${ref.anchor}`);
      const groups = (cited[m.id] ??= []);
      let group = groups.find((g) => g.doc === doc.id);
      if (!group) groups.push(group = { doc: doc.id, refs: [] });
      group.refs.push(ref);
    }
  }
  for (const id of Object.keys(ids)) ids[id] = { doc: ids[id].doc, preview: ids[id].preview };
  return { ids, cited };
}

export function collect(root) {
  const manifest = parseManifest(read(join(root, "docs", "spec", "manifest.yaml")));
  const sections = [];
  for (const [key, source] of Object.entries(manifest.sources)) {
    if (!source.path || manifest.notApplicable.includes(key)) continue;
    const path = join(root, source.path);
    const items = existsSync(path)
      ? filesOf(path).filter((f) => !f.endsWith(".gitkeep")).map((f) => item(root, f))
      : [{ kind: "missing", path: source.path }];
    sections.push({ id: key, title: TITLES[key] ?? key, items });
  }
  for (const [id, title, path] of [["review", "Design review", manifest.ledger], ["plan", "Build plan", "docs/build/plan.md"]]) {
    if (path && existsSync(join(root, path))) sections.push({ id, title, items: [item(root, join(root, path))] });
  }
  const docs = [];
  const taken = new Set();
  for (const s of sections) {
    for (const it of s.items) {
      const file = it.path.split("/").pop();
      let id = s.items.length === 1 ? s.id : slug(file.replace(/\.[^.]+$/, ""));
      while (taken.has(id)) id += "-2";
      taken.add(id);
      const h1 = it.kind === "markdown" ? (it.text.match(/^#\s+(.+)$/m) ?? [])[1] : null;
      it.id = id;
      it.title = s.items.length === 1 ? s.title : plain(h1 ?? file);
      it.heading = h1 ? plain(h1) : it.title;
      it.status = it.kind === "markdown" ? (it.text.match(/^Status:\s*([A-Za-z_]+)/m) ?? [])[1] ?? null : null;
      if (it.kind === "markdown") {
        const o = outline(it.text);
        it.headings = o.headings;
        docs.push({ id, title: it.title, outline: o });
      }
    }
  }
  return { project: manifest.project ?? "", status: manifest.status, baseline: manifest.baseline, idPattern: ID, sections, ...indexIds(docs) };
}

const safeJson = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
const inline = (code) => code.replace(/<\/script/gi, "<\\/script");
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function page(data, fingerprint) {
  const libraries = LIBRARIES.map((f) => `<script>${inline(read(join(VENDOR, f)))}</script>`).join("\n");
  const manrope = readFileSync(join(VENDOR, FONT)).toString("base64");
  const light = `
  color-scheme: light;
  --canvas: #fafafa; --sidebar: #eaeaeb; --card: #ffffff; --subtle: #eef1f4; --paper: #ffffff;
  --ink: #1f2937; --ink-2: #3f4a5c; --ink-3: #5f697c; --line: #e4e7ec; --mark-muted: #d0d5dd;
  --good: #006641; --warn: #7d4f00; --critical: #ac1e31; --code-bg: #f3f4f6;
  --primary: #822b62; --primary-bright: #de65b2; --primary-wash: #fbe9f5; --accent-ink: #862d65; --on-primary: #ffffff;
  --shadow-tile: 0 1px 2px rgb(31 41 55 / 0.04), 0 10px 48px rgb(31 41 55 / 0.06);
  --shadow-chip: 0 1px 2px rgb(31 41 55 / 0.05);
  --shadow-pop: 0 2px 4px rgb(31 41 55 / 0.06), 0 16px 40px -8px rgb(31 41 55 / 0.22);`;
  const dark = `
  color-scheme: dark;
  --canvas: #0e1217; --sidebar: #161b22; --card: #171c23; --subtle: #212833; --paper: #fbfbf9;
  --ink: #e6e9ee; --ink-2: #b7bfca; --ink-3: #8a94a3; --line: #2a323d; --mark-muted: #3a4350;
  --good: #3ccf8e; --warn: #f0a52a; --critical: #f27583; --code-bg: #1c222b;
  --primary: #ea8ac7; --primary-bright: #e61e9d; --primary-wash: #301727; --accent-ink: #ea8ac7; --on-primary: #2a0c1f;
  --shadow-tile: 0 1px 2px rgb(0 0 0 / 0.4), 0 10px 40px rgb(0 0 0 / 0.35);
  --shadow-chip: 0 1px 2px rgb(0 0 0 / 0.4);
  --shadow-pop: 0 2px 4px rgb(0 0 0 / 0.4), 0 16px 40px -8px rgb(0 0 0 / 0.6);`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="changesmith render-package ${fingerprint}">
<title>${escapeHtml(data.project || "Design package")} · design package</title>
<style>
@font-face { font-family: Manrope; font-style: normal; font-weight: 200 800; font-display: swap; src: url(data:font/woff2;base64,${manrope}) format("woff2"); }
:root {${light}
  --tile: 28px; --pill: 9999px;
  --sans: Manrope, ui-sans-serif, "Segoe UI", system-ui, sans-serif;
  --mono: ui-monospace, "Cascadia Code", "SF Mono", Consolas, "Liberation Mono", monospace;
}
:root[data-theme="dark"] {${dark}
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {${dark}
} }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-padding-top: 84px; scrollbar-color: var(--mark-muted) transparent; }
body { margin: 0; background: var(--canvas); color: var(--ink); font: 400 15.5px/1.625 var(--sans); font-feature-settings: "tnum" 1; caret-color: var(--primary); }
::selection { background: var(--primary-wash); color: var(--accent-ink); }
:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; }
a { color: var(--primary); text-decoration: none; }
a:hover { text-decoration: underline; text-underline-offset: 3px; }
button { font: inherit; }
svg.icon { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex: none; }

.top { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 16px; height: 64px; padding: 0 24px; background: var(--card); box-shadow: var(--shadow-chip); }
.brand { display: flex; align-items: baseline; gap: 10px; min-width: 0; color: var(--ink); }
.brand:hover { text-decoration: none; color: var(--primary); }
.brand b { font: 700 21px/1.2 var(--sans); letter-spacing: -0.02em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.brand span { color: var(--ink-3); font: 600 13px/1 var(--sans); white-space: nowrap; }
.pkg { display: flex; align-items: center; gap: 8px; }
.baseline { color: var(--ink-3); font: 600 12.5px/1 var(--sans); }
.search { position: relative; margin-left: auto; width: min(360px, 34vw); }
.search > svg { position: absolute; left: 16px; top: 22px; translate: 0 -50%; width: 16px; height: 16px; color: var(--ink-3); pointer-events: none; }
.search input { width: 100%; height: 44px; padding: 0 44px 0 42px; border: 1px solid var(--line); border-radius: var(--pill); background: var(--canvas); color: var(--ink); font: 400 14px var(--sans); }
.search input:hover { border-color: var(--mark-muted); }
.search input::placeholder { color: var(--ink-3); }
.search kbd { position: absolute; right: 12px; top: 22px; translate: 0 -50%; padding: 1px 8px; border-radius: 6px; background: var(--card); box-shadow: var(--shadow-chip); color: var(--ink-3); font: 600 12px var(--sans); }
.results { position: absolute; top: 52px; left: 0; right: 0; z-index: 50; max-height: min(60vh, 440px); overflow: auto; padding: 8px; border-radius: 20px; background: var(--card); box-shadow: var(--shadow-pop); }
.results a { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 9px 12px; border-radius: 12px; color: var(--ink); font-size: 14px; }
.results a span { color: var(--ink-3); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.results a[aria-selected="true"], .results a:hover { background: var(--primary-wash); color: var(--accent-ink); text-decoration: none; }
.results p { margin: 0; padding: 10px 12px; color: var(--ink-3); font-size: 14px; }
.icon-btn { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 44px; height: 44px; padding: 0; border: 1px solid var(--line); border-radius: var(--pill); background: var(--canvas); color: var(--ink-3); cursor: pointer; }
.icon-btn:hover { border-color: var(--primary); color: var(--primary); }
.menu { display: none; }

.chip { display: inline-flex; align-items: center; gap: 6px; min-height: 24px; padding: 0 10px; border-radius: var(--pill); background: var(--card); box-shadow: var(--shadow-chip); color: var(--ink-3); font: 600 12px/1 var(--sans); white-space: nowrap; }
.chip::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.chip.ok { color: var(--good); }
.chip.warn { color: var(--warn); }
.chip.bad { color: var(--critical); }

.shell { display: grid; grid-template-columns: 272px minmax(0, 1fr) 224px; min-height: calc(100vh - 64px); }
.tree { position: sticky; top: 64px; height: calc(100vh - 64px); overflow: auto; padding: 20px 12px 40px; background: var(--sidebar); border-right: 1px solid var(--line); scrollbar-width: thin; }
.tree a { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; padding: 0 16px; border-radius: var(--pill); color: var(--ink-2); font-size: 13.5px; line-height: 1.35; }
.tree a:hover { background: var(--card); color: var(--primary); text-decoration: none; }
.tree a[aria-current="page"] { background: var(--primary); color: var(--on-primary); font-weight: 600; }
.tree a[aria-current="page"] .chip { box-shadow: none; }
.tree .chip { min-height: 22px; padding: 0 8px; font-size: 11.5px; }
.tree-group { margin: 8px 0; }
.tree-label { display: flex; align-items: center; min-height: 40px; padding: 0 16px; color: var(--ink-3); font-size: 12.5px; }
.tree-links { margin-left: 24px; padding-left: 8px; border-left: 1px solid var(--mark-muted); }
.tree-links a { align-items: flex-start; min-height: 40px; padding: 9px 10px 9px 12px; }
.tree-links a > span:first-child { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

main { min-width: 0; padding: 36px clamp(16px, 4vw, 56px) 96px; }
.crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 10px; color: var(--ink-3); font: 600 12.5px var(--sans); }
.crumbs svg { width: 14px; height: 14px; }
.source { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin: 0 0 24px; color: var(--ink-3); font-size: 13px; }
.source > span { display: inline-flex; align-items: center; gap: 6px; }
.source svg { width: 15px; height: 15px; }

.prose > * { max-width: 74ch; }
.prose > .table-wrap, .prose > pre, .prose > figure, .prose > .cited, .prose > iframe { max-width: 100%; }
.prose h1 { margin: 0 0 8px; font: 700 40px/1.25 var(--sans); letter-spacing: -0.035em; text-wrap: balance; }
.prose h2 { margin: 2.2em 0 .6em; font: 600 21px/1.375 var(--sans); letter-spacing: -0.02em; text-wrap: balance; }
.prose h3 { margin: 1.8em 0 .4em; font: 600 16px/1.4 var(--sans); letter-spacing: -0.01em; }
.prose h4, .prose h5, .prose h6 { margin: 1.6em 0 .4em; font: 600 15px/1.4 var(--sans); }
.prose p, .prose ul, .prose ol { margin: 0 0 1em; color: var(--ink-2); }
.prose li { margin: .35em 0; }
.prose li > ul, .prose li > ol { margin: .3em 0; }
.prose strong { color: var(--ink); }
.prose blockquote { margin: 1.2em 0; padding: 2px 0 2px 16px; border-left: 1px solid var(--mark-muted); color: var(--ink-2); }
.prose hr { border: 0; border-top: 1px solid var(--line); margin: 2.5em 0; }
code { font: .86em var(--mono); background: var(--code-bg); padding: .12em .4em; border-radius: 6px; }
pre { margin: 1.4em 0; padding: 18px 20px; overflow: auto; background: var(--card); border-radius: 20px; box-shadow: var(--shadow-tile); font-size: 13px; line-height: 1.6; }
pre code { background: none; padding: 0; font-size: inherit; }
.table-wrap { overflow-x: auto; margin: 1.4em 0; padding: 6px 16px; border-radius: var(--tile); background: var(--card); box-shadow: var(--shadow-tile); }
table { border-collapse: collapse; width: 100%; font-size: 13.5px; line-height: 1.5; }
th, td { padding: 11px 12px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); }
th { color: var(--ink-3); font-weight: 600; font-size: 12.5px; white-space: nowrap; }
td { color: var(--ink-2); }
tr:last-child > td { border-bottom: 0; }
td code { white-space: nowrap; }
dl.meta { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 8px 20px; margin: 0 0 1.6em; padding: 16px 20px; border-radius: 20px; background: var(--card); box-shadow: var(--shadow-chip); font-size: 14px; }
dl.meta dt { color: var(--ink-3); font-weight: 600; }
dl.meta dd { margin: 0; color: var(--ink-2); }
.note { display: flex; gap: 10px; align-items: flex-start; margin: 12px 0; padding: 12px 16px; border-radius: 16px; background: var(--card); box-shadow: var(--shadow-chip); color: var(--warn); font-size: 14px; }
.note svg { margin-top: 3px; }
.enum-values code { margin-right: 4px; }
iframe { width: 100%; height: 640px; border: 0; border-radius: 20px; background: #fff; box-shadow: var(--shadow-tile); }

figure.diagram { margin: 1.4em 0; border-radius: var(--tile); background: var(--paper); box-shadow: var(--shadow-tile); overflow: hidden; }
.diagram-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px 10px 20px; border-bottom: 1px solid #e4e7ec; color: #3f4a5c; font: 600 13px var(--sans); }
.diagram-tools { display: flex; align-items: center; gap: 4px; }
.diagram-bar .icon-btn { width: 36px; height: 36px; background: #fafafa; border-color: #e4e7ec; color: #3f4a5c; }
.diagram-bar .icon-btn:hover { border-color: #822b62; color: #822b62; }
.diagram-bar .icon-btn:focus-visible { outline-color: #822b62; }
.zoom-level { min-width: 48px; color: #5f697c; font-size: 12.5px; text-align: center; font-variant-numeric: tabular-nums; }
.diagram-body { overflow: auto; max-height: 75vh; padding: 20px; overscroll-behavior: contain; }
.diagram-body.pannable { cursor: grab; }
.diagram-body:focus-visible { outline: 2px solid #822b62; outline-offset: -4px; border-radius: 0; }
.diagram-hint { margin: 0; padding: 8px 20px; border-top: 1px solid #e4e7ec; color: #5f697c; font-size: 12.5px; }
.diagram-hint:empty { display: none; }
.diagram-body.panning { cursor: grabbing; user-select: none; }
.diagram-body pre.mermaid { width: max-content; min-width: 100%; margin: 0; padding: 0; overflow: visible; border-radius: 0; background: none; box-shadow: none; color: transparent; }
.diagram-body pre.mermaid[data-processed] { color: inherit; }
.diagram-body svg { display: block; margin: 0 auto; max-width: none !important; }
figure.diagram:fullscreen { display: flex; flex-direction: column; margin: 0; border-radius: 0; }
figure.diagram:fullscreen .diagram-body { flex: 1; max-height: none; }

.def-id { color: var(--ink); font-weight: 700; }
a.idref { font-weight: 600; white-space: nowrap; border-bottom: 1px solid color-mix(in srgb, var(--primary) 40%, transparent); }
a.idref:hover { text-decoration: none; border-bottom-color: var(--primary); }
.arrived { animation: arrive 1.8s cubic-bezier(.22, 1, .36, 1) both; }
@keyframes arrive { from { background: var(--primary-wash); box-shadow: 0 0 0 8px var(--primary-wash); } to { background: transparent; box-shadow: 0 0 0 8px transparent; } }
.cited { margin: .2em 0 1.4em; font-size: 13px; line-height: 1.5; }
li > .cited, td > .cited-toggle { margin-top: .4em; }
.cited-toggle { display: inline-flex; align-items: center; gap: 8px; min-height: 32px; padding: 0 14px 0 12px; border: 0; border-radius: var(--pill); background: var(--card); box-shadow: var(--shadow-chip); color: var(--ink-3); font-weight: 600; font-size: 12.5px; cursor: pointer; white-space: nowrap; }
.cited-toggle svg { width: 15px; height: 15px; transition: rotate .2s cubic-bezier(.22, 1, .36, 1); }
.cited-toggle:hover, .cited-toggle[aria-expanded="true"] { color: var(--primary); }
.cited-toggle[aria-expanded="true"] svg { rotate: 90deg; }
.cited-toggle b { color: var(--ink); }
.cited-list { margin-top: 10px; padding: 4px 20px; border-radius: 20px; background: var(--card); box-shadow: var(--shadow-tile); }
.cited-row > td { padding-top: 0; }
.cited-row .cited-list { margin-top: 0; box-shadow: none; background: var(--canvas); }
.cited-doc { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 16px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.cited-doc:last-child { border-bottom: 0; }
.cited-doc > span { flex: 0 0 140px; color: var(--ink-3); font-weight: 600; }
.cited-doc a { font-weight: 600; }

.preview { position: fixed; z-index: 60; width: min(420px, calc(100vw - 24px)); max-height: 320px; overflow: hidden; padding: 16px 20px; border-radius: 20px; background: var(--card); box-shadow: var(--shadow-pop); color: var(--ink-2); font-size: 14px; line-height: 1.55; pointer-events: none; }
.preview-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
.preview-head b { color: var(--ink); font-size: 15px; }
.preview-head span { color: var(--ink-3); font-size: 12px; }
.preview p, .preview ul { margin: 0 0 .5em; }
.preview table { font-size: 13px; }

.pager { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 74ch; margin-top: 64px; }
.pager a { display: grid; gap: 2px; padding: 18px 24px; border-radius: var(--tile); background: var(--card); box-shadow: var(--shadow-chip); transition: box-shadow .2s cubic-bezier(.22, 1, .36, 1); }
.pager a:hover { box-shadow: var(--shadow-tile); text-decoration: none; }
.pager a.next { grid-column: 2; text-align: right; }
.pager span { color: var(--ink-3); font-size: 12.5px; }
.pager b { color: var(--primary); font-size: 15px; font-weight: 600; }
.foot { max-width: 74ch; margin-top: 28px; color: var(--ink-3); font-size: 12.5px; }
.foot code { font: inherit; background: none; padding: 0; color: var(--ink-2); }

.toc { position: sticky; top: 64px; height: calc(100vh - 64px); overflow: auto; padding: 24px 12px 40px; border-left: 1px solid var(--line); scrollbar-width: thin; }
.toc-title { padding: 0 16px 8px; color: var(--ink-3); font-size: 12.5px; }
.toc a { display: flex; align-items: center; gap: 10px; min-height: 34px; padding: 4px 16px; border-radius: var(--pill); color: var(--ink-3); font-size: 13px; line-height: 1.3; }
.toc a::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--line); flex: none; }
.toc a:hover { color: var(--primary); text-decoration: none; }
.toc a[aria-current="true"] { color: var(--primary); font-weight: 600; }
.toc a[aria-current="true"]::before { background: var(--primary-bright); }

@media (max-width: 1200px) { .shell { grid-template-columns: 272px minmax(0, 1fr); } .toc { display: none; } }
@media (max-width: 900px) {
  .shell { display: block; }
  .menu { display: inline-flex; }
  .top { gap: 8px; padding: 0 12px; }
  .brand span, .baseline, .search kbd { display: none; }
  .search { width: auto; flex: 1; min-width: 0; }
  .search input { padding-right: 16px; }
  .results { position: fixed; top: 60px; left: 12px; right: 12px; }
  .tree { position: fixed; inset: 64px 0 0 0; z-index: 35; display: none; height: auto; border-right: 0; }
  body.nav-open .tree { display: block; }
  body.nav-open { overflow: hidden; }
  main { padding: 24px 16px 88px; }
  .prose h1 { font-size: 32px; }
  .cited-doc > span { flex-basis: 100%; }
  .pager { grid-template-columns: 1fr; }
  .pager a.next { grid-column: 1; }
}
@media (max-width: 560px) { .pkg { display: none; } .brand b { font-size: 18px; } }
@media (prefers-reduced-motion: reduce) { .arrived { animation: none; } * { transition: none !important; } }
@media print {
  .top, .tree, .toc, .pager, .cited-toggle, .cited, .cited-row, .icon-btn, .preview { display: none !important; }
  .shell { display: block; } main { padding: 0; } body { background: #fff; }
  figure.diagram, .table-wrap, pre { box-shadow: none; border: 1px solid #e4e7ec; break-inside: avoid; }
  .diagram-tools, .diagram-hint { display: none; }
  .diagram-body { max-height: none; overflow: visible; }
  .diagram-body svg { width: 100% !important; height: auto !important; }
}
</style>
</head>
<body>
<header class="top">
<button class="icon-btn menu" id="rp-menu" aria-expanded="false" aria-controls="rp-tree" aria-label="Documents"></button>
<a class="brand" id="rp-brand" href="#"></a>
<span class="pkg" id="rp-pkg"></span>
<div class="search" id="rp-search"><input id="rp-filter" type="search" autocomplete="off" placeholder="Filter documents, headings, IDs" aria-label="Filter documents, headings, IDs" aria-controls="rp-results" aria-expanded="false"><kbd>/</kbd><div class="results" id="rp-results" role="listbox" hidden></div></div>
<button class="icon-btn" id="rp-theme"></button>
</header>
<div class="shell">
<nav class="tree" id="rp-tree" aria-label="Documents"></nav>
<main id="rp-main"><nav class="crumbs" id="rp-crumbs" aria-label="Location"></nav><div id="rp-doc"></div><nav class="pager" id="rp-pager" aria-label="Documents"></nav><p class="foot" id="rp-foot"></p></main>
<nav class="toc" id="rp-toc" aria-label="On this page"></nav>
</div>
<div class="preview" id="rp-preview" role="tooltip" hidden></div>
<script type="application/json" id="package">${safeJson(data)}</script>
${libraries}
<script>
(() => {
const data = JSON.parse(document.getElementById("package").textContent);
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fold = (s) => s.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
const icon = (path) => '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + path + "</svg>";
const ICONS = {
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  fit: '<path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4"/>',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  auto: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
  light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  dark: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
};
const STATUS = { approved: "ok", accepted: "ok", decided: "ok", ready_for_review: "", ready_for_verification: "", draft: "", proposed: "", superseded: "", open: "warn", rejected: "bad", needs_reconciliation: "warn", blocked: "bad", escalate: "bad" };
const chip = (text) => {
  if (!text) return "";
  const label = String(text).replace(/_/g, " ");
  return '<span class="chip ' + (STATUS[String(text).toLowerCase()] ?? "") + '">' + esc(label[0].toUpperCase() + label.slice(1)) + "</span>";
};
const ID_RE = new RegExp("\\\\b(" + data.idPattern + ")\\\\b");

marked.use({ renderer: { code({ text, lang }) { return lang === "mermaid" ? diagram("Diagram", text) : false; } } });
function diagram(title, text) {
  const tool = (action, label) => '<button class="icon-btn" data-zoom="' + action + '" aria-label="' + label + '" title="' + label + '">' + icon(ICONS[action === "out" ? "minus" : action === "in" ? "plus" : action]) + "</button>";
  return '<figure class="diagram"><div class="diagram-bar"><span>' + esc(title) + '</span><div class="diagram-tools">' + tool("out", "Zoom out") +
    '<span class="zoom-level" aria-live="polite"></span>' + tool("in", "Zoom in") + tool("fit", "Fit to width") + tool("full", "Full screen") +
    '</div></div><div class="diagram-body" tabindex="0" role="region" aria-label="' + esc(title) + '"><pre class="mermaid">' + esc(text) + '</pre></div><p class="diagram-hint"></p></figure>';
}
// Mermaid caps the SVG at the container width, so zoom sets explicit pixel sizes from the
// viewBox and the body scrolls; the point at the center stays in place while zooming.
function zoomTo(fig, scale, fitted) {
  const svg = fig.querySelector(".diagram-body svg");
  if (!svg || !fig.dataset.w) return;
  const body = fig.querySelector(".diagram-body");
  const w = +fig.dataset.w, h = +fig.dataset.h;
  const fx = (body.scrollLeft + body.clientWidth / 2) / (svg.clientWidth || 1);
  const fy = (body.scrollTop + body.clientHeight / 2) / (svg.clientHeight || 1);
  scale = Math.min(4, Math.max(0.1, scale));
  fig.dataset.scale = scale;
  fig.dataset.fitted = fitted ? "1" : "";
  svg.style.width = w * scale + "px";
  svg.style.height = h * scale + "px";
  body.scrollLeft = fx * w * scale - body.clientWidth / 2;
  body.scrollTop = fy * h * scale - body.clientHeight / 2;
  const pannable = body.scrollWidth > body.clientWidth || body.scrollHeight > body.clientHeight;
  body.classList.toggle("pannable", pannable);
  fig.querySelector(".zoom-level").textContent = Math.round(scale * 100) + "%";
  const mouse = matchMedia("(hover: hover)").matches;
  fig.querySelector(".diagram-hint").textContent = [
    pannable && (mouse ? "Click and drag, or use the arrow keys, to move around" : "Drag to move around"),
    mouse ? "Ctrl + wheel or the buttons to zoom" : "Use the buttons to zoom",
  ].filter(Boolean).join(" · ");
}
const fitScale = (fig) => Math.min(1, (fig.querySelector(".diagram-body").clientWidth - 40) / +fig.dataset.w);
function setupDiagrams(el) {
  for (const fig of el.querySelectorAll("figure.diagram")) {
    const svg = fig.querySelector(".diagram-body svg");
    const box = svg && svg.viewBox.baseVal;
    if (!box || !box.width) { fig.querySelector(".diagram-tools").hidden = true; continue; }
    fig.dataset.w = box.width;
    fig.dataset.h = box.height;
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    zoomTo(fig, fitScale(fig), true);
    const body = fig.querySelector(".diagram-body");
    body.addEventListener("wheel", (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomTo(fig, +fig.dataset.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
    }, { passive: false });
    const STEP = { ArrowUp: [0, -60], ArrowDown: [0, 60], ArrowLeft: [-60, 0], ArrowRight: [60, 0] };
    body.addEventListener("keydown", (e) => {
      if (STEP[e.key]) { e.preventDefault(); body.scrollBy(...STEP[e.key]); return; }
      if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomTo(fig, +fig.dataset.scale * 1.25); }
      if (e.key === "-") { e.preventDefault(); zoomTo(fig, +fig.dataset.scale * 0.8); }
      if (e.key === "0") { e.preventDefault(); zoomTo(fig, fitScale(fig), true); }
    });
    let drag = null;
    body.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || !body.classList.contains("pannable")) return;
      drag = { x: e.clientX, y: e.clientY, left: body.scrollLeft, top: body.scrollTop };
      body.setPointerCapture(e.pointerId);
      body.classList.add("panning");
    });
    body.addEventListener("pointermove", (e) => {
      if (!drag) return;
      body.scrollLeft = drag.left - (e.clientX - drag.x);
      body.scrollTop = drag.top - (e.clientY - drag.y);
    });
    const stop = () => { drag = null; body.classList.remove("panning"); };
    body.addEventListener("pointerup", stop);
    body.addEventListener("pointercancel", stop);
  }
}
const refit = () => document.querySelectorAll('figure.diagram[data-fitted="1"]').forEach((fig) => zoomTo(fig, fitScale(fig), true));
// ADRs and briefs open with "Key: value" lines right after the title; Markdown would join them
// into one paragraph, so they become a definition list.
function markdown(text) {
  const lines = text.split(/\\r?\\n/);
  const start = lines.findIndex((l) => /^#\\s/.test(l)) + 1;
  let i = start;
  while (i < lines.length && lines[i].trim() === "") i++;
  const meta = [];
  while (i < lines.length && /^[A-Z][\\w ()/-]{0,40}:\\s+\\S/.test(lines[i])) meta.push(lines[i++]);
  let html = "";
  if (meta.length >= 2) {
    const rows = meta.map((l) => { const at = l.indexOf(":"); return "<dt>" + esc(l.slice(0, at)) + "</dt><dd>" + marked.parseInline(l.slice(at + 1).trim()) + "</dd>"; }).join("");
    html = marked.parse(lines.slice(0, start).join("\\n")) + '<dl class="meta">' + rows + "</dl>" + marked.parse(lines.slice(i).join("\\n"));
  } else {
    html = marked.parse(text);
  }
  return html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\\/table>/g, "</table></div>");
}
function render(it) {
  if (it.kind === "missing") return '<p class="note">' + icon(ICONS.info) + "Declared in the manifest but missing on disk.</p>";
  if (it.kind === "markdown") return markdown(it.text);
  if (it.kind === "mermaid") return diagram(it.path.split("/").pop(), it.text);
  if (it.kind === "html") return '<iframe sandbox title="' + esc(it.path) + '" srcdoc="' + esc(it.text) + '"></iframe>';
  if (it.kind === "structurizr") return it.views
    ? it.views.map((v) => "<h2>" + esc(v.name) + "</h2>" + diagram(v.name, v.text)).join("")
    : '<p class="note">' + icon(ICONS.info) + esc(it.note) + "</p><pre><code>" + esc(it.text) + "</code></pre>";
  if (it.kind === "dbml") {
    const m = it.model;
    let html = (m.project && m.project.note ? "<p>" + esc(m.project.note) + "</p>" : "") + "<h2>Entity relationships</h2>" + diagram("Entity relationships", it.er);
    for (const t of m.tables) {
      html += "<h2><code>" + esc(t.name) + "</code></h2>" + (t.note ? "<p>" + esc(t.note) + "</p>" : "");
      html += '<div class="table-wrap"><table><thead><tr><th>Column</th><th>Type</th><th>Settings</th><th>Note</th></tr></thead><tbody>' + t.columns.map((c) =>
        "<tr><td><code>" + esc(c.name) + "</code></td><td>" + esc(c.type) + "</td><td>" + esc([...c.flags, c.default !== null ? "default: " + c.default : "", c.ref ? "ref: " + c.ref : ""].filter(Boolean).join(", ")) + "</td><td>" + esc(c.note || "") + "</td></tr>").join("") + "</tbody></table></div>";
      if (t.indexes.length) html += "<p><strong>Indexes:</strong> " + t.indexes.map((x) => "<code>" + esc(x) + "</code>").join(" ") + "</p>";
    }
    for (const e of m.enums) html += "<h2>Enum <code>" + esc(e.name) + '</code></h2><p class="enum-values">' + e.values.map((v) => "<code>" + esc(v) + "</code>").join(" ") + "</p>";
    return html;
  }
  return (it.note ? '<p class="note">' + icon(ICONS.info) + esc(it.note) + "</p>" : "") + "<pre><code>" + esc(it.text) + "</code></pre>";
}

const docs = data.sections.flatMap((s) => s.items.map((it) => Object.assign(it, { section: s })));
const byId = new Map(docs.map((d) => [d.id, d]));
const href = (doc, anchor) => "#" + doc + (anchor ? "/" + anchor : "");
const own = (id) => data.ids[id] && byId.get(data.ids[id].doc);

function anchorHeadings(el, doc) {
  const hs = [...el.querySelectorAll("h1, h2, h3, h4, h5, h6")];
  const known = doc.headings && doc.headings.length === hs.length ? doc.headings : null;
  const used = new Set();
  hs.forEach((h, i) => {
    let id = known ? known[i].anchor : slug(h.textContent) || "section";
    while (used.has(id)) id += "-2";
    used.add(id);
    h.id = id;
  });
}
function markDefinitions(el, doc) {
  const defined = (id) => data.ids[id] && data.ids[id].doc === doc.id && !el.querySelector("#" + CSS.escape(id));
  for (const li of el.querySelectorAll("li")) {
    const m = li.textContent.trim().match(new RegExp("^(" + data.idPattern + ")"));
    if (m && defined(m[1])) li.id = m[1];
  }
  for (const tr of el.querySelectorAll("tbody tr")) {
    const id = tr.cells[0] && tr.cells[0].textContent.trim();
    if (id && defined(id)) tr.id = id;
  }
  for (const def of el.querySelectorAll("[id]")) {
    if (!data.ids[def.id] || data.ids[def.id].doc !== doc.id) continue;
    const head = def.matches("tr") ? def.cells[0] : def;
    const walker = document.createTreeWalker(head, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const at = n.textContent.indexOf(def.id);
      if (at < 0) continue;
      const span = document.createElement("span");
      span.className = "def-id";
      span.textContent = def.id;
      const rest = n.splitText(at);
      rest.textContent = rest.textContent.slice(def.id.length);
      n.parentNode.insertBefore(span, rest);
      break;
    }
  }
}
// Every mention of a defined ID becomes a link, except inside code, diagrams and the definition itself.
function linkIds(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) =>
    n.parentElement.closest("pre, code, a, .mermaid, .def-id, .source") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (ID_RE.test(n.textContent)) nodes.push(n);
  for (const n of nodes) {
    const parts = n.textContent.split(ID_RE);
    if (parts.length < 2) continue;
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (i % 2 === 0) { if (part) frag.append(part); return; }
      const target = own(part);
      if (!target) { frag.append(part); return; }
      const a = document.createElement("a");
      a.className = "idref";
      a.href = href(target.id, part);
      a.dataset.id = part;
      a.textContent = part;
      frag.append(a);
    });
    n.replaceWith(frag);
  }
}
function addCitations(el, doc) {
  for (const [id, groups] of Object.entries(data.cited)) {
    if (data.ids[id].doc !== doc.id) continue;
    const def = el.querySelector("#" + CSS.escape(id));
    if (!def) continue;
    const count = groups.reduce((n, g) => n + g.refs.length, 0);
    const panelId = "rp-cited-" + slug(id);
    const button = '<button class="cited-toggle" aria-expanded="false" aria-controls="' + panelId + '">' + icon(ICONS.chevron) + "Cited in <b>" + count + "</b> " + (count === 1 ? "place" : "places") + (groups.length > 1 ? " across " + groups.length + " documents" : "") + "</button>";
    const list = '<div class="cited-list" id="' + panelId + '">' + groups.map((g) => {
      const target = byId.get(g.doc);
      return '<div class="cited-doc"><span>' + esc(target.title) + "</span>" + g.refs.map((r) => '<a href="' + href(g.doc, r.anchor) + '">' + esc(r.label) + "</a>").join("") + "</div>";
    }).join("") + "</div>";
    if (def.matches("tr")) {
      def.cells[0].insertAdjacentHTML("beforeend", "<br>" + button);
      def.insertAdjacentHTML("afterend", '<tr class="cited-row" hidden><td colspan="' + def.cells.length + '">' + list + "</td></tr>");
    } else if (def.matches("li")) {
      def.insertAdjacentHTML("beforeend", '<div class="cited">' + button + list.replace('class="cited-list"', 'class="cited-list" hidden') + "</div>");
    } else {
      let next = def.nextElementSibling;
      while (next && !/^H[1-6]$/.test(next.tagName)) next = next.nextElementSibling;
      const block = document.createElement("div");
      block.className = "cited";
      block.innerHTML = button + list.replace('class="cited-list"', 'class="cited-list" hidden');
      el.insertBefore(block, next);
    }
  }
}

const views = new Map();
function build(doc) {
  const el = document.createElement("article");
  el.className = "prose";
  let html = render(doc);
  if (!/^\\s*<h1[\\s>]/.test(html)) html = "<h1>" + esc(doc.heading) + "</h1>" + html;
  const source = '<div class="source"><span>' + icon(ICONS.file) + esc(doc.path) + "</span>" + chip(doc.status) + "</div>";
  el.innerHTML = html.replace(/(<h1[\\s\\S]*?<\\/h1>)/, "$1" + source);
  anchorHeadings(el, doc);
  markDefinitions(el, doc);
  linkIds(el);
  addCitations(el, doc);
  return el;
}

const tree = $("rp-tree");
tree.innerHTML = data.sections.map((s) => s.items.length === 1
  ? '<a href="' + href(s.items[0].id) + '" data-doc="' + esc(s.items[0].id) + '"><span>' + esc(s.title) + "</span>" + chip(s.items[0].status) + "</a>"
  : '<div class="tree-group"><div class="tree-label">' + esc(s.title) + '</div><div class="tree-links">' + s.items.map((it) =>
    '<a href="' + href(it.id) + '" data-doc="' + esc(it.id) + '" title="' + esc(it.title) + '"><span>' + esc(it.title) + "</span>" + chip(it.status) + "</a>").join("") + "</div></div>").join("");
$("rp-brand").innerHTML = "<b>" + esc(data.project || "Design package") + "</b><span>Design package</span>";
$("rp-brand").href = href(docs[0].id);
$("rp-pkg").innerHTML = chip(data.status) + (data.baseline ? '<span class="baseline">' + esc(data.baseline) + "</span>" : "");
$("rp-menu").innerHTML = icon(ICONS.menu);
$("rp-search").insertAdjacentHTML("afterbegin", icon(ICONS.search));

let current = null;
let headings = [];
function show(doc, anchor) {
  closePreview();
  closeResults();
  const changed = current !== doc;
  if (changed) {
    let el = views.get(doc.id);
    const fresh = !el;
    if (fresh) views.set(doc.id, el = build(doc));
    $("rp-doc").replaceChildren(el);
    current = doc;
    if (fresh) mermaid.run({ nodes: el.querySelectorAll("pre.mermaid"), suppressErrors: true }).then(() => setupDiagrams(el));
    else refit();
    tree.querySelectorAll("a[aria-current]").forEach((a) => a.removeAttribute("aria-current"));
    const link = tree.querySelector('[data-doc="' + CSS.escape(doc.id) + '"]');
    link.setAttribute("aria-current", "page");
    link.scrollIntoView({ block: "nearest" });
    const multi = doc.section.items.length > 1;
    $("rp-crumbs").innerHTML = multi ? "<span>" + esc(doc.section.title) + "</span>" + icon(ICONS.chevron) + "<span>" + esc(doc.title) + "</span>" : "<span>" + esc(doc.section.title) + "</span>";
    const i = docs.indexOf(doc);
    $("rp-pager").innerHTML = (docs[i - 1] ? '<a href="' + href(docs[i - 1].id) + '"><span>Previous</span><b>' + esc(docs[i - 1].title) + "</b></a>" : "") +
      (docs[i + 1] ? '<a class="next" href="' + href(docs[i + 1].id) + '"><span>Next</span><b>' + esc(docs[i + 1].title) + "</b></a>" : "");
    $("rp-foot").innerHTML = "Generated from <code>" + esc(doc.path) + "</code> on " + esc(data.generatedAt) + ". Edit the source, not this page.";
    document.title = doc.title + " · " + (data.project || "Design package");
    headings = [...el.querySelectorAll("h2")];
    if (!headings.length) headings = [...el.querySelectorAll("h3")];
    $("rp-toc").innerHTML = headings.length ? '<div class="toc-title">On this page</div>' + headings.map((h) => '<a href="' + href(doc.id, h.id) + '" data-target="' + esc(h.id) + '">' + esc(h.textContent) + "</a>").join("") : "";
  }
  const target = anchor && $("rp-doc").querySelector("#" + CSS.escape(anchor));
  if (target) {
    target.scrollIntoView({ block: "start" });
    target.classList.remove("arrived");
    void target.offsetWidth;
    target.classList.add("arrived");
  } else {
    scrollTo(0, 0);
  }
  markToc();
}
function route() {
  const raw = decodeURIComponent(location.hash.slice(1));
  const cut = raw.indexOf("/");
  const head = cut < 0 ? raw : raw.slice(0, cut);
  let anchor = cut < 0 ? "" : raw.slice(cut + 1);
  let doc = byId.get(head) || (docs.find((d) => d.section.id === head));
  if (!doc && own(head)) { doc = own(head); anchor = head; }
  show(doc || docs[0], anchor);
}
addEventListener("hashchange", route);
// The browser would restore the last scroll position after route() placed the target.
history.scrollRestoration = "manual";

let pending = false;
function markToc() {
  pending = false;
  let at = null;
  for (const h of headings) if (h.getBoundingClientRect().top < 120) at = h;
  if (!at && headings.length) at = headings[0];
  $("rp-toc").querySelectorAll("a").forEach((a) => a.toggleAttribute("aria-current", false));
  const link = at && $("rp-toc").querySelector('[data-target="' + CSS.escape(at.id) + '"]');
  if (link) link.setAttribute("aria-current", "true");
}
addEventListener("scroll", () => { if (!pending) { pending = true; requestAnimationFrame(markToc); } }, { passive: true });

const entries = [];
for (const d of docs) {
  entries.push({ label: d.title, hint: d.section.title, href: href(d.id), rank: 1 });
  for (const h of d.headings || []) if (h.level > 1 && h.level < 4 && !data.ids[h.anchor]) entries.push({ label: h.text, hint: d.title, href: href(d.id, h.anchor), rank: 2 });
}
for (const id of Object.keys(data.ids)) entries.push({ label: id, hint: byId.get(data.ids[id].doc).title, href: href(data.ids[id].doc, id), rank: 0 });
const filter = $("rp-filter");
const results = $("rp-results");
let hits = [];
let active = -1;
function paint() {
  results.innerHTML = hits.length
    ? hits.map((e, i) => '<a role="option" id="rp-hit-' + i + '" href="' + e.href + '" aria-selected="' + (i === active) + '">' + esc(e.label) + "<span>" + esc(e.hint) + "</span></a>").join("")
    : "<p>No matches.</p>";
  filter.setAttribute("aria-activedescendant", active >= 0 ? "rp-hit-" + active : "");
}
function search() {
  const q = fold(filter.value.trim());
  if (!q) { closeResults(); return; }
  hits = entries.filter((e) => fold(e.label).includes(q))
    .sort((a, b) => (fold(b.label).startsWith(q) - fold(a.label).startsWith(q)) || a.rank - b.rank)
    .slice(0, 12);
  active = hits.length ? 0 : -1;
  results.hidden = false;
  filter.setAttribute("aria-expanded", "true");
  paint();
}
function closeResults() { results.hidden = true; filter.setAttribute("aria-expanded", "false"); }
filter.addEventListener("input", search);
filter.addEventListener("focus", () => { if (filter.value.trim()) search(); });
filter.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeResults(); filter.blur(); return; }
  if (results.hidden || !hits.length) return;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); active = (active + (e.key === "ArrowDown" ? 1 : hits.length - 1)) % hits.length; paint(); }
  if (e.key === "Enter" && active >= 0) { e.preventDefault(); location.hash = hits[active].href; closeResults(); filter.blur(); }
});
results.addEventListener("click", () => { closeResults(); filter.blur(); });
document.addEventListener("click", (e) => { if (!e.target.closest(".search")) closeResults(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !e.target.closest("input, textarea")) { e.preventDefault(); filter.focus(); }
});

const preview = $("rp-preview");
const canHover = matchMedia("(hover: hover)").matches;
let timer = null;
let anchorLink = null;
function openPreview(a) {
  const def = data.ids[a.dataset.id];
  preview.innerHTML = '<div class="preview-head"><b>' + esc(a.dataset.id) + "</b><span>" + esc(byId.get(def.doc).title) + "</span></div>" + marked.parse(def.preview || "");
  preview.hidden = false;
  const box = a.getBoundingClientRect();
  const w = preview.offsetWidth, h = preview.offsetHeight;
  const below = box.bottom + 10 + h < innerHeight;
  preview.style.left = Math.max(12, Math.min(box.left, innerWidth - w - 12)) + "px";
  preview.style.top = (below ? box.bottom + 10 : Math.max(12, box.top - h - 10)) + "px";
  a.setAttribute("aria-describedby", "rp-preview");
  anchorLink = a;
}
function closePreview() {
  clearTimeout(timer);
  preview.hidden = true;
  if (anchorLink) anchorLink.removeAttribute("aria-describedby");
  anchorLink = null;
}
const main = $("rp-main");
if (canHover) {
  main.addEventListener("pointerover", (e) => { const a = e.target.closest("a.idref"); if (!a || a === anchorLink) return; clearTimeout(timer); timer = setTimeout(() => openPreview(a), 140); });
  main.addEventListener("pointerout", (e) => { if (e.target.closest("a.idref") && !e.relatedTarget?.closest?.("a.idref")) closePreview(); });
}
main.addEventListener("focusin", (e) => { const a = e.target.closest("a.idref"); if (a) openPreview(a); });
main.addEventListener("focusout", (e) => { if (e.target.closest("a.idref")) closePreview(); });
addEventListener("scroll", closePreview, { passive: true });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePreview(); });

main.addEventListener("click", (e) => {
  closePreview();
  const toggle = e.target.closest(".cited-toggle");
  if (toggle) {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    const panel = document.getElementById(toggle.getAttribute("aria-controls"));
    (panel.closest(".cited-row") || panel).hidden = !open;
    return;
  }
  const zoom = e.target.closest("[data-zoom]");
  if (!zoom) return;
  const fig = zoom.closest("figure");
  const action = zoom.dataset.zoom;
  if (action === "full") {
    if (document.fullscreenElement) document.exitFullscreen(); else fig.requestFullscreen().catch(() => {});
    return;
  }
  const scale = +fig.dataset.scale;
  zoomTo(fig, action === "fit" ? fitScale(fig) : scale * (action === "in" ? 1.25 : 0.8), action === "fit");
});
document.addEventListener("fullscreenchange", () => requestAnimationFrame(refit));
let resizing = null;
addEventListener("resize", () => { clearTimeout(resizing); resizing = setTimeout(refit, 150); });
main.addEventListener("click", (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (link && link.getAttribute("href") === location.hash) route();
});

const MODES = ["auto", "light", "dark"];
const themeButton = $("rp-theme");
function applyTheme(mode) {
  if (mode === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = mode;
  themeButton.innerHTML = icon(ICONS[mode]);
  themeButton.setAttribute("aria-label", "Theme: " + mode);
  themeButton.title = "Theme: " + mode;
  try { localStorage.setItem("render-package-theme", mode); } catch {}
}
let mode = "auto";
try { mode = localStorage.getItem("render-package-theme") || "auto"; } catch {}
applyTheme(MODES.includes(mode) ? mode : "auto");
themeButton.addEventListener("click", () => applyTheme(MODES[(MODES.indexOf(document.documentElement.dataset.theme || "auto") + 1) % MODES.length]));

const menu = $("rp-menu");
menu.addEventListener("click", () => { const open = document.body.classList.toggle("nav-open"); menu.setAttribute("aria-expanded", String(open)); });
tree.addEventListener("click", (e) => { if (e.target.closest("a")) { document.body.classList.remove("nav-open"); menu.setAttribute("aria-expanded", "false"); } });

mermaid.initialize({ startOnLoad: false, securityLevel: "antiscript", theme: "neutral", fontFamily: getComputedStyle(document.body).fontFamily });
if (docs.length) document.fonts.ready.then(route);
else $("rp-doc").innerHTML = '<p class="note">' + icon(ICONS.info) + "The manifest declares no applicable sources.</p>";
})();
</script>
</body>
</html>
`;
}

// The fingerprint covers the sources and this generator, not the date, so an unchanged package is
// not rewritten and does not create a diff on every commit.
export function outputPath(root, project) {
  const name = String(project ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return join(root, "docs", "site", `${name || "package"}-architecture.html`);
}

export function render(root, out) {
  const data = collect(root);
  out ??= outputPath(root, data.project);
  const fingerprint = createHash("sha256").update(JSON.stringify(data)).update(LIBRARIES.join()).update(FONT)
    .update(read(fileURLToPath(import.meta.url))).digest("hex").slice(0, 16);
  if (existsSync(out) && read(out).includes(`render-package ${fingerprint}"`)) return { out, changed: false };
  data.generatedAt = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page(data, fingerprint));
  return { out, changed: true };
}

export function isSource(root, file) {
  const rel = slash(relative(root, file));
  return rel.startsWith("docs/") && !rel.startsWith("docs/site/");
}

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
}

export function installGitHook(root) {
  const top = git(root, "rev-parse", "--show-toplevel");
  const hook = resolve(top, git(root, "rev-parse", "--git-path", "hooks/pre-commit"));
  if (existsSync(hook) && !read(hook).includes(HOOK_MARKER)) {
    throw new Error(`${hook} already exists and was not written by render-package; add this line to it instead:\nnode "${slash(fileURLToPath(import.meta.url))}" --pre-commit .`);
  }
  const packageDir = slash(relative(top, root)) || ".";
  mkdirSync(dirname(hook), { recursive: true });
  writeFileSync(hook, `#!/bin/sh\n${HOOK_MARKER}\nexec node "${slash(fileURLToPath(import.meta.url))}" --pre-commit "$(git rev-parse --show-toplevel)/${packageDir}"\n`, { mode: 0o755 });
  return hook;
}

function preCommit(root) {
  const top = git(root, "rev-parse", "--show-toplevel");
  const staged = git(root, "diff", "--cached", "--name-only").split("\n").filter(Boolean);
  if (!staged.some((f) => isSource(root, join(top, f)))) return;
  const { out } = render(root);
  git(root, "add", "--", out);
}

function watchPackage(root) {
  let timer = null;
  const rebuild = () => {
    try { const { out, changed } = render(root); if (changed) console.log(`rebuilt ${slash(relative(root, out))}`); } catch (error) { console.error(error.message); }
  };
  rebuild();
  watch(join(root, "docs"), { recursive: true }, (_event, name) => {
    if (!name || !isSource(root, join(root, "docs", name))) return;
    clearTimeout(timer);
    timer = setTimeout(rebuild, 300);
  });
  console.log(`watching ${slash(join(root, "docs"))}; Ctrl+C to stop`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const root = resolve(args.find((a) => !a.startsWith("--")) ?? ".");
  try {
    if (args.includes("--watch")) watchPackage(root);
    else if (args.includes("--pre-commit")) preCommit(root);
    else if (args.includes("--install-git-hook")) console.log(`installed ${installGitHook(root)}`);
    else { const { out, changed } = render(root); console.log(`${changed ? "wrote" : "unchanged"} ${slash(out)}`); }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
