# 电商与 Shopify SEO

电商 SEO 的核心是把品类需求映射到 collection，把具体商品需求映射到 product，再用购买指南、比较和售后内容支持决策。库存、价格、变体、筛选和应用脚本使其比普通内容站更动态。

## 页面类型分工

| 页面 | 主要任务 | 必要内容 |
|---|---|---|
| 首页 | 品牌/核心品类导航 | 清晰实体、主品类、信任与入口 |
| Collection | 品类/属性交易与商业调查 | 独特介绍、筛选、商品、选购信息、FAQ（需要时） |
| Product | 具体商品购买 | 独特描述、规格、价格、库存、配送退换、评价、媒体 |
| Guide/Comparison | 选择与教育 | 原创经验、比较标准、内链到 collection/product |
| Policy/Help | 风险消除与售后 | 运送、退货、保修、兼容、使用说明 |

不要把供应商描述原样铺到大量商品。collection 文案不应挡住商品首屏；可将必要选择信息分布在商品列表前后。

## Shopify 已处理与仍需负责

Shopify 通常自动提供 SSL、sitemap、部分 canonical 与主题 metadata 接口，但商家/开发者仍需验证最终输出。主题或 app 可以重复 title/canonical/schema、增加阻塞脚本或生成索引噪音。

重点检查：

- `/products/`、`/collections/`、`/blogs/` 的主页面与 alternate URL。
- collection 内产品链接是否指向规范 product URL，而非不必要的 collection-scoped duplicate。
- `?variant=`、排序、筛选、标签、站内搜索、分页和 tracking 参数的 crawl/index 策略。
- Product JSON-LD 的价格、货币、库存、variant、评价与页面可见数据一致。
- Shopify Markets 的域/子目录、货币、语言、canonical 与 hreflang。
- 主题和应用的 JS/CSS、第三方 tag、聊天、评论、订阅、A/B 工具对 CWV 的影响。
- `robots.txt.liquid` 自定义前先理解默认规则；升级后回归测试。

## 筛选、排序和变体

- 先从需求数据决定哪些筛选组合值得成为独立 landing page；为其提供稳定 URL、独特内容、内链和 self-canonical。
- 其余组合避免无限 crawl space；可通过链接策略、robots、canonical/noindex 组合治理，但需保证主产品可发现。
- 排序通常不应索引；pagination 通常可抓取且 self-canonical。
- 变体若有独立搜索需求、内容和可购买性，可建独立 URL；否则主 product 聚合，并保持价格/库存 schema 准确。

## 缺货与停售

- 暂时缺货：保持 200、显示 OutOfStock、提供补货提醒和相近替代品。
- 永久停售且有高度相关替代：301 到真正等价产品/collection。
- 无替代且页面有历史需求/外链：可保留说明与替代推荐；否则 404/410。
- 不要把所有下架商品跳首页，避免 soft 404 和用户困惑。

## Merchant Center 与商品展示

Product schema 与 Merchant Center feed 互补。确保 GTIN/MPN/brand、价格、库存、运费、退货和落地页一致；监控 feed disapproval 与自动更新。免费商品展示不等同普通蓝链 SEO，但共享数据质量基础。

## Shopify 执行顺序

1. 导出产品/collection/blog URL、GSC、收入、库存和内部链接基线。
2. 修阻塞索引和 canonical/redirect/schema 错误。
3. 建立 collection 优先级与关键词-URL 映射。
4. 优化高毛利/高库存 collection/product，补独特商品和信任信息。
5. 发布选购/比较/使用内容并链接商业页。
6. 清理低价值参数与重复 app 输出，压缩应用性能成本。
7. 推进数字公关、供应商/媒体/测评合作，并按自然收入复盘。

任何 handle、主题、Markets、域名或平台迁移都要使用 [网站迁移 SOP](../playbooks/site-migration.md)。
