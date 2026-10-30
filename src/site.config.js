// 一命 · 全站配置（唯一来源）
// 前端（App）、构建脚本（scripts/）、接口（functions/）都从这里读。
// 规则：值留空 = 对应功能自动隐藏，不会出现"坏按钮"。

export const SITE = {
  url: 'https://oneming.net', // 主域名（canonical / sitemap / 分享图都用它）
  domain: 'oneming.net',
  // 允许调用 /api/reading 的来源（主域名 + 备用域名 + 预览环境）
  // 备用域名（如 oneming.org）请在 Cloudflare 里 301 跳转到主域名
  allowedHosts: ['oneming.net', 'www.oneming.net', 'oneming.org', 'www.oneming.org'],
  allowPreviewHosts: true, // *.pages.dev 预览环境
  github: 'https://github.com/xcatea/oneming',
  nameZh: '一命',
  nameEn: 'ONEMING',
}

// 变现位：填上即启用
export const MONETIZE = {
  // 打赏
  tipUrl: 'https://ko-fi.com/oneming', // 海外（Ko-fi）
  tipQrWechat: '', // 国内微信赞赏码图片路径，如 '/pay/wechat.png'（放 public/pay/ 下）
  tipQrAlipay: '', // 国内支付宝收款码图片路径，如 '/pay/alipay.png'

  // 付费深度报告（Ko-fi Shop / Gumroad / Lemon Squeezy / 面包多 的商品链接）
  reportUrlZh: '',
  reportUrlEn: '',
  reportPriceZh: '¥19.9',
  reportPriceEn: '$4.99',

  // 五行配色选物（Etsy / Amazon / 独立站 / 淘宝店 链接）
  shopUrlZh: '',
  shopUrlEn: '',

  // Google AdSense 发布商 ID，如 'ca-pub-1234567890123456'
  // 只投放在知识页/指南页/生肖页，排盘结果页不放
  adsenseClient: '',
}

// 统计：两者都可选，构建时也可用同名环境变量覆盖（CF Pages → Settings → Environment variables）
export const ANALYTICS = {
  cfBeaconToken: '', // Cloudflare Web Analytics 的 token（免费、无 cookie）。环境变量：CF_BEACON_TOKEN
  ga4Id: '', // Google Analytics 4，如 'G-XXXXXXXXXX'。环境变量：GA4_ID
}
