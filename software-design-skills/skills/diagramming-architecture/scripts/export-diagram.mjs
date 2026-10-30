#!/usr/bin/env node
// Exports each view of the diagram page to a standalone SVG and, optionally, a PNG:
//   node export-diagram.mjs diagram.html <out-dir> [--png] [--scale 2]
// writes <out-dir>/<view>.svg (and .png). Each SVG carries the stylesheet, the shared icons and
// the light palette resolved inside it, so it opens in any browser, Figma or Illustrator.
// PNGs are rasterized with headless Chrome or Edge.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CSS_START = "/* ---------- diagram text ----------";
const CSS_END = ".foot {";

const BROWSERS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/microsoft-edge",
];

export function buildSvgs(html) {
  const start = html.indexOf(CSS_START);
  const end = html.indexOf(CSS_END, start);
  if (start === -1 || end === -1) {
    throw new Error(`the page needs a style block that starts with "${CSS_START}" and ends before "${CSS_END}"`);
  }
  // The first :root block is the light palette; resolving it on the svg element keeps the
  // exported file self-contained and in step with the page without a second copy of the tokens.
  const tokens = html.match(/:root\s*\{([^}]*)\}/)?.[1];
  if (!tokens) throw new Error("the page has no :root block with the palette");
  // The template documents its own markup in an HTML comment; only real elements count.
  const markup = html.replace(/<!--[\s\S]*?-->/g, "");
  const defs = markup.match(/<svg class="defs"[^>]*>([\s\S]*?)<\/svg>/)?.[1].trim() ?? "";
  const views = [...markup.matchAll(/<svg\b([^>]*\bviewBox="0 0 (\d+) (\d+)"[^>]*)>([\s\S]*?)<\/svg>/g)];
  if (!views.length) throw new Error('the page has no <svg viewBox="0 0 W H">');
  return views.map(([, attributes, width, height, body]) => {
    // Older renderers (Office) only read xlink:href.
    const inner = `${defs}\n${body}`.replace(/<use href="#([\w-]+)"/g, '<use xlink:href="#$1" href="#$1"');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <style>
    svg {${tokens} background: #FFFFFF; }
    ${html.slice(start, end).trimEnd()}
  </style>
  <rect x="0" y="0" width="${width}" height="${height}" fill="#FFFFFF"/>
${inner}</svg>
`;
    const view = attributes.match(/data-view="([\w-]+)"/)?.[1] ?? "diagram";
    return { view, width: Number(width), height: Number(height), svg };
  });
}

function findBrowser() {
  return BROWSERS.find((path) => existsSync(path)) ?? null;
}

function renderPng(svgPath, pngPath, width, height, scale) {
  const browser = findBrowser();
  if (!browser) throw new Error("Chrome or Edge not found; the SVGs were written");
  const shim = join(dirname(svgPath), "_shot.html");
  const profile = mkdtempSync(join(tmpdir(), "diagram-"));
  writeFileSync(shim, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff}img{display:block;width:${width}px;height:${height}px}</style><img src="${basename(svgPath)}">`);
  try {
    execFileSync(browser, [
      "--headless=new", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${profile}`,
      "--default-background-color=ffffffff", `--force-device-scale-factor=${scale}`,
      `--window-size=${width},${height}`, `--screenshot=${pngPath}`, pathToFileURL(shim).href,
    ], { stdio: "pipe", timeout: 180000 });
  } finally {
    rmSync(profile, { recursive: true, force: true });
    rmSync(shim, { force: true });
  }
  if (!existsSync(pngPath)) throw new Error("the browser wrote no PNG");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const option = (name) => { const i = args.indexOf(name); return i === -1 ? null : args.splice(i, 2)[1]; };
  const scale = Number(option("--scale") ?? 2);
  const png = args.includes("--png");
  const [htmlPath, outDir] = args.filter((a) => a !== "--png").map((a) => resolve(a));
  if (!htmlPath || !outDir) {
    console.error("usage: node export-diagram.mjs <diagram.html> <out-dir> [--png] [--scale 2]");
    process.exit(2);
  }
  try {
    mkdirSync(outDir, { recursive: true });
    for (const { view, width, height, svg } of buildSvgs(readFileSync(htmlPath, "utf8"))) {
      const svgPath = join(outDir, `${view}.svg`);
      writeFileSync(svgPath, svg);
      console.log(`SVG ${svgPath} (${width}x${height})`);
      if (png) {
        const pngPath = join(outDir, `${view}.png`);
        renderPng(svgPath, pngPath, width, height, scale);
        console.log(`PNG ${pngPath} (${width * scale}x${height * scale})`);
      }
    }
    if (png) console.log("Look at each PNG before delivering: text overlaps are invisible in the source and obvious in the image.");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
