#!/usr/bin/env node
// audit-live.mjs — portable, zero-dependency live-URL crawl/GEO auditor.
//
// Checks the things you can only see on a deployed origin: robots.txt policy
// (incl. AI-crawler allow/deny), XML sitemap, llms.txt (GEO), on-page JSON-LD,
// canonical, and security/caching response headers.
//
//   node audit-live.mjs https://www.example.com [--json]
//
// Node >=18 (global fetch). No npm install.

const base = process.argv[2];
const JSON_OUT = process.argv.includes('--json');
if (!base || !/^https?:\/\//.test(base)) {
  console.error('usage: node audit-live.mjs https://www.example.com [--json]');
  process.exit(2);
}
const origin = new URL(base).origin;

const out = []; // {sev:'ok'|'info'|'warn'|'error', area, msg}
const ok = (area, msg) => out.push({ sev: 'ok', area, msg });
const info = (area, msg) => out.push({ sev: 'info', area, msg });
const warn = (area, msg) => out.push({ sev: 'warn', area, msg });
const err = (area, msg) => out.push({ sev: 'error', area, msg });

async function get(path) {
  try {
    const r = await fetch(origin + path, { redirect: 'follow', headers: { 'user-agent': 'seo-audit/1.0' } });
    const text = await r.text();
    return { status: r.status, headers: r.headers, text };
  } catch (e) {
    return { status: 0, headers: new Headers(), text: '', error: String(e) };
  }
}

// Major AI crawlers a GEO-friendly site generally WANTS to allow.
// (Training + search + user-initiated fetch agents for the big assistants.)
const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',           // OpenAI
  'ClaudeBot', 'Claude-User', 'Claude-SearchBot',      // Anthropic
  'PerplexityBot', 'Perplexity-User',                  // Perplexity
  'Google-Extended', 'GoogleOther',                    // Google AI
  'CCBot',                                             // Common Crawl (feeds many LLMs)
  'Bytespider', 'Amazonbot', 'Applebot-Extended',      // others
];

// Parse robots.txt into per-user-agent group rules.
function parseRobots(txt) {
  const groups = []; let cur = null;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') {
      if (!cur || cur._hasRules) { cur = { agents: [], allow: [], disallow: [], _hasRules: false }; groups.push(cur); }
      cur.agents.push(v);
    } else if (cur && k === 'allow') { cur.allow.push(v); cur._hasRules = true; }
    else if (cur && k === 'disallow') { cur.disallow.push(v); cur._hasRules = true; }
  }
  return groups;
}
// Resolve root-path policy and preserve whether it was explicit, inherited
// from User-agent: *, or unspecified. This is intentionally a root-policy
// summary, not a full RFC-grade robots matcher for arbitrary paths.
function policyFor(groups, ua) {
  const lc = ua.toLowerCase();
  const exact = groups.filter((x) => x.agents.some((a) => a.toLowerCase() === lc));
  const fallback = groups.filter((x) => x.agents.includes('*'));
  const selected = exact.length ? exact : fallback;
  if (!selected.length) return { policy: 'unspecified', source: 'none' };
  const allow = selected.flatMap((x) => x.allow);
  const disallow = selected.flatMap((x) => x.disallow);
  const blocksRoot = disallow.includes('/') && !allow.includes('/');
  return {
    policy: blocksRoot ? 'blocked' : 'allowed',
    source: exact.length ? 'explicit' : 'inherited',
  };
}

