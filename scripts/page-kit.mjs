// 一命 · 静态页公共组件（head / 页脚 / 统计与广告注入 / 样式）
// 所有构建期页面都从这里出，保证域名、统计、广告、hreflang 一处配置全站生效。
import { SITE, MONETIZE, ANALYTICS } from '../src/site.config.js'

export const BASE = SITE.url.replace(/\/$/, '')

// 构建时环境变量优先（Cloudflare Pages → Settings → Environment variables）
export const CFG = {
  cfBeaconToken: process.env.CF_BEACON_TOKEN || ANALYTICS.cfBeaconToken,
  ga4Id: process.env.GA4_ID || ANALYTICS.ga4Id,
  adsenseClient: process.env.ADSENSE_CLIENT || MONETIZE.adsenseClient,
}

export const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const baseName = (s) => s.split('（')[0].split('(')[0].trim()

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap'

// 统计脚本（所有页面，含首页 App）
export function analyticsTags() {
  let out = ''
  if (CFG.cfBeaconToken) {
    out += `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${JSON.stringify({ token: CFG.cfBeaconToken })}'></script>\n`
  }
  if (CFG.ga4Id) {
    out += `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(CFG.ga4Id)}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(CFG.ga4Id)}');</script>\n`
  }
  return out
}

// 广告脚本（只用于内容页：词条/指南/生肖/年份；排盘工具页不放）
export function adTags() {
  if (!CFG.adsenseClient) return ''
  return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(CFG.adsenseClient)}" crossorigin="anonymous"></script>\n`
}

export const STYLE = `
:root{--paper:#ece5d6;--ink:#211d18;--soft:#5a5246;--jade:#4c6b5e;--seal:#9e342a}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:"Noto Serif SC","Source Han Serif SC","Songti SC","STSong","SimSun",Georgia,serif;line-height:1.75;-webkit-font-smoothing:antialiased}
.wrap{max-width:720px;margin:0 auto;padding:28px 20px 60px}
a{color:var(--jade);text-decoration:none}
header{display:flex;align-items:center;gap:10px;padding-bottom:18px;border-bottom:1px solid rgba(33,29,24,.12);margin-bottom:24px}
header .sp{flex:1}
header .lang{font-size:13px;border:1px solid var(--jade);border-radius:999px;padding:3px 12px}
.seal{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:7px;background:var(--seal);color:#f3ece1;font-weight:700;font-size:20px}
.brand{font-weight:700;font-size:18px;letter-spacing:.04em}
.brand small{display:block;font-size:10px;letter-spacing:.3em;color:var(--soft);font-weight:400}
.crumb{font-size:13px;color:var(--soft);margin-bottom:14px}
h1{font-size:34px;margin:.2em 0 .1em;line-height:1.3}
h2.sec{font-size:20px;margin:32px 0 10px;border-bottom:1px solid rgba(33,29,24,.12);padding-bottom:6px}
.en{color:var(--soft);font-size:16px;margin-bottom:18px}
.def{font-size:17px;margin:18px 0}
.box{background:rgba(76,107,94,.08);border-radius:12px;padding:16px 18px;margin:18px 0}
.box .lab{font-size:12px;letter-spacing:.2em;color:var(--jade);margin-bottom:6px}
.src{font-size:13px;color:var(--soft)}
.cta{display:inline-block;margin:22px 0;background:var(--ink);color:var(--paper);padding:12px 26px;border-radius:999px;font-size:15px}
.cta.alt{background:transparent;color:var(--jade);border:1px solid var(--jade);margin-left:8px}
.more{margin-top:32px;padding-top:20px;border-top:1px solid rgba(33,29,24,.12)}
.more h2{font-size:15px;color:var(--soft);font-weight:600;letter-spacing:.05em}
.more a{display:inline-block;margin:4px 10px 4px 0;font-size:14px}
.ensec{margin-top:28px;padding-top:18px;border-top:1px solid rgba(33,29,24,.12);color:var(--soft);font-size:14px}
ul.list{list-style:none;padding:0}
ul.list li{margin:14px 0}
.toc{margin:22px 0;padding:16px 18px;background:rgba(255,255,255,.28);border:1px solid rgba(33,29,24,.09);border-radius:12px}
.toc strong{display:block;margin-bottom:6px;font-size:14px}
.toc a{display:block;padding:3px 0;font-size:14px}
.article p{margin:10px 0}
.article strong{font-weight:700}
.faq{margin-top:32px}
.faq-item{padding:15px 0;border-bottom:1px solid rgba(33,29,24,.12)}
.faq-item h3{font-size:17px;margin:0 0 6px}
.faq-item p{margin:0;color:var(--soft)}
.sources{margin-top:28px;padding:16px 18px;border-left:3px solid var(--jade);background:rgba(76,107,94,.06)}
.sources h2{font-size:15px;margin:0 0 8px}
.sources ul{margin:0;padding-left:20px}
.table-wrap{overflow-x:auto;margin:18px 0;border:1px solid rgba(33,29,24,.12);border-radius:12px;background:rgba(255,255,255,.22)}
table{width:100%;border-collapse:collapse;min-width:560px;font-size:14px}
th,td{padding:11px 12px;text-align:left;border-bottom:1px solid rgba(33,29,24,.10);vertical-align:top}
th{background:rgba(76,107,94,.08);font-weight:700}
tr:last-child td{border-bottom:0}
th:first-child,td:first-child{white-space:nowrap}
.kicker{color:var(--soft);font-size:16px;margin-bottom:18px}
.facts{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:18px 0}
.facts div{background:rgba(255,255,255,.32);border:1px solid rgba(33,29,24,.1);border-radius:12px;padding:12px 14px}
.facts b{display:block;font-size:12px;letter-spacing:.12em;color:var(--soft);font-weight:400}
.facts span{font-size:19px;font-weight:700}
.grid12{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:18px 0}
.grid12 a{display:block;background:rgba(255,255,255,.32);border:1px solid rgba(33,29,24,.1);border-radius:12px;padding:14px;color:var(--ink)}
.grid12 a strong{font-size:22px;display:block}
.grid12 a small{color:var(--soft);font-size:12px}
.years a{display:inline-block;margin:3px 6px 3px 0;padding:3px 10px;border:1px solid rgba(33,29,24,.14);border-radius:999px;font-size:13px}
.chip{display:inline-block;width:18px;height:18px;border-radius:5px;vertical-align:-3px;margin-right:4px;border:1px solid rgba(0,0,0,.12)}
.note{font-size:14px;color:var(--soft);background:rgba(158,52,42,.06);border-left:3px solid var(--seal);padding:10px 14px;border-radius:0 10px 10px 0}
footer{margin-top:40px;font-size:12px;color:var(--soft);text-align:center}
@media (max-width:520px){h1{font-size:28px}.cta.alt{margin-left:0}}
`

