# 一命 · 上线配置清单

代码已经把所有开关都集中到 `src/site.config.js`，**值留空 = 功能自动隐藏**，不会出现坏按钮。下面按顺序做，每一项都能独立生效。

## 一、合并后马上做（30 分钟）

### 1. 合并 PR，等 Cloudflare Pages 自动部署
构建命令不变：`npm run build`；输出目录不变：`dist`。

### 2. 打开 Cloudflare Web Analytics（免费，不用 Cookie）
- 最简单：Cloudflare 后台 → Workers & Pages → oneming 项目 → **Metrics → Web Analytics → Enable**，Cloudflare 会自动注入统计脚本，不用改代码。
- 或者：在 Web Analytics 里拿到 token，填进 `ANALYTICS.cfBeaconToken`，或在 Pages 的环境变量里加 `CF_BEACON_TOKEN`。

### 3. 给接口加限流（防止 DeepSeek 额度被刷）
- Cloudflare 后台 → Workers & Pages → KV → 新建命名空间，比如 `oneming-rate`
- oneming 项目 → Settings → Functions → **KV namespace bindings** → 变量名填 `RATE_KV`，选刚建的命名空间
- 不绑也能跑（只是没有按 IP 限流）；同一张盘的结果已经走 Cache API 缓存，重复请求不再花钱

### 4. oneming.org 跳转到 oneming.net
- 把 oneming.org 也加到 Cloudflare
- Rules → Redirect Rules → 新建：所有请求 → 301 → `https://oneming.net${请求路径}`（勾选保留查询参数）
- 这样权重全部集中在 .net，不会分散

### 5. 提交搜索引擎
- Google Search Console：添加 `oneming.net`（域名资源，DNS 验证），提交 `https://oneming.net/sitemap.xml`
- Bing Webmaster Tools：可以直接从 Google Search Console 导入
- sitemap 现在有 330 个地址（中文 + 英文 + 生肖 + 年份页）

## 二、开始变现（1–4 周）

### 6. Google Analytics 4（可选，但申请广告和看转化需要它）
- 新建 GA4 媒体资源，拿到 `G-XXXXXXX`
- 填 `ANALYTICS.ga4Id`，或环境变量 `GA4_ID`
- 已埋好的事件：`chart_submit`、`share_copy`、`card_open`、`card_download`、`term_open`、`lang_switch`、`next_learn`、`report_click`、`shop_click`、`colors_guide`、`tip_click`、`zodiac_lookup`（都不含出生信息）
- 隐私页会自动加上 GA 的 Cookie 说明

### 7. Google AdSense
- 申请条件：有原创内容（现在有 300+ 页）、有隐私政策（中英文都有）、能正常访问。**等 Search Console 显示开始收录、有一些自然流量后再申请，通过率更高**
- 通过后把 `ca-pub-xxxxxxxx` 填进 `MONETIZE.adsenseClient`，或环境变量 `ADSENSE_CLIENT`
- 构建时会自动：在词条、指南、生肖、年份、配色页加载广告脚本（**排盘工具页不放广告**），生成 `ads.txt`，隐私页加上广告 Cookie 说明
- AdSense 后台开"自动广告"即可，不用手动放广告位

### 8. 国内打赏码
- 把微信赞赏码、支付宝收款码图片放到 `public/pay/wechat.png`、`public/pay/alipay.png`
- 填 `MONETIZE.tipQrWechat = '/pay/wechat.png'`、`tipQrAlipay = '/pay/alipay.png'`
- 中文版会显示二维码，英文版继续显示 Ko-fi 按钮

### 9. 付费入门手册（第一个数字产品）
- 手册文件见 PR 说明（如果已生成）。上架渠道：
  - 海外：Ko-fi Shop（你已有账号，可直接卖数字下载）或 Gumroad
  - 国内：面包多等支持微信支付的数字商品平台
- 把商品链接填进 `MONETIZE.reportUrlZh` / `reportUrlEn`，价格填 `reportPriceZh` / `reportPriceEn`
- 结果页"再深入一步"会出现付费卡片

### 10. 五行配色选物（手串/小物）
- 店铺链接填 `MONETIZE.shopUrlZh` / `shopUrlEn`（Etsy / Amazon / 独立站 / 淘宝）
- 首页周边区、结果页、五行配色页（`/wuxing-colors/`、`/en/five-element-colors/`）会出现购买入口
- **文案红线**：只讲颜色、材质、审美，不写"改运、招财、开光、转运"等功效。这既是品牌口径，也是广告法和电商平台的要求

## 三、需要你来定的事
- 付费产品的定位（建议：排盘和解读永远免费，付费只卖"更深的学习内容"，不卖预测）
- 手串是自己做品牌，还是先挂别人的联盟链接试水
- 要不要做国内备案（做国内流量需要，但算命类内容在国内有监管风险，建议先做海外）
