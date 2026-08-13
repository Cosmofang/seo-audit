# Case study: production SEO/GEO as a release system

This case study summarizes the architecture currently used by DeepLumen's public website. Product names and public URLs are retained where they help explain the system; business internals, credentials and private data are excluded.

## Why the system works

The website does not depend on a one-time SEO plugin score. It moves SEO-visible behavior into typed sources, rendered-output gates and production smoke tests:

```text
route and entity sources
  -> environment-bound static build
  -> deterministic output audits
  -> edge/Worker SEO responses
  -> Lighthouse and multi-UA parity CI
  -> production verification and measurement
```

## Route and origin model

One route registry owns clean paths, titles, descriptions, breadcrumbs, schema hints, sitemap priority/change frequency and optional lastmod. Build-time code generation adds CMS/blog routes and meaningful lastmod values.

Static output is bound to one canonical origin:

- Development/staging build injects the staging origin.
- Production build injects `https://www.deeplumen.com`.
- A generic build command intentionally fails, forcing the caller to choose an environment.
- A route audit checks the rendered canonical host against the selected origin.

The same built artifact is never promoted across origins because canonical, Open Graph, hreflang and JSON-LD absolute URLs are already baked into HTML.

## Twelve output gates

The current build runner executes these checks in order:

1. Exactly one H1 (editorial hierarchy policy).
2. Responsive viewport meta.
3. Shared semantic landmarks.
4. Route format, metadata, page coverage and canonical origin.
5. English/Chinese route, hreflang, canonical and internal-link parity.
6. Minimum font-size baseline.
7. Image dimensions, alt, priority/lazy loading and 500 KB built-image budget.
8. HTML + same-page CSS/JS 500 KB budget.
9. No inline executable scripts or event handlers.
10. No unapproved remote runtime assets, including CSS URL and srcset references.
11. Admin bundle isolation from the public site.
12. Per-page JavaScript budget (40 KB reference ceiling).

These gates mix true output failures with deliberate project policies. For example, self-hosting and strict CSP improve reliability and security but are not described as independent ranking factors.

## Structured entity layer

The shared layout emits stable Organization and WebSite nodes. Pages add only the schema types their visible content supports, such as Product, Article, CollectionPage, DefinedTerm, FAQPage or BreadcrumbList.

Stable IDs such as `/#organization` and `/#website` connect page graphs with a public entity endpoint. Locale-aware builders translate descriptions and `inLanguage` while keeping the same organization identity.

Builder unit tests and rendered JSON parsing protect syntax and relationships. Claims, prices, dates and case metrics must still be validated against their visible sources.

## International SEO

English stays at root paths and Chinese uses `/zh/` twins. Each page:

- Is self-canonical.
- Emits `en`, `zh-CN` and `x-default` alternates only when the twin exists.
- Uses correct `html lang`, Open Graph locale and localized JSON-LD.
- Links to same-language internal pages.
- Appears in sitemap hreflang only when both indexable twins exist.

Static product/content pages can require full parity in CI, while blog translation follows a documented subset model.

## Edge SEO surfaces

A Cloudflare Worker serves route-derived SEO files before static asset fallthrough:

- Production/staging-aware robots.txt.
- Sitemap with route lastmod and bilingual alternates.
- Curated, route-backed llms.txt.
- A public agents.md entity/navigation page.
- A public entity JSON-LD endpoint.

A shared noindex source filters public low-value/legal pages from sitemap and content indexes. CDN-managed robots settings are verified on the final production origin because dashboard features can modify responses outside the application repository.

## White-hat AI readability

Canonical pages return the same factual HTML to humans, Googlebot and AI-related agents. The site explicitly rejected an early User-Agent body-switching design because serving crawler-specific Markdown at the canonical URL creates cloaking and truth-drift risk.

AI-readable surfaces are public alternates:

- Page JSON-LD.
- Trust/entity pages.
- llms.txt and agents.md.
- Entity JSON-LD.
- Public Markdown mirrors generated from visible page content.

A CI test boots the real local Worker and fetches representative English and Chinese pages as a browser, Googlebot, AI search crawlers and training crawlers. It requires identical canonical/title/description and near-identical visible main text.

## Crawler governance

Crawler rules distinguish:

- Standard search crawlers.
- AI search/index crawlers.
- User-triggered fetchers.
- Training crawlers.
- Robots-only control tokens such as Google-Extended.

DeepLumen currently chooses broad access because AI discovery is central to its product, but the reusable guidance in this repository treats training as a separate legal/business choice. Blocking a training crawler does not automatically mean blocking an AI search crawler.

## Performance gates

The production campaign identified a text LCP and improved it by removing render-blocking stylesheet round trips, splitting critical/deferred CSS, removing unnecessary font preloads, deferring non-LCP work and loading analytics after idle/interaction.

The gains are protected by:

- Per-page HTML/CSS/JS and JavaScript budgets.
- Image budgets and LCP priority checks.
- Lighthouse CI on representative mobile pages with LCP below 2.5 seconds and CLS below 0.1.
- Repeated lab measurements plus field monitoring when available.

See `references/lcp-playbook.md` for the measured sequence and caveats.

## Deployment and operations

CI builds both configured origins, runs unit/output audits, Lighthouse journeys and AI parity. Production deploys are environment-specific. After a successful production deploy, canonical URLs can be submitted through IndexNow.

Ongoing operations still require Search Console, Bing Webmaster Tools, logs, field CWV and analytics. Green markup gates do not prove indexation, rankings, AI citations or revenue.

## Transferable lessons

1. Make route identity and indexability structured data sources, not scattered template strings.
2. Audit rendered output and the actual delivery layer.
3. Bind static artifacts to their canonical origin.
4. Generate sitemap, alternates and discovery indexes from the same route source.
5. Keep structured data factual and connected with stable IDs.
6. Treat crawler categories and permissions separately.
7. Keep AI-readable layers public and canonical-linked; prohibit UA body cloaking.
8. Protect performance with metric gates and byte budgets.
9. Fail closed when the build is empty, misconfigured or unverified.
10. Keep experimental GEO features labeled as experiments and measure their use.
