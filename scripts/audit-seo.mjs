#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const args = process.argv.slice(2);
const valueOf = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')
    ? args[index + 1]
    : fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);
const valuesOf = (name) => args.flatMap((arg, index) => (
  arg === `--${name}` && args[index + 1] && !args[index + 1].startsWith('--') ? [args[index + 1]] : []
));

if (hasFlag('help')) {
  console.log(`usage: node scripts/audit-seo.mjs [options]

options:
  --dir <path>          build output directory (default: dist)
  --origin <url>        expected canonical origin, e.g. https://www.example.com
  --alternate-prefix p  repeatable output prefix whose canonical may point to a primary page
  --strict              fail when warnings exist
  --json                emit JSON
  --max-page-kb <n>     HTML + local CSS/JS budget (default: 500)
  --max-img-kb <n>      built image budget (default: 500)
  --help                show this help`);
  process.exit(0);
}

const ROOT = resolve(valueOf('dir', 'dist'));
const STRICT = hasFlag('strict');
const JSON_OUT = hasFlag('json');
const MAX_PAGE = Number(valueOf('max-page-kb', '500')) * 1024;
const MAX_IMAGE = Number(valueOf('max-img-kb', '500')) * 1024;
const ALTERNATE_PREFIXES = valuesOf('alternate-prefix').map((prefix) => (
  prefix.replace(/^[/\\]+/, '').split('\\').join('/').replace(/\/+$/, '') + '/'
));
const IMAGE_EXTENSIONS = new Set(['.webp', '.avif', '.jpg', '.jpeg', '.png', '.gif', '.svg']);
const ALLOWED_INLINE_SCRIPT_TYPES = new Set(['application/ld+json', 'application/json', 'importmap']);

let expectedOrigin = null;
const originArg = valueOf('origin', '');
if (originArg) {
  try {
    const parsed = new URL(originArg);
    if (!/^https?:$/.test(parsed.protocol) || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      throw new Error('origin must contain only scheme and host');
    }
    expectedOrigin = parsed.origin;
  } catch (error) {
    emitFatal('invalid-origin', `invalid --origin "${originArg}": ${error.message}`);
  }
}
if (!Number.isFinite(MAX_PAGE) || MAX_PAGE <= 0 || !Number.isFinite(MAX_IMAGE) || MAX_IMAGE <= 0) {
  emitFatal('invalid-budget', '--max-page-kb and --max-img-kb must be positive numbers');
}

const findings = [];
const add = (file, severity, rule, message) => findings.push({ file, severity, rule, message });
const pageRecords = [];

function emitFatal(rule, message) {
  const payload = {
    dir: ROOT,
    origin: expectedOrigin,
    scanned: { html: 0, css: 0, img: 0 },
    errors: [{ file: '.', severity: 'error', rule, message }],
    warnings: [],
  };
  if (JSON_OUT) console.log(JSON.stringify(payload, null, 2));
  else console.error(`x [${rule}] ${message}`);
  process.exit(2);
}

function* walk(directory) {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    add(relative(ROOT, directory) || '.', 'error', 'read-directory', error.message);
    return;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.isFile()) yield path;
  }
}

function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || [];
}

function attributes(tag) {
  const out = new Map();
  const body = tag.replace(/^<[^\s>]+\s*/i, '').replace(/\/?>$/, '');
  const expression = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = expression.exec(body))) {
    out.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return out;
}

function findMeta(metas, key, value) {
  const expected = value.toLowerCase();
  return metas.find((tag) => (attributes(tag).get(key) || '').toLowerCase() === expected);
}

function relTokens(tag) {
  return new Set((attributes(tag).get('rel') || '').toLowerCase().split(/\s+/).filter(Boolean));
}