/**
 * @param {string} title
 * @param {string} desc
 * @param {string} url 绝对地址（canonical）
 * @param {object} o  { lang:'zh'|'en', alt:{zh,en} 对应语言版本的绝对地址, ads:boolean, type, noindex }
 */
export function head(title, desc, url, o = {}) {
  const lang = o.lang || 'zh'
  const alt = o.alt || {}
  const hreflang = (alt.zh || alt.en)
    ? [alt.zh && `<link rel="alternate" hreflang="zh-CN" href="${alt.zh}">`, alt.en && `<link rel="alternate" hreflang="en" href="${alt.en}">`, `<link rel="alternate" hreflang="x-default" href="${alt.zh || alt.en}">`].filter(Boolean).join('')
    : ''
  const home = lang === 'en' ? '/en/' : '/'
  const otherLang = lang === 'en' ? alt.zh : alt.en
  const langLink = otherLang ? `<a class="lang" href="${otherLang.replace(BASE, '')}">${lang === 'en' ? '中文' : 'EN'}</a>` : ''
  return `<!doctype html><html lang="${lang === 'en' ? 'en' : 'zh-CN'}"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">${hreflang}
${o.noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="${o.type || 'article'}"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<meta property="og:site_name" content="${lang === 'en' ? 'ONEMING' : '一命 ONEMING'}">
<meta property="og:image" content="${BASE}/share-cover.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${BASE}/share-cover.png">
<meta name="theme-color" content="#ece5d6">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="${FONT_HREF}" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${FONT_HREF}"></noscript>
${analyticsTags()}${o.ads ? adTags() : ''}<style>${STYLE}</style></head><body><div class="wrap">
<header><a class="seal" href="${home}">命</a><a href="${home}" style="color:inherit"><span class="brand">ONEMING<small>一 命</small></span></a><span class="sp"></span>${langLink}</header>`
}

export function foot(lang = 'zh') {
  if (lang === 'en') {
    return `<footer>One fate, two luck, three feng shui, four virtue, five learning · <a href="/en/">${SITE.domain}</a><br>Traditional culture, for reflection and fun — not fate.<br><a href="/en/term/">Glossary</a> · <a href="/en/chinese-zodiac/">Chinese Zodiac</a> · <a href="/en/five-element-colors/">Element Colors</a><br><a href="/en/terms/">Terms</a> · <a href="/en/privacy/">Privacy</a> · <a href="/en/ai-notice/">AI notice</a> · <a href="/">中文</a></footer></div></body></html>`
  }
  return `<footer>一命二运三风水，四积阴德五读书 · <a href="/">${SITE.domain}</a><br>传统文化 · 娱乐参考，非命定。<br><a href="/term/">命理小词典</a> · <a href="/shengxiao/">十二生肖</a> · <a href="/wuxing-colors/">五行配色</a><br><a href="/terms/">用户协议</a> · <a href="/privacy/">隐私说明</a> · <a href="/ai-notice/">AI 生成说明</a> · <a href="/en/">English</a></footer></div></body></html>`
}

export function jsonLd(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`
}

export function articleLd({ title, description, url, lang = 'zh', updatedAt }) {
  const data = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: title, description,
    inLanguage: lang === 'en' ? 'en' : 'zh-CN', mainEntityOfPage: url,
    author: { '@type': 'Organization', name: lang === 'en' ? 'ONEMING' : '一命 ONEMING' },
    publisher: { '@type': 'Organization', name: lang === 'en' ? 'ONEMING' : '一命 ONEMING' },
  }
  if (updatedAt) { data.datePublished = updatedAt; data.dateModified = updatedAt }
  return jsonLd(data)
}

export function breadcrumbLd(items) {
  return jsonLd({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.item })),
  })
}

export function faqLd(faqs) {
  if (!faqs || !faqs.length) return ''
  return jsonLd({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') } })),
  })
}

export function faqHtml(faqs, lang = 'zh') {
  if (!faqs || !faqs.length) return ''
  return `<section class="faq"><h2 class="sec">${lang === 'en' ? 'FAQ' : '常见问题'}</h2>${faqs.map((f) => `<div class="faq-item"><h3>${esc(f.q)}</h3><p>${f.a}</p></div>`).join('')}</section>`
}
