import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { decide, configFromEnv } from "./git-guard.mjs";

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
