export type Locale = 'en' | 'zh';

export function buildCanonical(origin: string, path: string): string {
  const parsed = new URL(origin);
  if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('origin must contain only scheme and host');
  }
  if (!path.startsWith('/')) throw new Error('path must start with /');
  return `${parsed.origin}${path}`;
}

export const isZh = (path: string): boolean => path === '/zh/' || path.startsWith('/zh/');
export const enPath = (path: string): string => isZh(path) ? path.replace(/^\/zh(?=\/)/, '') || '/' : path;
export const zhPath = (path: string): string => isZh(path) ? path : path === '/' ? '/zh/' : `/zh${path}`;

export function buildAlternates(origin: string, path: string, twinExists: boolean) {
  if (!twinExists) return [];
  const en = buildCanonical(origin, enPath(path));
  const zh = buildCanonical(origin, zhPath(path));
  return [
    { hreflang: 'en', href: en },
    { hreflang: 'zh-CN', href: zh },
    { hreflang: 'x-default', href: en },
  ];
}

export function organizationJsonLd(origin: string, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: 'Example',
    url: `${origin}/`,
    inLanguage: locale === 'zh' ? 'zh-CN' : 'en',
    description: locale === 'zh'
      ? '关于组织的准确中文描述。'
      : 'An accurate description of the organization.',
  };
}
