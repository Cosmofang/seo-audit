#!/usr/bin/env node

const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith('--'));
const JSON_OUT = args.includes('--json');

if (args.includes('--help') || !target) {
  console.log('usage: node scripts/audit-live.mjs https://www.example.com [--json]');
  process.exit(args.includes('--help') ? 0 : 2);
}

let requested;
try {
  requested = new URL(target);
  if (!/^https?:$/.test(requested.protocol)) throw new Error('only HTTP(S) origins are supported');
} catch (error) {
  console.error(`invalid URL: ${target} (${error.message})`);
  process.exit(2);
}

const origin = requested.origin;
const findings = [];
const add = (severity, area, message, details = undefined) => {
  findings.push({ severity, area, message, ...(details ? { details } : {}) });
};
const ok = (area, message, details) => add('ok', area, message, details);
const info = (area, message, details) => add('info', area, message, details);
const warn = (area, message, details) => add('warn', area, message, details);
const error = (area, message, details) => add('error', area, message, details);

async function get(path, userAgent = 'seo-audit/2.0') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(new URL(path, `${origin}/`), {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': userAgent,
        accept: 'text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.8',
      },
    });
    const text = await response.text();
    return {
      status: response.status,
      url: response.url,
      headers: response.headers,
      text,
    };
  } catch (cause) {
    const rootCause = cause?.cause;
    const reason = [
      cause?.name || 'Error',
      cause?.message,
      rootCause?.code,
      rootCause?.message,
    ].filter(Boolean).join(': ');
    return { status: 0, url: new URL(path, `${origin}/`).href, headers: new Headers(), text: '', cause: reason || String(cause) };
  } finally {
    clearTimeout(timer);
  }
}

function parseRobots(text) {
  const groups = [];
  let group = null;
  let seenRule = false;
  const sitemaps = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const match = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === 'sitemap') {
      if (value) sitemaps.push(value);
      continue;
    }
    if (key === 'user-agent') {
      if (!group || seenRule) {
        group = { agents: [], rules: [] };
        groups.push(group);
        seenRule = false;
      }
      group.agents.push(value.toLowerCase());
      continue;
    }
    if (group && (key === 'allow' || key === 'disallow')) {
      if (value || key === 'allow') group.rules.push({ type: key, pattern: value });
      seenRule = true;
    }
  }
  return { groups, sitemaps };
}

function robotsPatternMatch(pattern, path) {
  if (!pattern) return false;
  const anchored = pattern.endsWith('$');
  const source = pattern.replace(/\$$/, '').split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  const expression = new RegExp(`^${source}${anchored ? '$' : ''}`);
  return expression.test(path);
}

function policyFor(parsed, agent, path = '/') {
  const token = agent.toLowerCase();
  let specificity = -1;
  let matching = [];
  for (const group of parsed.groups) {
    const score = Math.max(...group.agents.map((candidate) => candidate === '*' ? 0 : candidate === token ? candidate.length : -1));
    if (score > specificity) {
      specificity = score;
      matching = score >= 0 ? [group] : [];
    } else if (score === specificity && score >= 0) {
      matching.push(group);
    }
  }
  if (specificity < 0) return { status: 'unspecified', source: 'none' };
  const matches = matching.flatMap((group) => group.rules).filter((rule) => robotsPatternMatch(rule.pattern, path));
  if (!matches.length) return { status: 'allowed', source: specificity === 0 ? 'default' : 'named' };
  matches.sort((a, b) => b.pattern.replace(/\$$/, '').length - a.pattern.replace(/\$$/, '').length || (a.type === 'allow' ? -1 : 1));
  const longest = matches[0].pattern.replace(/\$$/, '').length;
  const tied = matches.filter((rule) => rule.pattern.replace(/\$$/, '').length === longest);
  const decision = tied.some((rule) => rule.type === 'allow') ? 'allowed' : 'blocked';
  return { status: decision, source: specificity === 0 ? 'default' : 'named' };
}

const AGENT_GROUPS = {
  search: ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot'],
  userFetch: ['ChatGPT-User', 'Claude-User', 'Perplexity-User'],
  training: ['GPTBot', 'ClaudeBot', 'CCBot'],
  control: ['Google-Extended'],
};

function scriptAttributes(raw) {
  const type = raw.match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return (type?.[1] || type?.[2] || type?.[3] || '').toLowerCase();
}

