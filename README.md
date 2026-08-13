# SEO / GEO Audit and Operations

DeepLumen 官网技术 SEO、国际化 SEO、AI 可见性（GEO）、Core Web Vitals 与发布运维体系的公开整理版。

这个仓库同时提供：

- 两个零依赖 Node.js 审计器：本地构建产物审计 + 线上 origin 审计。
- 一套可落地的 SEO/GEO 工程规范和发布 Runbook。
- 从 DeepLumen 生产官网提炼的架构模式、构建门禁与实测性能经验。
- 一个可安装到 Claude Code、Codex、Cursor 等工具中的 `seo-audit` skill。

仓库不包含官网业务源码、账号、密钥、客户数据或私有运营数据。示例已泛化，官网内容仍以其 canonical URL 为唯一原文来源。

## 快速开始

要求 Node.js 18 或更高版本，无需 `npm install`。

```bash
# 审计构建产物
node scripts/audit-seo.mjs --dir dist --origin https://www.example.com

# 公开 alternate representation 仍接受审计，但允许 canonical 指向主页面
node scripts/audit-seo.mjs --dir dist --origin https://www.example.com \
  --alternate-prefix agent/

# CI 模式：warning 也会导致非零退出码
node scripts/audit-seo.mjs --dir dist --origin https://www.example.com --strict

# 审计线上站点
node scripts/audit-live.mjs https://www.example.com

# 机器可读输出
node scripts/audit-seo.mjs --dir dist --origin https://www.example.com --json
node scripts/audit-live.mjs https://www.example.com --json
```

本地审计覆盖：

- 每页唯一 H1、viewport、语义地标、title、description。
- 绝对 canonical，以及传入 `--origin` 时的 host 与自指路径校验。
- Open Graph、图片尺寸/alt/加载策略与图片体积。
- inline 可执行脚本、inline 事件处理器、外部资源引用。
- HTML + 同页 CSS/JS 体积预算，支持根路径和相对路径资源。
- JSON-LD 解析、主页 Organization/WebSite、重复 title/description/canonical。
- CSS 外链、`srcset` 外链与过小字体提示。

线上审计覆盖：

- robots.txt、sitemap.xml、llms.txt。
- 搜索索引 crawler、用户触发 fetcher、训练 crawler 的分组策略。
- 首页 canonical、robots meta、JSON-LD 与基础响应头。
- 线上错误时可靠的退出码，包括 `--json` 模式。

这些检查是高信号技术基线，不替代 Search Console、Bing Webmaster Tools、真实用户 Core Web Vitals、日志分析、内容质量评估或人工验证。

## 文档导航

| 任务 | 文档 |
|---|---|
| 建立完整 SEO/GEO 工作流 | [`references/operating-model.md`](references/operating-model.md) |
| 配置构建门禁 | [`references/hard-gates.md`](references/hard-gates.md) |
| 路由、canonical、重定向与 sitemap | [`references/routing-canonical.md`](references/routing-canonical.md) |
| 中英双语与 hreflang | [`references/international-seo.md`](references/international-seo.md) |
| JSON-LD 与实体一致性 | [`references/structured-data.md`](references/structured-data.md) |
| AI crawler、llms.txt、agents.md 与 GEO | [`references/geo-ai-visibility.md`](references/geo-ai-visibility.md) |
| 白帽 AI 可读层与防 cloaking | [`references/whitehat-ai-readability.md`](references/whitehat-ai-readability.md) |
| LCP / CLS / 性能预算 | [`references/lcp-playbook.md`](references/lcp-playbook.md) |
| 上线、巡检、故障处理 | [`references/publishing-runbook.md`](references/publishing-runbook.md) |
| 内容集群与发布规范 | [`references/content-system.md`](references/content-system.md) |
| DeepLumen SEO/GEO 内容资产索引 | [`references/deeplumen-content-inventory.md`](references/deeplumen-content-inventory.md) |

可直接改造成项目代码的最小参考实现位于 [`examples/reference-architecture/`](examples/reference-architecture/)；它包含路由、canonical/hreflang、结构化数据、robots、sitemap、Lighthouse 与 CI 示例。

## 证据等级

仓库中的建议分为三类，避免把实验性 GEO 结论写成搜索引擎规则：

- **标准/平台文档支持**：canonical、hreflang、robots、sitemap、结构化数据语法、Core Web Vitals 等。
- **工程策略**：单一路由源、字节预算、严格 CSP、自托管资源、CI 门禁等。它们能提升稳定性，但不是独立排名因子声明。
- **实验/兼容层**：`llms.txt`、`agents.md`、Markdown 镜像、实体补充端点等。可以部署和测量，但不能承诺直接提升排名、引用或推荐。

## CI 接入

```yaml
- name: Build
  run: npm run build

- name: SEO hard gate
  run: node vendor/seo-audit/scripts/audit-seo.mjs --dir dist --origin https://www.example.com --strict
```

CI 必须对错误的目录或零 HTML 构建失败。本仓库自带测试覆盖这些 fail-open 场景。

## Skill 安装

将仓库放入工具的 skills 目录，或安装发布版本。`SKILL.md` 只保留工作流与按需加载索引，详细知识都在 `references/`，避免每次调用占用过多上下文。

## 边界

仓库主要处理技术 SEO、国际化 SEO、站内内容结构、AI 可读性和性能。以下工作仍需要独立数据源：

- 关键词量级、排名与竞品份额。
- Search Console 索引状态、抓取错误与人工处置。
- 外链质量、品牌提及与数字公关。
- GA4/CRM 收入归因、转化率和实验结果。
- CrUX 真实用户数据与不同地区/设备表现。

## License

[MIT](LICENSE)
