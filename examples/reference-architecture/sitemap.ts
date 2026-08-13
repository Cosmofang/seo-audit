import { enPath, zhPath } from './seo.ts';

type SitemapRoute = {
  path: string;
  index: boolean;
  lastmod: string;
};

const escapeXml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

export function renderSitemap(routes: SitemapRoute[], origin: string): string {
  const indexable = routes.filter((route) => route.index);
  const present = new Set(indexable.map((route) => route.path));
  const entries = indexable.map((route) => {
    const en = enPath(route.path);
    const zh = zhPath(route.path);
    const alternates = present.has(en) && present.has(zh)
      ? `
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(`${origin}${en}`)}"/>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${escapeXml(`${origin}${zh}`)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${origin}${en}`)}"/>`
      : '';
    return `  <url>
    <loc>${escapeXml(`${origin}${route.path}`)}</loc>${alternates}
    <lastmod>${escapeXml(route.lastmod)}</lastmod>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`;
}
