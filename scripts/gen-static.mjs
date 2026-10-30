// 构建后生成静态词条页 + 词典总览 + 首页静态化注入 + sitemap（SEO 用）
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TERMS } from '../src/terms.js'
import { SHISHEN, RIZHU } from './seo-data.mjs'
import { LONGFORM, GUIDES } from './seo-content.mjs'
import { BASE, CFG, esc, baseName, head, foot, articleLd, breadcrumbLd, analyticsTags } from './page-kit.mjs'
import { buildGrowth, LEGAL_EN } from './gen-growth.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')

const CORE = TERMS.map((t) => ({ ...t, kind: 'term' }))
const ALL = [...CORE, ...SHISHEN, ...RIZHU]
const FOOT = foot('zh')

// ——— 信任页（用户协议 / 隐私 / AI 说明）———
const LEGAL = [
  {
    id: 'terms', title: '用户协议', desc: '一命 ONEMING 用户协议：服务性质、使用规范与免责说明。',
    body: `
<p class="def">欢迎使用一命（oneming.net）。使用本站即表示你已阅读并同意以下条款。</p>
<h2 class="sec">服务性质</h2>
<p>本站提供基于传统命理文化（八字/四柱）的排盘与性格倾向解读，属于<strong>传统文化与娱乐参考服务</strong>。所有内容仅供文化欣赏与自我反思，<strong>不构成任何预测、承诺或专业建议</strong>，不能替代医疗、法律、投资、心理等专业意见。</p>
<h2 class="sec">使用规范</h2>
<p>请勿将本站内容用于迷信宣传、恐吓他人、诈骗或任何违法用途；请勿以自动化手段批量抓取或滥用本站接口。未满 18 周岁的用户请在监护人指导下使用。</p>
<h2 class="sec">免责说明</h2>
<p>命盘计算基于公开的历法算法，解读基于公有古籍的传统框架（如《渊海子平》《滴天髓》），其准确性与适用性不作任何保证。你基于本站内容作出的任何决定，责任由你自行承担。</p>
<h2 class="sec">变更与联系</h2>
<p>本协议可能不定期更新，更新后在本页公示即生效。</p>`,
  },
  {
    id: 'privacy', title: '隐私说明', desc: '一命 ONEMING 隐私说明：出生信息本地计算、不存储、不追踪。',
    body: `
<p class="def">我们把隐私当作产品设计的一部分，而不是一纸声明。</p>
<h2 class="sec">出生信息：本地计算</h2>
<p>你的出生日期、时间在<strong>你自己的浏览器里</strong>完成排盘计算。本站不要求注册，不建立用户档案，<strong>不在服务器上存储你的出生信息</strong>。</p>
<h2 class="sec">AI 解读：脱敏、无状态</h2>
<p>当生成 AI 文字解读时，发送给文本生成服务的仅是<strong>已脱敏的盘面要素</strong>（如干支、旺衰、喜用等），不包含姓名等身份信息；该请求为无状态处理，<strong>不落库、不保留</strong>。生成的文字会缓存在你自己的浏览器本地，便于下次直接查看。</p>
<h2 class="sec">分享由你决定</h2>
<p>"保存/分享命盘"生成的链接包含出生参数，是否分享、分享给谁，完全由你决定。命盘卡片默认为不含完整八字的"氛围卡"，含完整四柱的"完整卡"需要你主动选择。</p>
<h2 class="sec">统计、Cookie 与广告</h2>
<p>本站托管于 Cloudflare，可能产生匿名的聚合访问统计（如访问量），不涉及你的出生信息。${CFG.ga4Id ? '我们使用 Google Analytics 统计页面访问和按钮点击（只记录事件名称，不记录出生日期或时间），它会使用 Cookie。' : ''}${CFG.adsenseClient ? '部分知识页面展示 Google AdSense 广告。Google 等第三方供应商会使用 Cookie，根据你过去访问本站或其他网站的情况投放广告；你可以在 <a href="https://adssettings.google.com">Google 广告设置</a>中关闭个性化广告。排盘工具页面不展示广告。' : ''}</p>`,
  },
  {
    id: 'ai-notice', title: 'AI 生成说明', desc: '一命 ONEMING AI 生成说明：哪些内容由 AI 辅助生成，以及我们的约束方式。',
    body: `
<p class="def">诚实地说明：本站哪些内容与 AI 有关、我们怎么约束它。</p>
<h2 class="sec">哪些是确定性计算</h2>
<p>四柱排盘、五行统计、旺衰判定、喜用推导，均为<strong>确定性规则计算</strong>（基于公开历法与传统扶抑法），同样的输入永远得到同样的结果，与 AI 无关。</p>
<h2 class="sec">哪些由 AI 辅助</h2>
<p>命盘解读中的"文字表达"由 AI 模型基于上述计算结果润色生成。AI <strong>只负责措辞，不产生新的命理结论</strong>：它只能使用引擎给定的盘面事实，且被明确禁止输出运势预测、吉凶断言与改运暗示；输出还会经过独立的合规过滤，不合格则回退为固定文案。</p>
<h2 class="sec">词条内容</h2>
<p>命理小词典的词条基于公有古籍（《渊海子平》《滴天髓》《三命通会》等）的传统框架，以现代语言原创撰写，并标注出处。</p>
<h2 class="sec">一句话</h2>
<p>计算是规则的，措辞可能是 AI 的，红线是写死的：<strong>只谈性格倾向，不预测、不改运。</strong></p>`,
  },
]