async function run() {
  // ---- robots.txt ----
  const robots = await get('/robots.txt');
  if (robots.status === 404) {
    info('robots', 'robots.txt not present; crawling is unrestricted unless access is blocked elsewhere');
  } else if (robots.status === 0 || robots.status >= 500) {
    err('robots', `robots.txt could not be fetched reliably (status ${robots.status})`);
  } else if (robots.status !== 200) {
    warn('robots', `robots.txt returned ${robots.status}; verify crawler handling`);
  } else {
    const groups = parseRobots(robots.text);
    const star = policyFor(groups, '*');
    if (star.policy === 'blocked') err('robots', 'User-agent: * is Disallow: / — site blocked from all crawlers');
    else if (star.policy === 'allowed') ok('robots', 'default crawler group allows the root path');
    else info('robots', 'no User-agent: * group; crawler-specific groups may still apply');

    if (/sitemap\s*:/i.test(robots.text)) ok('robots', 'declares Sitemap:');
    else warn('robots', 'no Sitemap: directive in robots.txt');

    const explicit = [], inherited = [], blocked = [], unspecified = [];
    for (const bot of AI_BOTS) {
      const result = policyFor(groups, bot);
      if (result.policy === 'blocked') blocked.push(bot);
      else if (result.source === 'explicit') explicit.push(bot);
      else if (result.source === 'inherited') inherited.push(bot);
      else unspecified.push(bot);
    }
    if (explicit.length) ok('geo', `AI crawlers explicitly allowed: ${explicit.join(', ')}`);
    if (inherited.length) info('geo', `AI crawlers inheriting User-agent: * policy: ${inherited.join(', ')}`);
    if (unspecified.length) info('geo', `AI crawler policy unspecified: ${unspecified.join(', ')}`);
    if (blocked.length) warn('geo', `AI crawlers blocked; review against training/search policy: ${blocked.join(', ')}`);
  }

  // ---- sitemap.xml ----
  const sm = await get('/sitemap.xml');
  if (sm.status !== 200) warn('sitemap', `sitemap.xml returned ${sm.status}`);
  else {
    const urls = (sm.text.match(/<loc>/gi) || []).length;
    const hasLastmod = /<lastmod>/i.test(sm.text);
    if (urls === 0) warn('sitemap', 'sitemap.xml has 0 <loc> entries (or is an index — check children)');
    else ok('sitemap', `${urls} URLs${hasLastmod ? ' (with <lastmod>)' : ' (no <lastmod> — add for freshness)'}`);
  }

  // ---- llms.txt (GEO) ----
  const llms = await get('/llms.txt');
  if (llms.status === 200 && llms.text.trim()) info('geo', 'experimental llms.txt present');
  else info('geo', 'no /llms.txt (experimental convention, not a search requirement)');

  // ---- homepage: JSON-LD, canonical, OG, headers ----
  const home = await get('/');
  if (home.status !== 200) {
    err('home', `homepage returned ${home.status}`);
  } else {
    const typesOf = (node) => {
      // Expand arrays and schema.org @graph wrappers to their member @types.
      if (Array.isArray(node)) return node.flatMap(typesOf);
      if (node && typeof node === 'object') {
        if (Array.isArray(node['@graph'])) return node['@graph'].flatMap(typesOf);
        if (node['@type']) return [node['@type']];
      }
      return [];
    };
    const types = [...home.text.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
      .flatMap((m) => { try { return typesOf(JSON.parse(m[1])); } catch { return ['(unparseable)']; } });
    if (types.length) ok('jsonld', `JSON-LD @types: ${types.join(', ')}`);
    else info('jsonld', 'no JSON-LD on homepage; add only types that match visible content and business needs');
    for (const want of ['Organization', 'WebSite'])
      if (!types.includes(want)) info('jsonld', `${want} structured data not detected (optional, not a ranking requirement)`);

    const canonicalTag = home.text.match(/<link[^>]*rel=["']?canonical[^>]*>/i)?.[0];
    const canonicalHref = canonicalTag?.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = canonicalHref?.[1] ?? canonicalHref?.[2] ?? canonicalHref?.[3] ?? '';
    if (!canonicalTag) warn('canonical', 'homepage missing canonical');
    else {
      try {
        const canonicalUrl = new URL(href);
        if (canonicalUrl.origin === origin && canonicalUrl.pathname === '/') ok('canonical', 'homepage canonical matches origin root');
        else warn('canonical', `homepage canonical points to ${canonicalUrl.href}; expected ${origin}/ unless intentionally cross-canonicalized`);
      } catch {
        warn('canonical', `homepage canonical is not an absolute URL: "${href}"`);
      }
    }

    // headers
    const h = home.headers;
    if (h.get('strict-transport-security')) ok('headers', 'HSTS present');
    else warn('headers', 'no Strict-Transport-Security header');
    if ((h.get('vary') || '').toLowerCase().includes('user-agent')) info('headers', 'Vary: User-Agent present');
    const cc = h.get('cache-control') || '';
    if (cc) ok('headers', `Cache-Control: ${cc}`);
    else warn('headers', 'no Cache-Control on homepage');
  }

  // ---- report ----
  if (JSON_OUT) { console.log(JSON.stringify({ origin, findings: out }, null, 2)); return; }
  const icon = { ok: '✓', info: 'i', warn: '⚠', error: '✗' };
  let area = '';
  for (const f of out.sort((a, b) => a.area.localeCompare(b.area))) {
    if (f.area !== area) { area = f.area; console.log(`\n[${area}]`); }
    console.log(`  ${icon[f.sev]} ${f.msg}`);
  }
  const e = out.filter((x) => x.sev === 'error').length;
  const w = out.filter((x) => x.sev === 'warn').length;
  const i = out.filter((x) => x.sev === 'info').length;
  console.log(`\n${'─'.repeat(56)}\norigin: ${origin}\nerrors: ${e}   warnings: ${w}   info: ${i}`);
  process.exit(e > 0 ? 1 : 0);
}
run();
