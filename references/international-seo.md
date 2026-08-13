# International SEO

The DeepLumen reference architecture keeps English at root paths and Chinese under `/zh/`. The pattern is transferable; locale choices are not.

## URL model

```text
English: /
Chinese: /zh/

English: /product/
Chinese: /zh/product/
```

Do not automatically redirect by IP, User-Agent or browser language. Give users an explicit language link and let each locale URL remain crawlable.

## Page contract

Each twin must have:

- Its own self canonical.
- Correct `<html lang>` (`en`, `zh-CN`, etc.).
- Locale-appropriate title, description, H1 and visible content.
- Reciprocal hreflang links.
- `x-default` pointing to the intended fallback, usually the primary language.
- Correct `og:locale` and optional alternate locale.
- Locale-aware structured data.
- Internal page links that stay in the current locale where a twin exists.

Example on both twin pages:

```html
<link rel="alternate" hreflang="en" href="https://www.example.com/product/">
<link rel="alternate" hreflang="zh-CN" href="https://www.example.com/zh/product/">
<link rel="alternate" hreflang="x-default" href="https://www.example.com/product/">
```

Do not canonicalize Chinese to English. Canonical handles duplicate/representative URLs; hreflang connects localized equivalents.

## Pure locale helpers

Put path mapping in pure functions that both the frontend build and sitemap generator can reuse:

```ts
type Locale = 'en' | 'zh';

const isZh = (path: string) => path === '/zh/' || path.startsWith('/zh/');
const enPath = (path: string) => isZh(path) ? path.replace(/^\/zh(?=\/)/, '') || '/' : path;
const zhPath = (path: string) => isZh(path) ? path : path === '/' ? '/zh/' : `/zh${path}`;
```

Test inversion and idempotency.

## Coverage policy

Define coverage explicitly:

- Static product/landing pages may require complete EN<->ZH parity.
- Blog translation can be a subset, as long as no hreflang points to missing pages.
- A translated page must never exist without a valid source/counterpart unless intentionally independent.

CI should support a rollout mode (warn) and an enforced mode (error). Once full parity is promised, production CI should use enforced mode.

## Sitemap alternates

Only emit alternate links when both route twins are present in the indexable sitemap set. Every member of a pair must emit the same alternate set.

Noindexing one twin generally means it should not be advertised by the other as a search alternate.

## Content and links

- Translate meaning and search intent, not only words.
- Preserve brands, SKUs, protocols and proper names consistently.
- Keep original publication and modification dates accurate.
- Localize breadcrumb labels and navigation.
- Do not send Chinese readers through English URLs when a Chinese twin exists.
- Allow neutral assets and deliberately language-neutral machine-readable hubs as documented exceptions.

## JSON-LD

Use locale-specific `inLanguage`, headline, description and visible text fields. Keep stable entity IDs for the same Organization/Product where appropriate. Do not create two unrelated Organization nodes merely because the language changed.

## Audit matrix

For every pair, assert:

1. Both outputs exist.
2. Each canonical points to itself.
3. `lang`, hreflang and `og:locale` are correct.
4. hreflang is reciprocal and `x-default` is consistent.
5. Same-language internal links do not escape accidentally.
6. Sitemap alternates match page-head alternates.
7. No translated page exposes stale or untranslated commercial facts.
