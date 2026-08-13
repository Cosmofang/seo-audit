# SEO/GEO operating model

## Contents

- Objective, sources of truth and ownership
- Evidence policy
- Page/content/route lifecycle
- Weekly and quarterly operations
- Incident priority

## Objective

Operate SEO as a release-quality system, not a one-time checklist. The system joins five layers:

```text
content and entity facts
  -> route and metadata source
  -> rendered HTML and machine-readable surfaces
  -> edge delivery, redirects and crawler policy
  -> measurement, incidents and iteration
```

## Sources of truth

A production implementation should assign one owner to each kind of truth:

| Truth | Recommended source | Consumers |
|---|---|---|
| Public route identity | typed route registry/CMS | pages, canonical, sitemap, breadcrumbs, discovery files |
| Indexability | shared noindex policy | page meta/X-Robots-Tag, sitemap filters, content indexes |
| Entity facts | structured entity module or CMS | Organization JSON-LD, trust page, public entity endpoint |
| Locale mapping | pure path/locale helpers | pages, language switch, hreflang, sitemap |
| Product/article facts | commerce/CMS source | visible content and page-specific JSON-LD |
| Performance budgets | versioned CI configuration | build audit and Lighthouse CI |
| Crawler policy | reviewed robots generator/config | production robots response and monitoring |

Generated files should carry a header or be ignored by version control. Do not manually edit route-derived output.

## Ownership

| Role | Responsibilities |
|---|---|
| Engineering | routes, templates, rendering, schema builders, redirects, sitemap, robots, CI, performance |
| SEO/content | search intent, metadata, internal links, content quality, freshness, source citations |
| Legal/security | training-crawler policy, data licensing, privacy/legal noindex decisions, claims |
| Analytics | crawler logs, AI referral classification, Search Console, CWV, attribution |
| Release owner | environment/origin pairing, smoke tests, IndexNow, incident rollback |

## Evidence policy

Every recommendation or report should label its evidence:

- **Observed**: a fetch, rendered output, log, Search Console record, field metric or controlled test.
- **Platform documented**: supported by current search/AI operator documentation.
- **Project policy**: chosen for security, performance or editorial consistency.
- **Hypothesis**: deployed for compatibility or experimentation and awaiting outcome data.

Do not turn correlation into a ranking claim. Store the before/after date, pages, traffic segment, query set and confounders for experiments.

## Lifecycle

### New page

1. Map search/user intent and choose the canonical path.
2. Add route metadata and indexability decision.
3. Add all required language twins or explicitly mark partial coverage.
4. Implement visible content, internal links and truthful page schema.
5. Build with the target origin and run hard gates.
6. Preview headers, robots behavior and redirects through the real delivery layer.
7. Deploy, run live smoke tests and notify supported indexes.
8. Monitor indexing, queries, CWV and conversions.

### Content update

1. Update visible facts and their citations.
2. Update translated twins or record why they lag.
3. Update structured data from the same facts.
4. Set `dateModified`/lastmod only for meaningful changes.
5. Recheck internal links and related hubs.
6. Deploy and notify changed canonical URLs.

### Route migration

1. Define old-to-new mapping with query preservation rules.
2. Update internal links, canonical, hreflang, sitemap and discovery files.
3. Add one-hop permanent redirects to the final canonical URL.
4. Keep redirects long enough for users, backlinks and crawlers.
5. Monitor old/new URLs in logs and Search Console.

## Weekly operations

- Search Console: indexing changes, sitemap errors, manual actions, query/page CTR changes.
- Bing Webmaster Tools/IndexNow: submission failures and coverage where used.
- Production fetch: robots, sitemap, canonical, hreflang, JSON-LD and status codes.
- Server logs: crawler status distribution, redirect loops, spikes in 404/5xx and bot classification.
- CWV: field LCP/INP/CLS by template, country and device.
- Content: decaying pages, orphan pages, outdated claims and untranslated twins.
- AI measurement: separate crawler access, user-triggered fetches, citations/referrals and downstream conversion.

## Quarterly review

- Revalidate crawler names and official documentation.
- Review noindex and robots decisions with legal/security.
- Revalidate structured data types against current consumer policies.
- Rebaseline Lighthouse journeys and byte budgets without hiding regressions.
- Consolidate overlapping content and refresh topic hubs.
- Audit edge/CDN dashboard settings that code cannot see.
- Review experimental GEO surfaces and remove those with maintenance cost but no observed use.

## Incident priority

1. Production blocked or globally noindex.
2. Wrong-domain/wrong-path canonical or redirect loop.
3. Widespread 5xx/blank rendering/missing content.
4. Sitemap/hreflang contradictions and schema with false commercial facts.
5. Severe LCP/CLS/INP regression.
6. AI discovery-file or optional enhancement failure.

Do not let a missing `llms.txt` distract from a blocked site or wrong canonical.
