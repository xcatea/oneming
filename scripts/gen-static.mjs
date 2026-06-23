// 构建后生成静态词条页 + 词典总览 + 首页静态化注入 + sitemap（SEO 用）
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TERMS } from '../src/terms.js'
import { SHISHEN, RIZHU } from './seo-data.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')
const BASE = 'https://oneming.net'
const TODAY = new Date().toISOString().slice(0, 10)

const CORE = TERMS.map((t) => ({ ...t, kind: 'term' }))
const ALL = [...CORE, ...SHISHEN, ...RIZHU]

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const baseName = (s) => s.split('（')[0].split('(')[0].trim()

const STYLE = `
:root{--paper:#ece5d6;--ink:#211d18;--soft:#5a5246;--jade:#4c6b5e;--seal:#9e342a}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:"Noto Serif SC",Georgia,serif;line-height:1.75;-webkit-font-smoothing:antialiased}
.wrap{max-width:720px;margin:0 auto;padding:28px 20px 60px}
a{color:var(--jade);text-decoration:none}
header{display:flex;align-items:center;gap:10px;padding-bottom:18px;border-bottom:1px solid rgba(33,29,24,.12);margin-bottom:24px}
.seal{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:7px;background:var(--seal);color:#f3ece1;font-weight:700;font-size:20px}
.brand{font-weight:700;font-size:18px;letter-spacing:.04em}
.brand small{display:block;font-size:10px;letter-spacing:.3em;color:var(--soft);font-weight:400}
.crumb{font-size:13px;color:var(--soft);margin-bottom:14px}
h1{font-size:34px;margin:.2em 0 .1em}
h2.sec{font-size:20px;margin:32px 0 10px;border-bottom:1px solid rgba(33,29,24,.12);padding-bottom:6px}
.en{color:var(--soft);font-size:16px;margin-bottom:18px}
.def{font-size:17px;margin:18px 0}
.box{background:rgba(76,107,94,.08);border-radius:12px;padding:16px 18px;margin:18px 0}
.box .lab{font-size:12px;letter-spacing:.2em;color:var(--jade);margin-bottom:6px}
.src{font-size:13px;color:var(--soft)}
.cta{display:inline-block;margin:22px 0;background:var(--ink);color:var(--paper);padding:12px 26px;border-radius:999px;font-size:15px}
.more{margin-top:32px;padding-top:20px;border-top:1px solid rgba(33,29,24,.12)}
.more h2{font-size:15px;color:var(--soft);font-weight:600;letter-spacing:.05em}
.more a{display:inline-block;margin:4px 10px 4px 0;font-size:14px}
.ensec{margin-top:28px;padding-top:18px;border-top:1px solid rgba(33,29,24,.12);color:var(--soft);font-size:14px}
ul.list{list-style:none;padding:0}
ul.list li{margin:14px 0}
footer{margin-top:40px;font-size:12px;color:var(--soft);text-align:center}
`

function head(title, desc, url) {
  return `<!doctype html><html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">
<style>${STYLE}</style></head><body><div class="wrap">
<header><a class="seal" href="/">命</a><a href="/" style="color:inherit"><span class="brand">ONEMING<small>一 命</small></span></a></header>`
}
const FOOT = `<footer>一命二运三风水，四积阴德五读书 · <a href="/">oneming.net</a><br>传统文化 · 娱乐参考，非命定。</footer></div></body></html>`

function pageTitle(t) {
  if (t.kind === 'rizhu') return `${baseName(t.zh)}日主是什么性格？（${t.en}）- 一命 ONEMING`
  if (t.kind === 'shishen') return `${baseName(t.zh)}是什么意思？十神详解（${t.en}）- 一命 ONEMING`
  return `${baseName(t.zh)}是什么意思？（${t.en}）- 一命 ONEMING`
}

function jsonLd(t, url) {
  const data = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: pageTitle(t), description: t.defZh.slice(0, 110),
    inLanguage: 'zh-CN', mainEntityOfPage: url,
    author: { '@type': 'Organization', name: '一命 ONEMING' },
    publisher: { '@type': 'Organization', name: '一命 ONEMING' },
  }
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
}