function legalPage(p) {
  const url = `${BASE}/${p.id}/`
  const title = `${p.title} - 一命 ONEMING`
  return head(title, p.desc, url, { alt: { zh: url, en: `${BASE}/en/${p.id}/` } }) + `
<nav class="crumb"><a href="/">首页</a> / ${esc(p.title)}</nav>
<h1>${esc(p.title)}</h1>
${p.body}
<a class="cta" href="/">返回首页 →</a>
` + FOOT
}

// ——— 母题页：一命二运三风水 ———
function proverbPage() {
  const url = `${BASE}/yiming-eryun-san-fengshui/`
  const title = '一命二运三风水是什么意思？和八字命盘有什么关系 - 一命 ONEMING'
  const desc = '"一命二运三风水，四积阴德五读书"逐句解释：一命指出生时间形成的八字命盘，二运指大运流年的阶段变化，三风水指环境影响，四五指后天的行为与修养。看懂这句话，就看懂了传统命理的整体框架。'
  const ld = articleLd({ title, description: desc, url })
  return head(title, desc, url, { ads: true }) + ld + `
<nav class="crumb"><a href="/">首页</a> / 一命二运三风水</nav>
<h1>一命二运三风水是什么意思？</h1>
<div class="en">和八字命盘有什么关系</div>
<p class="def">"一命二运三风水，四积阴德五读书"是流传很广的一句民间总结，常被认为化自明清命理著述的观念。它把影响一个人一生的因素，按传统的看法排了个序。逐句拆开看，其实是一套很完整的人生观框架——前一半讲"天生与环境"，后一半讲"后天与自己"。</p>

<h2 class="sec">一命：出生时间形成的八字命盘</h2>
<p>"命"指你出生那一刻的年、月、日、时，按干支历记下来，就是四组干支、八个字——即<a href="/term/bazi/">八字</a>，又称<a href="/term/sizhu/">四柱</a>。传统命理认为，这八个字构成一个人的"先天底盘"：<a href="/term/wuxing/">五行</a>的多寡、<a href="/term/rizhu/">日主</a>的强弱，勾勒出天生的性格质地与行事倾向。命排在第一位，说的是"先天这副牌"是一切的起点——但请注意，是起点，不是终点。</p>

<h2 class="sec">二运：大运与流年，人生的阶段变化</h2>
<p>"运"指大运与流年。同样一副牌，在不同阶段的"外部节奏"里，打法与体感并不一样——传统命理用十年一换的"大运"和逐年的"流年"来描述这种阶段感。俗话说"命好不如运好"，讲的就是静态的盘面之外，还有动态的时机。一命目前专注把"命"这一层（排盘与解读）做透，运的部分作为文化概念供你了解。</p>

<h2 class="sec">三风水：环境对人的影响</h2>
<p>"风水"讲的是环境：居所、方位、气候、你身边围绕的人与物。抛开玄学外衣，它的内核是朴素的——环境确实塑造人。传统排序把它放在命与运之后，意思是：环境有影响，但不如先天禀赋与时机来得根本。</p>

<h2 class="sec">四积阴德、五读书：后天的行为与修养</h2>
<p>这句常被忽略的后半段，恰恰是整句话的点睛：积阴德是你怎么待人处事，读书是你怎么提升自己。前三样多少带着"给定"的成分，后两样完全握在自己手里。古人把它们列进同一个序列，本身就在说：<strong>命不是全部，人的努力在这个框架里占有正式的位置。</strong></p>

<h2 class="sec">这句话和你的命盘是什么关系</h2>
<p>一命（oneming.net）取名就来自这句话的第一个词。我们的立场也和这句话的完整语义一致：排出你的八字命盘，解释<a href="/term/rizhu/">日主</a>、<a href="/term/xiyong/">喜用神</a>、<a href="/term/qisha/">七杀</a>这些术语，帮你看懂"天生这副牌"长什么样——但怎么打，是"四积阴德五读书"的事，在你自己。所以我们只谈性格倾向，不预测吉凶，不搞改运。</p>

<a class="cta" href="/">输入生辰，先看懂你的"一命" →</a>
<div class="more"><h2>相关词条</h2><a href="/term/bazi/">八字</a><a href="/term/sizhu/">四柱</a><a href="/term/rizhu/">日主</a><a href="/term/wuxing/">五行</a><a href="/term/xiyong/">喜用神</a><a href="/term/shenqiang/">身强</a><a href="/term/shenruo/">身弱</a></div>
` + FOOT
}

