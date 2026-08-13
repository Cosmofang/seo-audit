import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const script = join(root, 'scripts/audit-seo.mjs');

function run(directory, ...extra) {
  return spawnSync(process.execPath, [script, '--dir', directory, '--json', ...extra], {
    encoding: 'utf8',
  });
}

function temp(name) {
  return mkdtempSync(join(tmpdir(), `seo-audit-${name}-`));
}

function validPage(overrides = {}) {
  const canonical = overrides.canonical || 'https://www.example.com/';
  const schema = overrides.schema || JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [{ '@type': 'Organization' }, { '@type': 'WebSite' }],
  });
  const extraHead = overrides.extraHead || '';
  const extraBody = overrides.extraBody || '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Example Technical SEO Test Page</title>
  <meta name="description" content="A complete test page with enough descriptive text to exercise the portable technical SEO build auditor.">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="Example Technical SEO Test Page">
  <meta property="og:image" content="https://www.example.com/og.png">
  <script type="application/ld+json">${schema}</script>
  ${extraHead}
</head>
<body><nav>Nav</nav><main><h1>Example Test Page</h1>${extraBody}</main><footer>Footer</footer></body>
</html>`;
}

test('help exits successfully', () => {
  const output = execFileSync(process.execPath, [script, '--help'], { encoding: 'utf8' });
  assert.match(output, /--origin/);
});

test('zero HTML is a failing audit', () => {
  const result = run(temp('empty'));
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert(report.errors.some((finding) => finding.rule === 'no-html'));
});

test('wrong canonical origin, invalid JSON-LD and external CSS/srcset are detected', () => {
  const directory = temp('signals');
  writeFileSync(join(directory, 'index.html'), validPage({
    canonical: 'https://wrong.example.net/',
    schema: '{invalid json}',
    extraHead: '<style>.hero{background:url("https://cdn.example.net/bg.webp")}</style>',
    extraBody: '<picture><source srcset="https://cdn.example.net/a.webp 1x"><img src="/local.svg" width="100" height="100" alt="" loading="lazy"></picture>',
  }));
  writeFileSync(join(directory, 'local.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>');

  const result = run(directory, '--origin', 'https://www.example.com');
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert(report.errors.some((finding) => finding.rule === 'canonical-origin'));
  assert(report.errors.some((finding) => finding.rule === 'jsonld-parse'));
  assert(report.warnings.filter((finding) => finding.rule === 'external-resource').length >= 2);
});

test('document-relative assets count toward the page budget', () => {
  const directory = temp('relative');
  writeFileSync(join(directory, 'index.html'), validPage({ extraHead: '<script src="large.js"></script>' }));
  writeFileSync(join(directory, 'large.js'), 'x'.repeat(600 * 1024));

  const result = run(directory, '--origin', 'https://www.example.com');
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert(report.errors.some((finding) => finding.rule === 'page-weight'));
});

test('same-origin absolute assets count toward the page budget', () => {
  const directory = temp('absolute');
  writeFileSync(join(directory, 'index.html'), validPage({
    extraHead: '<script src="https://www.example.com/large.js"></script>',
  }));
  writeFileSync(join(directory, 'large.js'), 'x'.repeat(600 * 1024));

  const result = run(directory, '--origin', 'https://www.example.com');
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert(report.errors.some((finding) => finding.rule === 'page-weight'));
  assert(!report.warnings.some((finding) => finding.rule === 'external-resource'));
});

test('a clean fixture passes without strict mode', () => {
  const directory = temp('clean');
  mkdirSync(join(directory, 'assets'));
  writeFileSync(join(directory, 'index.html'), validPage());
  const result = run(directory, '--origin', 'https://www.example.com');
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.errors.length, 0);
});

test('declared alternate output may canonicalize to its primary page', () => {
  const directory = temp('alternate');
  mkdirSync(join(directory, 'agent', 'guide'), { recursive: true });
  writeFileSync(join(directory, 'agent', 'guide', 'index.html'), validPage({
    canonical: 'https://www.example.com/guide/',
  }).replace('<meta property="og:title" content="Example Technical SEO Test Page">', '')
    .replace('<meta property="og:image" content="https://www.example.com/og.png">', ''));

  const result = run(directory, '--origin', 'https://www.example.com', '--alternate-prefix', 'agent/');
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.errors.length, 0);
  assert(!report.warnings.some((finding) => finding.rule === 'open-graph'));
});
