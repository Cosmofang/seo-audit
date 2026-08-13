# 技术 SEO

技术 SEO 的主线是：发现 -> 抓取 -> 渲染 -> 规范选择 -> 索引 -> 搜索展示。Lighthouse SEO 100 分不能证明页面已索引或能排名。

## HTTP 与可访问性

- 正常页面返回 `200`；永久迁移用 `301/308`；临时跳转用 `302/307`；删除且无替代用 `404/410`。
- 避免 soft 404、重定向链/环、所有旧页跳首页、200 错误页。
- HTTPS、有效证书、单一首选 host/protocol；HTTP 和非首选 host 一跳到最终 URL。
- 5xx、超时和高 TTFB 会妨碍用户与抓取；用日志和 uptime 监控。

## robots、noindex 与访问控制

- `robots.txt` 控制抓取，不保证移除索引；不要用它做 canonical。
- `noindex` 必须允许爬虫抓到指令；被 robots 阻止时搜索引擎可能看不到它。
- 私密内容使用认证/授权，不靠 robots。
- staging 使用认证或明确阻止索引；上线时检查移除 noindex、密码和全站 Disallow。
- CSS/JS/图片若参与页面理解和渲染，应允许抓取。

## Sitemap

- 仅包含首选、可索引、200 canonical URL；不要放重定向、404、noindex、参数重复页。
- 单 sitemap 最多 50,000 URL 或未压缩 50MB，超出用 sitemap index。
- `lastmod` 只在内容实质变化时更新，不要每次构建全部刷新。
- sitemap 是发现/规范信号，不保证索引。比较 submitted、crawled、indexed 并查原因。

## Canonical 与重复 URL

重定向是强信号，`rel=canonical` 是强信号，sitemap 是弱信号。自引用 canonical 是推荐做法；内部链接、hreflang 和 sitemap 应指向同一首选 URL。

常见重复来源：协议/host、大小写/斜杠、跟踪参数、排序/筛选、打印页、会话、产品变体、跨域联合发布。不要把有独特意图的页面 canonical 到不等价页面。跨域 canonical 可用于合法联合发布，并非一律错误。

## JavaScript SEO

- 服务端渲染、静态生成或 hydration 都可用；关键是搜索引擎能获取等价主体、链接、metadata 和状态。
- 链接使用带 `href` 的 `<a>`，不要只用 `onclick` 或 hash 路由发现内容。
- 关键内容不要依赖滚动、同意弹窗后操作或长期失败的 API。
- 在原始 HTML、渲染 DOM、Google URL Inspection 三处比较 title、canonical、robots、主体和链接。
- 客户端 JS 不应把正确 canonical/noindex 改成冲突值。
- SSR 错误页必须返回正确 HTTP 状态，不能一律 200。

## Core Web Vitals 与性能

官方良好体验目标按真实用户数据第 75 百分位评估：`LCP <= 2.5s`、`INP <= 200ms`、`CLS <= 0.1`。CWV 是整体页面体验的一部分，不是越快就必然排名越高。

诊断顺序：

1. 区分 CrUX/GSC field data 与 Lighthouse lab data。
2. 按模板、设备、连接、地区定位问题；找真正 LCP 元素和 INP 交互。
3. 分解 LCP 的 TTFB、资源延迟、下载、渲染延迟。
4. 降低主线程长任务、JS 执行、第三方脚本；优化缓存与 CDN。
5. LCP 图片不要 lazy-load；使用响应式尺寸、现代格式、优先级提示。
6. 为图片/广告/嵌入预留空间，避免布局位移。
7. 每改一步重新测 field 趋势与 lab 回归。

具体性能打法见 [LCP playbook](../references/lcp-playbook.md)。项目字节预算、第三方白名单和 CSP 是质量门禁，不应伪装成 Google 排名规则。

## 结构化数据

- 先选 Google 支持的搜索功能，再读该类型的必需/推荐字段；Schema.org 支持不等于 Google 富结果支持。
- JSON-LD 通常最易维护，但 Microdata/RDFa 也可；一个或多个 block、是否 `@graph` 都是工程选择。
- 标记必须与可见内容一致，数据真实且持续更新；不要伪造评分、价格、库存、FAQ 或作者。
- 有效 schema 只提供资格，不保证展示，也不是通用排名捷径。
- 用 Rich Results Test 验资格，用 Schema Validator 验词汇，用 Search Console 监控实际增强结果。
- FAQ 富结果通常只对符合条件的权威政府/健康站点开放；普通商业站不应把 FAQ schema 当增长承诺。

详见经修订的 [结构化数据指南](../references/structured-data.md)。

## 国际、图片、视频与新闻

- hreflang、国家/语言 URL、翻译和 x-default 见国际专项。
- 图片应可抓取、与文本相关、具有尺寸和合适 alt；可按需要添加图片 sitemap/许可 metadata。
- 视频应有专属观看页、稳定缩略图、可抓取视频文件/播放器及 `VideoObject`，按资格提供关键时刻。
- 新闻/Discover 更依赖及时、透明、原创和政策合规；新闻 sitemap 只放最近符合要求内容。

## 技术审计边界

静态 regex 能发现 markup 信号，单页 live 请求能检查 origin 配置，但都不能替代完整 crawl、JS 渲染、日志、GSC 索引、真实用户 CWV、反链或转化审计。工具输出必须结合页面类型与业务影响排序。