function pageTitle(t) {
  if (t.kind === 'rizhu') return `${baseName(t.zh)}日主是什么性格？（${t.en}）- 一命 ONEMING`
  if (t.kind === 'shishen') return `${baseName(t.zh)}是什么意思？十神详解（${t.en}）- 一命 ONEMING`
  return `${baseName(t.zh)}是什么意思？（${t.en}）- 一命 ONEMING`
}

function renderLongform(content) {
  const toc = content.sections.map((section) =>
    `<a href="#${esc(section.id)}">${esc(section.title)}</a>`
  ).join('')

  const sections = content.sections.map((section) => `
<section class="article">
  <h2 class="sec" id="${esc(section.id)}">${esc(section.title)}</h2>
  ${section.body}
</section>`).join('')

  const faqs = (content.faqs || []).map((faq) => `
<div class="faq-item">
  <h3>${esc(faq.question)}</h3>
  <p>${faq.answer}</p>
</div>`).join('')

  const sources = (content.sources || []).map((source) => `<li>${esc(source)}</li>`).join('')

  return `
<p class="def">${esc(content.summary)}</p>
<nav class="toc" aria-label="文章目录"><strong>本文目录</strong>${toc}</nav>
${sections}
<a class="cta" href="/">免费排盘，查看我的命盘术语 →</a>
${faqs ? `<section class="faq"><h2 class="sec">常见问题</h2>${faqs}</section>` : ''}
${sources ? `<aside class="sources"><h2>参考与出处</h2><ul>${sources}</ul><p class="src">以上为传统文化资料的现代整理，不构成预测或现实决策建议。</p></aside>` : ''}
`
}

