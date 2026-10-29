import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { decide, configFromEnv, newRootDirs } from "./git-guard.mjs";

const STRICT_ENV = {
  CHANGESMITH_GIT_GUARD: "1",
  CHANGESMITH_GIT_GUARD_PROTECTED: "main,master,development",
  CHANGESMITH_GIT_GUARD_BRANCH_PATTERN: "^(feat|fix|docs|refactor|chore|test)/[a-z0-9]+(-[a-z0-9]+)*/[A-Za-z][A-Za-z0-9]*$",
  CHANGESMITH_GIT_GUARD_ASK: "commit,push",
  CHANGESMITH_GIT_GUARD_MERGE_ONLY: "main:development,master:development",
};
const config = configFromEnv(STRICT_ENV);
const on = (branch) => () => branch;
const kind = (cmd, branchOf, cwd, cfg = config) => decide(cmd, branchOf, cwd, cfg)?.decision ?? "none";
const win32 = { skip: process.platform !== "win32" && "Windows path semantics" };

test("disabled by default: every decision is a no-op", () => {
  assert.equal(configFromEnv({}).enabled, false);
  assert.equal(configFromEnv({ CHANGESMITH_GIT_GUARD: "0" }).enabled, false);
  assert.equal(kind("git commit -m x", on("main"), ".", configFromEnv({})), "none");
});

test("enabled with no other setting enforces nothing", () => {
  const cfg = configFromEnv({ CHANGESMITH_GIT_GUARD: "1" });
  assert.equal(cfg.enabled, true);
  for (const c of ["git commit -m x", "git push", "git switch -c whatever", "git merge x"]) {
    assert.equal(kind(c, on("main"), ".", cfg), "none", c);
  }
});

test("each setting works on its own", () => {
  const only = (extra) => configFromEnv({ CHANGESMITH_GIT_GUARD: "1", ...extra });
  assert.equal(kind("git commit -m x", on("main"), ".", only({ CHANGESMITH_GIT_GUARD_PROTECTED: "main" })), "deny");
  assert.equal(kind("git commit -m x", on("dev"), ".", only({ CHANGESMITH_GIT_GUARD_PROTECTED: "main" })), "none");
  assert.equal(kind("git commit -m x", on("dev"), ".", only({ CHANGESMITH_GIT_GUARD_ASK: "commit" })), "ask");
  assert.equal(kind("git push", on("dev"), ".", only({ CHANGESMITH_GIT_GUARD_ASK: "commit" })), "none");
  assert.equal(kind("git push", on("dev"), ".", only({ CHANGESMITH_GIT_GUARD_ASK: "push" })), "ask");
  assert.equal(kind("git switch -c nope", on("dev"), ".", only({ CHANGESMITH_GIT_GUARD_BRANCH_PATTERN: "^ok-" })), "deny");
  assert.equal(kind("git switch -c ok-1", on("dev"), ".", only({ CHANGESMITH_GIT_GUARD_BRANCH_PATTERN: "^ok-" })), "none");
});

test("an invalid branch pattern fails open", () => {
  const cfg = configFromEnv({ CHANGESMITH_GIT_GUARD: "1", CHANGESMITH_GIT_GUARD_BRANCH_PATTERN: "(" });
  assert.equal(kind("git switch -c anything", on("dev"), ".", cfg), "none");
});

test("messages are neutral English", () => {
  for (const [cmd, branch] of [["git commit -m x", "main"], ["git commit -m x", "dev"], ["git push", "dev"], ["git merge x", "main"], ["git switch -c bad", "dev"]]) {
    const { reason } = decide(cmd, on(branch), ".", config);
    assert.match(reason, /^[\x20-\x7e]+$/, reason);
  }
});

test("commit on a protected branch is denied", () => {
  for (const b of ["main", "master", "development"]) assert.equal(kind("git commit -m x", on(b)), "deny");
});

test("commit on another branch asks", () => {
  assert.equal(kind("git commit -m x", on("feat/a-b/Alex")), "ask");
});

test("commit with unresolvable branch asks", () => {
  assert.equal(kind("git commit -m x", on(null)), "ask");
});

test("push asks", () => {
  assert.equal(kind("git push origin x", on("feat/a/Alex")), "ask");
});

test("merge into a restricted branch", () => {
  assert.equal(kind("git merge development", on("main")), "none");
  assert.equal(kind("git merge origin/development", on("main")), "none");
  assert.equal(kind("git merge feat/a/Alex", on("main")), "deny");
  assert.equal(kind("git merge feat/a/Alex", on("development")), "none");
});

