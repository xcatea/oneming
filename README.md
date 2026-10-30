# 一命 · ONEMING

**oneming.net** 是一个免费八字排盘与**命盘术语解释**工具，中英双语（`/` 与 `/en/`）。

输入出生时间后，系统在浏览器本地生成四柱八字、五行分布与十神关系，并解释命盘中出现的日主、旺衰、喜用神、正官、七杀、纳音等专业术语——从"一命二运三风水"开始，看懂自己的命盘。

## 核心定位

- "一命二运三风水"的现代文化解释
- 免费八字排盘（永远免费）
- 命盘专业术语自动识别与解释
- 出生信息在浏览器本地计算，不注册、不存储
- **不预测吉凶，不售卖改运服务**——只谈性格倾向，供文化与自我认知参考

## 技术架构

- **前端**：Vite + React + Tailwind CSS v4，排盘计算基于 [lunar-javascript](https://github.com/6tail/lunar-javascript)，全部在浏览器本地完成
- **AI 文笔层**：命盘解读的文字表达由 DeepSeek 通过 Cloudflare Pages Function（`functions/api/reading.js`）代理生成；服务端构建受约束提示词，只允许改写引擎给定的盘面事实，禁止预测与改运措辞，输出经合规过滤，失败回退为确定性文案。请求无状态，不存储出生信息
- **SEO 静态层**：构建时由 `scripts/gen-static.mjs` 生成词典页（`/term/*`）、专题页、信任页、404 与 sitemap
- **部署**：Cloudflare Pages，`npm run build` = `vite build && node scripts/gen-static.mjs`

## 目录

```
src/
  site.config.js  全站唯一配置（域名 / 变现链接 / 统计 ID，留空即隐藏）
  wuxing.js       干支五行基础表（前端 / 构建 / 接口共用）
  bazi.js         排盘引擎（四柱/五行/纳音，支持时辰未知）
  analyze.js      解读引擎第①层：旺衰/喜用/性格（确定性规则）
  reading.js      解读引擎第②层：AI 文笔（模型无关，含合规过滤与兜底）
  track.js        事件埋点（不含出生信息）
  terms.js        应用内词条（18 条）
functions/        Cloudflare Pages Functions（DeepSeek 代理：只收干支、缓存、限流）
scripts/          构建期静态页：词条 / 指南 / 生肖 / 年份 / 2027 专题 / 五行配色 / 英文版 / sitemap
public/           静态资源（robots.txt / 404.html / _headers / 分享封面）
docs/             产品圣经、路线图、知识规范、顶层设计与变现（Strategy.md）、上线配置清单（Operations.md）
```

详见 [Architecture.md](Architecture.md)、[SEO.md](SEO.md)、[docs/Operations.md](docs/Operations.md)。

## 内容与合规口径

词条与解读框架源出公有古籍（《渊海子平》《滴天髓》《三命通会》等），以现代语言原创撰写并标注出处。全站红线：**只解释、只谈性格倾向，不预测吉凶、不恐吓、不改运、不带货开光。** 详见站内 [用户协议](https://oneming.net/terms/) · [隐私说明](https://oneming.net/privacy/) · [AI 生成说明](https://oneming.net/ai-notice/)。