function termPage(t) {
  const url = `${BASE}/term/${t.id}/`
  const content = LONGFORM[t.id]
  const title = content?.title || pageTitle(t)
  const desc = content?.description || t.defZh.slice(0, 80)
  const relatedIds = content?.related || []
  const related = relatedIds.length
    ? relatedIds.map((id) => ALL.find((x) => x.id === id)).filter(Boolean)
    : ALL.filter((x) => x.id !== t.id && (x.kind === t.kind || x.kind === 'term')).slice(0, 24)
  const moreLinks = related.map((x) => `<a href="/term/${x.id}/">${esc(baseName(x.zh))}</a>`).join('')
  const h1 = content?.h1 || (t.kind === 'rizhu' ? `${esc(baseName(t.zh))}日主` : esc(baseName(t.zh)))
  const ld = articleLd({
    title,
    description: desc,
    url,
    updatedAt: content?.updatedAt,
  }) + breadcrumbLd([
    { name: '首页', item: `${BASE}/` },
    { name: '命理小词典', item: `${BASE}/term/` },
    { name: baseName(t.zh), item: url },
  ])

  const main = content ? renderLongform(content) : `
<p class="def">${esc(t.defZh)}</p>
<div class="box"><div class="lab">它和别的怎么互动</div>${esc(t.relZh)}</div>
<p class="src">出处：${esc(t.src)}（公有古籍）</p>
<a class="cta" href="/">用一命免费排你的八字 →</a>`

  return head(title, desc, url, { ads: true, alt: { zh: url, en: `${BASE}/en/term/${t.id}/` } }) + ld + `
<nav class="crumb"><a href="/">首页</a> / <a href="/term/">命理小词典</a> / ${esc(baseName(t.zh))}</nav>
<h1>${h1}</h1>
<div class="en">${esc(t.en)}</div>
${main}
<div class="ensec"><strong>${esc(t.en)}</strong> — ${esc(t.defEn)} <em>${esc(t.relEn)}</em></div>
<div class="more"><h2>相关词条</h2>${moreLinks}</div>
` + FOOT
}

function guidePage(g) {
  const url = `${BASE}${g.path}`
  const ld = articleLd({
    title: g.title,
    description: g.description,
    url,
    updatedAt: g.updatedAt,
  }) + breadcrumbLd([
    { name: '首页', item: `${BASE}/` },
    { name: '命理小词典', item: `${BASE}/term/` },
    { name: g.h1.replace(/[？?]$/, ''), item: url },
  ])

  const related = (g.related || []).map((item) =>
    `<a href="${item.href}">${esc(item.label)}</a>`
  ).join('')

  return head(g.title, g.description, url, { ads: true }) + ld + `
<nav class="crumb"><a href="/">首页</a> / <a href="/term/">命理小词典</a> / ${esc(g.h1.replace(/[？?]$/, ''))}</nav>
<h1>${esc(g.h1)}</h1>
<div class="kicker">${esc(g.kicker || '')}</div>
${renderLongform(g)}
<div class="more"><h2>十神词条</h2>${related}</div>
` + FOOT
}

