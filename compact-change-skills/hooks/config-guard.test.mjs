import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isGuardedConfig } from "./config-guard.mjs";

const SCRIPT = fileURLToPath(new URL("./config-guard.mjs", import.meta.url));

test("linter, formatter and type-check configs are guarded", () => {
  for (const name of [".eslintrc.json", "eslint.config.mjs", ".prettierrc", "biome.jsonc", "ruff.toml", "tsconfig.json", "tsconfig.app.json", "analysis_options.yaml", ".editorconfig"]) {
    assert.equal(isGuardedConfig(join("repo", name)), true, name);
  }
});

test("ordinary files and mixed-purpose manifests are not guarded", () => {
  for (const name of ["package.json", "pyproject.toml", "index.ts", "eslint-rules.md", "tsconfig.json.bak"]) {
    assert.equal(isGuardedConfig(join("repo", name)), false, name);
  }
});

test("the hook asks for an existing config only when CHANGESMITH_CONFIG_GUARD=1", () => {
  const dir = mkdtempSync(join(tmpdir(), "config-guard-"));
  try {
    writeFileSync(join(dir, "tsconfig.json"), "{}");
    const run = (file, env) => spawnSync(process.execPath, [SCRIPT], {
      input: JSON.stringify({ cwd: dir, tool_input: { file_path: join(dir, file) } }),
      env: { ...process.env, CHANGESMITH_CONFIG_GUARD: "", ...env },
      encoding: "utf8",
    });

    assert.equal(run("tsconfig.json", {}).stdout, "");

    const on = run("tsconfig.json", { CHANGESMITH_CONFIG_GUARD: "1" });
    assert.equal(on.status, 0);
    assert.equal(JSON.parse(on.stdout).hookSpecificOutput.permissionDecision, "ask");

    assert.equal(run("eslint.config.js", { CHANGESMITH_CONFIG_GUARD: "1" }).stdout, "", "a new config file is allowed");
    assert.equal(run("index.ts", { CHANGESMITH_CONFIG_GUARD: "1" }).stdout, "");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("malformed input fails open", () => {
  const r = spawnSync(process.execPath, [SCRIPT], {
    input: "not json",
    env: { ...process.env, CHANGESMITH_CONFIG_GUARD: "1" },
    encoding: "utf8",
  });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "");
});
