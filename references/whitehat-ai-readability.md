# White-hat AI readability and anti-cloaking

## Core rule

At one canonical URL, humans, search crawlers and AI-related agents must receive the same factual page content. Do not swap body copy, FAQs, prices, capabilities, cases or promises based on User-Agent.

This protects users, search integrity and maintainability. It also prevents a fragile architecture where every crawler sees a different truth.

## Safe layers

AI readability can be improved with public, consistent layers:

- Server-rendered/static HTML containing important facts.
- Page-level JSON-LD matching visible content.
- A public trust/entity profile.
- `/llms.txt` or `/agents.md` navigation files, clearly treated as experimental conventions.
- A public entity JSON-LD endpoint using the same stable IDs.
- Public Markdown alternates generated from the same page source and linked for every visitor.

These surfaces should help orientation and parsing, not hide facts from people.

## Unsafe pattern

```ts
if (isAiBot(request.headers.get('user-agent'))) {
  return markdownWithExtraClaims;
}
return humanHtml;
```

Excluding Googlebot from the condition does not make this safe. Crawlers can compare user agents, render with browsers and follow shared URLs.

## Public Markdown alternate

If a site generates `/agent/<slug>.md`:

- Derive headings, prose, lists and JSON-LD from the same built page/source.
- Exclude navigation widgets and decorative text, not substantive content.
- Link it from the canonical page with an alternate representation link.
- Keep it fetchable for humans and all agents.
- Do not place unique offers or claims only in the Markdown.
- Use the human page as the canonical identity unless the Markdown itself is intended as an independently indexed document.

Generation must be deterministic and tested. Regex-only extraction can accidentally omit meaningful content; prefer DOM parsing when dependencies are acceptable.

When using this repository's build auditor, declare the output subtree explicitly so alternate pages still receive markup/resource/JSON-LD checks without being required to self-canonicalize:

```bash
node scripts/audit-seo.mjs --dir dist --origin https://www.example.com \
  --alternate-prefix agent/
```

## Multi-UA parity gate

Test through the real Worker/CDN-like router rather than only a static file server. Fetch representative pages as:

- A normal browser.
- Googlebot.
- AI search/index crawler.
- User-triggered fetcher.
- Training crawler, if allowed.

Compare:

- HTTP status and redirect destination.
- Canonical, title, description and robots directives.
- Structured data presence.
- Visible main-content text.
- Variant/debug headers that imply UA branching.

Exact byte equality is strongest but can be too strict when headers or non-content dynamic values differ. A normalized text similarity threshold can catch body swaps; review false positives and keep the compared fields explicit.

Example acceptance:

```text
status = 200 for every allowed agent
canonical/title/description/robots = exact match
normalized main text similarity >= 0.92
no x-variant header
```

Run this after the full delivery layer is available and before deployment.

## Legitimate variation

Some variation is legitimate, such as consent state, authentication, geolocation-required commerce terms or accessibility preferences. It must not selectively mislead crawlers. When prices or availability vary by market, expose the rules transparently and keep structured data aligned with the rendered market state.

## Incident response

If UA-specific content is found:

1. Disable the branch immediately or route everyone to the canonical representation.
2. Capture affected paths, UAs and deployment window.
3. Compare cached/CDN and origin responses.
4. Remove crawler-only claims and reconcile public content/schema.
5. Purge affected caches.
6. Run the parity suite against production.
7. Inspect Search Console/manual actions and crawler logs.
8. Add the failure case to CI.