test("branch creation validates the name for every form", () => {
  const ok = "feat/hook-guard/Alex";
  const bad = "my-branch";
  for (const make of [
    (n) => `git switch -c ${n}`,
    (n) => `git switch -C ${n}`,
    (n) => `git checkout -b ${n}`,
    (n) => `git checkout -B ${n}`,
    (n) => `git branch ${n}`,
    (n) => `git worktree add ../w -b ${n}`,
    (n) => `git worktree add -B ${n} ../w`,
  ]) {
    assert.equal(kind(make(ok), on("development")), "none", make(ok));
    assert.equal(kind(make(bad), on("development")), "deny", make(bad));
  }
});

test("branch commands that do not create are ignored", () => {
  for (const c of ["git branch -d x", "git branch -D x", "git branch --list", "git branch -a", "git branch -r", "git branch --show-current", "git branch"]) {
    assert.equal(kind(c, on("development")), "none", c);
  }
});

test("git -C uses the other directory's branch", () => {
  const branchOf = (d) => (d === resolve("/repo", "other") ? "main" : "feat/a/Alex");
  assert.equal(kind("git -C other commit -m x", branchOf, "/repo"), "deny");
  assert.equal(kind("git commit -m x", branchOf, "/repo"), "ask");
});

test("cd before git uses the target directory's branch", () => {
  const branchOf = (d) => (d === resolve("/repo", "other") ? "main" : "feat/a/Alex");
  assert.equal(kind("cd other && git commit -m x", branchOf, "/repo"), "deny");
  assert.equal(kind("cd other; git commit -m x", branchOf, "/repo"), "deny");
});

test("strictest decision wins in compound commands", () => {
  assert.equal(kind("git push && git commit -m x", on("main")), "deny");
  assert.equal(kind("git status; git push", on("feat/a/Alex")), "ask");
});

test("non-git commands produce no decision", () => {
  assert.equal(kind("npm test && ls", on("main")), "none");
});

test("separators inside quotes do not split", () => {
  assert.equal(kind('git commit -m "a && git push; b"', on("feat/a/Alex")), "ask");
  assert.equal(kind('echo "git commit" && ls', on("main")), "none");
});

test("merge option values are not refs", () => {
  for (const c of [
    'git merge --no-ff -m "Merge development" development',
    "git merge -X theirs development",
    "git merge -mfoo development",
    "git merge --message=foo development",
    "git merge -s ours --strategy-option theirs origin/development",
  ]) assert.equal(kind(c, on("main")), "none", c);
  assert.equal(kind('git merge -m "x" feat/a/Alex', on("main")), "deny");
});

test("git branch is creation only in whitelisted forms", () => {
  for (const c of [
    "git branch --merged", "git branch --no-merged main", "git branch --contains abc", "git branch --no-contains abc",
    "git branch --points-at HEAD", "git branch --format=%(refname)", "git branch -u origin/x", "git branch --set-upstream-to=origin/x",
    "git branch --unset-upstream", "git branch --edit-description", "git branch -v", "git branch -vv", "git branch --sort=-committerdate",
    "git branch -l", "git branch --list x*", "git branch -a", "git branch -r", "git branch -d x", "git branch --delete x", "git branch --show-current",
  ]) assert.equal(kind(c, on("development")), "none", c);
  assert.equal(kind("git branch feat/a-b/Alex main", on("development")), "none");
  assert.equal(kind("git branch bad main", on("development")), "deny");
  assert.equal(kind("git branch -c old feat/a/Alex", on("development")), "none");
  assert.equal(kind("git branch -c old bad", on("development")), "deny");
  assert.equal(kind("git branch -m feat/a/Alex", on("development")), "none");
  assert.equal(kind("git branch -M old bad", on("development")), "deny");
});

test("long and orphan creation forms validate the name", () => {
  for (const c of ["git switch --create", "git switch --force-create", "git switch --orphan", "git checkout --orphan"]) {
    assert.equal(kind(`${c} feat/a/Alex`, on("development")), "none", c);
    assert.equal(kind(`${c} bad`, on("development")), "deny", c);
  }
});

test("env prefixes and git.exe are detected", () => {
  assert.equal(kind("GIT_EDITOR=true git commit -m x", on("main")), "deny");
  assert.equal(kind("git.exe commit -m x", on("main")), "deny");
});

test("paths in quotes keep their spaces", () => {
  const dir = resolve("/work/my repo");
  const branchOf = (d) => (d === dir ? "main" : "feat/a/Alex");
  assert.equal(kind(`cd "${dir}" && git commit -m x`, branchOf, resolve("/other")), "deny");
  assert.equal(kind(`git -C '${dir}' commit -m x`, branchOf, resolve("/other")), "deny");
  assert.equal(kind('git commit -m "a \\" && b"', on("feat/a/Alex")), "ask");
});

