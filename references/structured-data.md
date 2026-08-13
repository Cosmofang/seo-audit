# 结构化数据实现参考

## 决策顺序

1. 页面可见内容是否真实存在相应实体？
2. Google 的 [structured data gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) 是否支持需要的搜索功能？
3. 逐项满足该类型 required/recommended properties 和内容政策。
4. Rich Results Test 验 Google 资格，Schema Validator 验词汇，Search Console 看实际表现。

JSON-LD 通常最易维护，但不是唯一格式。单 block、多个 block 或 `@graph` 都可；稳定 `@id` 和连接实体是工程便利，不是排名要求。

## 通用 `@graph` 示例

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.example.com/#organization",
      "name": "Example",
      "url": "https://www.example.com/",
      "logo": "https://www.example.com/logo.png",
      "sameAs": ["https://www.linkedin.com/company/example/"]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.example.com/#website",
      "url": "https://www.example.com/",
      "name": "Example",
      "publisher": {"@id": "https://www.example.com/#organization"}
    }
  ]
}
</script>
```

只在最相关页面输出所需实体即可；Organization/WebSite 不必机械地每页重复。`knowsAbout` 可准确描述组织知识领域，但没有可靠证据证明它直接提升 LLM 推荐。

## 页面类型

- `BreadcrumbList`：与可见层级一致。
- `Article`/`BlogPosting`：真实作者、发布时间、实质修改时间、图片和 publisher。
- `Product`：名称、图片、描述、brand、offer/aggregateOffer；价格、币种、库存、variant、评价必须和页面一致。
- `LocalBusiness`：选择准确 subtype，地址/营业时间/电话与真实业务一致。
- `VideoObject`、`Event`、`Recipe` 等：只按对应官方指南实现。
- `FAQPage`：仅标记页面可见问答；有效 schema 不是排名因素。Google 的 FAQ 富结果通常仅对符合条件的权威政府/健康站点开放。

## 禁止做法

隐藏/不存在内容、虚假评价、错误价格库存、自评星级滥用、批量给所有页面套 FAQ/Product、仅为了占 SERP 而标无关实体。结构化数据有效不代表一定展示富结果。
