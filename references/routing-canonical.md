# Routing, canonical and index control

## Contents

- Route source and clean-build contract
- Build-time origin binding
- URL normalization and indexability
- Sitemap, internal links and redirect verification

## One route identity

The route source should contain enough metadata to drive every SEO consumer:

```ts
type Route = {
  path: string;
  page: string;
  title: string;
  description: string;
  changefreq?: 'weekly' | 'monthly';
  priority?: number;
  breadcrumb?: Array<{ name: string; href: string }>;
  schemaType?: 'WebPage' | 'Article' | 'Product' | 'FAQPage';
  lastmod?: string;
};
```

Keep generated routes for dynamic content (for example CMS posts) in the same normalized shape.

Start every production build from a clean output directory. Static builders do not all remove stale/manual public files, and a leftover HTML file can ship an obsolete canonical even when the current route source is correct. Audit both route coverage and unexpected HTML output.

## Static build origin binding

Absolute canonical, Open Graph, JSON-LD and hreflang URLs are produced during a static build. Therefore:

```text
build:staging + STAGING_ORIGIN -> staging artifact only
build:production + PRODUCTION_ORIGIN -> production artifact only
```

Make the generic build command fail if no target origin is selected. Runtime Worker/CDN environment variables cannot retroactively change absolute URLs already baked into HTML.

At build time, validate:

- Origin is absolute and has the required production scheme/host.
- Exactly one canonical exists.
- Every indexable page canonical is self-referential unless an intentional consolidation rule says otherwise.
- Canonical query and fragment handling matches policy.
- No staging hostname appears in production output.

## URL normalization

Choose one form for:

- HTTPS.
- Apex or `www`.
- Lowercase paths.
- Trailing slash.
- Encoded characters and duplicate slashes.

Redirect every alternate form to the final canonical in one permanent hop where the edge platform allows it. Preserve query strings unless they are known tracking/noise parameters being deliberately removed.

Pipeline ordering matters:

```text
host/scheme normalization
  -> API/private routes
  -> SEO files (robots, sitemap, discovery endpoints)
  -> legacy redirects
  -> page-path normalization
  -> static assets/pages
  -> response headers
```

Skip path normalization for APIs, asset paths, extension URLs and special SEO endpoints. Redirecting POST APIs can drop or alter request bodies depending on status and client behavior.

Use 301/308 according to method-preservation needs; for canonical GET URLs, a one-hop permanent redirect is the important property. Verify actual behavior instead of relying on dashboard intent.

## Indexability source

Maintain a shared indexability classification:

```ts
type IndexPolicy = 'index' | 'noindex' | 'private';
```

- `index`: self canonical, eligible for sitemap and public content indexes.
- `noindex`: publicly reachable but excluded via meta/X-Robots-Tag; omit from sitemap.
- `private`: authenticated or unavailable to crawlers; do not rely on robots.txt for access control.

robots.txt controls crawling, not guaranteed de-indexing. If a public page should leave the index, allow the crawler to fetch its `noindex` until removal is processed.

## Sitemap

Generate sitemap URLs from normalized, indexable routes. For every entry:

- Use the production canonical origin.
- Include meaningful lastmod only when content changed.
- Avoid rebuilding every lastmod with the deployment timestamp.
- Emit hreflang only when all referenced twins exist and reciprocate.
- Split into sitemap indexes when URL/byte limits require it.

If lastmod comes from git history, CI needs full relevant history. CMS dates are preferable for CMS-owned content. Do not treat `changefreq` and `priority` as guaranteed crawler instructions.

## Internal links

- Link directly to canonical final URLs without redirect hops.
- Keep language-specific navigation in the current locale.
- Use descriptive anchors that fit the sentence; avoid mechanically repeating exact-match keywords.
- External editorial citations normally remain followed. Add `rel="sponsored"`, `ugc` or `nofollow` only when the relationship warrants it.
- Add `noopener` where opening a new context requires the security protection; modern browsers also protect many `_blank` cases, but explicit policy is acceptable.

## Redirect verification

Test a matrix after every routing change:

```text
http apex
https apex
http canonical host
https canonical host
uppercase path
missing trailing slash
legacy path
API POST
robots.txt / sitemap.xml / llms.txt
hashed asset
```

Assert final URL, status, hop count, query preservation and method behavior.
