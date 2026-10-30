# 一命 · 技术架构

## 总览

```
浏览器（React App）                         Cloudflare Pages
┌───────────────────────────┐            ┌──────────────────────────────┐
│ 表单 → bazi.js 排盘        │            │ dist/  静态资源               │
│      → analyze.js 旺衰喜用 │  POST 干支  │ functions/api/reading.js     │
│      → reading.js 兜底文案 │ ─────────▶ │   校验 Origin → 查缓存 → 限流 │
│ 卡片 canvas / 分享链接     │ ◀───────── │   → analyze.js 重算事实        │
└───────────────────────────┘   解读文字  │   → DeepSeek → 合规过滤 → 缓存 │
                                          └──────────────────────────────┘
构建期：vite build → scripts/gen-static.mjs（词条/指南/生肖/年份/配色/英文页/sitemap）
```

## 目录

| 路径 | 作用 |
| --- | --- |
| `src/site.config.js` | **全站唯一配置**：域名、变现链接、统计 ID。留空即隐藏 |
| `src/wuxing.js` | 干支五行基础表，前端/构建/接口共用；`chartFromPillars` 供接口重建盘面 |
| `src/bazi.js` | 排盘（lunar-javascript），支持时辰未知（三柱） |
| `src/analyze.js` | 解读第①层：旺衰（三档）、喜用（扶抑法）、性格方向，纯确定性规则 |
| `src/reading.js` | 解读第②层：提示词、合规校验、兜底文案（模型无关） |
| `src/track.js` | 事件埋点（仅事件名，不含出生信息） |
| `src/App.jsx` | 页面；语言由路径决定（`/` 中文、`/en/` 英文） |
| `functions/api/reading.js` | DeepSeek 代理：只收干支，服务端重算事实，Cache API 缓存，可选 KV 限流 |
| `scripts/page-kit.mjs` | 静态页公共部分：head、页脚、统计/广告注入、hreflang、结构化数据 |
| `scripts/gen-static.mjs` | 中文词条、指南、信任页、首页注入、sitemap |
| `scripts/gen-growth.mjs` | 英文词条与信任页、十二生肖、年份页、2027 专题、五行配色 |
| `scripts/zodiac-data.mjs` | 生肖文案与结构性知识（三合六合六冲、五行配色） |

## 关键设计

- **隐私**：出生信息只在浏览器里算。接口只收 8 个干支字，不收日期，也不收任何自由文本。
- **防盗用**：接口不接受客户端传来的文字，事实由服务端重算，所以不能被当成通用大模型调用；没有 Origin 的请求一律拒绝。
- **省钱**：盘面组合有限，同盘结果按"干支 + 语言 + 档位 + 提示词版本"缓存 30 天；改提示词时把 `PROMPT_VERSION` 加 1，旧缓存自动失效。
- **永不崩**：没有 Key、接口超时、输出违规，都回退到确定性文案。
- **国内可用**：字体异步加载，失败时回退到系统宋体，不阻塞首屏；卡片最多等 2.5 秒字体。

## 构建与部署

- `npm run build` = `vite build && node scripts/gen-static.mjs`
- Cloudflare Pages：输出目录 `dist`；环境变量 `DEEPSEEK_API_KEY`（必需）、`CF_BEACON_TOKEN` / `GA4_ID` / `ADSENSE_CLIENT`（可选）；KV 绑定 `RATE_KV`（可选）