function hubPage() {
  const url = `${BASE}/term/`
  const title = '命理小词典 - 八字术语·十神·日主性格全解（公有古籍） - 一命 ONEMING'
  const desc = '日主、十神、五行、旺衰、喜用神，十天干日主性格、正官七杀正印等十神详解——通俗、有源有据，免费，不预测、不改运。'
  const sec = (name, arr) => `<h2 class="sec">${name}</h2><ul class="list">` +
    arr.map((t) => `<li><a href="/term/${t.id}/" style="font-size:18px;font-weight:600">${esc(baseName(t.zh))}</a> <span style="color:var(--soft)">${esc(t.en)}</span><br><span style="color:var(--soft);font-size:14px">${esc(t.defZh.slice(0, 44))}…</span></li>`).join('') + '</ul>'
  return head(title, desc, url, { ads: true, alt: { zh: url, en: `${BASE}/en/term/` } }) + `
<nav class="crumb"><a href="/">首页</a> / 命理小词典</nav>
<h1>命理小词典</h1>
<div class="en">八字术语 · 十神详解 · 日主性格 · 取自公有古籍</div>
<p class="def">把命盘里会遇到的词，一条条用大白话讲清楚——是什么、它和别的怎么互动、出处在哪。只解释、谈性格倾向，不预测、不改运。</p>
<a class="cta" href="/">用一命免费排你的八字 →</a>
<h2 class="sec">深度指南</h2>
<ul class="list">${GUIDES.map((g) => `<li><a href="${g.path}" style="font-size:18px;font-weight:600">${esc(g.h1.replace(/[？?]$/, ''))}</a><br><span style="color:var(--soft);font-size:14px">${esc(g.description.slice(0, 62))}…</span></li>`).join('')}</ul>
${sec('基础术语', CORE)}
${sec('十神详解', SHISHEN)}
${sec('十天干日主性格', RIZHU)}
` + FOOT
}

function write(path, content) {
  const full = join(DIST, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content, 'utf8')
}

// ——— 首页（中文 / 英文两个入口）———
// 1) 注入结构化数据与统计；2) 在 #root 里放一段可抓取的静态导航（React 挂载后会替换掉，对用户不可见差异）
function homeStatic(lang) {
  if (lang === 'en') {
    return `<main style="max-width:720px;margin:0 auto;padding:40px 20px;font-family:Georgia,serif;color:#211d18">
<h1>Free BaZi Calculator — Four Pillars chart with every term explained</h1>
<p>Enter your birth date and time to get your Four Pillars of Destiny (BaZi), Five Elements balance and Ten Gods — plus plain-English explanations of every term. Calculated in your browser. No predictions, no fate-changing.</p>
<p><a href="/en/term/">BaZi glossary</a> · <a href="/en/chinese-zodiac/">Chinese zodiac by year</a> · <a href="/en/2027-year-of-the-fire-goat/">2027 Year of the Fire Goat</a> · <a href="/en/five-element-colors/">Five Element colors</a> · <a href="/">中文版</a></p>
</main>`
  }
  return `<main style="max-width:720px;margin:0 auto;padding:40px 20px;font-family:serif;color:#211d18">
<h1>一命二运三风水 · 免费八字排盘，看懂你的命盘</h1>
<p>输入出生时间，免费排出四柱八字、五行分布与十神关系，并解释命盘里出现的每一个专业术语。在浏览器本地计算，不注册、不存储；只谈性格倾向，不预测吉凶、不改运。</p>
<p><a href="/term/">命理小词典</a> · <a href="/guide/shishen/">十神详解</a> · <a href="/shengxiao/">十二生肖与年份查询</a> · <a href="/2027-huoyang/">2027 丁未火羊年</a> · <a href="/wuxing-colors/">五行配色</a> · <a href="/en/">English</a></p>
</main>`
}

