export type Locale = 'en' | 'zh';

export type Route = {
  path: string;
  page: string;
  title: string;
  description: string;
  index: boolean;
  changefreq: 'weekly' | 'monthly';
  priority: number;
  breadcrumb?: Array<{ name: string; href: string }>;
  schemaType?: 'WebPage' | 'Article' | 'Product' | 'CollectionPage';
  lastmod?: string;
};

// Treat this as the public URL registry. Pages, sitemap, breadcrumbs, discovery
// indexes and output audits should consume it rather than maintain parallel lists.
export const routes: Route[] = [
  {
    path: '/',
    page: 'index',
    title: 'Example | Product Category',
    description: 'A factual description of the organization and primary offer.',
    index: true,
    changefreq: 'weekly',
    priority: 1,
    schemaType: 'WebPage',
  },
  {
    path: '/product/',
    page: 'product',
    title: 'Product | Example',
    description: 'What the product does, who it is for, and the primary evidence.',
    index: true,
    changefreq: 'weekly',
    priority: 0.9,
    schemaType: 'Product',
    breadcrumb: [
      { name: 'Home', href: '/' },
      { name: 'Product', href: '/product/' },
    ],
  },
  {
    path: '/zh/',
    page: 'zh/index',
    title: 'Example | 产品类别',
    description: '关于组织与主要产品的准确中文说明。',
    index: true,
    changefreq: 'weekly',
    priority: 1,
    schemaType: 'WebPage',
  },
  {
    path: '/zh/product/',
    page: 'zh/product',
    title: '产品 | Example',
    description: '产品解决什么问题、适合谁，以及主要佐证。',
    index: true,
    changefreq: 'weekly',
    priority: 0.9,
    schemaType: 'Product',
    breadcrumb: [
      { name: '首页', href: '/zh/' },
      { name: '产品', href: '/zh/product/' },
    ],
  },
];
