# AI 搜索可见性实现参考

本文件提供实现细节，策略与证据边界以 [GEO 与 AI 搜索](../knowledge/geo-and-ai-search.md) 为准。最后核验：2026-08-13。

## OpenAI 爬虫用途

依据 [OpenAI crawlers](https://developers.openai.com/api/docs/bots)：

- `OAI-SearchBot`：ChatGPT Search 自动搜索抓取；希望出现在搜索答案时应允许，并配合官方 IP 范围/WAF。
- `GPTBot`：可能用于基础模型训练；可独立允许或阻止。
- `ChatGPT-User`：用户操作触发，不用于自动搜索索引；robots 规则可能不适用。

不要把三者写成一个“全放行或全阻止”开关。Anthropic、Perplexity、Google 等也应以各自最新官方说明为准。

```text
User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Disallow: /

User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://www.example.com/sitemap.xml
```

这只是示例策略，不是法律建议。生产环境同时验证 app、CDN/WAF 和日志。`audit-live.mjs` 只总结根路径策略，不是完整 robots parser。

## `llms.txt` 实验

若决定测试，可在 `/llms.txt` 提供短的 Markdown 导航：品牌/产品说明、起始页、概念、研究和支持资源。只列公开 canonical URL，从 route/content source 生成并记录日志/引用/referral。其缺失不是 SEO/GEO 错误。

## IndexNow

按 [IndexNow documentation](https://www.indexnow.org/documentation) 托管密钥并提交新增、更新、删除 URL；批量单次上限 10,000。HTTP 200/202 只表示接收/待验证，不表示抓取、索引、排名或 AI 引用。它不替代 Google sitemap/GSC 流程。

## 可引用内容

清晰回答、原始来源、稳定 URL、作者/品牌实体、发布日期/更新时间、可复制表格和真实产品事实有利于机器与用户理解。把 AI 引用当可观测结果，不要宣称超长 meta、`knowsAbout` 或单一 schema 结构有直接推荐因果。
