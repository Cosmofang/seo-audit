# 构建质量门禁：适用范围与配置

这里记录本仓 `audit-seo.mjs` 可检查的信号。它们混合了搜索实现风险、无障碍/安全/性能建议和参考项目预算，因此不再统称为“Google SEO 硬规则”。

| 检查 | 默认级别 | 正确解释 |
|---|---|---|
| viewport 缺失/无效 | ERROR | 移动渲染基础实现错误 |
| title 缺失 | ERROR | 搜索标题与浏览器语义基础缺失 |
| canonical 非绝对或与 `--expected-origin` 冲突 | ERROR | 高规范化/环境配置风险；合法跨域 canonical 需按场景豁免 |
| canonical path 与构建文件路径不同 | WARN | 可能是错误路径，也可能是有意重复映射；必须人工确认 |
| description 缺失 | ERROR | 本工具的内容完整性策略；Google 仍可从正文生成摘要 |
| H1 数量、landmark | WARN | 清晰度与无障碍建议，不是固定排名规则 |
| title/description 长度 | WARN | SERP 人工检查提示，无官方固定字符上限 |
| 图片尺寸/alt/lazy/priority | WARN | 无障碍、CLS 和性能提示，按图片角色判断 |
| inline JS、external resources | WARN | CSP、安全、隐私、缓存与性能策略，不是排名硬规则 |
| JSON-LD 缺失 | WARN | 仅在页面存在合适实体/搜索资格时有意义 |
| HTML+CSS+JS 500KB、图片 500KB | WARN | 可配置项目预算，不是 Google 阈值 |

## CI 用法

```bash
node scripts/audit-seo.mjs \
  --dir dist \
  --expected-origin https://www.example.com \
  --max-page-kb 500 \
  --max-img-kb 500
```

使用 `--strict` 会把所有 WARN 升为构建失败。这表示团队主动采用这些质量策略，不表示每个 WARN 都会影响排名。

## 不在脚本覆盖范围

HTTP 全站 crawl、JavaScript 渲染、robots 完整路径匹配、索引选择、hreflang 集群、分页/参数、孤儿页、重复内容、真实用户 CWV、搜索意图、内容质量、链接、GSC、日志和转化。使用 [全站审计 SOP](../playbooks/site-audit.md) 补齐。

## 参考项目经验

参考站曾采用更严格门禁：恰好一个 H1、无 inline script、全部资源自托管、固定字节预算、小写/尾斜杠/三级目录。这些可以是有效工程选择，但不能推广成搜索引擎通用要求。案例见 [脱敏分析](../analysis/case-study-build-time-seo-gates.md)。