test("windows paths in quotes keep their backslashes and spaces", win32, () => {
  const dir = "C:\\work\\my repo";
  const branchOf = (d) => (d === resolve(dir) ? "main" : "feat/a/Alex");
  assert.equal(kind(`cd "${dir}" && git commit -m x`, branchOf, "C:\\other"), "deny");
  assert.equal(kind(`git -C "${dir}" commit -m x`, branchOf, "C:\\other"), "deny");
  assert.equal(kind(`git -C '${dir}' commit -m x`, branchOf, "C:\\other"), "deny");
});

test("git bash drive paths are translated on Windows", win32, () => {
  const branchOf = (d) => (d === resolve("C:/work/my repo") ? "main" : "feat/a/Alex");
  assert.equal(kind('cd "/c/work/my repo" && git commit -m x', branchOf, "C:\\other"), "deny");
  assert.equal(kind('git -C "/c/work/my repo" commit -m x', branchOf, "C:\\other"), "deny");
  assert.equal(kind("git -C /c commit -m x", branchOf, "C:\\other"), "ask");
});

test("a POSIX /c/... directory is not read as a drive", { skip: process.platform === "win32" && "Windows only translates drives" }, () => {
  const branchOf = (d) => (d === "/c/work" ? "main" : "feat/a/Alex");
  assert.equal(kind("git -C /c/work commit -m x", branchOf, "/other"), "deny");
});

const rootDirConfig = (extra = {}) => configFromEnv({ CHANGESMITH_GIT_GUARD: "1", CHANGESMITH_GIT_GUARD_ASK: "root-dir", ...extra });
const returning = (names, calls = []) => (dir, adding) => {
  calls.push({ dir, adding });
  return names;
};
const rootDirDecision = (cmd, names, extra, calls) => decide(cmd, on("feat/a/Alex"), "/repo", rootDirConfig(extra), returning(names, calls));

test("a commit that adds a new top-level directory asks and names it", () => {
  const result = rootDirDecision("git commit -m x", [".impeccable"]);
  assert.equal(result.decision, "ask");
  assert.match(result.reason, /\.impeccable/);
  assert.match(result.reason, /^[\x20-\x7e]+$/);
});

test("root-dir does nothing unless it is in the ask list", () => {
  const names = returning([".impeccable"]);
  assert.equal(decide("git commit -m x", on("feat/a/Alex"), "/repo", configFromEnv({ CHANGESMITH_GIT_GUARD: "1" }), names), null);
  assert.equal(decide("git commit -m x", on("feat/a/Alex"), "/repo", configFromEnv({ CHANGESMITH_GIT_GUARD: "1", CHANGESMITH_GIT_GUARD_ASK: "push" }), names), null);
});

test("allowed root directories never ask", () => {
  const extra = { CHANGESMITH_GIT_GUARD_ROOT_DIRS: ".github, src/" };
  assert.equal(rootDirDecision("git commit -m x", [".github", "src"], extra), null);
  const result = rootDirDecision("git commit -m x", [".github", "groma"], extra);
  assert.equal(result.decision, "ask");
  assert.match(result.reason, /groma/);
  assert.doesNotMatch(result.reason, /\.github/);
});

test("with no new root directory the commit follows the other rules", () => {
  assert.equal(rootDirDecision("git commit -m x", []), null);
  assert.equal(rootDirDecision("git commit -m x", [], { CHANGESMITH_GIT_GUARD_ASK: "root-dir,commit" }).reason, "Commit requires confirmation");
});

test("a protected branch is still denied before the root directory question", () => {
  const cfg = rootDirConfig({ CHANGESMITH_GIT_GUARD_PROTECTED: "main" });
  assert.equal(decide("git commit -m x", on("main"), "/repo", cfg, returning(["groma"]))?.decision, "deny");
});

test("a git failure while listing root directories fails open", () => {
  const failing = () => { throw new Error("not a repository"); };
  assert.equal(decide("git commit -m x", on("feat/a/Alex"), "/repo", rootDirConfig(), failing), null);
});

test("many new root directories are summarized", () => {
  const names = ["a", "b", "c", "d", "e", "f", "g"];
  assert.match(rootDirDecision("git commit -m x", names).reason, /a, b, c, d, e, and 2 more/);
});

test("only commit looks at root directories", () => {
  const calls = [];
  for (const c of ["git push", "git status", "git add -A", "git merge x"]) rootDirDecision(c, ["groma"], {}, calls);
  assert.equal(calls.length, 0);
});

