#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WINDOWS = process.platform === 'win32';
const MERGE_VALUE_OPTIONS = new Set(['-m', '--message', '-F', '--file', '-X', '--strategy-option', '-s', '--strategy', '--into-name', '--cleanup']);
const BRANCH_COPY_MOVE = new Set(['-c', '-C', '-m', '-M', '--copy', '--move']);
const BRANCH_PLAIN_FLAGS = new Set(['-f', '--force', '-t', '--track', '--no-track']);
const RANK = { none: 0, ask: 1, deny: 2 };

function parse(command) {
  const segments = [];
  let words = [];
  let word = null;
  let quote = null;
  const endWord = () => { if (word !== null) words.push(word); word = null; };
  const endSegment = () => { endWord(); if (words.length) segments.push(words); words = []; };
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === '\\' && quote === '"' && '$`"\\\n'.includes(command[i + 1] ?? ' ')) word += command[++i];
      else word += c;
    } else if (c === '"' || c === "'") {
      quote = c;
      word ??= '';
    } else if (c === ';' || c === '\n' || c === '|' || c === '&') {
      endSegment();
    } else if (/\s/.test(c)) {
      endWord();
    } else {
      word = (word ?? '') + c;
    }
  }
  endSegment();
  return segments;
}

function gitCommand(words) {
  const start = words.findIndex(w => !/^[A-Za-z_]\w*=/.test(w));
  if (start === -1 || !/^git(\.exe)?$/.test(words[start])) return null;
  let dir = null;
  let i = start + 1;
  while (i < words.length && words[i].startsWith('-')) {
    if (words[i] === '-C') dir = words[++i];
    else if (words[i] === '-c') i++;
    i++;
  }
  return { dir, sub: words[i], args: words.slice(i + 1) };
}

function creationName({ sub, args }) {
  const after = (flags) => {
    const at = args.findIndex(a => flags.includes(a));
    return at === -1 ? undefined : args[at + 1];
  };
  if (sub === 'switch') return after(['-c', '-C', '--create', '--force-create', '--orphan']);
  if (sub === 'checkout') return after(['-b', '-B', '--orphan']);
  if (sub === 'worktree' && args[0] === 'add') return after(['-b', '-B']);
  if (sub !== 'branch') return undefined;
  const dashed = args.filter(a => a.startsWith('-'));
  const positional = args.filter(a => !a.startsWith('-'));
  if (dashed.some(a => BRANCH_COPY_MOVE.has(a))) return positional.at(-1);
  if (dashed.every(a => BRANCH_PLAIN_FLAGS.has(a))) return positional[0];
  return undefined;
}

const list = (value) => (value ?? '').split(',').map(v => v.trim()).filter(Boolean);

// Nothing is enforced unless CHANGESMITH_GIT_GUARD=1. A malformed branch pattern is ignored
// rather than thrown, so a typo in the environment can never block a command.
export function configFromEnv(env = process.env) {
  let branchPattern = null;
  try {
    if (env.CHANGESMITH_GIT_GUARD_BRANCH_PATTERN) branchPattern = new RegExp(env.CHANGESMITH_GIT_GUARD_BRANCH_PATTERN);
  } catch {}
  const mergeOnly = new Map();
  for (const pair of list(env.CHANGESMITH_GIT_GUARD_MERGE_ONLY)) {
    const [target, ...sources] = pair.split(':');
    if (target && sources.length) mergeOnly.set(target, new Set(sources.flatMap(s => [s, `origin/${s}`])));
  }
  return {
    enabled: env.CHANGESMITH_GIT_GUARD === '1',
    protectedBranches: new Set(list(env.CHANGESMITH_GIT_GUARD_PROTECTED)),
    branchPattern,
    ask: new Set(list(env.CHANGESMITH_GIT_GUARD_ASK)),
    mergeOnly,
  };
}

function judge(git, branch, config) {
  const { sub, args } = git;
  if (sub === 'commit') {
    if (config.protectedBranches.has(branch)) {
      return { decision: 'deny', reason: `Committing on protected branch "${branch}" is blocked; switch to another branch` };
    }
    if (config.ask.has('commit')) return { decision: 'ask', reason: 'Commit requires confirmation' };
  }
  if (sub === 'push' && config.ask.has('push')) return { decision: 'ask', reason: 'Push requires confirmation' };
  const sources = config.mergeOnly.get(branch);
  if (sub === 'merge' && sources) {
    const refs = [];
    for (let i = 0; i < args.length; i++) {
      if (MERGE_VALUE_OPTIONS.has(args[i])) i++;
      else if (!args[i].startsWith('-')) refs.push(args[i]);
    }
    if (refs.some(r => !sources.has(r))) {
      return { decision: 'deny', reason: `"${branch}" only accepts merges from: ${[...sources].join(', ')}` };
    }
  }
  const name = creationName(git);
  if (config.branchPattern && name !== undefined && !config.branchPattern.test(name)) {
    return { decision: 'deny', reason: `Branch name "${name}" does not match ${config.branchPattern}` };
  }
  return null;
}

function resolveDir(base, p) {
  const gitBash = WINDOWS && /^\/([a-zA-Z])(\/|$)/.exec(p);
  return resolve(base, gitBash ? `${gitBash[1].toUpperCase()}:/${p.slice(gitBash[0].length)}` : p);
}

export function decide(command, branchOf, cwd = '.', config = configFromEnv()) {
  let dir = cwd;
  let strictest = null;
  for (const words of parse(command)) {
    if (words[0] === 'cd' && words[1]) {
      dir = resolveDir(dir, words[1]);
      continue;
    }
    const git = gitCommand(words);
    if (!git) continue;
    const target = git.dir ? resolveDir(dir, git.dir) : dir;
    const result = judge(git, branchOf(target), config);
    if (result && (!strictest || RANK[result.decision] > RANK[strictest.decision])) strictest = result;
  }
  return strictest;
}

function currentBranch(dir) {
  try {
    const out = execFileSync('git', ['-C', dir, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return out && out !== 'HEAD' ? out : null;
  } catch {
    return null;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const config = configFromEnv();
    const input = config.enabled ? JSON.parse(readFileSync(0, 'utf8')) : null;
    const command = input?.tool_input?.command;
    if (typeof command === 'string') {
      const result = decide(command, currentBranch, input.cwd ?? process.cwd(), config);
      if (result) {
        process.stdout.write(JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: result.decision,
            permissionDecisionReason: result.reason,
          },
        }));
      }
    }
  } catch {
    process.exit(0);
  }
}