function injectHome() {
  const file = join(DIST, 'index.html')
  const src = readFileSync(file, 'utf8')
  const org = { '@context': 'https://schema.org', '@type': 'Organization', name: '一命 ONEMING', url: `${BASE}/`, logo: `${BASE}/share-cover.png`, sameAs: ['https://github.com/xcatea/oneming'] }
  const siteZh = { '@context': 'https://schema.org', '@type': 'WebSite', name: '一命 ONEMING', alternateName: 'oneming', url: `${BASE}/`, inLanguage: 'zh-CN', description: '免费八字排盘与命盘术语解释工具：四柱八字、五行分布、十神关系，并解释命盘中出现的每一个专业术语。' }
  const appEn = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'ONEMING BaZi Calculator', url: `${BASE}/en/`, applicationCategory: 'LifestyleApplication', operatingSystem: 'Any', inLanguage: 'en', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'Free BaZi (Four Pillars) calculator with Five Elements, Ten Gods and every term explained in plain English.' }
  const ldTag = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`

  // 中文首页
  let zh = src.replace('</head>', `${ldTag(org)}\n${ldTag(siteZh)}\n${analyticsTags()}</head>`)
  zh = zh.replace('<div id="root"></div>', `<div id="root">${homeStatic('zh')}</div>`)
  writeFileSync(file, zh, 'utf8')

  // 英文首页 /en/：同一个 App，按路径切英文；改写 head 让它成为独立可收录的英文页
  let en = src
    .replace('<html lang="zh-CN">', '<html lang="en">')
    .replace(/<title>[\s\S]*?<\/title>/, '<title>Free BaZi Calculator · Four Pillars Chart with Every Term Explained | ONEMING</title>')
    .replace(/<meta name="description" content="[^"]*"/, '<meta name="description" content="Free BaZi (Four Pillars of Destiny) calculator: get your Day Master, Five Elements balance and Ten Gods, with every Chinese metaphysics term explained in plain English. No sign-up, no predictions."')
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${BASE}/en/"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${BASE}/en/"`)
    .replace(/<meta property="og:title" content="[^"]*"/, '<meta property="og:title" content="Free BaZi Calculator — every term in your chart explained"')
    .replace(/<meta property="og:description" content="[^"]*"/, '<meta property="og:description" content="Your Four Pillars, Five Elements and Ten Gods, explained in plain English. Free forever."')
    .replace(/<meta name="twitter:title" content="[^"]*"/, '<meta name="twitter:title" content="Free BaZi Calculator — every term in your chart explained"')
    .replace(/<meta name="twitter:description" content="[^"]*"/, '<meta name="twitter:description" content="Your Four Pillars, Five Elements and Ten Gods, explained in plain English. Free forever."')
    .replace('<meta property="og:site_name" content="一命 ONEMING" />', '<meta property="og:site_name" content="ONEMING" />')
  en = en.replace('</head>', `${ldTag(org)}\n${ldTag(appEn)}\n${analyticsTags()}</head>`)
  en = en.replace('<div id="root"></div>', `<div id="root">${homeStatic('en')}</div>`)
  write('en/index.html', en)
}

function sitemap(urls) {
  const today = new Date().toISOString().slice(0, 10)
  const body = urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

for (const t of ALL) write(`term/${t.id}/index.html`, termPage(t))
for (const g of GUIDES) write(`${g.path.replace(/^\//, '')}index.html`, guidePage(g))
write('term/index.html', hubPage())
for (const p of LEGAL) write(`${p.id}/index.html`, legalPage(p))
write('yiming-eryun-san-fengshui/index.html', proverbPage())
injectHome()

// 增长页：英文版、生肖、年份、2027 专题、五行配色
const growth = buildGrowth({ write, ALL, GUIDES })

// ads.txt（配置了 AdSense 才生成）
if (CFG.adsenseClient) {
  write('ads.txt', `google.com, ${CFG.adsenseClient.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`)
}

const urls = [
  `${BASE}/`, `${BASE}/en/`, `${BASE}/term/`, `${BASE}/yiming-eryun-san-fengshui/`,
  ...ALL.map((t) => `${BASE}/term/${t.id}/`),
  ...GUIDES.map((g) => `${BASE}${g.path}`),
  ...LEGAL.map((p) => `${BASE}/${p.id}/`),
  ...LEGAL_EN.map((p) => `${BASE}/en/${p.id}/`),
  ...growth.urls,
]
write('sitemap.xml', sitemap([...new Set(urls)]))
console.log(`[gen-static] 词条 ${ALL.length} + 指南 ${GUIDES.length} + 信任页 ${LEGAL.length}×2 + 增长页 ${growth.urls.length}，sitemap 共 ${new Set(urls).size} 条`)