function decodeText(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function expectedPath(file) {
  const rel = relative(ROOT, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

function isAlternateOutput(file) {
  const rel = relative(ROOT, file).split(sep).join('/');
  return ALTERNATE_PREFIXES.some((prefix) => rel.startsWith(prefix));
}

function isErrorPage(file) {
  const rel = relative(ROOT, file).split(sep).join('/');
  return /(^|\/)(404|50\d)(?:\/index)?\.html$/i.test(rel);
}

function localAsset(file, reference) {
  if (!reference || /^(?:data:|blob:|mailto:|tel:|#)/i.test(reference)) return null;
  let normalizedReference = reference;
  if (/^https?:\/\//i.test(reference) || reference.startsWith('//')) {
    let absolute;
    try {
      absolute = new URL(reference, expectedOrigin || 'https://audit.invalid');
    } catch {
      return null;
    }
    if (!expectedOrigin || absolute.origin !== expectedOrigin) return null;
    normalizedReference = `${absolute.pathname}${absolute.search}${absolute.hash}`;
  }
  const withoutFragment = normalizedReference.split('#')[0];
  const withoutQuery = withoutFragment.split('?')[0];
  let pathname;
  try {
    pathname = decodeURIComponent(withoutQuery);
  } catch {
    return null;
  }
  const target = normalizedReference.startsWith('/')
    ? resolve(ROOT, `.${pathname}`)
    : resolve(dirname(file), pathname);
  const rootPrefix = ROOT.endsWith(sep) ? ROOT : `${ROOT}${sep}`;
  if (target !== ROOT && !target.startsWith(rootPrefix)) return null;
  return existsSync(target) && statSync(target).isFile() ? target : null;
}

function isExternalResource(reference) {
  if (!reference || /^(?:data:|blob:|#)/i.test(reference)) return false;
  if (!/^https?:\/\//i.test(reference)) return false;
  if (!expectedOrigin) return true;
  try {
    return new URL(reference).origin !== expectedOrigin;
  } catch {
    return true;
  }
}

function srcsetUrls(value) {
  return value.split(',').map((part) => part.trim().split(/\s+/)[0]).filter(Boolean);
}

function structuredTypes(node) {
  if (Array.isArray(node)) return node.flatMap(structuredTypes);
  if (!node || typeof node !== 'object') return [];
  const own = Array.isArray(node['@type']) ? node['@type'] : node['@type'] ? [node['@type']] : [];
  const graph = node['@graph'] ? structuredTypes(node['@graph']) : [];
  return [...own, ...graph];
}

function scanCss(file, css, label) {
  for (const match of css.matchAll(/(?:url\(\s*['"]?([^'")]+)|@import\s+(?:url\()?\s*['"]([^'"]+))/gi)) {
    const url = (match[1] || match[2] || '').trim();
    if (isExternalResource(url)) add(label, 'warn', 'external-resource', `external CSS resource: ${url}`);
  }
  for (const match of css.matchAll(/font-size\s*:\s*([^;}]+)/gi)) {
    const raw = match[1].replace(/!important/i, '').trim();
    if (/^(?:var\(|calc\(|clamp\(|inherit|initial|unset|0\b)/i.test(raw)) continue;
    const unit = raw.match(/^([\d.]+)(px|pt|rem|em)?$/i);
    if (!unit) continue;
    const number = Number(unit[1]);
    const px = !unit[2] || unit[2].toLowerCase() === 'px'
      ? number
      : unit[2].toLowerCase() === 'pt' ? number * 1.3333 : number * 16;
    if (px < 10) add(label, 'warn', 'font-size', `font-size ${raw} is below the 10px project floor`);
  }
}

function auditHtml(file, html) {
  const label = relative(ROOT, file).split(sep).join('/');
  const errorPage = isErrorPage(file);
  const alternateOutput = isAlternateOutput(file);
  const metas = tags(html, 'meta');
  const links = tags(html, 'link');
  const images = tags(html, 'img');

  const h1Count = tags(html, 'h1').length;
  if (h1Count !== 1) add(label, 'error', 'h1', `expected exactly one <h1>, found ${h1Count}`);

  const viewport = findMeta(metas, 'name', 'viewport');
  if (!viewport) add(label, 'error', 'viewport', 'missing <meta name="viewport">');
  else {
    const content = attributes(viewport).get('content') || '';
    if (!/width\s*=\s*device-width/i.test(content) || !/initial-scale\s*=\s*1(?:\.0)?(?:\D|$)/i.test(content)) {
      add(label, 'error', 'viewport', `invalid viewport content: "${content}"`);
    }
  }

  for (const landmark of ['main', 'nav', 'footer']) {
    if (tags(html, landmark).length === 0) add(label, 'error', 'semantic', `missing <${landmark}>`);
  }

  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeText(titleMatch[1]) : '';
  if (!title) add(label, 'error', 'title', 'missing or empty <title>');
  else if ([...title].length < 10 || [...title].length > 70) {
    add(label, 'warn', 'title-length', `title length ${[...title].length}; review SERP fit and intent`);
  }

  const descriptionTag = findMeta(metas, 'name', 'description');
  const description = descriptionTag ? (attributes(descriptionTag).get('content') || '').trim() : '';
  if (!errorPage && !description) add(label, 'error', 'description', 'missing or empty meta description');
  else if (description && ([...description].length < 50 || [...description].length > 180)) {
    add(label, 'warn', 'description-length', `description length ${[...description].length}; review snippet fit`);
  }

  const robots = (attributes(findMeta(metas, 'name', 'robots') || '').get('content') || '').toLowerCase();
  const noindex = /\bnoindex\b/.test(robots);

  const canonicals = links.filter((link) => relTokens(link).has('canonical'));
  let canonical = '';
  if (!errorPage && canonicals.length !== 1) {
    add(label, 'error', 'canonical-count', `expected exactly one canonical, found ${canonicals.length}`);
  }
  if (canonicals.length) {
    canonical = attributes(canonicals[0]).get('href') || '';
    try {
      const parsed = new URL(canonical);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error('canonical must use HTTP(S)');
      if (expectedOrigin && parsed.origin !== expectedOrigin) {
        add(label, 'error', 'canonical-origin', `canonical origin ${parsed.origin} does not match ${expectedOrigin}`);
      }
      const expected = expectedPath(file);
      if (!errorPage && !alternateOutput && parsed.pathname !== expected) {
        add(label, 'error', 'canonical-path', `canonical path ${parsed.pathname} does not match built route ${expected}`);
      }
      if (parsed.hash) add(label, 'error', 'canonical-fragment', 'canonical must not contain a fragment');
    } catch (error) {
      add(label, 'error', 'canonical-url', `canonical is not a valid absolute URL: "${canonical}" (${error.message})`);
    }
  }

  if (!errorPage && !alternateOutput) {
    for (const property of ['og:title', 'og:image']) {
      const meta = findMeta(metas, 'property', property);
      if (!meta || !(attributes(meta).get('content') || '').trim()) {
        add(label, 'warn', 'open-graph', `missing or empty ${property}`);
      }
    }
  }

  for (const image of images) {
    const attrs = attributes(image);
    const src = attrs.get('src') || '(missing src)';
    if (!attrs.has('width') || !attrs.has('height')) add(label, 'error', 'image-dimensions', `<img src="${src}"> missing width/height`);
    if (!attrs.has('alt')) add(label, 'error', 'image-alt', `<img src="${src}"> missing alt`);
    const highPriority = (attrs.get('fetchpriority') || '').toLowerCase() === 'high';
    const eager = (attrs.get('loading') || '').toLowerCase() === 'eager';
    if (eager && !highPriority) add(label, 'warn', 'image-priority', `eager image should be reviewed for fetchpriority="high": ${src}`);
    if (!eager && !highPriority && (attrs.get('loading') || '').toLowerCase() !== 'lazy') {
      add(label, 'warn', 'image-loading', `non-priority image is not loading="lazy": ${src}`);
    }
  }

  const scriptExpression = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const schemaTypes = [];
  let scriptMatch;
  while ((scriptMatch = scriptExpression.exec(html))) {
    const attrs = attributes(`<script ${scriptMatch[1]}>`);
    const body = scriptMatch[2].trim();
    const type = (attrs.get('type') || '').toLowerCase();
    if (type === 'application/ld+json' && body) {
      try {
        schemaTypes.push(...structuredTypes(JSON.parse(body)));
      } catch (error) {
        add(label, 'error', 'jsonld-parse', `invalid JSON-LD: ${error.message}`);
      }
    }
    if (!attrs.has('src') && body && !ALLOWED_INLINE_SCRIPT_TYPES.has(type)) {
      add(label, 'warn', 'inline-script', `inline executable script type="${type || '(default)'}" blocks a strict CSP`);
    }
  }
  if (!errorPage && schemaTypes.length === 0) add(label, 'warn', 'jsonld-missing', 'no parseable JSON-LD found');
  if (expectedPath(file) === '/' && !errorPage) {
    for (const type of ['Organization', 'WebSite']) {
      if (!schemaTypes.includes(type)) add(label, 'warn', 'jsonld-site', `homepage JSON-LD missing ${type}`);
    }
  }

  for (const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
    if (/\son[a-z]+\s*=/i.test(match[2])) add(label, 'warn', 'inline-handler', `<${match[1]}> has an inline event handler`);
  }

  const resourceChecks = [
    ...tags(html, 'script').map((tag) => [tag, 'src']),
    ...tags(html, 'img').flatMap((tag) => [[tag, 'src'], [tag, 'srcset']]),
    ...tags(html, 'source').flatMap((tag) => [[tag, 'src'], [tag, 'srcset']]),
    ...tags(html, 'video').map((tag) => [tag, 'poster']),
    ...links.filter((tag) => [...relTokens(tag)].some((token) => ['stylesheet', 'preload', 'prefetch', 'modulepreload'].includes(token))).map((tag) => [tag, 'href']),
  ];
  for (const [tag, attrName] of resourceChecks) {
    const value = attributes(tag).get(attrName);
    if (!value) continue;
    const urls = attrName === 'srcset' ? srcsetUrls(value) : [value];
    for (const url of urls) {
      if (isExternalResource(url)) add(label, 'warn', 'external-resource', `external ${attrName} resource: ${url}`);
    }
  }
  for (const style of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) scanCss(file, style[1], label);
  for (const style of html.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) scanCss(file, style[1] || style[2] || '', label);

  let pageBytes = Buffer.byteLength(html, 'utf8');
  const seenAssets = new Set();
  const budgetRefs = [
    ...links.filter((tag) => relTokens(tag).has('stylesheet')).map((tag) => attributes(tag).get('href')),
    ...tags(html, 'script').map((tag) => attributes(tag).get('src')),
  ];
  for (const reference of budgetRefs) {
    const asset = localAsset(file, reference);
    if (asset && !seenAssets.has(asset)) {
      seenAssets.add(asset);
      pageBytes += statSync(asset).size;
    }
  }
  if (pageBytes > MAX_PAGE) {
    add(label, 'error', 'page-weight', `HTML+local CSS/JS ${(pageBytes / 1024).toFixed(1)} KB exceeds ${(MAX_PAGE / 1024).toFixed(0)} KB`);
  }

  pageRecords.push({ file: label, errorPage, alternateOutput, noindex, title, description, canonical });
}

if (!existsSync(ROOT) || !statSync(ROOT).isDirectory()) emitFatal('directory', `build directory not found: ${ROOT}`);

let htmlCount = 0;
let cssCount = 0;
let imageCount = 0;
for (const file of walk(ROOT)) {
  const extension = extname(file).toLowerCase();
  if (extension === '.html') {
    htmlCount += 1;
    auditHtml(file, readFileSync(file, 'utf8'));
  } else if (extension === '.css') {
    cssCount += 1;
    scanCss(file, readFileSync(file, 'utf8'), relative(ROOT, file).split(sep).join('/'));
  } else if (IMAGE_EXTENSIONS.has(extension)) {
    imageCount += 1;
    const bytes = statSync(file).size;
    if (bytes > MAX_IMAGE) {
      add(relative(ROOT, file).split(sep).join('/'), 'warn', 'image-size', `${(bytes / 1024).toFixed(1)} KB exceeds ${(MAX_IMAGE / 1024).toFixed(0)} KB`);
    }
  }
}

if (htmlCount === 0) add('.', 'error', 'no-html', 'zero HTML files found; --dir is not a usable build output');

for (const [field, severity] of [['title', 'warn'], ['description', 'warn'], ['canonical', 'error']]) {
  const grouped = new Map();
  for (const page of pageRecords) {
    if (page.errorPage || page.alternateOutput || page.noindex || !page[field]) continue;
    const key = page[field];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(page.file);
  }
  for (const [value, files] of grouped) {
    if (files.length > 1) add(files.join(', '), severity, `duplicate-${field}`, `${files.length} indexable pages share ${field}: "${value}"`);
  }
}

const errors = findings.filter((item) => item.severity === 'error');
const warnings = findings.filter((item) => item.severity === 'warn');
const report = {
  dir: ROOT,
  origin: expectedOrigin,
  alternatePrefixes: ALTERNATE_PREFIXES,
  scanned: { html: htmlCount, css: cssCount, img: imageCount },
  errors,
  warnings,
};

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const byFile = new Map();
  for (const finding of findings) {
    if (!byFile.has(finding.file)) byFile.set(finding.file, []);
    byFile.get(finding.file).push(finding);
  }
  for (const [file, items] of byFile) {
    console.log(`\n${file}`);
    for (const item of items.sort((a, b) => a.severity.localeCompare(b.severity))) {
      console.log(`  ${item.severity === 'error' ? 'x' : '!'} [${item.rule}] ${item.message}`);
    }
  }
  console.log(`\nscanned: ${htmlCount} html | ${cssCount} css | ${imageCount} images`);
  console.log(`errors: ${errors.length} | warnings: ${warnings.length}`);
}

process.exit(errors.length > 0 || (STRICT && warnings.length > 0) ? 1 : 0);
