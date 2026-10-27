#!/usr/bin/env node
// Opt-in: runs only when CHANGESMITH_RENDER_PACKAGE=1. After an edit to a file under docs/ of a
// design package, it rebuilds docs/site/<project>-architecture.html. It never blocks the edit: failures go to stderr.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isSource, render } from "../skills/designing-system/scripts/render-package.mjs";

export function packageRoot(file) {
  let dir = dirname(resolve(file));
  while (true) {
    if (existsSync(join(dir, "docs", "spec", "manifest.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function onEdit(input) {
  const file = input?.tool_input?.file_path ?? input?.tool_input?.notebook_path;
  if (!file) return null;
  const root = packageRoot(file);
  if (!root || !isSource(root, resolve(file))) return null;
  return render(root);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.CHANGESMITH_RENDER_PACKAGE === "1") {
    try {
      onEdit(JSON.parse(readFileSync(0, "utf8") || "{}"));
    } catch (error) {
      console.error(`render-package: ${error.message}`);
    }
  }
}
