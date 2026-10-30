#!/usr/bin/env node
// Line-based on purpose: the plugin ships no dependencies, so there is no YAML parser.
// It relies on the layout of references/manifest-template.yaml (schema_version 3).
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const TOP_LEVEL_KEYS = new Set([
  "schema_version", "project", "status", "review", "read_first", "authoritative_sources",
  "not_applicable", "change_folders", "checks", "cross_repo_dependencies", "nature",
  "superseded_documents", "rules",
]);
const PACKAGE_STATUSES = new Set([
  "draft", "ready_for_review", "needs_reconciliation", "ready_for_verification",
  "approved", "blocked", "escalate",
]);
const ADR_STATUSES = new Set(["Proposed", "Accepted", "Superseded", "Rejected"]);
const DECISION_STATUSES = new Set(["Open", "Decided"]);
const BOUNDARIES = new Set(["inside", "outside"]);
const CONTAINER_STATES = new Set(["exists", "to_create"]);
const RELATION_KINDS = new Set(["public", "deploy", "private", "dependency", "internal", "telemetry", "local"]);
const SEVERITIES = new Set(["BLOCKER", "MAJOR", "MINOR", "NOTE"]);
const FINDING_STATUSES = new Set([
  "OPEN", "READY_FOR_VERIFICATION", "RESOLVED", "ACCEPTED", "INVALID", "BLOCKED",
]);
const PRD_ID = /\b(?:FR|NFR|BR|CON|PD)-\d{3}\b/g;
const ADR_ID = /\bADR-\d{3}\b/g;
const SKIPPED_DIRS = new Set(["node_modules", ".git"]);

function read(path) {
  return path && existsSync(path) ? readFileSync(path, "utf8").replace(/^﻿/, "") : null;
}

function scalar(raw) {
  return raw.replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, "");
}

