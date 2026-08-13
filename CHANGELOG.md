# Changelog

All notable changes to the `seo-audit` skill. Versioning follows [semver](https://semver.org/): MAJOR = breaking change to script CLI/output contract, MINOR = new capability/reference, PATCH = fixes/copy.

## [2.0.0] — 2026-08-13

### Added
- Full SEO operations knowledge base: strategy/KPIs, keyword and SERP research, content/on-page, information architecture, technical SEO, ecommerce/Shopify, international/local, authority/digital PR, monitoring/recovery, and AI search.
- Execution playbooks for a 90-day program, site audits, content briefs/publishing, and site migrations.
- Evidence levels, official-source register, a myth/non-rule decision guide, and automated tests.

### Changed
- Reframed the original “hard gates” as implementation errors, recommendations, project guardrails, or experiments.
- Added `--expected-origin` canonical host validation to the build auditor.
- Added built-file to canonical-path comparison and live homepage canonical value validation.
- Live robots reporting now separates explicit, inherited, blocked, and unspecified AI-crawler policies.
- Missing `llms.txt` and optional homepage schema are informational rather than SEO warnings.
- Missing `robots.txt` is informational because absence does not block crawling; removed the synthetic heuristic score.
- The skill now routes complete SEO work instead of excluding keywords, content, links, and measurement.

### Corrected
- Removed unsupported universal claims about title/description/word-count limits, H1 dilution, external-link `nofollow`, self-hosting, Organization/WebSite markup, and direct GEO effects from `knowsAbout` or `llms.txt`.

## [1.1.0] — 2026-06-10

Iterated via the `automatic-skill` pipeline (review → SEO → self-check → safety check).

### Added
- `references/lcp-playbook.md` — Core Web Vitals deep-dive distilled from the reference site's real campaign (mobile LCP 7.5 s → ~1.5 s). Covers: diagnosis method (find the real LCP element — often text; DevTools applied throttling, never Lantern), 9 levers ranked by measured impact (render-blocking CSS inline ~1.7 s, critical-CSS split with the cascade-order pitfall, font preload discipline ~300 ms + 148 KB, deferring non-LCP viewport DOM ~230 ms, eager hero image, third-party JS on idle/first-interaction, IntersectionObserver-deferred init, compositor-only animations, immutable caching), CLS guardrails (reserve space for everything deferred; typing-effect min-width CLS 0.40 → 0.03), and CI lock-in (Lighthouse devtools-throttled gate + per-page JS byte budget).
- `CHANGELOG.md` (this file) — every iteration now gets a semver bump recorded here.

### Changed
- `SKILL.md` — frontmatter description now surfaces the Core Web Vitals / LCP capability; +7 keywords (lcp, render-blocking, critical-css, font-loading, LCP优化, 性能优化, …); "When to use" adds the slow-LCP scenario; "What you have" + capability table register the playbook; workflow gains an "if the complaint is LCP" routing paragraph.
- `package.json` — description mentions Core Web Vitals + LCP playbook; +9 keywords; version 1.1.0.
- `README.md` — folder tree lists `lcp-playbook.md`; new 性能层 (LCP / Core Web Vitals) quick-reference section in Chinese.

### Fixed
- `scripts/audit-seo.mjs` — header comment typo ("the the").

### Identity (intentional, do not "fix")
- clawHub slug is **`seo-geo-gate`** while the skill/package/repo name is `seo-audit` — deliberate: `seo-audit` was already taken on clawHub (monorepo commit 35176a4). Published locations: GitHub standalone `Cosmofang/seo-audit`, monorepo `Cosmofang/openclaw-skills` at `openclaw/agents/skills/seo-audit/`, clawHub as `seo-geo-gate`. Self-check's slug-consistency rule is waived for this skill on this point.

## [1.0.0] — 2026-06-09

Initial release: 12-hard-gate on-disk auditor (`audit-seo.mjs`), live-URL GEO auditor (`audit-live.mjs`), references for hard gates / structured data / GEO AI visibility, case-study analysis.
