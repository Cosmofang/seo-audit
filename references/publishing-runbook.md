# SEO publishing and incident runbook

## Contents

- Pre-merge, deployment and production checks
- Search submission and weekly operations
- Crawl, canonical, redirect, schema and performance incidents
- Rollback records

## Before implementation

- Confirm target query/user intent and page purpose.
- Select the final canonical path and index policy.
- Check whether an existing page should be updated instead of creating overlap.
- Identify language twins and translation owner.
- Identify factual sources for product claims, metrics, ratings and dates.
- Choose the visible breadcrumb/internal-link placement and appropriate schema type.

## Before merge

Run the environment-bound build and all local gates:

```bash
node scripts/audit-seo.mjs --dir dist --origin https://www.example.com --strict
```

Verify:

- Route exists in the route source and generated output.
- Title, description, H1 and visible opening answer match intent.
- Self canonical uses the correct environment origin.
- Robots/index policy and sitemap eligibility agree.
- Hreflang twins exist and reciprocate.
- JSON-LD parses and matches visible facts.
- Images have intrinsic dimensions, alt and appropriate loading priority.
- Internal links use canonical, same-language destinations.
- No hidden crawler-only content exists.
- Performance budgets and representative Lighthouse journeys pass.

## Deployment

1. Build with the production canonical origin.
2. Deploy the exact artifact that passed audits.
3. Do not rebuild implicitly with a different environment during upload.
4. Apply edge/Worker configuration and verify it did not inject robots or redirect behavior.
5. Submit changed canonical URLs to IndexNow where used, after deployment succeeds.

## Production smoke test

```bash
node scripts/audit-live.mjs https://www.example.com
```

Manually inspect at least:

```bash
curl -sSIL https://www.example.com/new-page/
curl -sS https://www.example.com/robots.txt
curl -sS https://www.example.com/sitemap.xml
curl -sS https://www.example.com/llms.txt
```

Check:

- 200 on canonical, one-hop permanent redirects on variants.
- Correct canonical, robots meta and hreflang in production HTML.
- Page present in sitemap only when indexable.
- Correct response content type and caching for SEO files.
- No staging hostname or stale entity facts.
- Browser rendering and mobile layout.
- Multi-UA parity through production delivery.

## Search submission

- Keep site-ownership verification tags/files for Google, Bing, Baidu or other active webmaster platforms under explicit ownership. These services may recheck periodically; do not remove a production verification artifact during template or public-directory cleanup without confirming the property has another valid method.
- Treat verification tokens as deployment configuration. Document their purpose and owner, but do not copy live tokens into public examples or reports unnecessarily.
- Keep sitemap registered in Search Console and Bing Webmaster Tools.
- Request indexing sparingly for important new/changed pages; do not use it to hide site-wide crawl problems.
- Use URL Inspection to verify selected canonical, rendered HTML and index status.
- Record deployment date so later ranking/traffic analysis has a causal boundary.

## Weekly checks

- Search Console Pages/Crawl Stats/Enhancements and query-page performance.
- Sitemap fetch and lastmod quality.
- Production robots diff against intended policy.
- 404, redirect and 5xx logs for crawlers.
- CWV field regressions and Lighthouse CI trend.
- New orphan pages, duplicate metadata and broken internal links.
- AI agent log categories and referral/conversion separation.

## Incident: production blocked

Symptoms: `Disallow: /`, global `noindex`, authentication wall, or CDN block.

1. Fetch final production responses from outside the origin.
2. Check CDN managed robots and security dashboard settings.
3. Restore crawl/index policy.
4. Purge cache and verify multiple UAs.
5. Inspect Search Console and resubmit sitemap.
6. Add an automated production monitor.

## Incident: wrong canonical origin/path

1. Stop deployment promotion.
2. Confirm build-time origin and artifact provenance.
3. Rebuild for production; never edit only generated HTML.
4. Verify every template class, not just home.
5. Purge CDN cache.
6. Inspect sitemap, Open Graph, hreflang and JSON-LD for the same wrong origin.
7. Monitor Google's selected canonical.

## Incident: redirect loop or multi-hop

1. Capture every hop with headers.
2. Identify ownership: edge redirect rule, HTTPS setting, Worker/router, framework or origin.
3. Consolidate scheme+host+path into one final redirect where possible.
4. Exempt APIs/assets/SEO files as intended.
5. Test query preservation and non-GET methods.

## Incident: structured data error

1. Compare rendered JSON-LD to visible content and source records.
2. Remove false prices, availability, ratings or claims immediately.
3. Fix the shared builder/source rather than individual generated pages.
4. Run syntax/unit/external validation.
5. Revalidate affected templates in Search Console.

## Incident: performance regression

1. Identify the actual LCP element and metric phase.
2. Compare bundle/image/font bytes to the previous release.
3. Reproduce with the same device/network profile, three-run median.
4. Fix render blockers, priorities, layout reservations or main-thread work.
5. Verify CLS and INP did not regress while improving LCP.
6. Tighten or add a gate for the specific regression.

## Rollback records

For every SEO incident record:

- Start/end time and affected origins/paths.
- First bad deployment/config change.
- Crawler/index/user impact.
- Fix and cache purge actions.
- Verification commands and results.
- Preventive test/monitor added.