export function parseManifest(text) {
  const manifest = {
    topKeys: [], schema: null, project: null, status: null, sources: {}, notApplicable: [],
    readFirst: [], ledger: null, baseline: null, changeFolders: null,
  };
  let section = null;
  let source = null;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*(#|$)/.test(line)) continue;
    const top = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (top) {
      section = top[1];
      const value = scalar(top[2]);
      manifest.topKeys.push(section);
      if (section === "schema_version") manifest.schema = value;
      if (section === "status") manifest.status = value;
      if (section === "project") manifest.project = value;
      if (section === "change_folders") manifest.changeFolders = value;
      if (section === "not_applicable" && value.startsWith("[")) {
        manifest.notApplicable.push(...value.slice(1, -1).split(",").map((s) => s.trim()));
      }
      continue;
    }
    if (section === "authoritative_sources") {
      const key = line.match(/^ {2}([A-Za-z_]+):\s*$/);
      if (key) source = manifest.sources[key[1]] = { path: null, view: null };
      const path = line.match(/^ {4}path:\s*(.+)$/);
      if (path && source) source.path = scalar(path[1]);
      const view = line.match(/^ {4}view:\s*(.+)$/);
      if (view && source) source.view = scalar(view[1]);
    }
    if (section === "review") {
      const ledger = line.match(/^ {2}ledger:\s*(.+)$/);
      if (ledger) manifest.ledger = scalar(ledger[1]);
      const baseline = line.match(/^ {2}baseline_id:\s*(.+)$/);
      if (baseline) manifest.baseline = scalar(baseline[1]);
    }
    const item = line.match(/^\s+-\s*(?:key:\s*)?([^\s:#]+)/);
    if (item && section === "not_applicable") manifest.notApplicable.push(item[1]);
    if (item && section === "read_first") manifest.readFirst.push(item[1]);
  }
  return manifest;
}

function section(markdown, headingPattern) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((l) => /^## /.test(l) && headingPattern.test(l));
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^## /.test(l));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

function tableRows(markdown, headingPattern) {
  return (section(markdown, headingPattern) ?? "").split(/\r?\n/)
    .filter((l) => /^\s*\|/.test(l))
    .slice(2)
    .map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim().replace(/^`|`$/g, "")));
}

const pending = (cell) => /^to confirm\b/i.test(cell ?? "");

function checkArchitecture(text, viewText, viewLabel, fail) {
  const containers = tableRows(text, /^## Containers\b/);
  const relations = tableRows(text, /^## Relations\b/);
  const ids = new Set();
  for (const [id] of tableRows(text, /^## People\b/)) {
    if (ids.has(id)) fail("architecture", `${id} is defined twice`);
    ids.add(id);
  }
  for (const [id, , , , , boundary, state] of containers) {
    if (ids.has(id)) fail("architecture", `${id} is defined twice`);
    ids.add(id);
    if (!BOUNDARIES.has(boundary) && !pending(boundary)) fail("architecture", `${id}: boundary not inside/outside: ${boundary}`);
    if (!CONTAINER_STATES.has(state) && !pending(state)) fail("architecture", `${id}: state not exists/to_create: ${state}`);
  }
  const edges = new Set();
  for (const [from, to, , , kind] of relations) {
    for (const end of [from, to]) {
      if (!ids.has(end)) fail("architecture", `relation ${from} -> ${to} names ${end}, which is not a person or container`);
    }
    if (!RELATION_KINDS.has(kind) && !pending(kind)) fail("architecture", `relation ${from} -> ${to}: kind not in ${[...RELATION_KINDS].join("/")}: ${kind}`);
    edges.add(`${from}>${to}`);
  }
  if (viewText === null) return;
  // The template documents the attributes in an HTML comment; only drawn elements count.
  const markup = viewText.replace(/<!--[\s\S]*?-->/g, "");
  // Only the containers view maps one to one to the tables; context and component views summarize.
  const hasViews = /<svg\b[^>]*\bdata-view="/.test(markup);
  const drawn = hasViews ? markup.match(/<svg\b[^>]*\bdata-view="containers"[\s\S]*?<\/svg>/)?.[0] ?? null : markup;
  if (drawn === null) {
    fail("architecture-view", `${viewLabel} has views but no data-view="containers"`);
    return;
  }
  const drawnNodes = new Set([...drawn.matchAll(/data-node="([^"]+)"/g)].map((m) => m[1]));
  const drawnEdges = new Set([...drawn.matchAll(/data-edge="([^"]+)"/g)].map((m) => m[1].replace(/&gt;/g, ">")));
  for (const id of ids) if (!drawnNodes.has(id)) fail("architecture-view", `${viewLabel} does not draw ${id}`);
  for (const id of drawnNodes) if (!ids.has(id)) fail("architecture-view", `${viewLabel} draws ${id}, which is not a person or container`);
  for (const edge of edges) if (!drawnEdges.has(edge)) fail("architecture-view", `${viewLabel} does not draw relation ${edge.replace(">", " -> ")}`);
  for (const edge of drawnEdges) if (!edges.has(edge)) fail("architecture-view", `${viewLabel} draws ${edge.replace(">", " -> ")}, which is not a relation`);
}

function changesDir(root, folder) {
  return join(root, ...(folder || "docs/changes/").split("/").filter(Boolean));
}

function changeSpecs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((name) => join(dir, name, "spec.md"))
    .filter((path) => existsSync(path));
}

function filesUnder(path) {
  if (!path || !existsSync(path)) return [];
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) return [];
  if (!stat.isDirectory()) return [path];
  return readdirSync(path)
    .filter((name) => !SKIPPED_DIRS.has(name))
    .flatMap((name) => filesUnder(join(path, name)));
}

function adrId(file, text) {
  return text.match(/^#\s*(ADR-\d{3})\b/m)?.[1] ?? file.match(/ADR-\d{3}/)?.[0] ?? null;
}

const mentions = (text, id) => new RegExp(`\\b${id}\\b`).test(text);

export function checkPackage(root) {
  const errors = [];
  const fail = (check, message) => errors.push(`[${check}] ${message}`);
  const label = (file) => file.slice(root.length + 1).replace(/\\/g, "/");

  const manifestText = read(join(root, "docs", "spec", "manifest.yaml"));
  if (manifestText === null) {
    fail("manifest", "docs/spec/manifest.yaml not found");
    return { skipped: false, schema: null, errors };
  }
  const manifest = parseManifest(manifestText);
  if (manifest.schema !== "3") return { skipped: true, schema: manifest.schema, errors };

  for (const key of manifest.topKeys) {
    if (!TOP_LEVEL_KEYS.has(key)) fail("manifest-keys", `key outside the template: ${key}`);
  }
  if (!PACKAGE_STATUSES.has(manifest.status)) {
    fail("manifest-status", `invalid status: ${manifest.status}`);
  }

  const applicable = Object.entries(manifest.sources)
    .filter(([key, source]) => source.path && !manifest.notApplicable.includes(key));
  for (const [key, source] of applicable) {
    if (!existsSync(join(root, source.path))) fail("paths", `${key}: ${source.path} does not exist`);
    if (source.view && !existsSync(join(root, source.view))) fail("paths", `${key}: view ${source.view} does not exist`);
  }
  // superseded_documents are not checked: a milestone may delete them once they are replaced.
  for (const path of manifest.readFirst) {
    if (!existsSync(join(root, path))) fail("paths", `read_first: ${path} does not exist`);
  }
  const pathOf = (key) => {
    const source = applicable.find(([k]) => k === key);
    return source ? join(root, source[1].path) : null;
  };

  for (const doc of ["docs/product/brief.md", "docs/product/prd.md", "docs/build/plan.md"]) {
    const text = read(join(root, doc));
    if (text && /^Status:/m.test(text)) fail("status-lines", `${doc} still has a Status: line`);
  }

  // A Structurizr .dsl authority from an older package is validated by the Structurizr CLI, not here.
  const architecture = applicable.find(([key]) => key === "architecture")?.[1];
  const architectureText = architecture?.path.endsWith(".md") ? read(join(root, architecture.path)) : null;
  if (architectureText !== null) {
    const viewText = architecture.view ? read(join(root, architecture.view)) : null;
    checkArchitecture(architectureText, viewText, architecture.view, fail);
  }

  const adrFiles = filesUnder(pathOf("architecture_decisions"));
  const adrs = new Map();
  for (const file of adrFiles) {
    const text = read(file);
    const id = adrId(file, text);
    if (!id) continue;
    const status = text.match(/^Status:\s*(\S+)/m)?.[1];
    adrs.set(id, status);
    if (!ADR_STATUSES.has(status)) fail("adr", `${id}: invalid status ${status}`);
    if (status === "Accepted" && !/^Accepted by:\s*\S.*«.+»/m.test(text)) {
      fail("adr", `${id}: Accepted without an "Accepted by" line with a quote`);
    }
  }

  const prd = read(pathOf("product")) ?? "";
  const prdIds = new Set(prd.match(PRD_ID) ?? []);
  const specs = changeSpecs(changesDir(root, manifest.changeFolders));
  const planPath = join(root, "docs", "build", "plan.md");
  const authorityKeys = applicable.map(([key]) => key).filter((key) => key !== "product");
  // AC/TST IDs are not checked: compact-change 2.2 keeps them local to each change folder.
  const citing = [...authorityKeys.flatMap((key) => filesUnder(pathOf(key))), planPath, ...specs]
    .filter((file) => existsSync(file));
  for (const file of citing) {
    const text = read(file);
    for (const id of new Set(text.match(PRD_ID) ?? [])) {
      if (!prdIds.has(id)) fail("ids", `${label(file)} cites ${id}, which the PRD does not define`);
    }
    for (const id of new Set(text.match(ADR_ID) ?? [])) {
      if (!adrs.has(id)) fail("ids", `${label(file)} cites ${id}, which has no ADR file`);
    }
  }
  // A plan may legitimately wait on a Proposed ADR, so only authorities are held to this rule.
  const adrSet = new Set(adrFiles);
  for (const key of ["product", ...authorityKeys]) {
    for (const file of filesUnder(pathOf(key)).filter((f) => !adrSet.has(f))) {
      for (const id of new Set(read(file).match(ADR_ID) ?? [])) {
        if (adrs.get(id) === "Proposed") {
          fail("adr", `${label(file)} relies on ${id}, which is still Proposed`);
        }
      }
    }
  }

  const decisions = section(prd, /Product Decisions/i) ?? "";
  for (const row of decisions.split(/\r?\n/).filter((l) => /^\|\s*PD-\d{3}/.test(l))) {
    const [, id, , status] = row.split("|").map((cell) => cell.trim());
    if (!DECISION_STATUSES.has(status)) fail("enums", `PRD §15 ${id} status not Open/Decided: ${status}`);
  }

  const mvpIn = (section(prd, /MVP/i) ?? "").split(/^###\s+Out\b/m)[0];
  const mvpFrs = new Set(mvpIn.match(/\bFR-\d{3}\b/g) ?? []);
  if (prd && mvpFrs.size === 0) fail("mvp", "the PRD MVP section cites no FR IDs");
  const plan = read(planPath);
  if (plan !== null) {
    const coverage = [plan, ...specs.map((f) => read(f))].join("\n");
    for (const id of mvpFrs) {
      if (!mentions(coverage, id)) fail("mvp", `${id} is in the MVP but in no milestone or change spec`);
    }
  }

  const ledger = read(join(root, manifest.ledger ?? "docs/design/review.md"));
  if (ledger !== null) {
    for (const [, value] of ledger.matchAll(/^- Severity:\s*`?([^`\s]+)/gm)) {
      if (!SEVERITIES.has(value)) fail("enums", `review ledger severity not in English enum: ${value}`);
    }
    for (const [, value] of ledger.matchAll(/^- Status:\s*`?([^`\s]+)/gm)) {
      if (!FINDING_STATUSES.has(value)) fail("enums", `review ledger status not in English enum: ${value}`);
    }
  }

  return { skipped: false, schema: manifest.schema, errors };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = resolve(process.argv[2] ?? ".");
  const { skipped, schema, errors } = checkPackage(root);
  if (skipped) {
    console.log(`Skipped: the manifest declares schema_version ${schema ?? "(none)"}, not 3.`);
  } else if (errors.length) {
    console.error(errors.join("\n"));
    console.error(`${errors.length} problem(s) found.`);
    process.exit(1);
  } else {
    console.log("Package checks passed.");
  }
}
