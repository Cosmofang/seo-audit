# SEO/GEO content system

## Contents

- Page families and publishing briefs
- Writing, linking and claim governance
- Multilingual and GEO considerations
- Update/consolidation workflow
- Metrics

## Content is an entity and evidence system

The goal is not maximum keyword volume. Build pages that answer a clear job, expose facts, connect related entities and give readers a reason to trust the source.

## Page families

| Family | Job | Typical structure |
|---|---|---|
| Product/solution | Explain offer, fit, evidence and next action | problem, mechanism, features, proof, FAQ, CTA |
| Glossary/definition | Own a precise concept and connect the topic graph | short definition, importance, operation, examples, related terms, sources |
| Guide/blog | Answer a concrete operational question | direct answer, diagnosis, steps, examples, measurement, sources |
| Comparison | Help evaluate alternatives without straw-manning | evaluation criteria, differences, fit, limitations, decision table |
| Case study | Provide verifiable evidence | context, baseline, intervention, dates, outcome, methodology, limitations |
| White paper/benchmark | Establish a reusable model | definitions, scoring/model, evidence, implementation, limitations, citations |
| Trust/entity profile | Resolve who the organization is | identity, products, policies, evidence, machine-readable links, citation rules |

## Publishing brief

Every brief should state:

- Primary user question and intent.
- Target audience and decision stage.
- Canonical entity/topic and related entities.
- What is new compared with existing site pages.
- Factual sources and claims requiring review.
- Required internal links in/out.
- Language/market coverage.
- Appropriate schema type.
- Conversion or learning objective.
- Success metrics and review date.

## Writing rules

- Answer the core question early in plain language.
- Use descriptive headings, definitions, lists and tables when they improve comprehension.
- Separate observed fact, interpretation and product claim.
- Cite primary or authoritative sources for platform behavior, market numbers and protocols.
- Include dates and methodology for time-sensitive claims.
- State limitations; avoid guaranteed ranking, citation or revenue language.
- Use keywords naturally through accurate topic coverage, not stuffing or synthetic synonym lists.
- Keep important facts in server-rendered text, not only images, canvas or interaction-gated UI.

## Internal linking

Use a hub-and-spoke model:

```text
product / trust center
  <-> glossary definitions
  <-> operational guides
  <-> white papers / benchmarks
  <-> case evidence
```

Each new page should link to its parent hub and a few genuinely related pages. Existing authoritative pages should link back to the new page when useful. Avoid site-wide footer links for every topic.

## Claim governance

Commercial and performance claims require:

- Named metric and unit.
- Measurement window.
- Baseline/comparison.
- Data source and attribution method.
- Scope/sample size.
- Review/expiry owner.

Keep schema, page copy, sales material and translated versions consistent. If a claim expires or cannot be verified, remove it from every surface.

## Multilingual content

- Translate intent and examples for the market.
- Maintain source dates and factual parity.
- Preserve product/protocol names where translation would create ambiguity.
- Link within the current language.
- Do not publish empty/thin translations merely to satisfy parity counts.

## GEO-specific considerations

Pages are easier to retrieve and quote when they contain explicit definitions, self-contained answers, current facts, stable URLs and clear source attribution. These are good content qualities independent of any specific model.

Do not create hidden AI-only copy. Experimental discovery files should point to canonical content rather than duplicating it.

## Update and consolidation

Review content when:

- Platform user-agent/docs or protocols change.
- Product behavior or pricing changes.
- A claim reaches its review date.
- Queries shift or a page loses useful traffic.
- Two pages target the same intent.
- Translations drift from the source.

Prefer merging overlapping pages and redirecting the weaker URL over maintaining near-duplicates indefinitely.

## Metrics

Track by page family and intent:

- Indexed canonical pages and crawl health.
- Impressions, clicks, CTR and query coverage.
- Engaged sessions and conversion contribution.
- Backlinks/mentions for research assets.
- AI referrals and user-triggered retrieval separately from training crawler hits.
- Assisted conversions with documented attribution limits.
- Content freshness and translation parity.
