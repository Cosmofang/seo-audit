import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function* markdownFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* markdownFiles(path);
    else if (extname(entry.name).toLowerCase() === '.md') yield path;
  }
}

test('local Markdown links resolve', () => {
  const missing = [];
  for (const file of markdownFiles(root)) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const raw = match[1].trim().replace(/^<|>$/g, '');
      if (!raw || /^(?:https?:|mailto:|tel:|#)/i.test(raw)) continue;
      const pathPart = raw.split('#')[0];
      if (!pathPart) continue;
      const target = resolve(dirname(file), decodeURIComponent(pathPart));
      if (!existsSync(target)) missing.push(`${file}: ${raw}`);
    }
  }
  assert.deepEqual(missing, []);
});
