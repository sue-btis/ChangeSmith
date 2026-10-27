#!/usr/bin/env node
// Loosening a lint, format or type-check rule is the cheapest way to turn a red check green,
// and the verifier then sees a pass. Asking keeps legitimate config changes possible.
// Opt-in: only runs when CHANGESMITH_CONFIG_GUARD=1. Fails open on any error.
// ponytail: only guards the Edit/Write tools; a shell `sed -i` on the same file is not seen.
import { readFileSync, existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const GUARDED = /^(\.eslintrc(\..+)?|eslint\.config\.[cm]?[jt]s|\.prettierrc(\..+)?|prettier\.config\.[cm]?[jt]s|biome\.jsonc?|\.?ruff\.toml|tsconfig(\..+)?\.json|analysis_options\.yaml|\.golangci\.ya?ml|\.flake8|mypy\.ini|\.?pylintrc|\.rubocop\.yml|\.stylelintrc(\..+)?|\.editorconfig|\.globalconfig)$/i;

export const isGuardedConfig = (path) => GUARDED.test(basename(path));

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.env.CHANGESMITH_CONFIG_GUARD === '1') {
      const input = JSON.parse(readFileSync(0, 'utf8'));
      const path = input?.tool_input?.file_path;
      if (typeof path === 'string' && isGuardedConfig(path) && existsSync(resolve(input.cwd ?? process.cwd(), path))) {
        process.stdout.write(JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'ask',
            permissionDecisionReason: `${basename(path)} configures a lint, format or type check. Fix the code instead of loosening the check; approve only if the change was requested.`,
          },
        }));
      }
    }
  } catch {
    process.exit(0);
  }
}
