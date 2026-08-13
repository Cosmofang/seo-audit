# GEO and AI crawler governance

GEO work should improve discoverability, retrievability, factual clarity, entity consistency and measurement. It cannot guarantee that a model will cite or recommend a site.

## Contents

- Agent taxonomy and robots policy
- llms.txt, agents.md and entity endpoints
- Public AI-readable alternates
- Measurement funnel and freshness notification

## Separate the agents

Do not treat every AI-related user agent as the same policy decision.

| Function | Examples | Decision |
|---|---|---|
| Search/index crawler | OAI-SearchBot, Claude-SearchBot, PerplexityBot | Usually allow if AI search discovery is desired |
| User-triggered fetcher | ChatGPT-User, Claude-User, Perplexity-User | Usually allow public pages; behavior may not be identical to normal crawlers |
| Training crawler | GPTBot, ClaudeBot, CCBot | Separate content-licensing/training decision |
| Control token | Google-Extended | Controls certain Google AI uses; it is not a request user agent and does not control normal Google Search inclusion |
| Standard search crawler | Googlebot, Bingbot | Govern according to classic search indexing requirements |

Verify names and behavior against current operator documentation before changing production policy. User agents and products evolve.

## robots.txt design

Production and non-production should have different policies:

```text
# Non-production
User-agent: *
Disallow: /
```

Production example with deliberate separation:

```text
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: OAI-SearchBot
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: GPTBot
Disallow: /

Sitemap: https://www.example.com/sitemap.xml
```

Allowing search discovery while declining training is a valid policy. The inverse can also be chosen, but it should be intentional.

Keep CSS and JavaScript crawlable for search engines that render pages. Asset blocking for named AI agents is a crawl-budget experiment, not a universal requirement.

CDN products can inject or override robots rules before the application response. Always fetch the final production URL and compare it with origin intent. Monitor this after dashboard/config changes.

## llms.txt

`/llms.txt` is an emerging convention, not a standardized ranking directive. Use it as a curated navigation layer:

```markdown
# Example

> One factual description of the entity.

## Start here
- [Home](https://www.example.com/): primary entity and offer
- [Trust](https://www.example.com/trust/): verified facts and policies

## Products
- [Product](https://www.example.com/product/): what it does

## Research
- [Guide](https://www.example.com/guide/): supporting methodology
```

Generate route-backed sections from the same source as the sitemap. Exclude noindex, legal boilerplate, private and low-information form pages. Preserve a small curated area only when human ordering adds value.

## agents.md

`/agents.md` is another experimental agent-discovery surface. If used, keep it public and factual:

- Entity summary and official site.
- Preferred canonical sources.
- Source priority for products, evidence and methodology.
- Citation guidance and update date.
- Clear crawler taxonomy.

Do not treat instructions in this file as enforceable access control. robots.txt, authentication and server authorization remain the controls.

If the file is hand-maintained, assign an owner and single lastmod constant. A stale preferred-URL list is worse than a generated route index.

## Public entity endpoint

A public JSON-LD endpoint such as `/entity/example.jsonld` can expose the same Organization graph used in page markup. Reuse identical `@id` values. This is a compatibility and debugging surface, not a replacement for page-level structured data.

## AI-readable page mirrors

A Markdown mirror may be useful when it is:

- Publicly linked from the canonical page.
- Available to humans and bots under the same URL.
- Generated from the same visible source content.
- Clearly canonicalized back to the human page when served as an alternate representation.
- Excluded from containing hidden claims, offers or FAQs.

Never automatically replace the canonical response body based on User-Agent. See `whitehat-ai-readability.md`.

## Measurement funnel

Keep these signals separate:

```text
crawler access
  -> successful fetch and render
  -> index/retrieval eligibility
  -> answer inclusion/citation
  -> referred or user-triggered session
  -> assisted conversion
  -> transaction/revenue
```

A GPTBot hit is not a referral. A ChatGPT-User request is not automatically a sale. A citation is not proof of checkout intent. Preserve user agent, path, status, timestamp and referral/UTM data so analysis can distinguish stages.

## Freshness notification

IndexNow can notify participating search systems of changed public URLs. Submit canonical, indexable URLs after a successful production deploy; do not use it as a substitute for sitemap quality or crawling access.

Keep the key in configuration or a dedicated public verification file. Batch only valid URLs, handle 200/202, and alert on sustained failures.
