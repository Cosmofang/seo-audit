# Build-time SEO hard gates

This document separates universal failures from project policy. A hard gate is valuable only when it is deterministic, explains the failure and cannot silently pass an empty or wrong build.

## Contents

- Gate severity and audit contract
- Page identity and document structure
- Images, structured data and resource policy
- Byte budgets and route completeness
- Recommended pipeline

## Gate severity

| Level | Meaning | Examples |
|---|---|---|
| Error | Shipped output is broken, contradictory or materially risky | missing title, wrong-origin canonical, invalid JSON-LD, blocked production site |
| Policy error | Team deliberately enforces a stricter engineering baseline | no inline executable JS, self-hosted assets, page byte budget |
| Warning | Context-dependent optimization or review item | title length, description length, missing llms.txt |

Do not label every preference an SEO ranking requirement. CI can still enforce a preference, but its reason must be stated honestly.

## Required audit contract

Every audit runner must:

1. Fail when the target directory does not exist.
2. Fail when zero HTML files are found.
3. Return a nonzero exit code when errors exist, including JSON output mode.
4. Print the target directory/origin and number of files examined.
5. Resolve root-relative and document-relative asset references.
6. Deduplicate shared assets when calculating per-page budgets.
7. Exempt intentional error pages only from rules that truly do not apply.

## Page identity

### Title and description

- Require a non-empty `<title>` and `<meta name="description">` on indexable pages.
- Check uniqueness across indexable output. Duplicate metadata is a review signal; not every duplicate is automatically wrong.
- Treat pixel width and search intent as more meaningful than rigid character limits. This repository uses approximate character-length warnings only as a screening tool.
- Keep the page's visible H1 aligned with its title and search intent, without requiring exact string identity.

### Canonical

- Require exactly one absolute HTTP(S) canonical on every indexable page.
- When the canonical origin is known, require matching protocol and host.
- For self-canonical pages, require canonical pathname to match the built route contract.
- Do not point translated pages at another language as canonical; connect language twins with hreflang.
- Never ship staging canonicals on production or production canonicals on a blocked staging environment by accident.

### Robots meta

- Parse `meta[name=robots]` and named crawler directives.
- Exclude noindex pages from sitemap generation.
- Do not use robots.txt as a substitute for `noindex`: blocked pages may remain known to search engines because crawlers cannot fetch the meta directive.

## Document structure

- Require a viewport meta on responsive web pages.
- Require at least one main content landmark. DeepLumen's shared layout additionally requires navigation and footer on public marketing pages; that is a project policy, not a universal search rule.
- DeepLumen requires exactly one H1 for editorial consistency. HTML and search engines can technically handle multiple H1s, so describe this as a deliberate content hierarchy rule.
- Keep heading order meaningful and ensure important text exists in rendered HTML without requiring user interaction.

## Images

- Require `alt` on every `<img>`; allow `alt=""` for decorative images.
- Require intrinsic width and height, or another deterministic aspect-ratio reservation, to limit layout shift.
- Prioritize the actual LCP image. Do not infer every non-lazy image is a hero.
- Lazy-load below-fold images, but do not lazy-load the LCP image.
- DeepLumen uses a 500 KB built-image ceiling. Adapt the number to the site's format and quality requirements without weakening it merely to pass CI.
- Inspect `srcset` and `<source>` candidates as well as `src`.

## Structured data

- Parse every `application/ld+json` block as JSON.
- Report invalid blocks as errors, not as “structured data present.”
- Validate required and recommended properties with the relevant consumer's current documentation.
- Use stable `@id` values so Organization, WebSite, WebPage, Product and Breadcrumb nodes connect rather than duplicate.
- Never encode unverified claims, ratings, availability or prices.

## CSP and resource policy

DeepLumen enforces these project policies:

- No inline executable `<script>` and no `on*=` handlers.
- JSON-LD, JSON data blocks and import maps are the only allowed inline script types.
- JavaScript is bundled as same-origin external modules.
- CSS may be inlined when deliberately used as critical CSS and allowed by `style-src`.
- Fonts, images, CSS and JavaScript are self-hosted.

These rules improve security, reliability and performance predictability. They are not standalone Google ranking factors.

If a site legitimately uses third-party analytics, consent management or payments, use an explicit resource allowlist and CSP policy instead of pretending the dependency does not exist.

## Byte budgets

DeepLumen's current reference budgets are:

- HTML + same-page local CSS + local JavaScript: no more than 500 KB uncompressed on disk.
- JavaScript referenced by one page: no more than 40 KB uncompressed on disk.
- Each built raster/vector image: no more than 500 KB.
- Lighthouse CI: LCP below 2.5 seconds and CLS below 0.1 on selected mobile journeys; TBT is advisory until a stable CI baseline exists.

These are regression controls, not a claim that every page under the limit is fast. Measure LCP, INP and CLS separately.

## Routes and output completeness

The production pattern uses a route registry as the source of truth. Audit:

- Lowercase clean paths with a consistent trailing-slash policy.
- Route-to-output one-to-one coverage.
- No unregistered public output and no registered missing page.
- A clean build directory so deleted/renamed pages cannot survive as stale HTML with old canonical metadata.
- Canonical, sitemap, alternate, breadcrumb and discovery-file URLs derived from the same route identity.
- A shared noindex set consumed by page meta, sitemap and discovery-file filtering.
- Expected language twins and same-language internal links.

Depth limits such as “three segments maximum” are information-architecture policy, not an SEO law.

## Recommended pipeline

```text
route codegen
  -> typecheck and unit tests
  -> environment-bound static build
  -> output audits
  -> worker/server bundle validation
  -> Lighthouse journeys
  -> multi-UA parity test
  -> deploy
  -> live SEO smoke test
  -> IndexNow/search-engine notification where applicable
```

Keep post-build HTML mutations to a minimum. If a codemod changes SEO-visible HTML, either move the change into source templates or rerun affected audits afterward.
