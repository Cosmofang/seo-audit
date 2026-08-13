# 网站迁移 SOP

适用于域名、协议、URL、CMS、平台、主题架构或大规模信息架构变更。无法保证“零波动”；目标是保留信号、减少错误并快速发现异常。一次只改变一个大变量，能分离域名/CMS/设计改版时不要同时做。

## 角色与决策

| 角色 | 负责人 | 职责 |
|---|---|---|
| Migration owner |  | go/no-go、范围、回滚 |
| SEO |  | URL 映射、指令、基线、监控 |
| 开发/平台 |  | redirect、状态、性能、部署 |
| 内容/商品 |  | 页面与媒体完整性 |
| 分析 |  | tracking、仪表盘、告警 |
| 业务/客服 |  | 关键流程、用户沟通 |

## URL 映射表字段

`old_url`、`old_status`、`old_canonical`、`indexability`、`page_type`、`organic_clicks`、`conversions/revenue`、`backlinks`、`new_url`、`action(301/308/200/404/410)`、`mapping_reason`、`new_canonical`、`hreflang_cluster`、`owner`、`qa_status`。

映射规则：一对一到最相关页面；不要把大量无关旧 URL 跳首页。合并页需确认新页保留旧页的重要意图。删除且无替代返回 404/410。包含图片、PDF、视频和高价值资源 URL。

## 迁移前 4-6 周

- 导出全量 URL：crawl、sitemap、GSC、分析、日志、CMS、外链；取并集。
- 保存状态、canonical、robots、hreflang、title、主体 hash、内链、schema、CWV、流量/排名/收入基线。
- 新旧 Search Console/Bing 资产验证；域名迁移保留旧域控制。
- 新站在认证保护的 staging 全面测试，不只靠 robots。
- 完成 URL 映射与 server-side 301/308 规则；禁止链、环和无关目标。
- 更新新站内部链接、canonical、hreflang、schema、sitemap、media、OG、feed、邮件/广告链接。
- 保留或改善高价值内容、title、主标题、产品数据和转化流程。
- 容量/缓存/WAF/DNS/TLS/CDN/404/日志/监控/回滚方案演练。
- Shopify：导入 URL Redirects，验证 handle、product/collection/blog 路径、Markets、主题/app、checkout 相关流程。

## 上线前 go/no-go

以下必须 100% 通过：

- 所有高流量、高转化、有外链 URL 的 301/308 目标正确。
- 随机分层抽样 URL 的最终目标正确，无重定向链、环、soft 404。
- 新 canonical 自引用且域名/协议正确；hreflang 双向且指向新 URL。
- 新 sitemap 只含 200、canonical、可索引 URL；robots/noindex/认证无误。
- 核心模板和用户流程在移动/桌面通过；分析与收入追踪有效。
- 旧站 redirect 配置、DNS/TLS、server capacity 和回滚包就绪。

## 上线日

1. 冻结非迁站变更，记录版本和时间。
2. 发布新站和 redirect；立即跑 URL 映射全量验证。
3. crawl 新旧域：status、最终 URL、canonical、robots、hreflang、内链、sitemap、schema。
4. 提交新 sitemap；域名迁移按适用场景使用 Search Console Change of Address。
5. 更新重要外部资产与可控高价值链接；不要因迁移批量购买链接。
6. 检查日志中的 404/5xx、crawl、缓存、WAF 和用户转化。

## 上线后监控窗口

- 前 4 小时：每 30-60 分钟查 5xx、核心流程、redirect、robots/noindex、tracking。
- 第 1-3 天：每日查 crawl errors、404、sitemap、canonical、日志、收入/线索。
- 第 1-4 周：每周查 GSC 索引、点击/展示、排名分布、CWV、外链目标。
- 第 2-3 月：双周/月度复盘目录迁移率、遗留旧 URL、内容与转化。

重定向至少保留一年，重要外链和仍有访问的旧 URL 应长期保留；继续控制旧域和证书。

## 回滚阈值

阈值必须由负责人在迁移前按站点基线填写，不能临场拍脑袋：

| 指标 | 回滚/止损阈值 | 动作 owner |
|---|---|---|
| 核心页面 5xx / 不可购买 | 任一持续超过 __ 分钟 |  |
| 高价值 URL 错误映射 | > 0（目标 100% 正确） |  |
| 全站 robots/noindex/canonical 错误 | 任一大规模模板命中 |  |
| 收入/线索追踪中断 | 超过 __ 分钟 |  |
| 404 比例 / redirect chain | 高于基线 __ 倍 |  |
| 自然流量/收入 | 排除季节性后低于预期 __%，持续 __ 天 |  |

能热修的配置问题优先热修；回滚可能再次制造 URL 变化，必须由 migration owner、SEO、开发和业务共同决定并记录。

## 完成标准

- URL 映射的高价值与分层样本 100% 正确，无链/环。
- 新 URL 被发现和索引，旧 URL 持续向最终目标永久跳转。
- canonical、hreflang、sitemap、内链和结构化数据一致。
- 核心自然点击/转化进入预期恢复区间，未解决异常都有 owner。
- 迁移记录、问题和后续监控已归档。
