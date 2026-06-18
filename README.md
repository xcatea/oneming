# 一命 · ONEMING

免费八字命盘网站。八字 / 五行排盘在**浏览器本地**完成，零后端、零数据库、不收集出生信息 —— 因此可直接托管在 Cloudflare Pages（免费、海外、无需备案）。算命永远免费，变现靠周边手串/文玩（链接外跳到独立店铺）。

## 技术栈

- **Vite + React** —— 纯静态产物，CF Pages 原生支持
- **Tailwind CSS v4** —— 设计 token 在 `src/index.css`
- **lunar-javascript**（6tail 开源）—— 八字/四柱/十神/纳音/生肖计算引擎

## 目录

```
src/
  bazi.js      八字引擎：封装 lunar-javascript，输出命盘 + 五行统计 + 性格基调文案（中英）
  strings.js   全部中英文案，改文案只动这里
  App.jsx      页面：竖排谚语 Hero / 出生表单 / 四柱命盘 / 五行分布 / 周边引流 / 免责声明
  index.css    设计 token（宣纸 / 墨 / 青瓷 / 朱砂）+ 竖排谚语样式
public/
  _redirects   SPA 回退（之后加路由时用得上）
  robots.txt
```

## 本地运行

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物在 dist/
```

## 部署到 Cloudflare Pages

1. 把这个目录推到 GitHub（`node_modules`、`dist` 已在 .gitignore）。
2. Cloudflare 控制台 → Workers & Pages → 新建 → 连接你的 GitHub 仓库。
3. 构建设置：
   - Framework preset：`Vite`
   - Build command：`npm run build`
   - Build output directory：`dist`
4. 绑定域名 `oneming.net`（Cloudflare 自带 DNS，几分钟生效，HTTPS 自动）。

> 你 paypa.cc 那套 CF Pages 流程一样，直接套用即可。

## 上线前要改的地方

- **`src/App.jsx` 顶部的 `SHOP_URL`** —— 换成你的店铺/独立站/TikTok 落地页地址（现在是占位符）。
- 字体走 Google Fonts CDN，国内访问偏慢；要更快可把 Noto Serif SC / Spectral 自托管，或国内站点换国内字体 CDN。

## 合规备注（重要）

设计上已经按"安全模式"来做，**保持这几条不要改**：

- 解读只写**性格倾向 / 节奏参考**，不写宿命断言、不恐吓灾祸；
- 周边文案当**文玩/饰品**卖，不能加"开光/转运/招财/辟邪/改运"任何功效词；
- 全站保留**免责声明**与"传统文化·娱乐参考"标识；
- 算命**免费**、不对排盘或"化解改运"收费。

## 后续可扩展

- 紫微斗数 / 塔罗作为新模块（`src/` 下并列加文件，路由用 `_redirects` 已留好）；
- 解读文案可接 AI（你的 3070 + Ollama，或 API）做个性化生成，但产出同样要走上面的合规口径；
- `lunar-javascript` 体积较大（打包后 gzip ~170KB），日后可改成路由级懒加载减小首屏。