function termPage(t) {
  const url = `${BASE}/term/${t.id}/`
  const title = pageTitle(t)
  const desc = t.defZh.slice(0, 80)
  const related = ALL.filter((x) => x.id !== t.id && (x.kind === t.kind || x.kind === 'term')).slice(0, 24)
  const moreLinks = related.map((x) => `<a href="/term/${x.id}/">${esc(baseName(x.zh))}</a>`).join('')
  const h1 = t.kind === 'rizhu' ? `${esc(baseName(t.zh))}日主` : esc(baseName(t.zh))
  return head(title, desc, url) + jsonLd(t, url) + `
<nav class="crumb"><a href="/">首页</a> / <a href="/term/">命理小词典</a> / ${esc(baseName(t.zh))}</nav>
<h1>${h1}</h1>
<div class="en">${esc(t.en)}</div>
<p class="def">${esc(t.defZh)}</p>
<div class="box"><div class="lab">它和别的怎么互动</div>${esc(t.relZh)}</div>
<p class="src">出处：${esc(t.src)}（公有古籍）</p>
<a class="cta" href="/">用一命免费排你的八字 →</a>
<div class="ensec"><strong>${esc(t.en)}</strong> — ${esc(t.defEn)} <em>${esc(t.relEn)}</em></div>
<div class="more"><h2>相关词条</h2>${moreLinks}</div>
` + FOOT
}

function hubPage() {
  const url = `${BASE}/term/`
  const title = '命理小词典 - 八字术语·十神·日主性格全解（公有古籍） - 一命 ONEMING'
  const desc = '日主、十神、五行、旺衰、喜用神，十天干日主性格、正官七杀正印等十神详解——通俗、有源有据，免费，不预测、不改运。'
  const sec = (name, arr) => `<h2 class="sec">${name}</h2><ul class="list">` +
    arr.map((t) => `<li><a href="/term/${t.id}/" style="font-size:18px;font-weight:600">${esc(baseName(t.zh))}</a> <span style="color:var(--soft)">${esc(t.en)}</span><br><span style="color:var(--soft);font-size:14px">${esc(t.defZh.slice(0, 44))}…</span></li>`).join('') + '</ul>'
  return head(title, desc, url) + `
<nav class="crumb"><a href="/">首页</a> / 命理小词典</nav>
<h1>命理小词典</h1>
<div class="en">八字术语 · 十神详解 · 日主性格 · 取自公有古籍</div>
<p class="def">把命盘里会遇到的词，一条条用大白话讲清楚——是什么、它和别的怎么互动、出处在哪。只解释、谈性格倾向，不预测、不改运。</p>
<a class="cta" href="/">用一命免费排你的八字 →</a>
${sec('基础术语', CORE)}
${sec('十神详解', SHISHEN)}
${sec('十天干日主性格', RIZHU)}
` + FOOT
}

// 首页静态化：把 SEO 内容注入到 dist/index.html 的 #root 里（React 挂载时会替换，但原始 HTML 已含内容供爬虫读取）
function injectHome() {
  const file = join(DIST, 'index.html')
  let html = readFileSync(file, 'utf8')
  const featured = ['rizhu', 'wuxing', 'xiyong', 'shenruo', 'jiamu', 'binghuo', 'wutu', 'zhengguan', 'qisha']
    .map((id) => ALL.find((x) => x.id === id)).filter(Boolean)
    .map((x) => `<a href="/term/${x.id}/">${esc(baseName(x.zh))}</a>`).join(' · ')
  const block = `<div style="max-width:680px;margin:0 auto;padding:40px 20px;font-family:'Noto Serif SC',serif;color:#211d18;line-height:1.8">
<h1>一命 ONEMING · 免费八字命盘</h1>
<p>一命是一个免费、好看的八字工具：输入出生信息，本地排出你的四柱八字与五行命盘，并给出基于传统命理（扶抑法）的性格解读。算命永远免费，只供文化欣赏与自我参考，不预测、不改运。</p>
<p>常言道"一命二运三风水，四积阴德五读书"——命排在第一位。先把你天生这副牌排出来看看。</p>
<p>想读懂命盘里的词？看 <a href="/term/">命理小词典</a>：${featured} 等。</p>
</div>`
  html = html.replace('<div id="root"></div>', `<div id="root"><div id="seo-prerender" style="display:none" aria-hidden="true">${block}</div></div>`)
  writeFileSync(file, html, 'utf8')
}

function sitemap() {
  const urls = [`${BASE}/`, `${BASE}/term/`, ...ALL.map((t) => `${BASE}/term/${t.id}/`)]
  const body = urls.map((u) => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

function write(path, content) {
  const full = join(DIST, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content, 'utf8')
}

for (const t of ALL) write(`term/${t.id}/index.html`, termPage(t))
write('term/index.html', hubPage())
write('sitemap.xml', sitemap())
injectHome()
console.log(`[gen-static] 生成 ${ALL.length} 个词条页 + 总览 + sitemap + 首页静态化`)
