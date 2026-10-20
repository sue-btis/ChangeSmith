#!/usr/bin/env node
// La regla 9 filtra comentario por comentario: cada edicion pasa sola y el archivo acaba en prosa.
//
// NO mide densidad. Medirla es indefendible: Sonar publico esa regla (25% minimo), la deprecio y
// la borro en 10.0; ningun linter de ningun lenguaje impone un maximo de densidad; y los DTO del
// sample oficial de OpenAPI de Microsoft corren a 2.0-2.5 lineas de doc por linea de codigo.
//
// Marca dos cosas, ambas con respaldo empirico:
//   1. Bloque de doc SIN tags y largo. Los doc con tag son contrato (schema.Description de
//      OpenAPI, dartdoc, doctests de rustdoc, description de FastAPI) y no se tocan jamas.
//   2. Cabeceras de seccion. Prohibidas por la regla 9, sin ambiguedad.
// Los comentarios inline no se miran: medidos en 20 repos y en npm dan p90 de 2-4 lineas siempre.
//
// Recalibrar:  node presupuesto-comentarios.mjs --calibrar <dir>
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

// npm publicado (9.439 bloques .ts): p75=19 palabras, p90=41. La rama que motivo esto: p75=40.
// PMD CommentSize, el unico maximo que existe en un linter mainstream: 6 lineas.
// Pascarella (MSR 2017): un comentario SUMMARY real promedia 1.4 lineas.
const MAX_PALABRAS = 40;
const TAG = /<(summary|param|returns|remarks|response|typeparam|exception|value|inheritdoc|example)\b|@(param|returns?|throws|template|typeParam|deprecated|example|see|link|arg|type|property|remarks)\b|^\s*(Args|Returns|Raises|Yields|Attributes|Parameters|Examples?)\s*:|:(param|returns?|rtype|raises)\b/im;
const BANNER = /[─━—═*=~#-]{6,}/;
const EXENCION = /presupuesto-comentarios:\s*exento/;
const HASH = new Set(['.py', '.rb']);
const EXT = /\.(ts|tsx|js|jsx|mjs|cjs|cs|py|dart|java|go|rs|kt|rb|php|swift)$/i;
// Codegen: su volumen no lo decide nadie que pueda arreglarlo.
const GENERADO = /\.(d\.ts|min\.[jt]s|g\.cs|designer\.cs|g\.dart|freezed\.dart|mocks\.dart|pb\.dart|pb2\.py|generated\.[a-z]+)$|(^|[\/])(app_localizations[^\/]*\.dart|migrations)$/i;

function revisar(texto, ext) {
  const L = texto.split(/\r?\n/);
  if (L.slice(0, 5).some(l => EXENCION.test(l))) return [];
  const hash = HASH.has(ext);
  const faltas = [];
  let i = 0;
  while (i < L.length) {
    const t = L[i].trim();
    if (!t) { i++; continue; }
    let doc = false, fin = i, doble = false;

    if (hash) {
      const m = t.match(/^[rbuf]*("""|''')/i);
      if (m) {
        doc = true; doble = true;
        const q = m[1], resto = t.slice(t.indexOf(q) + 3);
        if (resto.includes(q)) fin = i + 1;
        else { fin = i + 1; while (fin < L.length && !L[fin].includes(q)) fin++; fin++; }
      } else if (/^#/.test(t) && !/^#!/.test(t)) {
        fin = i; while (fin < L.length && /^\s*#/.test(L[fin])) fin++;
        if (BANNER.test(L.slice(i, fin).join('\n'))) faltas.push([i + 1, 'cabecera de seccion']);
        i = fin; continue;
      }
    } else if (/^\/\/\//.test(t)) {
      doc = true; while (fin < L.length && /^\s*\/\/\//.test(L[fin])) fin++;
    } else if (/^\/\*\*/.test(t)) {
      doc = true; while (fin < L.length && !/\*\//.test(L[fin])) fin++; fin++;
    } else if (/^\/[/*]/.test(t)) {
      if (/^\/\*/.test(t)) { while (fin < L.length && !/\*\//.test(L[fin])) fin++; fin++; }
      else { while (fin < L.length && /^\s*\/\//.test(L[fin])) fin++; }
      if (BANNER.test(L.slice(i, fin).join('\n'))) faltas.push([i + 1, 'cabecera de seccion']);
      i = fin; continue;
    }

    if (!doc) { i++; continue; }
    const cuerpo = L.slice(i, fin).join(' ');
    if (BANNER.test(cuerpo)) faltas.push([i + 1, 'cabecera de seccion']);
    else if (!TAG.test(cuerpo)) {
      const limpio = cuerpo.replace(/\/\*\*|\*\/|\*|\/\/\/|"""|'''/g, ' ');
      const n = (limpio.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}/g) ?? []).length;
      if (n > MAX_PALABRAS) faltas.push([i + 1, `${doble ? 'docstring' : 'bloque doc'} de ${n} palabras sin un solo tag`]);
    }
    i = fin;
  }
  return faltas;
}

function* archivos(d) {
  let e; try { e = readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const x of e) {
    if (/^(node_modules|\.git|dist|build|out|bin|obj|\.angular|\.next|coverage|venv|\.venv|__pycache__|vendor)$/.test(x.name)) continue;
    const p = join(d, x.name);
    try { if (x.isDirectory()) yield* archivos(p); else if (EXT.test(x.name) && !GENERADO.test(basename(p)) && statSync(p).size < 1e6) yield p; } catch {}
  }
}

if (process.argv[2] === '--calibrar') {
  const MIN = Number(process.argv[4]) || 1;
  let tot = 0, mal = 0, arch = 0;
  for (const f of archivos(process.argv[3] ?? '.')) {
    let t; try { t = readFileSync(f, 'utf8'); } catch { continue; }
    const fa = revisar(t, extname(f).toLowerCase());
    arch++; tot += t.split('\n').length; mal += fa.length;
    if (fa.length >= MIN) console.log(`${String(fa.length).padStart(3)}  ${f}`);
  }
  console.log(`\n${arch} archivos, ${tot} lineas, ${mal} bloques marcados (1 cada ${Math.round(tot / (mal || 1))} lineas)`);
  process.exit(0);
}

const ruta = JSON.parse(readFileSync(0, 'utf8'))?.tool_input?.file_path ?? '';
if (!EXT.test(ruta) || GENERADO.test(basename(ruta))) process.exit(0);
let texto; try { texto = readFileSync(ruta, 'utf8'); } catch { process.exit(0); }
const faltas = revisar(texto, extname(ruta).toLowerCase());
if (!faltas.length) process.exit(0);

console.error(
  `COMENTARIOS FUERA DE PRESUPUESTO en ${ruta}\n` +
  faltas.map(([l, m]) => `  linea ${l}: ${m}`).join('\n') +
  `\n\nBorra o reduce esos bloques AHORA, en esta misma pasada. No reescribas codigo.\n` +
  `Un doc sin tags describe que hace el simbolo en una frase; si necesita parrafos, el rationale\n` +
  `sobra o pertenece a un ADR. Cabeceras de seccion: se borran siempre.\n` +
  `NO se tocan los doc con tags (<summary>, @param, Args:): son contrato de OpenAPI/dartdoc.\n` +
  `Si el USUARIO pidio esa densidad, no borres: dile que el hook lo marco y pide confirmacion\n` +
  `para poner "presupuesto-comentarios: exento — <razon>" en la cabecera del archivo.`
);
process.exit(2);