function structuredTypes(node) {
  if (Array.isArray(node)) return node.flatMap(structuredTypes);
  if (!node || typeof node !== 'object') return [];
  const own = Array.isArray(node['@type']) ? node['@type'] : node['@type'] ? [node['@type']] : [];
  const graph = node['@graph'] ? structuredTypes(node['@graph']) : [];
  return [...own, ...graph];
}

function edgeChallenge(response) {
  const mitigated = response.headers.get('cf-mitigated');
  return response.status === 403 && mitigated
    ? `edge security challenge blocked the audit (${mitigated})`
    : null;
}

async function run() {
  if (requested.protocol !== 'https:') warn('transport', 'audit target does not use HTTPS');

  const robots = await get('/robots.txt');
  const robotsChallenge = edgeChallenge(robots);
  if (robotsChallenge) {
    error('edge', `robots.txt: ${robotsChallenge}`);
  } else if (robots.status === 0) {
    error('robots', `robots.txt request failed: ${robots.cause}`);
  } else if (robots.status === 404) {
    warn('robots', 'robots.txt is absent (404); crawling defaults to allowed, but sitemap/crawler policy is undocumented');
  } else if (robots.status !== 200) {
    error('robots', `robots.txt returned ${robots.status}`);
  } else {
    const parsed = parseRobots(robots.text);
    const defaultPolicy = policyFor(parsed, '*');
    if (defaultPolicy.status === 'blocked') error('robots', 'default User-agent policy blocks the site root');
    else ok('robots', `default root policy: ${defaultPolicy.status}`);

    if (parsed.sitemaps.length) ok('robots', `declares ${parsed.sitemaps.length} Sitemap directive(s)`);
    else warn('robots', 'no Sitemap directive');

    const summarize = (agents) => agents.map((agent) => ({ agent, ...policyFor(parsed, agent) }));
    const search = summarize(AGENT_GROUPS.search);
    const userFetch = summarize(AGENT_GROUPS.userFetch);
    const training = summarize(AGENT_GROUPS.training);
    const control = summarize(AGENT_GROUPS.control);

    const blockedSearch = search.filter((entry) => entry.status === 'blocked').map((entry) => entry.agent);
    if (blockedSearch.length) warn('ai-search', `AI search/index crawlers blocked: ${blockedSearch.join(', ')}`);
    else ok('ai-search', `AI search/index root access: ${search.map((entry) => `${entry.agent}=${entry.status}`).join(', ')}`);

    const blockedFetch = userFetch.filter((entry) => entry.status === 'blocked').map((entry) => entry.agent);
    if (blockedFetch.length) warn('ai-user-fetch', `user-triggered fetchers blocked by policy: ${blockedFetch.join(', ')}`);
    else ok('ai-user-fetch', `user-triggered root access: ${userFetch.map((entry) => `${entry.agent}=${entry.status}`).join(', ')}`);

    info('ai-training', `training crawler policy (business/legal choice): ${training.map((entry) => `${entry.agent}=${entry.status}`).join(', ')}`);
    info('ai-control', `robots control token policy: ${control.map((entry) => `${entry.agent}=${entry.status}`).join(', ')}`);

    if (/content-signal\s*:/i.test(robots.text)) info('robots', 'Content-Signal directive present; verify CDN-injected policy matches site intent');
  }

  const sitemap = await get('/sitemap.xml');
  const sitemapChallenge = edgeChallenge(sitemap);
  if (sitemapChallenge) {
    error('edge', `sitemap.xml: ${sitemapChallenge}`);
  } else if (sitemap.status === 200) {
    const urlCount = (sitemap.text.match(/<url\b/gi) || []).length;
    const childCount = (sitemap.text.match(/<sitemap\b/gi) || []).length;
    if (urlCount > 0) ok('sitemap', `${urlCount} URL entries${/<lastmod>/i.test(sitemap.text) ? ' with lastmod data' : ''}`);
    else if (childCount > 0) ok('sitemap', `sitemap index with ${childCount} child sitemap(s)`);
    else warn('sitemap', '200 response contains no URL or child sitemap entries');
  } else if (sitemap.status === 0) {
    error('sitemap', `request failed: ${sitemap.cause}`);
  } else {
    warn('sitemap', `sitemap.xml returned ${sitemap.status}`);
  }

  const llms = await get('/llms.txt');
  const llmsChallenge = edgeChallenge(llms);
  if (llmsChallenge) error('edge', `llms.txt: ${llmsChallenge}`);
  else if (llms.status === 200 && llms.text.trim()) info('geo', `llms.txt present (${Buffer.byteLength(llms.text, 'utf8')} bytes; experimental convention)`);
  else info('geo', `llms.txt not detected (${llms.status || 'request failed'}); optional experimental compatibility layer`);

  const home = await get('/');
  const homeChallenge = edgeChallenge(home);
  if (homeChallenge) {
    error('edge', `homepage: ${homeChallenge}`);
  } else if (home.status === 0) {
    error('home', `homepage request failed: ${home.cause}`);
  } else if (home.status !== 200) {
    error('home', `homepage returned ${home.status}`);
  } else {
    const finalOrigin = new URL(home.url).origin;
    if (finalOrigin !== origin) info('redirect', `requested origin resolves to ${finalOrigin}`);

    const canonicalMatch = home.text.match(/<link\b[^>]*\brel\s*=\s*(?:"[^"]*canonical[^"]*"|'[^']*canonical[^']*'|canonical)[^>]*>/i);
    const canonicalHref = canonicalMatch?.[0].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const canonical = canonicalHref?.[1] || canonicalHref?.[2] || canonicalHref?.[3] || '';
    if (!canonical) error('canonical', 'homepage missing canonical');
    else {
      try {
        const parsed = new URL(canonical);
        if (parsed.origin !== finalOrigin || parsed.pathname !== '/') {
          error('canonical', `homepage canonical ${canonical} does not match final origin home ${finalOrigin}/`);
        } else ok('canonical', `homepage self-canonical: ${canonical}`);
      } catch {
        error('canonical', `homepage canonical is invalid: ${canonical}`);
      }
    }

    const robotsMeta = home.text.match(/<meta\b[^>]*\bname\s*=\s*["']?robots["']?[^>]*>/i)?.[0] || '';
    if (/\bnoindex\b/i.test(robotsMeta)) error('indexability', 'homepage has noindex robots meta');

    const types = [];
    let invalidJsonLd = 0;
    for (const match of home.text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (scriptAttributes(match[1]) !== 'application/ld+json') continue;
      try {
        types.push(...structuredTypes(JSON.parse(match[2])));
      } catch {
        invalidJsonLd += 1;
      }
    }
    if (invalidJsonLd) error('jsonld', `${invalidJsonLd} invalid JSON-LD block(s) on homepage`);
    if (types.length) ok('jsonld', `homepage types: ${[...new Set(types)].join(', ')}`);
    else warn('jsonld', 'homepage has no parseable JSON-LD');
    for (const wanted of ['Organization', 'WebSite']) {
      if (!types.includes(wanted)) warn('jsonld', `homepage missing ${wanted}`);
    }

    if (requested.protocol === 'https:') {
      if (home.headers.get('strict-transport-security')) ok('headers', 'HSTS present');
      else warn('headers', 'HSTS missing on HTTPS homepage');
    }
    const cacheControl = home.headers.get('cache-control');
    if (cacheControl) info('headers', `Cache-Control: ${cacheControl}`);
    else warn('headers', 'Cache-Control missing on homepage');
    if ((home.headers.get('vary') || '').toLowerCase().includes('user-agent')) {
      info('headers', 'Vary: User-Agent present; confirm UA-dependent responses are intentional and non-cloaking');
    }
  }

  const errors = findings.filter((finding) => finding.severity === 'error');
  const warnings = findings.filter((finding) => finding.severity === 'warn');
  if (JSON_OUT) {
    console.log(JSON.stringify({ origin, findings, summary: { errors: errors.length, warnings: warnings.length } }, null, 2));
  } else {
    const icons = { ok: '+', info: 'i', warn: '!', error: 'x' };
    let area = '';
    for (const finding of findings.sort((a, b) => a.area.localeCompare(b.area))) {
      if (finding.area !== area) {
        area = finding.area;
        console.log(`\n[${area}]`);
      }
      console.log(`  ${icons[finding.severity]} ${finding.message}`);
    }
    console.log(`\norigin: ${origin}`);
    console.log(`errors: ${errors.length} | warnings: ${warnings.length}`);
  }
  process.exit(errors.length > 0 ? 1 : 0);
}

run().catch((cause) => {
  if (JSON_OUT) {
    console.log(JSON.stringify({ origin, findings: [{ severity: 'error', area: 'runtime', message: String(cause) }], summary: { errors: 1, warnings: 0 } }, null, 2));
  } else {
    console.error(cause);
  }
  process.exit(1);
});
