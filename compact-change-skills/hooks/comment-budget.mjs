#!/usr/bin/env node
// Per-comment review lets every edit pass on its own while the file ends up as prose.
//
// It does NOT measure density: Sonar published that rule (25% minimum), deprecated it and
// removed it in 10.0; no linter enforces a maximum density; and the DTOs in Microsoft's official
// OpenAPI sample run at 2.0-2.5 doc lines per code line.
//
// It flags two things, both with empirical backing:
//   1. Long doc blocks WITHOUT tags. Tagged docs are contract (OpenAPI schema.Description,
//      dartdoc, rustdoc doctests, FastAPI description) and are never touched.
//   2. Section-header banners.
// Inline comments are not inspected: measured across 20 repos and npm they stay at a p90 of 2-4 lines.
//
// Opt-in: the edit hook only runs when CHANGESMITH_COMMENT_BUDGET=1.
// Recalibrate:  node comment-budget.mjs --calibrate <dir> [min-flags]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// npm (9,439 .ts blocks): p75=19 words, p90=41. PMD CommentSize, the only maximum in a
// mainstream linter, is 6 lines. Pascarella (MSR 2017): a real SUMMARY comment averages 1.4 lines.
const MAX_WORDS = 40;
const TAG = /<(summary|param|returns|remarks|response|typeparam|exception|value|inheritdoc|example)\b|@(param|returns?|throws|template|typeParam|deprecated|example|see|link|arg|type|property|remarks)\b|^\s*(Args|Returns|Raises|Yields|Attributes|Parameters|Examples?)\s*:|:(param|returns?|rtype|raises)\b/im;
const BANNER = /[─━—═*=~#-]{6,}/;
// The Spanish marker is the pre-rename spelling; files carrying it stay exempt.
const EXEMPT = /(comment-budget:\s*exempt|presupuesto-comentarios:\s*exento)/;
const HASH = new Set(['.py', '.rb']);
const EXT = /\.(ts|tsx|js|jsx|mjs|cjs|cs|py|dart|java|go|rs|kt|rb|php|swift)$/i;
// Codegen: nobody who could fix its volume decides it.
const GENERATED = /\.(d\.ts|min\.[jt]s|g\.cs|designer\.cs|g\.dart|freezed\.dart|mocks\.dart|pb\.dart|pb2\.py|generated\.[a-z]+)$|(^|[\/])(app_localizations[^\/]*\.dart|migrations)$/i;

export function review(text, ext) {
  const L = text.split(/\r?\n/);
  if (L.slice(0, 5).some(l => EXEMPT.test(l))) return [];
  const hash = HASH.has(ext);
  const flags = [];
  let i = 0;
  while (i < L.length) {
    const t = L[i].trim();
    if (!t) { i++; continue; }
    let doc = false, end = i, docstring = false;

    if (hash) {
      const m = t.match(/^[rbuf]*("""|''')/i);
      if (m) {
        doc = true; docstring = true;
        const q = m[1], rest = t.slice(t.indexOf(q) + 3);
        if (rest.includes(q)) end = i + 1;
        else { end = i + 1; while (end < L.length && !L[end].includes(q)) end++; end++; }
      } else if (/^#/.test(t) && !/^#!/.test(t)) {
        end = i; while (end < L.length && /^\s*#/.test(L[end])) end++;
        if (BANNER.test(L.slice(i, end).join('\n'))) flags.push([i + 1, 'section header']);
        i = end; continue;
      }
    } else if (/^\/\/\//.test(t)) {
      doc = true; while (end < L.length && /^\s*\/\/\//.test(L[end])) end++;
    } else if (/^\/\*\*/.test(t)) {
      doc = true; while (end < L.length && !/\*\//.test(L[end])) end++; end++;
    } else if (/^\/[/*]/.test(t)) {
      if (/^\/\*/.test(t)) { while (end < L.length && !/\*\//.test(L[end])) end++; end++; }
      else { while (end < L.length && /^\s*\/\//.test(L[end])) end++; }
      if (BANNER.test(L.slice(i, end).join('\n'))) flags.push([i + 1, 'section header']);
      i = end; continue;
    }

    if (!doc) { i++; continue; }
    const body = L.slice(i, end).join('\n');
    if (BANNER.test(body)) flags.push([i + 1, 'section header']);
    else if (!TAG.test(body)) {
      const clean = body.replace(/\/\*\*|\*\/|\*|\/\/\/|"""|'''/g, ' ');
      const n = (clean.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}/g) ?? []).length;
      if (n > MAX_WORDS) flags.push([i + 1, `${docstring ? 'docstring' : 'doc block'} of ${n} words without a single tag`]);
    }
    i = end;
  }
  return flags;
}

function* sourceFiles(d) {
  let e; try { e = readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const x of e) {
    if (/^(node_modules|\.git|dist|build|out|bin|obj|\.angular|\.next|coverage|venv|\.venv|__pycache__|vendor)$/.test(x.name)) continue;
    const p = join(d, x.name);
    try { if (x.isDirectory()) yield* sourceFiles(p); else if (EXT.test(x.name) && !GENERATED.test(basename(p)) && statSync(p).size < 1e6) yield p; } catch {}
  }
}

function calibrate(dir, min) {
  let total = 0, flagged = 0, files = 0;
  for (const f of sourceFiles(dir)) {
    let t; try { t = readFileSync(f, 'utf8'); } catch { continue; }
    const fl = review(t, extname(f).toLowerCase());
    files++; total += t.split('\n').length; flagged += fl.length;
    if (fl.length >= min) console.log(`${String(fl.length).padStart(3)}  ${f}`);
  }
  console.log(`\n${files} files, ${total} lines, ${flagged} blocks flagged (1 per ${Math.round(total / (flagged || 1))} lines)`);
}

function checkEditedFile() {
  if (process.env.CHANGESMITH_COMMENT_BUDGET !== '1') return;
  const path = JSON.parse(readFileSync(0, 'utf8'))?.tool_input?.file_path ?? '';
  if (!EXT.test(path) || GENERATED.test(basename(path))) return;
  let text; try { text = readFileSync(path, 'utf8'); } catch { return; }
  const flags = review(text, extname(path).toLowerCase());
  if (!flags.length) return;
  console.error(
    `COMMENTS OVER BUDGET in ${path}\n` +
    flags.map(([l, m]) => `  line ${l}: ${m}`).join('\n') +
    `\n\nDelete or shorten these blocks NOW, in this same pass. Do not rewrite code.\n` +
    `An untagged doc describes what the symbol does in one sentence; if it needs paragraphs,\n` +
    `the rationale does not belong in source or belongs in an ADR. Section headers are always deleted.\n` +
    `Tagged docs (<summary>, @param, Args:) are OpenAPI/dartdoc contract: leave them alone.\n` +
    `If the USER asked for that density, do not delete: tell them the hook flagged it and ask\n` +
    `for confirmation to put "comment-budget: exempt — <reason>" in the file header.`
  );
  process.exit(2);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--calibrate') calibrate(process.argv[3] ?? '.', Number(process.argv[4]) || 1);
  else try { checkEditedFile(); } catch { process.exit(0); }
}