test("an add earlier in the same command is passed to the lookup", () => {
  const seen = (cmd) => {
    const calls = [];
    rootDirDecision(cmd, [], {}, calls);
    return calls[0]?.adding;
  };
  assert.equal(seen("git commit -m x"), undefined);
  assert.equal(seen("git commit -m x && git add -A"), undefined);
  assert.equal(seen("git -C other add -A && git commit -m x"), undefined);
  for (const add of ["git add -A", "git add --all", "git add .", "git add -Af", "git add :/"]) {
    assert.equal(seen(`${add} && git commit -m x`).all, true, add);
  }
  const named = seen("git add .impeccable ./groma/x.md -- docs/y.md && git commit -m x");
  assert.equal(named.all, false);
  assert.deepEqual([...named.names].sort(), [".impeccable", "docs", "groma"]);
});

const git = (dir, ...args) => execFileSync("git", ["-C", dir, "-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const touch = (dir, path) => {
  mkdirSync(join(dir, path, ".."), { recursive: true });
  writeFileSync(join(dir, path), "x");
};
const everything = { all: true, names: new Set() };

test("newRootDirs reads real git state", () => {
  const dir = mkdtempSync(join(tmpdir(), "root-dirs-"));
  try {
    git(dir, "init", "-q");
    touch(dir, "src/deep/a.js");
    touch(dir, "README.md");
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "--no-verify", "-m", "first");

    touch(dir, "src/deep/b.js");
    git(dir, "add", "src/deep/b.js");
    assert.deepEqual(newRootDirs(dir), [], "a new file under a known directory is not a new root directory");
    assert.deepEqual(newRootDirs(join(dir, "src", "deep")), [], "paths stay relative to the repository root from a subdirectory");

    touch(dir, ".impeccable/design.json");
    git(dir, "add", ".impeccable/design.json");
    assert.deepEqual(newRootDirs(dir), [".impeccable"]);
    assert.deepEqual(newRootDirs(join(dir, "src")), [".impeccable"]);
    git(dir, "reset", "-q");

    writeFileSync(join(dir, ".gitignore"), "cache/\n");
    touch(dir, "cache/out.bin");
    touch(dir, "groma/index.md");
    assert.deepEqual(newRootDirs(dir), [], "untracked directories count only when an add is about to stage them");
    assert.deepEqual(newRootDirs(dir, everything).sort(), [".impeccable", "groma"], "an ignored directory is never new");
    assert.deepEqual(newRootDirs(dir, { all: false, names: new Set(["groma"]) }), ["groma"]);
    assert.deepEqual(newRootDirs(dir, { all: false, names: new Set(["docs"]) }), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a directory created by moving a file still counts as new", () => {
  const dir = mkdtempSync(join(tmpdir(), "root-dirs-"));
  try {
    git(dir, "init", "-q");
    touch(dir, "src/a.js");
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "--no-verify", "-m", "first");
    mkdirSync(join(dir, "lib"));
    git(dir, "mv", "src/a.js", "lib/a.js");
    assert.deepEqual(newRootDirs(dir), ["lib"], "git reports the move as a rename, not an addition");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("untracked directories keep their root-relative path from a subdirectory", () => {
  const dir = mkdtempSync(join(tmpdir(), "root-dirs-"));
  try {
    git(dir, "init", "-q");
    touch(dir, "src/a.js");
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "--no-verify", "-m", "first");
    touch(dir, "src/extra/b.js");
    assert.deepEqual(newRootDirs(join(dir, "src"), everything), [], "src/extra is under a known root directory, not a root directory of its own");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the real lookup asks end to end, and the first commit is left alone", () => {
  const dir = mkdtempSync(join(tmpdir(), "root-dirs-"));
  try {
    git(dir, "init", "-q");
    touch(dir, "src/a.js");
    git(dir, "add", "-A");
    const cfg = rootDirConfig();
    assert.equal(decide("git commit -m x", on("feat/a/Alex"), dir, cfg), null, "no commits yet");

    git(dir, "commit", "-q", "--no-verify", "-m", "first");
    touch(dir, "groma/index.md");
    assert.equal(decide("git commit -m x", on("feat/a/Alex"), dir, cfg), null, "untracked and not being added");
    assert.equal(decide("git add -A && git commit -m x", on("feat/a/Alex"), dir, cfg)?.decision, "ask");
    assert.equal(decide("git add groma && git commit -m x", on("feat/a/Alex"), dir, cfg)?.decision, "ask");
    assert.equal(decide("git add src && git commit -m x", on("feat/a/Alex"), dir, cfg), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
