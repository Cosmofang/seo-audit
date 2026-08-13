# SEO Audit + 实战运营知识库

一个同时服务“人”和 AI agent 的 SEO 仓库：保留零依赖技术审计脚本，并补齐从战略、关键词、内容、技术、电商 Shopify、国际/本地、外链、迁站到监控与 AI 搜索的完整操作体系。

## 从这里开始

- [SEO 实战知识地图](knowledge/README.md)：所有主题入口。
- [证据等级与官方来源](knowledge/sources-and-evidence.md)：先区分要求、资格、建议、项目门禁和实验。
- [常见误区](knowledge/myths-and-non-rules.md)：快速判断 H1、描述长度、schema、llms.txt、nofollow 等争议。
- [90 天 SEO 计划](playbooks/90-day-seo-plan.md)：从基线到执行和复盘。
- [全站审计 SOP](playbooks/site-audit.md)：证据、分级、路线图、复验。
- [内容 brief](playbooks/content-brief-and-publishing.md)：调研、写作、发布、更新。
- [网站迁移 SOP](playbooks/site-migration.md)：URL 映射、上线、监控和回滚。

## 命令行工具

要求 Node >= 18，无需安装依赖。

```bash
# 审计构建产物；建议提供预期生产 origin，以校验 canonical host
node scripts/audit-seo.mjs --dir dist --expected-origin https://www.example.com

# 审计线上 origin 的 robots、sitemap、实验性 llms.txt、首页 schema/headers
node scripts/audit-live.mjs https://www.example.com

# JSON 输出
node scripts/audit-seo.mjs --dir dist --json
node scripts/audit-live.mjs https://www.example.com --json
```

`ERROR` 用于明确的实现风险；`WARN` 包含启发式建议、可访问性/性能问题和项目预算；`INFO` 包含实验性或上下文信息。`--strict` 会故意让 WARN 也使 CI 失败，只应在团队接受这些项目门禁时使用。

工具边界：静态脚本采用保守 regex，线上脚本只请求少量固定端点。全绿不能证明全站可渲染/索引、内容能排名、CWV field data 良好、链接健康或能产生收入。完整方法见 [全站审计 SOP](playbooks/site-audit.md)。

## 目录

```text
seo-audit/
├── SKILL.md                 # agent 触发条件、工作流和知识路由
├── knowledge/               # 全链路 SEO 知识库
├── playbooks/               # 可复制执行的 SOP / 模板
├── references/              # 技术实现参考与单站经验
├── scripts/                 # 零依赖审计脚本
├── tests/                   # 工具行为和知识完整性验收
└── analysis/                # 脱敏案例（证据等级：单案例）
```

## 原则

- 用户与业务目标优先，搜索引擎可发现/理解是基础。
- 先诊断再改动，先阻塞性风险再增长。
- 官方文档和本站数据优先于行业口号。
- 富结果资格不等于展示，提交不等于收录，相关性不等于因果。
- 项目安全/性能门禁可以更严格，但必须明确不是通用排名规则。
- SEO 和 AI 搜索结果无法保证；每项变更都要有 owner、验收和观察窗。

## 验证

```bash
npm test
```
