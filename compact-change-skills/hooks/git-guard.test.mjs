import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { decide } from "./git-guard.mjs";

const on = (branch) => () => branch;
const kind = (cmd, branchOf, cwd) => decide(cmd, branchOf, cwd)?.decision ?? "none";

test("commit on main, master and development is denied", () => {
  for (const b of ["main", "master", "development"]) assert.equal(kind("git commit -m x", on(b)), "deny");
});

test("commit on a feature branch asks", () => {
  assert.equal(kind("git commit -m x", on("feat/a-b/Josue")), "ask");
});

test("commit with unresolvable branch asks", () => {
  assert.equal(kind("git commit -m x", on(null)), "ask");
});

test("push asks", () => {
  assert.equal(kind("git push origin x", on("feat/a/Josue")), "ask");
});

test("merge into main", () => {
  assert.equal(kind("git merge development", on("main")), "none");
  assert.equal(kind("git merge origin/development", on("main")), "none");
  assert.equal(kind("git merge feat/a/Josue", on("main")), "deny");
  assert.equal(kind("git merge feat/a/Josue", on("development")), "none");
});

test("branch creation validates the name for every form", () => {
  const ok = "feat/hook-guard/Josue";
  const bad = "mi-rama";
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
  const branchOf = (d) => (d === resolve("/repo", "other") ? "main" : "feat/a/Josue");
  assert.equal(kind("git -C other commit -m x", branchOf, "/repo"), "deny");
  assert.equal(kind("git commit -m x", branchOf, "/repo"), "ask");
});

test("cd before git uses the target directory's branch", () => {
  const branchOf = (d) => (d === resolve("/repo", "other") ? "main" : "feat/a/Josue");
  assert.equal(kind("cd other && git commit -m x", branchOf, "/repo"), "deny");
  assert.equal(kind("cd other; git commit -m x", branchOf, "/repo"), "deny");
});

test("strictest decision wins in compound commands", () => {
  assert.equal(kind("git push && git commit -m x", on("main")), "deny");
  assert.equal(kind("git status; git push", on("feat/a/Josue")), "ask");
});

test("non-git commands produce no decision", () => {
  assert.equal(kind("npm test && ls", on("main")), "none");
});

test("separators inside quotes do not split", () => {
  assert.equal(kind('git commit -m "a && git push; b"', on("feat/a/Josue")), "ask");
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
  assert.equal(kind('git merge -m "x" feat/a/Josue', on("main")), "deny");
});

test("git branch is creation only in whitelisted forms", () => {
  for (const c of [
    "git branch --merged", "git branch --no-merged main", "git branch --contains abc", "git branch --no-contains abc",
    "git branch --points-at HEAD", "git branch --format=%(refname)", "git branch -u origin/x", "git branch --set-upstream-to=origin/x",
    "git branch --unset-upstream", "git branch --edit-description", "git branch -v", "git branch -vv", "git branch --sort=-committerdate",
    "git branch -l", "git branch --list x*", "git branch -a", "git branch -r", "git branch -d x", "git branch --delete x", "git branch --show-current",
  ]) assert.equal(kind(c, on("development")), "none", c);
  assert.equal(kind("git branch feat/a-b/Josue main", on("development")), "none");
  assert.equal(kind("git branch bad main", on("development")), "deny");
  assert.equal(kind("git branch -c old feat/a/Josue", on("development")), "none");
  assert.equal(kind("git branch -c old bad", on("development")), "deny");
  assert.equal(kind("git branch -m feat/a/Josue", on("development")), "none");
  assert.equal(kind("git branch -M old bad", on("development")), "deny");
});

test("long and orphan creation forms validate the name", () => {
  for (const c of ["git switch --create", "git switch --force-create", "git switch --orphan", "git checkout --orphan"]) {
    assert.equal(kind(`${c} feat/a/Josue`, on("development")), "none", c);
    assert.equal(kind(`${c} bad`, on("development")), "deny", c);
  }
});

test("env prefixes and git.exe are detected", () => {
  assert.equal(kind("GIT_EDITOR=true git commit -m x", on("main")), "deny");
  assert.equal(kind("git.exe commit -m x", on("main")), "deny");
});

test("windows paths in quotes keep their backslashes and spaces", () => {
  const dir = "C:\\Users\\Josue Escobar\\x";
  const branchOf = (d) => (d === resolve(dir) ? "main" : "feat/a/Josue");
  assert.equal(kind(`cd "${dir}" && git commit -m x`, branchOf, "C:\\other"), "deny");
  assert.equal(kind(`git -C "${dir}" commit -m x`, branchOf, "C:\\other"), "deny");
  assert.equal(kind(`git -C '${dir}' commit -m x`, branchOf, "C:\\other"), "deny");
  assert.equal(kind('git commit -m "a \\" && b"', on("feat/a/Josue")), "ask");
});

test("git bash drive paths are translated", () => {
  const branchOf = (d) => (d === resolve("C:/Users/Josue Escobar/x") ? "main" : "feat/a/Josue");
  assert.equal(kind('cd "/c/Users/Josue Escobar/x" && git commit -m x', branchOf, "C:\\other"), "deny");
  assert.equal(kind('git -C "/c/Users/Josue Escobar/x" commit -m x', branchOf, "C:\\other"), "deny");
  assert.equal(kind("git -C /c commit -m x", branchOf, "C:\\other"), "ask");
});
