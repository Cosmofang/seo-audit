import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));
const script = fileURLToPath(new URL('../scripts/audit-live.mjs', import.meta.url));

function run(url) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, url, '--json'], { cwd: root });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

test('JSON output preserves a failing exit code', async (context) => {
  const server = createServer((request, response) => {
    if (request.url === '/robots.txt') {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('User-agent: *\nDisallow: /\n');
      return;
    }
    if (request.url === '/sitemap.xml') {
      response.writeHead(404);
      response.end('not found');
      return;
    }
    if (request.url === '/llms.txt') {
      response.writeHead(404);
      response.end('not found');
      return;
    }
    response.writeHead(500);
    response.end('broken');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => server.close());

  const address = server.address();
  const result = await run(`http://127.0.0.1:${address.port}`);
  assert.equal(result.status, 1, result.stderr);
  const report = JSON.parse(result.stdout);
  assert(report.summary.errors >= 2);
  assert(report.findings.some((finding) => finding.area === 'robots' && finding.severity === 'error'));
});

test('training crawler policy is informational, not an automatic visibility warning', async (context) => {
  const server = createServer((request, response) => {
    if (request.url === '/robots.txt') {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end(`User-agent: *
Allow: /

User-agent: GPTBot
Disallow: /

Sitemap: http://127.0.0.1/sitemap.xml
`);
      return;
    }
    if (request.url === '/sitemap.xml') {
      response.writeHead(200, { 'content-type': 'application/xml' });
      response.end('<?xml version="1.0"?><urlset><url><loc>http://example.test/</loc></url></urlset>');
      return;
    }
    if (request.url === '/llms.txt') {
      response.writeHead(404);
      response.end('not found');
      return;
    }
    const port = server.address().port;
    response.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'max-age=60' });
    response.end(`<!doctype html><html><head>
      <link rel="canonical" href="http://127.0.0.1:${port}/">
      <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization"},{"@type":"WebSite"}]}</script>
      </head><body>ok</body></html>`);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => server.close());

  const address = server.address();
  const result = await run(`http://127.0.0.1:${address.port}`);
  const report = JSON.parse(result.stdout);
  assert(report.findings.some((finding) => finding.area === 'ai-training' && finding.severity === 'info'));
  assert(!report.findings.some((finding) => finding.area === 'ai-training' && finding.severity === 'warn'));
});

test('edge security challenge is reported explicitly', async (context) => {
  const server = createServer((_request, response) => {
    response.writeHead(403, { 'cf-mitigated': 'challenge', 'content-type': 'text/html' });
    response.end('challenge');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => server.close());

  const address = server.address();
  const result = await run(`http://127.0.0.1:${address.port}`);
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert(report.findings.some((finding) => finding.area === 'edge' && /challenge/.test(finding.message)));
});
