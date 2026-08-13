# 证据等级与来源

最后核验：2026-08-13。搜索产品、富结果资格、爬虫名称和平台能力会变化；执行前应复核对应官方页面的更新时间。

## 证据等级

| 等级 | 定义 | 如何使用 |
|---|---|---|
| A 级 | 搜索引擎、标准组织或平台官方文档明确说明 | 可作为规范和验收依据，但仍区分“必须、建议、资格、提示” |
| B 级 | 可重复的第一方数据：GSC、日志、分析、实验、字段 CWV | 用于站点自身决策，优先于行业平均值 |
| C 级 | 多个可靠行业研究或成熟实践一致支持 | 作为假设或默认值，需用本站数据验证 |
| D 级 | 单案例、相关性研究、专家观点、未标准化 GEO 实验 | 只能做低成本测试，不得写成排名因果或硬门禁 |

## 规则标签

- `要求`：不满足可能阻止抓取、索引、资格或造成明确错误。
- `资格`：满足后仅获得某功能的申请资格，不保证展示或排名。
- `建议`：改善理解、体验、维护或点击，影响取决于场景。
- `项目门禁`：团队为了质量、安全或性能设定，不是搜索引擎通用规则。
- `实验`：证据尚弱或生态仍在变化，必须记录假设和结果。

## 一手来源目录

### Google Search Central

- [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)：基础、常见非规则、标题、摘要、链接、图片。
- [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)：内容自评、Who/How/Why、E-E-A-T 与 YMYL。
- [Search Essentials](https://developers.google.com/search/docs/essentials)：技术要求、垃圾政策和核心最佳实践。
- [How Search Works](https://developers.google.com/search/docs/fundamentals/how-search-works)：发现、抓取、索引、呈现。
- [Canonicalization](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)：重定向、canonical、sitemap 的信号强弱与冲突。
- [Robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)：抓取控制，不应用于规范化或可靠移除索引。
- [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)：发现提示，不保证索引。
- [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)：渲染、链接、状态码、动态 metadata。
- [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)：LCP 2.5s、INP 200ms、CLS 0.1，基于真实用户体验。
- [Structured data gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)：Google 支持的类型与资格。
- [Ecommerce guidance](https://developers.google.com/search/docs/specialty/ecommerce)：商品、分类、分页、站点结构。
- [Localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)：hreflang、x-default、双向链接。
- [Site moves](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)：URL 映射、重定向、迁站监控。
- [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)：规模化低价值内容、链接垃圾、滥用过期域等。

### 其他官方来源

- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)：Bing 抓取、内容和链接原则。
- [IndexNow Documentation](https://www.indexnow.org/documentation)：提交协议、密钥验证、状态码；提交不等于收录。
- [Schema.org](https://schema.org/docs/documents.html)：词汇定义；Google 富结果资格仍以 Google 文档为准。
- [Shopify SEO overview](https://help.shopify.com/en/manual/promoting-marketing/seo/seo-overview)：平台内置能力和商家设置。
- [Shopify theme SEO](https://shopify.dev/docs/storefronts/themes/seo)：metadata、hreflang、robots 主题开发入口。
- [OpenAI crawlers](https://developers.openai.com/api/docs/bots)：OAI-SearchBot、GPTBot、ChatGPT-User 的用途相互独立。

## 引用纪律

1. 不把“Google 能理解”写成“必须如此才能排名”。
2. 不把富结果资格写成展示保证。
3. 不用单个匿名案例证明普适因果关系。
4. 阈值注明来源：官方体验目标、项目预算或实验基线。
5. 第三方指标如 DA/DR、keyword difficulty 只用于相对比较，不是搜索引擎指标。
6. 建议变成 CI 硬门禁前，要写清业务理由、误报处理和回退方式。
