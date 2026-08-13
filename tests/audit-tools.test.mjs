import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);

function run(script, args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [fileURLToPath(new URL(script, root)), ...args]);
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

function fixture(html, relativePath = 'index.html') {
  const dir = mkdtempSync(join(tmpdir(), 'seo-audit-'));
  const target = join(dir, relativePath);
  mkdirSync(join(target, '..'), { recursive: true });
  writeFileSync(target, html);
  return dir;
}

const baseHtml = ({ h1 = '<h1>Primary</h1>', canonical = 'https://example.com/' } = {}) => `
<!doctype html>
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>A useful test page title</title>
  <meta name="description" content="A useful and unique description written for people evaluating this specific test page.">
  <link rel="canonical" href="${canonical}">
</head><body><nav></nav><main>${h1}</main><footer></footer></body></html>`;

test('multiple H1 elements are an advisory, not a ranking error', async () => {
  const dir = fixture(baseHtml({ h1: '<h1>Primary</h1><h1>Secondary</h1>' }));
  try {
    const result = await run('scripts/audit-seo.mjs', ['--dir', dir, '--json']);
    const report = JSON.parse(result.stdout);
    assert.equal(report.errors.some((item) => item.rule === 'h1'), false);
    assert.equal(report.warns.some((item) => item.rule === 'h1'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('canonical host is checked when expected origin is provided', async () => {
  const dir = fixture(baseHtml({ canonical: 'https://staging.example.com/' }));
  try {
    const result = await run('scripts/audit-seo.mjs', [
      '--dir', dir,
      '--expected-origin', 'https://www.example.com',
      '--json',
    ]);
    const report = JSON.parse(result.stdout);
    assert.equal(report.errors.some((item) => item.rule === 'canonical-host'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('canonical path is compared with the built page path', async () => {
  const dir = fixture(
    baseHtml({ canonical: 'https://www.example.com/products/b/' }),
    'products/a/index.html',
  );
  try {
    const result = await run('scripts/audit-seo.mjs', [
      '--dir', dir,
      '--expected-origin', 'https://www.example.com',
      '--json',
    ]);
    const report = JSON.parse(result.stdout);
    assert.equal(report.warns.some((item) => item.rule === 'canonical-path'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('live audit separates explicit, inherited, blocked, and unspecified robot policy', async () => {
  const server = createServer((req, res) => {
    res.statusCode = 200;
    if (req.url === '/robots.txt') {
      res.end('User-agent: OAI-SearchBot\nAllow: /\n\nSitemap: http://example.test/sitemap.xml\n');
    } else if (req.url === '/sitemap.xml') {
      res.end('<?xml version="1.0"?><urlset><url><loc>http://example.test/</loc></url></urlset>');
    } else if (req.url === '/llms.txt') {
      res.statusCode = 404;
      res.end('not found');
    } else {
      res.setHeader('content-type', 'text/html');
      res.end('<html><head><link rel="canonical" href="http://example.test/"></head><body></body></html>');
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const result = await run('scripts/audit-live.mjs', [`http://127.0.0.1:${port}`, '--json']);
    const report = JSON.parse(result.stdout);
    const geo = report.findings.filter((item) => item.area === 'geo');
    assert.equal(geo.some((item) => item.msg.includes('explicitly allowed: OAI-SearchBot')), true);
    assert.equal(geo.some((item) => item.msg.includes('unspecified:') && item.msg.includes('GPTBot')), true);
    assert.equal(geo.some((item) => item.msg.includes('AI crawlers allowed:') && item.msg.includes('GPTBot')), false);

    const llms = geo.find((item) => item.msg.includes('llms.txt'));
    assert.equal(llms.sev, 'info');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('missing robots.txt is informational because crawling defaults to unrestricted', async () => {
  const server = createServer((req, res) => {
    if (req.url === '/robots.txt' || req.url === '/llms.txt') {
      res.statusCode = 404;
      res.end('not found');
    } else if (req.url === '/sitemap.xml') {
      res.statusCode = 200;
      res.end('<?xml version="1.0"?><urlset><url><loc>http://example.test/</loc></url></urlset>');
    } else {
      res.statusCode = 200;
      res.end('<html><head><link rel="canonical" href="http://example.test/"></head><body></body></html>');
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const result = await run('scripts/audit-live.mjs', [`http://127.0.0.1:${port}`, '--json']);
    const report = JSON.parse(result.stdout);
    const robots = report.findings.find((item) => item.area === 'robots' && item.msg.includes('not present'));
    assert.equal(robots.sev, 'info');
    assert.equal(report.findings.some((item) => item.area === 'robots' && item.sev === 'error'), false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('live audit validates the homepage canonical value, not only tag presence', async () => {
  const server = createServer((req, res) => {
    if (req.url === '/robots.txt') {
      res.statusCode = 404;
      res.end('not found');
    } else if (req.url === '/sitemap.xml') {
      res.statusCode = 200;
      res.end('<?xml version="1.0"?><urlset><url><loc>http://example.test/</loc></url></urlset>');
    } else if (req.url === '/llms.txt') {
      res.statusCode = 404;
      res.end('not found');
    } else {
      res.statusCode = 200;
      res.end('<html><head><link rel="canonical" href="https://wrong.example/path/"></head><body></body></html>');
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const result = await run('scripts/audit-live.mjs', [`http://127.0.0.1:${port}`, '--json']);
    const report = JSON.parse(result.stdout);
    const canonical = report.findings.find((item) => item.area === 'canonical');
    assert.equal(canonical.sev, 'warn');
    assert.match(canonical.msg, /wrong\.example/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
