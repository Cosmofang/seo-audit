# Structured data and entity consistency

Structured data should make visible, factual content easier to interpret. It does not replace crawlable content and does not guarantee a rich result or AI citation.

## Contents

- Graph model and stable IDs
- Site-wide and page-specific nodes
- Breadcrumbs and localization
- Validation and change process

## Graph model

Use stable site-level identifiers:

```text
https://www.example.com/#organization
https://www.example.com/#website
https://www.example.com/product/#webpage
https://www.example.com/product/#product
```

Reference those identifiers instead of creating disconnected copies of the same entity on every page.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.example.com/#organization",
      "name": "Example",
      "url": "https://www.example.com/"
    },
    {
      "@type": "WebSite",
      "@id": "https://www.example.com/#website",
      "url": "https://www.example.com/",
      "publisher": { "@id": "https://www.example.com/#organization" }
    },
    {
      "@type": "WebPage",
      "@id": "https://www.example.com/product/#webpage",
      "url": "https://www.example.com/product/",
      "isPartOf": { "@id": "https://www.example.com/#website" },
      "about": { "@id": "https://www.example.com/product/#product" }
    }
  ]
}
```

## Site-wide nodes

Organization fields should be sourced from an entity record, not copied independently into templates:

- Name, canonical URL and stable `@id`.
- Logo/image with absolute URLs.
- A factual description.
- Verified public profiles in `sameAs`.
- Locale-aware `inLanguage` and description when serving translations.
- `knowsAbout` only for topics the organization demonstrably covers.

`knowsAbout` is an entity hint in Schema.org. Treat it as semantic metadata, not a proven direct AI recommendation lever.

WebSite should identify the site and publisher. Add SearchAction only if the site actually exposes a compatible search function.

## Page-specific types

Choose a type because the visible page supports it:

| Page | Common node |
|---|---|
| Product or software offer | Product / SoftwareApplication with accurate Offer fields |
| Editorial article | Article / BlogPosting with real author and dates |
| Definition page | DefinedTerm plus WebPage/Article where appropriate |
| Listing hub | CollectionPage plus ItemList |
| General landing page | WebPage |
| Visible breadcrumb UI | BreadcrumbList |
| Visible FAQ content | FAQPage only when current search policy permits and content is on page |

Avoid forcing every page into Product or Article. A modest, truthful WebPage node is better than an unsupported rich type.

## Breadcrumbs

BreadcrumbList items need ordered positions, names and absolute URLs. Generate visible breadcrumbs and JSON-LD from the same route metadata so labels and destinations cannot drift.

## Localization

Each translated page is its own WebPage with:

- Self canonical.
- Locale-appropriate `inLanguage`.
- Translated human-visible fields.
- Stable language-neutral Organization `@id` so knowledge graphs can merge the entity.
- Product identifiers shared only when the translated page describes the same actual product.

Do not translate brands, protocol names, SKUs or legal identifiers inconsistently.

## Validation

Run three layers:

1. JSON syntax parsing during build.
2. Schema structure/unit tests for builders and stable IDs.
3. External validators appropriate to the consumer, such as Schema.org Validator and Google Rich Results Test.

Also compare schema facts to visible content and source systems. Syntax-valid false data is a more serious problem than missing optional markup.

## Change process

When adding a schema node:

1. Identify the visible source for every claim.
2. Choose the narrowest valid type.
3. Reuse stable site entity IDs.
4. Add unit tests for required fields, URLs, locale and relationships.
5. Build and parse the rendered JSON-LD.
6. Validate on staging without allowing staging to be indexed.
7. Revalidate the production URL after deploy.
