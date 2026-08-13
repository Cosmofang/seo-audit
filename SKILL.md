---
name: seo-audit
description: Use when planning, auditing, implementing, or measuring organic search work, including technical SEO, keywords, content, ecommerce, Shopify, international/local SEO, migrations, links, Core Web Vitals, structured data, or AI search visibility.
---

# SEO Audit and Operations

## Core rule

Treat SEO as a business and evidence problem. Separate search-engine requirements, rich-result eligibility, recommendations, project guardrails, and experiments. Never present a fixed character count, word count, heading count, third-party score, or GEO convention as a universal ranking rule.

## Workflow

1. Define business goal, market/language, site type, constraints, baseline, and success metric.
2. Audit before recommending: combine crawl/render, GSC/Bing, analytics/business data, logs, SERP evidence, and manual template review as available.
3. Classify findings by evidence level and impact. Fix access/index/canonical/migration failures before content expansion.
4. Map demand and intent to page type and canonical URL. Resolve duplication and cannibalization only when evidence shows a real conflict.
5. Implement source/template fixes, record changes, re-run the relevant checks, and monitor through a defined observation window.
6. Report limitations. Do not guarantee rankings, indexing, rich results, AI citations, traffic, or revenue.

## Task routing

Read [knowledge/README.md](knowledge/README.md) first, then only the relevant files:

| Task | Required reference |
|---|---|
| Strategy, forecast, KPI, prioritization | `knowledge/strategy-and-measurement.md` |
| Keywords, intent, competitors, content gaps | `knowledge/keyword-research-and-serp.md` |
| Brief, writing, on-page, refresh/pruning | `knowledge/content-and-on-page.md` |
| Navigation, taxonomy, internal links, pagination | `knowledge/information-architecture-and-internal-links.md` |
| Crawl/index, JS, canonical, CWV, schema | `knowledge/technical-seo.md` |
| Ecommerce or Shopify | `knowledge/ecommerce-and-shopify.md` |
| Hreflang, markets, locations, GBP | `knowledge/international-and-local.md` |
| Backlinks, authority, digital PR | `knowledge/authority-links-and-digital-pr.md` |
| Monitoring, testing, traffic drops, updates | `knowledge/monitoring-experiments-and-recovery.md` |
| GEO, AI crawlers, citations, llms.txt | `knowledge/geo-and-ai-search.md` |
| A claimed “must” or fixed SEO rule | `knowledge/myths-and-non-rules.md` |

For execution, use `playbooks/90-day-seo-plan.md`, `site-audit.md`, `content-brief-and-publishing.md`, or `site-migration.md`.

## Technical tools

Audit rendered build output, not only source templates:

```bash
node scripts/audit-seo.mjs --dir dist --expected-origin https://www.example.com
node scripts/audit-live.mjs https://www.example.com
```

Use `--strict` only when the team deliberately wants warnings/project preferences to fail CI. The tools use regex and a small set of HTTP requests. They do not prove complete crawling, JavaScript rendering, indexing, ranking, backlinks, content quality, real-user CWV, or business impact.

## Non-negotiable decisions

- Multiple H1 elements are not a universal Google ranking error; review clarity and accessibility.
- Meta description length has no fixed Google character limit and is not a general direct ranking signal.
- FAQ or other structured data provides eligibility only when applicable and accurate; it is not mandatory or a display guarantee.
- `llms.txt` and schema properties proposed for GEO are experiments, not search requirements.
- Do not apply `nofollow` to all external links. Use `sponsored`, `ugc`, or `nofollow` according to the relationship.
- Do not prescribe keyword density, LSI keywords, minimum word counts, universal click depth, trailing slashes, or self-hosting as ranking requirements.
- Site moves require one-to-one URL mapping, server-side permanent redirects, pre/post-launch QA, monitoring, and explicit rollback thresholds.

## Evidence

Use [knowledge/sources-and-evidence.md](knowledge/sources-and-evidence.md). Prefer current official documentation and first-party site data. Label single-site case studies and AI-search tactics as observations or experiments, and re-check time-sensitive crawler/rich-result/platform rules before execution.
