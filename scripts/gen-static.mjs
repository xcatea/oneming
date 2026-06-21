// 构建后生成静态词条页 + 词典总览 + sitemap（SEO 用）
// 由 package.json 的 build 脚本在 `vite build` 之后调用，写入 dist/
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TERMS } from '../src/terms.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')
const BASE = 'https://oneming.net'
const TODAY = new Date().toISOString().slice(0, 10)

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

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

// 词条页
function termPage(term) {
  const url = `${BASE}/term/${term.id}/`
  const title = `${term.zh}是什么意思？（${term.en}）- 一命 ONEMING`
  const desc = term.defZh.slice(0, 80)
  const others = TERMS.filter((x) => x.id !== term.id)
  const moreLinks = others.map((x) => `<a href="/term/${x.id}/">${esc(x.zh)}</a>`).join('')
  return head(title, desc, url) + `
<nav class="crumb"><a href="/">首页</a> / <a href="/term/">命理小词典</a> / ${esc(term.zh)}</nav>
<h1>${esc(term.zh)}</h1>
<div class="en">${esc(term.en)}</div>
<p class="def">${esc(term.defZh)}</p>
<div class="box"><div class="lab">它和别的怎么互动</div>${esc(term.relZh)}</div>
<p class="src">出处：${esc(term.src)}（公有古籍）</p>
<a class="cta" href="/">用一命免费排你的八字 →</a>
<div class="ensec"><strong>${esc(term.en)}</strong> — ${esc(term.defEn)} <em>${esc(term.relEn)}</em></div>
<div class="more"><h2>更多命理词条</h2>${moreLinks}</div>
` + FOOT
}

// 词典总览页
function indexPage() {
  const url = `${BASE}/term/`
  const title = '命理小词典 - 八字术语解释（公有古籍） - 一命 ONEMING'
  const desc = '日主、十神、五行、旺衰、喜用神…常用八字命理术语的通俗解释，取自公有古籍，免费、不预测、不改运。'
  const list = TERMS.map((t) => `<li style="margin:14px 0"><a href="/term/${t.id}/" style="font-size:18px;font-weight:600">${esc(t.zh)}</a> <span style="color:var(--soft)">${esc(t.en)}</span><br><span style="color:var(--soft);font-size:14px">${esc(t.defZh.slice(0, 46))}…</span></li>`).join('')
  return head(title, desc, url) + `
<nav class="crumb"><a href="/">首页</a> / 命理小词典</nav>
<h1>命理小词典</h1>
<div class="en">八字常用术语 · 通俗解释 · 取自公有古籍</div>
<p class="def">把命盘里会遇到的词，一条条用大白话讲清楚——是什么、它和别的怎么互动、出处在哪。只解释、不预测、不改运。</p>
<a class="cta" href="/">用一命免费排你的八字 →</a>
<ul style="list-style:none;padding:0;margin-top:24px">${list}</ul>
` + FOOT
}

// sitemap
function sitemap() {
  const urls = [
    `${BASE}/`,
    `${BASE}/term/`,
    ...TERMS.map((t) => `${BASE}/term/${t.id}/`),
  ]
  const body = urls.map((u) => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

// 写文件
function write(path, content) {
  const full = join(DIST, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content, 'utf8')
}

let n = 0
for (const term of TERMS) { write(`term/${term.id}/index.html`, termPage(term)); n++ }
write('term/index.html', indexPage())
write('sitemap.xml', sitemap())
console.log(`[gen-static] 生成 ${n} 个词条页 + 词典总览 + sitemap.xml`)
