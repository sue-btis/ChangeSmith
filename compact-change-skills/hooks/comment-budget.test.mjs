import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { review } from "./comment-budget.mjs";

const SCRIPT = fileURLToPath(new URL("./comment-budget.mjs", import.meta.url));
const words = (n) => Array.from({ length: n }, () => "word").join(" ");

test("an untagged doc block over 40 words is flagged", () => {
  const flags = review(`/**\n * ${words(41)}\n */\nexport const x = 1;\n`, ".ts");
  assert.equal(flags.length, 1);
  assert.match(flags[0][1], /41 words/);
});

test("an untagged doc block at 40 words passes", () => {
  assert.deepEqual(review(`/** ${words(40)} */\nexport const x = 1;\n`, ".ts"), []);
});

test("tagged docs are never flagged, whatever their size", () => {
  assert.deepEqual(review(`/**\n * ${words(80)}\n * @param a the input\n */\nexport const x = 1;\n`, ".ts"), []);
  assert.deepEqual(review(`/// <summary>${words(80)}</summary>\nclass A {}\n`, ".cs"), []);
});

test("python docstrings follow the same budget", () => {
  assert.equal(review(`def f():\n    """${words(45)}"""\n`, ".py").length, 1);
  assert.deepEqual(review(`def f():\n    """${words(45)}\n\n    Args:\n        a: x\n    """\n`, ".py"), []);
});

test("section banners are flagged in line and hash comments", () => {
  assert.equal(review("// ==========\nconst a = 1;\n", ".js").length, 1);
  assert.equal(review("# ----------\na = 1\n", ".py").length, 1);
});

test("plain inline comments are not inspected", () => {
  assert.deepEqual(review(`// ${words(100)}\nconst a = 1;\n`, ".js"), []);
});

test("the exemption marker works in English and in the legacy Spanish spelling", () => {
  const body = `/** ${words(60)} */\nexport const x = 1;\n`;
  assert.deepEqual(review(`// comment-budget: exempt — public API docs\n${body}`, ".ts"), []);
  assert.deepEqual(review(`// presupuesto-comentarios: exento — docs\n${body}`, ".ts"), []);
});

test("the edit hook does nothing unless CHANGESMITH_COMMENT_BUDGET=1", () => {
  const dir = mkdtempSync(join(tmpdir(), "comment-budget-"));
  try {
    const file = join(dir, "a.ts");
    writeFileSync(file, `/** ${words(60)} */\nexport const x = 1;\n`);
    const run = (env) => spawnSync(process.execPath, [SCRIPT], {
      input: JSON.stringify({ tool_input: { file_path: file } }),
      env: { ...process.env, CHANGESMITH_COMMENT_BUDGET: "", ...env },
      encoding: "utf8",
    });
    assert.equal(run({}).status, 0);
    const on = run({ CHANGESMITH_COMMENT_BUDGET: "1" });
    assert.equal(on.status, 2);
    assert.match(on.stderr, /COMMENTS OVER BUDGET/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
