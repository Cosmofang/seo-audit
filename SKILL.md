---
name: seo-audit
description: Audit and improve technical SEO, international SEO, AI/GEO visibility, structured data, crawl policy, canonical routing, sitemaps, llms.txt, white-hat AI-readable surfaces, and Core Web Vitals. Use for pre-launch audits, SEO regressions, slow LCP/CLS, robots or canonical incidents, multilingual hreflang work, JSON-LD implementation, AI crawler governance, content publishing checks, and CI hard gates.
---

# SEO Audit

Audit evidence before recommending changes. Separate standards-backed requirements, project engineering policy, and experimental GEO compatibility features.

## Workflow

1. Identify the canonical production origin, build output, deployment environment, route source, languages, and indexable/noindex sets.
2. Build the site with the same origin configuration used by the target environment.
3. Run the on-disk audit against rendered HTML:

   ```bash
   node scripts/audit-seo.mjs --dir <build-dir> --origin <canonical-origin>
   ```

4. If deployed, run the live audit:

   ```bash
   node scripts/audit-live.mjs <origin>
   ```

5. Inspect Search Console/Bing Webmaster Tools, server logs, field CWV, and analytics when available. Do not infer index status, rankings, citations, or revenue from markup alone.
6. Rank findings by impact: crawl/index failures, wrong canonical/noindex, broken rendering, structured-data invalidity, performance regressions, then advisory enhancements.
7. Fix source templates/configuration rather than generated output. Rebuild and rerun every relevant gate.

Use `--strict` only when the project's policy intentionally treats all advisories as CI failures. Use `--json` for programmatic consumption; error exit codes still apply.

## Reference Routing

Read only the references required for the current task:

- Full program design and ownership: `references/operating-model.md`
- Build-time audit rules: `references/hard-gates.md`
- Routes, canonical, redirects, sitemap, noindex: `references/routing-canonical.md`
- Multilingual URL twins and hreflang: `references/international-seo.md`
- JSON-LD builders and validation: `references/structured-data.md`
- AI crawler taxonomy and discovery files: `references/geo-ai-visibility.md`
- Preventing UA cloaking: `references/whitehat-ai-readability.md`
- LCP, CLS and performance gates: `references/lcp-playbook.md`
- Release and incident procedures: `references/publishing-runbook.md`
- Content planning and page quality: `references/content-system.md`
- DeepLumen public content map: `references/deeplumen-content-inventory.md`

## Decision Rules

- Treat canonical, robots, noindex, hreflang and redirects as one URL-control system. Check them together.
- Keep a single structured route source for page metadata, sitemap, redirects, alternates, discovery files and lastmod where the stack permits.
- Build absolute SEO URLs with the target origin at build time for static sites. Never deploy one origin-bound artifact to another origin.
- Do not serve different factual body content to bots and humans at the same canonical URL.
- Classify AI agents by function. Search/index bots, user-triggered fetchers, training crawlers and robots control tokens are not interchangeable.
- Do not claim `llms.txt`, `agents.md`, `knowsAbout`, crawler access or JSON-LD guarantees AI citations or recommendations. Deploy them as measurable compatibility/entity layers.
- Do not add `nofollow` to all external editorial links. Use `sponsored`, `ugc`, or `nofollow` when the relationship warrants it; use `noopener` for security where needed.
- Validate JSON-LD syntax and factual truth. A present but invalid or unsupported schema block does not pass.
- Measure performance with repeatable lab tests and field data. Markup heuristics do not measure LCP, INP or CLS.

## Completion

Report commands and environments used, findings fixed, remaining advisories, and unavailable data. Never describe a site as fully SEO/GEO compliant solely because these scripts are green.
