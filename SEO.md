# 一命 · SEO 原则与页面体系

## 原则
1. **每一页都要有用**：批量生成的页面必须带真实、可核对的数据（例如年份页的干支、纳音、春节和立春时刻都是构建时计算的），不写空洞的套话页。
2. **中英文是两个独立入口**：`/` 和 `/en/` 各有自己的 title、description、canonical，互相用 hreflang 关联。
3. **一切互相连接**：词条 ↔ 排盘结果 ↔ 生肖 ↔ 年份 ↔ 配色，每页都有返回工具的入口。
4. **不碰预测**：不写运势、不写"化解"，这同时也是广告联盟和平台合规的前提。

## 页面体系（共 330 个地址）

| 类型 | 中文 | 英文 | 数量 | 主要搜索意图 |
| --- | --- | --- | --- | --- |
| 排盘工具 | `/` | `/en/` | 2 | 八字排盘 / bazi calculator |
| 词条 | `/term/<id>/` | `/en/term/<id>/` | 38×2 | 七杀是什么意思 / seven killings bazi |
| 指南 | `/guide/shishen/` | – | 1 | 十神是什么 |
| 生肖总览（含查询小工具） | `/shengxiao/` | `/en/chinese-zodiac/` | 2 | 生肖查询 / what is my chinese zodiac |
| 生肖详情 | `/shengxiao/<animal>/` | `/en/chinese-zodiac/<animal>/` | 12×2 | 属马的人性格 / year of the horse |
| 年份页 | `/shengxiao/<年>/` | `/en/chinese-zodiac/<年>/` | 106×2 | 1990年属什么 / 1990 chinese zodiac |
| 年度专题 | `/2027-huoyang/` | `/en/2027-year-of-the-fire-goat/` | 2 | 2027年是什么年 / chinese new year 2027 |
| 五行配色 | `/wuxing-colors/` | `/en/five-element-colors/` | 2 | 五行颜色 / five element colors |
| 信任页 | `/terms/` 等 | `/en/terms/` 等 | 3×2 | — |

## 结构化数据
Article、BreadcrumbList、FAQPage（生肖、年份、专题、配色页）、Organization、WebSite / WebApplication（首页）。

## 季节性节点
- **每年 10 月–次年 2 月**：下一年生肖专题（2028 年是戊申土猴年，2027 年 10 月前上线）
- **春节前后**：年份页和"X 年 1 月出生属什么"类问题流量最高
- 每年更新 `YEAR_TO` 并新增下一年的专题页
