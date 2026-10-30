// 一命 · 增长页生成：英文词条 / 英文信任页 / 十二生肖 / 年份查询 / 2027 专题 / 五行配色
// 年份数据（干支、纳音、春节、立春）全部在构建时用 lunar-javascript 计算，保证准确。
import { Lunar } from 'lunar-javascript'
import { BASE, esc, baseName, head, foot, articleLd, breadcrumbLd, faqLd, faqHtml, jsonLd } from './page-kit.mjs'
import { ANIMALS, SANHE, LIUHE, LIUCHONG, STEM_EN, BRANCH_EN, YANG_STEMS, ELEMENT_FLAVOR, ELEMENT_COLORS } from './zodiac-data.mjs'
import { GAN_WUXING, ELEMENT_META } from '../src/wuxing.js'
import { MONETIZE, SITE } from '../src/site.config.js'

const YEAR_FROM = 1930
const YEAR_TO = 2035

const EL_ZH = (e) => ELEMENT_META[e].zh
const EL_EN = (e) => ELEMENT_META[e].en
const animalByZhi = Object.fromEntries(ANIMALS.map((a) => [a.zhi, a]))
const animalById = Object.fromEntries(ANIMALS.map((a) => [a.id, a]))

const NAYIN_EN = {
  海中金: 'Gold in the Sea', 炉中火: 'Fire in the Furnace', 大林木: 'Wood of the Great Forest', 路旁土: 'Earth by the Roadside',
  剑锋金: 'Metal of the Sword Blade', 山头火: 'Fire on the Mountain', 涧下水: 'Water in the Ravine', 城头土: 'Earth on the City Wall',
  白蜡金: 'White Wax Metal', 杨柳木: 'Willow Wood', 泉中水: 'Water in the Spring', 屋上土: 'Earth on the Roof',
  霹雳火: 'Thunderbolt Fire', 松柏木: 'Pine and Cypress Wood', 长流水: 'Long-Flowing Water', 沙中金: 'Gold in the Sand',
  山下火: 'Fire at the Foot of the Mountain', 平地木: 'Wood of the Plain', 壁上土: 'Earth on the Wall', 金箔金: 'Gold Leaf Metal',
  覆灯火: 'Lamp Fire', 天河水: 'Water of the Heavenly River', 大驿土: 'Earth of the Great Post Road', 钗钏金: 'Hairpin and Bracelet Metal',
  桑柘木: 'Mulberry Wood', 大溪水: 'Water of the Great Stream', 沙中土: 'Earth in the Sand', 天上火: 'Fire in the Sky',
  石榴木: 'Pomegranate Wood', 大海水: 'Water of the Great Sea',
}
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const pad = (n) => String(n).padStart(2, '0')
const dZh = (s) => `${s.getYear()}年${s.getMonth()}月${s.getDay()}日`
const dEn = (s) => `${MONTHS_EN[s.getMonth() - 1]} ${s.getDay()}, ${s.getYear()}`
const tHm = (s) => `${pad(s.getHour())}:${pad(s.getMinute())}`
const ymd = (s) => `${s.getYear()}-${pad(s.getMonth())}-${pad(s.getDay())}`

// 年份信息（农历年 Y）
const YEAR_CACHE = new Map()
function yearInfo(Y) {
  if (YEAR_CACHE.has(Y)) return YEAR_CACHE.get(Y)
  const l = Lunar.fromYmd(Y, 1, 1)
  const cny = l.getSolar()
  const end = Lunar.fromYmd(Y + 1, 1, 1).getSolar().next(-1)
  const gz = l.getYearInGanZhi()
  const gan = gz[0]
  const zhi = gz[1]
  const lichun = l.getJieQiTable()['立春']
  const info = {
    Y, gz, gan, zhi, cny, end, lichun,
    nayin: l.getYearNaYin(),
    el: GAN_WUXING[gan],
    yang: YANG_STEMS.includes(gan),
    animal: animalByZhi[zhi],
  }
  YEAR_CACHE.set(Y, info)
  return info
}
const yearsOf = (animal) => {
  const out = []
  for (let Y = YEAR_FROM; Y <= YEAR_TO; Y++) if (yearInfo(Y).zhi === animal.zhi) out.push(yearInfo(Y))
  return out
}

const nameZh = (y) => `${EL_ZH(y.el)}${y.animal.zh}`
const nameEn = (y) => `${EL_EN(y.el)} ${y.animal.en}`

const hrefZh = { animal: (a) => `/shengxiao/${a.id}/`, year: (Y) => `/shengxiao/${Y}/` }
const hrefEn = { animal: (a) => `/en/chinese-zodiac/${a.id}/`, year: (Y) => `/en/chinese-zodiac/${Y}/` }

function relationsOf(a) {
  const sh = SANHE.find((g) => g.zhis.includes(a.zhi))
  const lh = LIUHE.find((p) => p.includes(a.zhi))
  const lc = LIUCHONG.find((p) => p.includes(a.zhi))
  return {
    sanhe: sh.zhis.filter((z) => z !== a.zhi).map((z) => animalByZhi[z]),
    sanheEl: sh.el,
    liuhe: animalByZhi[lh.find((z) => z !== a.zhi)],
    chong: animalByZhi[lc.find((z) => z !== a.zhi)],
  }
}

// —— 生肖速查小工具（纯前端、无依赖；春节日期在构建时算好内联）——
function lookupWidget(lang) {
  const data = []
  for (let Y = YEAR_FROM - 1; Y <= YEAR_TO; Y++) {
    const y = yearInfo(Y)
    data.push([ymd(y.cny), Y, y.animal.id, lang === 'en' ? `${nameEn(y)} (${y.gz})` : `${y.gz} ${nameZh(y)}`, lang === 'en' ? y.animal.en : y.animal.zh])
  }
  const t = lang === 'en'
    ? { lab: 'Enter your birth date', btn: 'Find my animal', res: 'You are a', yr: 'See your year', range: `Supports ${YEAR_FROM}–${YEAR_TO}.` }
    : { lab: '输入公历生日', btn: '查生肖', res: '你属', yr: '查看这一年', range: `支持 ${YEAR_FROM}—${YEAR_TO} 年。` }
  const base = lang === 'en' ? '/en/chinese-zodiac/' : '/shengxiao/'
  return `<div class="box" id="zodiac-lookup"><div class="lab">${t.lab}</div>
<form onsubmit="return zl(event)" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
<input type="date" id="zl-d" required min="${YEAR_FROM}-01-01" max="${YEAR_TO}-12-31" value="1990-06-15" style="padding:8px 10px;border:1px solid rgba(33,29,24,.2);border-radius:8px;background:rgba(255,255,255,.6);font:inherit">
<button style="padding:9px 18px;border:0;border-radius:999px;background:#4c6b5e;color:#ece5d6;font:inherit;cursor:pointer">${t.btn}</button></form>
<p id="zl-r" style="margin:10px 0 0;font-size:17px"></p><p class="src" style="margin:4px 0 0">${t.range}</p></div>
<script>var ZD=${JSON.stringify(data)};function zl(e){e.preventDefault();var v=document.getElementById('zl-d').value,h=null;for(var i=0;i<ZD.length;i++){if(ZD[i][0]<=v)h=ZD[i];else break}var r=document.getElementById('zl-r');if(!h){r.textContent='';return false}r.innerHTML='${t.res} <strong>'+h[4]+'</strong> · '+h[3]+' · <a href="${base}'+h[2]+'/">'+h[4]+' →</a>'+(h[1]>=${YEAR_FROM}?' · <a href="${base}'+h[1]+'/">${t.yr} '+h[1]+' →</a>':'');if(window.gtag)gtag('event','zodiac_lookup',{lang:'${lang}'});return false}</script>`
}

// ================= 生肖总览 =================
function zodiacHubZh() {
  const url = `${BASE}/shengxiao/`
  const title = '十二生肖年份对照表 · 生肖查询（1930—2035）与属相性格 - 一命 ONEMING'
  const desc = '十二生肖年份对照表：输入生日查属相，按春节准确换年；每个年份的干支、五行、纳音一目了然，附十二生肖性格与三合、六合、六冲关系。'
  const faqs = [
    { q: '生肖是按春节还是立春换的？', a: '民俗上生肖按农历春节（正月初一）更换；八字排盘里的年柱则以立春为界。两者通常相差几天，生日落在春节和立春之间的人要特别留意——民俗生肖和八字年柱可能不一样。' },
    { q: '1月份出生的人属什么？', a: '公历 1 月出生的人几乎都还没到春节，按民俗属上一年的生肖。例如 1990 年 1 月 15 日出生属蛇，而不是马。用上面的速查工具输入生日即可准确判断。' },
    { q: '"金马""火羊"这种说法是怎么来的？', a: '取的是当年天干的五行：甲乙为木、丙丁为火、戊己为土、庚辛为金、壬癸为水。2026 年丙午，丙属火，所以叫火马；2027 年丁未，叫火羊。' },
  ]
  const grid = ANIMALS.map((a) => {
    const r = relationsOf(a)
    return `<a href="${hrefZh.animal(a)}"><strong>${a.zh} · ${a.zhi}</strong><small>${EL_ZH(a.el)} · 三合${r.sanhe.map((x) => x.zh).join('')}</small></a>`
  }).join('')
  const rows = ANIMALS.map((a) => `<tr><td><a href="${hrefZh.animal(a)}"><strong>${a.zh}</strong></a></td><td>${yearsOf(a).map((y) => `<a href="${hrefZh.year(y.Y)}">${y.Y}</a>`).join(' ')}</td></tr>`).join('')
  return head(title, desc, url, { ads: true, alt: { zh: url, en: `${BASE}/en/chinese-zodiac/` } }) + articleLd({ title, description: desc, url }) + faqLd(faqs) + `
<nav class="crumb"><a href="/">首页</a> / 十二生肖</nav>
<h1>十二生肖年份对照表</h1>
<div class="en">生肖查询 · 属相性格 · 干支纳音</div>
<p class="def">十二生肖对应十二地支：子鼠、丑牛、寅虎、卯兔、辰龙、巳蛇、午马、未羊、申猴、酉鸡、戌狗、亥猪。下面可以按生日查属相（按春节准确换年），也可以点开任一年份，看当年的干支、五行和纳音。</p>
${lookupWidget('zh')}
<h2 class="sec">十二生肖</h2>
<div class="grid12">${grid}</div>
<h2 class="sec">生肖年份表（${YEAR_FROM}—${YEAR_TO}）</h2>
<div class="table-wrap"><table><thead><tr><th>生肖</th><th>年份（点击查看当年干支、纳音、春节与立春）</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="note">生肖是民俗文化，性格描述是传统印象，不是对个人的判断。想看更细的个人特质，要看完整的四柱八字——年柱只是八个字里的两个。</p>
<a class="cta" href="/">免费排完整八字 →</a><a class="cta alt" href="/2027-huoyang/">2027 丁未火羊年 →</a>
${faqHtml(faqs)}
` + foot('zh')
}

function zodiacHubEn() {
  const url = `${BASE}/en/chinese-zodiac/`
  const title = 'Chinese Zodiac Calculator & Years Chart (1930–2035) | ONEMING'
  const desc = 'What is my Chinese zodiac? Enter your birth date — we use the exact Chinese New Year date for every year. See each year’s animal, element, stem-branch and Na Yin, plus all 12 animal personalities and compatibility groups.'
  const faqs = [
    { q: 'Does the Chinese zodiac year start on January 1?', a: 'No. The zodiac animal changes at Chinese New Year, which falls between January 21 and February 20. If you were born in January or early February, you may belong to the previous year’s animal — the calculator above checks the exact date.' },
    { q: 'Why do BaZi charts sometimes show a different year animal?', a: 'Folk custom switches animals at Chinese New Year, but BaZi (Four Pillars) uses Lichun, the "Start of Spring" solar term around February 4. Births between the two dates can have a different year pillar from their folk zodiac animal.' },
    { q: 'What does "Fire Goat" or "Metal Horse" mean?', a: 'The element comes from the year’s Heavenly Stem: Jia/Yi are Wood, Bing/Ding Fire, Wu/Ji Earth, Geng/Xin Metal, Ren/Gui Water. 2026 is Bing-Wu (Fire Horse); 2027 is Ding-Wei (Fire Goat).' },
  ]
  const grid = ANIMALS.map((a) => {
    const r = relationsOf(a)
    return `<a href="${hrefEn.animal(a)}"><strong>${a.en}</strong><small>${a.zh} · ${a.zhi} · ${EL_EN(a.el)} · best with ${r.sanhe.map((x) => x.en).join(' & ')}</small></a>`
  }).join('')
  const rows = ANIMALS.map((a) => `<tr><td><a href="${hrefEn.animal(a)}"><strong>${a.en}</strong></a></td><td>${yearsOf(a).map((y) => `<a href="${hrefEn.year(y.Y)}">${y.Y}</a>`).join(' ')}</td></tr>`).join('')
  return head(title, desc, url, { lang: 'en', ads: true, alt: { zh: `${BASE}/shengxiao/`, en: url } }) + articleLd({ title, description: desc, url, lang: 'en' }) + faqLd(faqs) + `
<nav class="crumb"><a href="/en/">Home</a> / Chinese Zodiac</nav>
<h1>Chinese Zodiac Calculator &amp; Years Chart</h1>
<div class="en">What’s my Chinese zodiac animal? · ${YEAR_FROM}–${YEAR_TO}</div>
<p class="def">The twelve animals follow the twelve Earthly Branches: Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse, Goat, Monkey, Rooster, Dog and Pig. Enter your birth date below — we use the exact Chinese New Year date for every year, so January and February birthdays come out right.</p>
${lookupWidget('en')}
<h2 class="sec">The 12 animals</h2>
<div class="grid12">${grid}</div>
<h2 class="sec">Chinese zodiac years chart</h2>
<div class="table-wrap"><table><thead><tr><th>Animal</th><th>Years (tap for that year’s element, stem-branch, New Year and Lichun dates)</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="note">Zodiac personalities are folk tradition, not a verdict on any individual. For a personal picture you need the full Four Pillars (BaZi) chart — the year is only two of its eight characters.</p>
<a class="cta" href="/en/">Get your free BaZi chart →</a><a class="cta alt" href="/en/2027-year-of-the-fire-goat/">2027 Year of the Fire Goat →</a>
${faqHtml(faqs, 'en')}
` + foot('en')
}

// ================= 单个生肖 =================
function animalPageZh(a) {
  const url = `${BASE}${hrefZh.animal(a)}`
  const r = relationsOf(a)
  const ys = yearsOf(a)
  const title = `属${a.zh}的人性格特点与年份 · 生肖${a.zh}（${a.zhi}）详解 - 一命 ONEMING`
  const desc = `属${a.zh}的年份有哪些？生肖${a.zh}对应地支${a.zhi}、五行${EL_ZH(a.el)}，时辰${a.hour}。${a.traitZh.slice(0, 50)}……附三合、六合、六冲与历年干支纳音表。`
  const faqs = [
    { q: `属${a.zh}的是哪几年？`, a: `近百年属${a.zh}的年份有：${ys.map((y) => y.Y).join('、')}。注意以春节为界，公历 1 月或 2 月初出生的人可能属上一年的生肖。` },
    { q: `属${a.zh}和什么属相最合？`, a: `传统上讲"三合"与"六合"：${a.zh}与${r.sanhe.map((x) => x.zh).join('、')}三合（${r.sanhe.map((x) => x.zhi).join('')}${a.zhi}合${EL_ZH(r.sanheEl)}局），与${r.liuhe.zh}六合；与${r.chong.zh}相冲。这是地支之间的结构关系，用来理解文化说法即可，人与人相处远不止属相。` },
    { q: `${a.zh}年出生是什么五行？`, a: `生肖${a.zh}本身对应地支${a.zhi}，五行属${EL_ZH(a.el)}；但每个${a.zh}年的天干不同，所以有金${a.zh}、木${a.zh}、水${a.zh}、火${a.zh}、土${a.zh}之分，见下方年份表。` },
  ]
  const rows = ys.map((y) => `<tr><td><a href="${hrefZh.year(y.Y)}">${y.Y}</a></td><td>${y.gz}</td><td>${nameZh(y)}</td><td>${y.nayin}</td><td>${dZh(y.cny)}—${dZh(y.end)}</td></tr>`).join('')
  const flavors = ['wood', 'fire', 'earth', 'metal', 'water'].map((e) => `<li><strong>${EL_ZH(e)}${a.zh}</strong>：${ELEMENT_FLAVOR[e].zh}</li>`).join('')
  return head(title, desc, url, { ads: true, alt: { zh: url, en: `${BASE}${hrefEn.animal(a)}` } }) +
    articleLd({ title, description: desc, url }) + faqLd(faqs) +
    breadcrumbLd([{ name: '首页', item: `${BASE}/` }, { name: '十二生肖', item: `${BASE}/shengxiao/` }, { name: `属${a.zh}`, item: url }]) + `
<nav class="crumb"><a href="/">首页</a> / <a href="/shengxiao/">十二生肖</a> / 属${a.zh}</nav>
<h1>属${a.zh}的人</h1>
<div class="en">${a.en} · 地支${a.zhi}</div>
<div class="facts"><div><b>地支</b><span>${a.zhi}</span></div><div><b>五行</b><span>${a.yang ? '阳' : '阴'}${EL_ZH(a.el)}</span></div><div><b>时辰</b><span>${a.hour}</span></div><div><b>三合</b><span>${r.sanhe.map((x) => x.zh).join(' ')}</span></div><div><b>六合</b><span>${r.liuhe.zh}</span></div><div><b>相冲</b><span>${r.chong.zh}</span></div></div>
<h2 class="sec">属${a.zh}的人性格特点</h2>
<p>${a.traitZh}</p>
<p>${a.cultureZh}</p>
<h2 class="sec">不同五行的${a.zh}</h2>
<p>每个${a.zh}年的天干不同，民俗上会再细分五种${a.zh}：</p>
<ul>${flavors}</ul>
<h2 class="sec">属${a.zh}的年份表</h2>
<div class="table-wrap"><table><thead><tr><th>年份</th><th>干支</th><th>俗称</th><th>纳音</th><th>起止（按春节）</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2 class="sec">${a.zh}在八字里</h2>
<p>在八字里，"${a.zhi}"不只出现在年柱。${a.zhi}月是${a.monthZh}，${a.zhi}时是每天的 ${a.hour}。所以一个人即使不属${a.zh}，命盘的月柱、日柱或时柱里也可能有${a.zhi}。生肖只看年支，<a href="/term/sizhu/">四柱</a>要看完整的八个字。</p>
<p class="note">以上是民俗文化中的生肖印象，供了解与娱乐，不是对任何人的判断，也不涉及运势预测。</p>
<a class="cta" href="/">排完整八字，看懂你的命盘 →</a>
${faqHtml(faqs)}
<div class="more"><h2>其他生肖</h2>${ANIMALS.filter((x) => x.id !== a.id).map((x) => `<a href="${hrefZh.animal(x)}">属${x.zh}</a>`).join('')}</div>
` + foot('zh')
}

function animalPageEn(a) {
  const url = `${BASE}${hrefEn.animal(a)}`
  const r = relationsOf(a)
  const ys = yearsOf(a)
  const title = `Year of the ${a.en}: Personality, Years & Compatibility | Chinese Zodiac ${a.en}`
  const desc = `Chinese zodiac ${a.en} (${a.zh}, Earthly Branch ${a.zhi}): personality traits, every ${a.en} year from ${ys[0].Y} to ${ys.at(-1).Y} with its element, best matches (${r.sanhe.map((x) => x.en).join(', ')}, ${r.liuhe.en}) and clash (${r.chong.en}).`
  const faqs = [
    { q: `What years are the Year of the ${a.en}?`, a: `Recent ${a.en} years: ${ys.map((y) => y.Y).join(', ')}. Each starts at Chinese New Year, so if you were born in January or early February, check the exact dates in the table.` },
    { q: `Which signs are most compatible with the ${a.en}?`, a: `Traditionally the ${a.en} forms a "Three Harmony" group with the ${r.sanhe.map((x) => x.en).join(' and ')} (${r.sanhe.map((x) => x.zhi).join('')}${a.zhi}, a ${EL_EN(r.sanheEl)} alliance) and a "Six Harmony" pair with the ${r.liuhe.en}. Its opposite (clash) is the ${r.chong.en}. These are structural relationships between Earthly Branches — fun to know, not rules for real relationships.` },
    { q: `What element is the ${a.en}?`, a: `The ${a.en}’s fixed element is ${a.yang ? 'Yang' : 'Yin'} ${EL_EN(a.el)} (from its branch ${a.zhi}). Each ${a.en} year also has a stem element, which is why there are Wood, Fire, Earth, Metal and Water ${a.en}s.` },
  ]
  const rows = ys.map((y) => `<tr><td><a href="${hrefEn.year(y.Y)}">${y.Y}</a></td><td>${nameEn(y)}</td><td>${y.gz} (${STEM_EN[y.gan]}-${BRANCH_EN[y.zhi]})</td><td>${dEn(y.cny)} – ${dEn(y.end)}</td></tr>`).join('')
  const flavors = ['wood', 'fire', 'earth', 'metal', 'water'].map((e) => `<li><strong>${EL_EN(e)} ${a.en}</strong>: ${ELEMENT_FLAVOR[e].en}</li>`).join('')
  return head(title, desc, url, { lang: 'en', ads: true, alt: { zh: `${BASE}${hrefZh.animal(a)}`, en: url } }) +
    articleLd({ title, description: desc, url, lang: 'en' }) + faqLd(faqs) +
    breadcrumbLd([{ name: 'Home', item: `${BASE}/en/` }, { name: 'Chinese Zodiac', item: `${BASE}/en/chinese-zodiac/` }, { name: a.en, item: url }]) + `
<nav class="crumb"><a href="/en/">Home</a> / <a href="/en/chinese-zodiac/">Chinese Zodiac</a> / ${a.en}</nav>
<h1>Year of the ${a.en}</h1>
<div class="en">${a.zh} · Earthly Branch ${a.zhi} (${BRANCH_EN[a.zhi]})</div>
<div class="facts"><div><b>Branch</b><span>${a.zhi} ${BRANCH_EN[a.zhi]}</span></div><div><b>Fixed element</b><span>${a.yang ? 'Yang' : 'Yin'} ${EL_EN(a.el)}</span></div><div><b>Hour</b><span>${a.hour}</span></div><div><b>Three Harmony</b><span>${r.sanhe.map((x) => x.en).join(', ')}</span></div><div><b>Six Harmony</b><span>${r.liuhe.en}</span></div><div><b>Clash</b><span>${r.chong.en}</span></div></div>
<h2 class="sec">${a.en} personality</h2>
<p>${a.traitEn}</p>
<p>${a.cultureEn}</p>
<h2 class="sec">The five kinds of ${a.en}</h2>
<p>Every ${a.en} year carries a different Heavenly Stem, so tradition distinguishes five types:</p>
<ul>${flavors}</ul>
<h2 class="sec">Year of the ${a.en}: all dates</h2>
<div class="table-wrap"><table><thead><tr><th>Year</th><th>Element animal</th><th>Stem-Branch</th><th>Dates (Chinese New Year to New Year’s Eve)</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2 class="sec">The ${a.en} in a BaZi chart</h2>
<p>The branch ${a.zhi} isn’t only a year sign. The ${a.zhi} month runs ${a.monthEn}, and the ${a.zhi} hour is ${a.hour} every day — so anyone can have a ${a.en} in their month, day or hour pillar. Your zodiac animal is just the year branch; a <a href="/en/term/sizhu/">Four Pillars</a> chart reads all eight characters.</p>
<p class="note">Zodiac personalities are folk tradition for curiosity and fun — not a judgment of anyone and not a forecast.</p>
<a class="cta" href="/en/">Read your full BaZi chart, free →</a>
${faqHtml(faqs, 'en')}
<div class="more"><h2>Other animals</h2>${ANIMALS.filter((x) => x.id !== a.id).map((x) => `<a href="${hrefEn.animal(x)}">${x.en}</a>`).join('')}</div>
` + foot('en')
}

// ================= 年份页 =================
function boundaryZh(y) {
  const prev = yearInfo(y.Y - 1)
  const lcFirst = y.lichun.isBefore(y.cny)
  const lcTxt = `${dZh(y.lichun)} ${tHm(y.lichun)}`
  const p1 = `${y.Y}年1月1日至${dZh(y.cny.next(-1)).replace(`${y.Y}年`, '')}出生的人，按农历仍是${prev.gz}年，生肖属<a href="${hrefZh.animal(prev.animal)}">${prev.animal.zh}</a>，不属${y.animal.zh}。`
  const p2 = lcFirst
    ? `八字排盘以立春为年的分界。${y.Y}年立春在${lcTxt}，比春节早：立春到春节前一天之间出生的人，民俗生肖还是${prev.animal.zh}，但八字年柱已经是${y.gz}。`
    : `八字排盘以立春为年的分界。${y.Y}年立春在${lcTxt}，比春节晚：春节到立春之前出生的人，民俗生肖已经是${y.animal.zh}，但八字年柱仍是${prev.gz}。`
  return { p1, p2 }
}
function boundaryEn(y) {
  const prev = yearInfo(y.Y - 1)
  const lcFirst = y.lichun.isBefore(y.cny)
  const lcTxt = `${dEn(y.lichun)} at ${tHm(y.lichun)} (Beijing time)`
  const p1 = `If you were born between January 1 and ${dEn(y.cny.next(-1)).replace(`, ${y.Y}`, '')}, ${y.Y}, you belong to the previous lunar year (${prev.gz}) — your animal is the <a href="${hrefEn.animal(prev.animal)}">${prev.animal.en}</a>, not the ${y.animal.en}.`
  const p2 = lcFirst
    ? `BaZi uses Lichun (Start of Spring) as the year boundary. In ${y.Y}, Lichun fell on ${lcTxt} — before Chinese New Year. Babies born between Lichun and New Year’s Eve are ${prev.animal.en}s by folk custom, but their BaZi year pillar is already ${y.gz}.`
    : `BaZi uses Lichun (Start of Spring) as the year boundary. In ${y.Y}, Lichun fell on ${lcTxt} — after Chinese New Year. Babies born between New Year and Lichun are ${y.animal.en}s by folk custom, but their BaZi year pillar is still ${prev.gz}.`
  return { p1, p2 }
}

function yearPageZh(Y) {
  const y = yearInfo(Y)
  const a = y.animal
  const url = `${BASE}${hrefZh.year(Y)}`
  const title = `${Y}年属什么生肖？${y.gz}${nameZh(y)}年 · ${y.nayin}命 - 一命 ONEMING`
  const desc = `${Y}年是农历${y.gz}年，生肖属${a.zh}，年干${y.gan}属${y.yang ? '阳' : '阴'}${EL_ZH(y.el)}，俗称"${nameZh(y)}"，纳音${y.nayin}。从${dZh(y.cny)}春节开始，到${dZh(y.end)}结束；立春在${dZh(y.lichun)}。`
  const b = boundaryZh(y)
  const faqs = [
    { q: `${Y}年属${a.zh}是什么命？`, a: `按年柱纳音，${y.gz}年是"${y.nayin}"，所以民间常说${Y}年属${a.zh}是${y.nayin}命。不过纳音只是年柱的一个属性，一个人的五行与性格倾向要看完整的四柱八字。` },
    { q: `${Y}年是${nameZh(y)}还是${y.nayin.slice(-1)}${a.zh}？`, a: `"${nameZh(y)}"取的是年干${y.gan}的五行（${EL_ZH(y.el)}）；"${y.nayin}"是纳音五行（${y.nayin.slice(-1)}）。两种说法看的维度不同，都对，日常说"${nameZh(y)}年"更常见。` },
    { q: `${Y}年1月出生属什么？`, a: `${Y}年春节是${dZh(y.cny)}，在此之前出生的人属上一年的${yearInfo(Y - 1).animal.zh}（${yearInfo(Y - 1).gz}年）。` },
  ]
  const prevY = Y > YEAR_FROM ? `<a href="${hrefZh.year(Y - 1)}">← ${Y - 1}年 ${yearInfo(Y - 1).animal.zh}</a>` : ''
  const nextY = Y < YEAR_TO ? `<a href="${hrefZh.year(Y + 1)}">${Y + 1}年 ${yearInfo(Y + 1).animal.zh} →</a>` : ''
  return head(title, desc, url, { ads: true, alt: { zh: url, en: `${BASE}${hrefEn.year(Y)}` } }) +
    articleLd({ title, description: desc, url }) + faqLd(faqs) +
    breadcrumbLd([{ name: '首页', item: `${BASE}/` }, { name: '十二生肖', item: `${BASE}/shengxiao/` }, { name: `${Y}年`, item: url }]) + `
<nav class="crumb"><a href="/">首页</a> / <a href="/shengxiao/">十二生肖</a> / ${Y}年</nav>
<h1>${Y}年属什么生肖？</h1>
<div class="en">${y.gz}年 · ${nameZh(y)} · ${y.nayin}</div>
<p class="def">${Y}年是农历<strong>${y.gz}年</strong>，生肖属<strong><a href="${hrefZh.animal(a)}">${a.zh}</a></strong>。年干${y.gan}属${y.yang ? '阳' : '阴'}${EL_ZH(y.el)}，所以俗称"${nameZh(y)}年"；纳音为${y.nayin}。</p>
<div class="facts"><div><b>干支</b><span>${y.gz}</span></div><div><b>生肖</b><span>${a.zh}</span></div><div><b>年干五行</b><span>${y.yang ? '阳' : '阴'}${EL_ZH(y.el)}</span></div><div><b>纳音</b><span>${y.nayin}</span></div><div><b>春节</b><span>${y.cny.getMonth()}月${y.cny.getDay()}日</span></div><div><b>立春</b><span>${y.lichun.getMonth()}月${y.lichun.getDay()}日 ${tHm(y.lichun)}</span></div></div>
<h2 class="sec">${y.gz}年从哪天到哪天？</h2>
<p>按民俗，${y.gz}年从<strong>${dZh(y.cny)}</strong>（春节）开始，到<strong>${dZh(y.end)}</strong>（除夕）结束，这期间出生的人属${a.zh}。</p>
<p>${b.p1}</p>
<h2 class="sec">八字里的年柱：以立春为界</h2>
<p>${b.p2}（时间为北京时间）这也是为什么同一年出生的人，用不同工具查到的"年"可能不同。</p>
<h2 class="sec">属${a.zh}的人</h2>
<p>${a.traitZh}</p>
<p>${ELEMENT_FLAVOR[y.el].zh}</p>
<p><a href="${hrefZh.animal(a)}">查看生肖${a.zh}详解、三合六合与全部年份 →</a></p>
<h2 class="sec">六十年一轮</h2>
<p>干支纪年六十年一循环。上一个${y.gz}年是 ${Y - 60} 年，下一个是 ${Y + 60} 年。</p>
<p class="note">生肖与纳音属于民俗文化，供了解与娱乐，不构成预测。想看你自己的日主、五行与十神，请排完整八字。</p>
<a class="cta" href="/">免费排完整八字 →</a>
${faqHtml(faqs)}
<div class="more"><h2>相邻年份</h2>${prevY} ${nextY} <a href="/shengxiao/">全部年份表</a></div>
` + foot('zh')
}

function yearPageEn(Y) {
  const y = yearInfo(Y)
  const a = y.animal
  const url = `${BASE}${hrefEn.year(Y)}`
  const title = `${Y} Chinese Zodiac: Year of the ${nameEn(y)} (${y.gz}) — Dates & Meaning`
  const desc = `${Y} is the Year of the ${nameEn(y)} (${y.gz}, ${STEM_EN[y.gan]}-${BRANCH_EN[y.zhi]}) in the Chinese zodiac. It runs from ${dEn(y.cny)} to ${dEn(y.end)}. Na Yin: ${NAYIN_EN[y.nayin] || y.nayin}. Born in January or February? Check which animal you are.`
  const b = boundaryEn(y)
  const faqs = [
    { q: `What animal is ${Y} in the Chinese zodiac?`, a: `${Y} is the Year of the ${a.en} — specifically the ${nameEn(y)}, because its Heavenly Stem ${y.gan} (${STEM_EN[y.gan]}) is ${y.yang ? 'Yang' : 'Yin'} ${EL_EN(y.el)}. It begins on ${dEn(y.cny)}.` },
    { q: `What if I was born in January ${Y}?`, a: `Chinese New Year ${Y} fell on ${dEn(y.cny)}. Anyone born before that date belongs to the previous year — the ${nameEn(yearInfo(Y - 1))} (${yearInfo(Y - 1).gz}).` },
    { q: `What is the Na Yin element of ${Y}?`, a: `${y.gz} years carry the Na Yin "${y.nayin}" — ${NAYIN_EN[y.nayin] || ''}. Na Yin is a poetic secondary element assigned to each pair of stem-branch years; it’s different from the stem element used in "${nameEn(y)}".` },
  ]
  const prevY = Y > YEAR_FROM ? `<a href="${hrefEn.year(Y - 1)}">← ${Y - 1} ${yearInfo(Y - 1).animal.en}</a>` : ''
  const nextY = Y < YEAR_TO ? `<a href="${hrefEn.year(Y + 1)}">${Y + 1} ${yearInfo(Y + 1).animal.en} →</a>` : ''
  return head(title, desc, url, { lang: 'en', ads: true, alt: { zh: `${BASE}${hrefZh.year(Y)}`, en: url } }) +
    articleLd({ title, description: desc, url, lang: 'en' }) + faqLd(faqs) +
    breadcrumbLd([{ name: 'Home', item: `${BASE}/en/` }, { name: 'Chinese Zodiac', item: `${BASE}/en/chinese-zodiac/` }, { name: String(Y), item: url }]) + `
<nav class="crumb"><a href="/en/">Home</a> / <a href="/en/chinese-zodiac/">Chinese Zodiac</a> / ${Y}</nav>
<h1>${Y} Chinese Zodiac: Year of the ${nameEn(y)}</h1>
<div class="en">${y.gz} · ${STEM_EN[y.gan]}-${BRANCH_EN[y.zhi]} · Na Yin ${y.nayin}</div>
<p class="def">${Y} is the <strong>Year of the <a href="${hrefEn.animal(a)}">${a.en}</a></strong> in the Chinese zodiac. Its stem-branch is <strong>${y.gz}</strong> (${STEM_EN[y.gan]}-${BRANCH_EN[y.zhi]}); the stem ${y.gan} is ${y.yang ? 'Yang' : 'Yin'} ${EL_EN(y.el)}, which makes it a <strong>${nameEn(y)}</strong> year.</p>
<div class="facts"><div><b>Animal</b><span>${a.en}</span></div><div><b>Element</b><span>${y.yang ? 'Yang' : 'Yin'} ${EL_EN(y.el)}</span></div><div><b>Stem-Branch</b><span>${y.gz}</span></div><div><b>Na Yin</b><span>${y.nayin}</span></div><div><b>New Year</b><span>${MONTHS_EN[y.cny.getMonth() - 1].slice(0, 3)} ${y.cny.getDay()}</span></div><div><b>Lichun</b><span>${MONTHS_EN[y.lichun.getMonth() - 1].slice(0, 3)} ${y.lichun.getDay()}, ${tHm(y.lichun)}</span></div></div>
<h2 class="sec">When does the ${Y} zodiac year start and end?</h2>
<p>The ${nameEn(y)} year runs from <strong>${dEn(y.cny)}</strong> (Chinese New Year) to <strong>${dEn(y.end)}</strong> (New Year’s Eve). Everyone born in that window is a ${a.en}.</p>
<p>${b.p1}</p>
<h2 class="sec">BaZi and the Lichun boundary</h2>
<p>${b.p2}</p>
<h2 class="sec">${a.en} personality</h2>
<p>${a.traitEn}</p>
<p>${ELEMENT_FLAVOR[y.el].en}</p>
<p><a href="${hrefEn.animal(a)}">All about the ${a.en}: compatibility and every ${a.en} year →</a></p>
<h2 class="sec">The 60-year cycle</h2>
<p>Stem-branch years repeat every 60 years. The previous ${y.gz} year was ${Y - 60}; the next will be ${Y + 60}.</p>
<p class="note">The zodiac is cultural tradition for curiosity and fun — not a forecast. For your own Day Master, Five Elements and Ten Gods, read your full BaZi chart.</p>
<a class="cta" href="/en/">Free BaZi chart →</a>
${faqHtml(faqs, 'en')}
<div class="more"><h2>Nearby years</h2>${prevY} ${nextY} <a href="/en/chinese-zodiac/">All years</a></div>
` + foot('en')
}

// ================= 2027 丁未火羊专题 =================
function goatYears() {
  return yearsOf(animalById.goat).filter((y) => y.Y < 2027)
}
function fireGoatZh() {
  const y = yearInfo(2027)
  const prev = yearInfo(2026)
  const url = `${BASE}/2027-huoyang/`
  const title = '2027年是什么年？丁未火羊年从哪天开始 · 属羊本命年 - 一命 ONEMING'
  const desc = `2027年是农历丁未年，生肖属羊，丁属阴火，俗称"火羊年"，纳音天河水。丁未年从${dZh(y.cny)}春节开始，到${dZh(y.end)}结束；立春在${dZh(y.lichun)} ${tHm(y.lichun)}。附属羊的年份与本命年民俗。`
  const goats = goatYears()
  const faqs = [
    { q: '2027年是什么羊？', a: '2027年是丁未年。天干丁属阴火，所以叫"火羊"；纳音是天河水，所以也有人说"水命"。两种说法看的维度不同。' },
    { q: '2027年1月出生属什么？', a: `2027年春节在${dZh(y.cny)}。1月1日到${y.cny.getMonth()}月${y.cny.getDay() - 1}日出生的宝宝还属${prev.animal.zh}（${prev.gz}年）。八字年柱则以立春（${y.lichun.getMonth()}月${y.lichun.getDay()}日 ${tHm(y.lichun)}）为界。` },
    { q: '2027年是谁的本命年？', a: `属羊的人：${goats.slice(-6).map((g) => g.Y).join('、')}年出生的人，2027年都是本命年。` },
    { q: '本命年要注意什么？', a: '民俗上本命年有穿红衣、系红绳的习惯，图个喜庆，是一种文化仪式感。它不代表这一年会怎样，开心过就好；也不必为此花钱买所谓"化解"的东西。' },
  ]
  return head(title, desc, url, { ads: true, alt: { zh: url, en: `${BASE}/en/2027-year-of-the-fire-goat/` } }) + articleLd({ title, description: desc, url, updatedAt: '2026-10-30' }) + faqLd(faqs) + `
<nav class="crumb"><a href="/">首页</a> / <a href="/shengxiao/">十二生肖</a> / 2027 丁未火羊年</nav>
<h1>2027年是什么年？丁未火羊年</h1>
<div class="en">${dZh(y.cny)} 起 · 纳音天河水</div>
<p class="def">2027年是农历<strong>丁未年</strong>，生肖属<a href="/shengxiao/goat/">羊</a>。天干"丁"属阴火，地支"未"属土、对应羊，所以俗称<strong>火羊年</strong>。它接在2026年丙午火马年之后，从<strong>${dZh(y.cny)}</strong>（春节）开始。</p>
<div class="facts"><div><b>干支</b><span>丁未</span></div><div><b>生肖</b><span>羊</span></div><div><b>年干</b><span>丁 · 阴火</span></div><div><b>年支</b><span>未 · 阴土</span></div><div><b>纳音</b><span>${y.nayin}</span></div><div><b>春节</b><span>${y.cny.getMonth()}月${y.cny.getDay()}日</span></div></div>
<h2 class="sec">丁未年从哪天到哪天？</h2>
<p>民俗按春节换年：丁未年从 ${dZh(y.cny)} 开始，到 ${dZh(y.end)}（除夕）结束。八字排盘按立春换年：2027年立春在 ${dZh(y.lichun)} ${tHm(y.lichun)}（北京时间），比春节早两天。所以 ${y.lichun.getMonth()}月${y.lichun.getDay()}日立春到${y.cny.getMonth()}月${y.cny.getDay() - 1}日之间出生的宝宝，民俗属马，八字年柱却已是丁未。</p>
<h2 class="sec">"丁未"是什么意思？</h2>
<p><strong>丁</strong>是十天干的第四位，属阴火。传统上用"灯烛之火"来比喻丁火：不像丙火那样是太阳的普照，而是温暖、细致、照亮近处的光。</p>
<p><strong>未</strong>是十二地支的第八位，五行属土，对应夏末（小暑到立秋），是收获之前万物将熟的时段，生肖为羊。</p>
<p>丙午（2026）到丁未（2027），是从"阳火"到"阴火"——如果说火马年的气质是奔放外放，火羊年的文化意象更偏温和、细腻、照顾人。这是文化上的联想，不是对这一年的预测。</p>
<h2 class="sec">纳音"天河水"</h2>
<p>丙午、丁未两年的纳音都是天河水，意象是天上降下的雨露。所以民间说"2027年出生是水命"，指的是纳音；说"火羊"，指的是天干。<a href="/term/nayin/">纳音是什么？</a></p>
<h2 class="sec">属羊的人</h2>
<p>${animalById.goat.traitZh}</p>
<p>属羊的年份：${goats.map((g) => `<a href="${hrefZh.year(g.Y)}">${g.Y}（${nameZh(g)}）</a>`).join('、')}、2027（火羊）。</p>
<h2 class="sec">本命年的民俗</h2>
<p>逢自己生肖的年份叫本命年。民间有穿红衣、系红绳、过年贴红的习惯，寓意喜庆、红火。我们把它看作一种过年的仪式感：喜欢就穿，图个好心情。它不意味着这一年会发生什么，也没有必要为此购买所谓"化解""转运"的商品。</p>
<a class="cta" href="/">排你的完整八字 →</a><a class="cta alt" href="/shengxiao/">查任意年份的生肖 →</a>
${faqHtml(faqs)}
<div class="more"><h2>相关</h2><a href="/shengxiao/goat/">属羊的人</a><a href="/shengxiao/horse/">属马的人</a><a href="/shengxiao/2027/">2027年详情</a><a href="/shengxiao/2026/">2026 丙午火马</a><a href="/wuxing-colors/">五行配色</a></div>
` + foot('zh')
}

function fireGoatEn() {
  const y = yearInfo(2027)
  const prev = yearInfo(2026)
  const url = `${BASE}/en/2027-year-of-the-fire-goat/`
  const title = '2027 Chinese New Year: Year of the Fire Goat — Date, Meaning & Goat Years'
  const desc = `Chinese New Year 2027 falls on ${dEn(y.cny)}, starting the Year of the Fire Goat (Ding-Wei). What "Fire Goat" means, when the year begins and ends, the Lichun boundary, Na Yin, and every Goat year.`
  const goats = goatYears()
  const faqs = [
    { q: 'When is Chinese New Year 2027?', a: `Chinese New Year 2027 is on ${dEn(y.cny)}. The Fire Goat year lasts until ${dEn(y.end)}.` },
    { q: 'Why is 2027 a Fire Goat year?', a: 'Its stem-branch is Ding-Wei (丁未). Ding is Yin Fire; Wei is the Goat branch. The element in the name always comes from the Heavenly Stem.' },
    { q: 'Is a baby born in January 2027 a Goat?', a: `No. Babies born before ${dEn(y.cny)} are still Horses (${prev.gz}, Fire Horse). In BaZi, the year pillar switches at Lichun — ${dEn(y.lichun)} at ${tHm(y.lichun)} Beijing time.` },
    { q: 'What is a "ben ming nian"?', a: `Your ben ming nian (本命年) is a year matching your own animal — in 2027, everyone born in ${goats.slice(-5).map((g) => g.Y).join(', ')}. Folk custom is to wear something red for the festive spirit; it’s a cultural ritual, not a prediction, and there’s no need to buy anything to "fix" it.` },
  ]
  return head(title, desc, url, { lang: 'en', ads: true, alt: { zh: `${BASE}/2027-huoyang/`, en: url } }) + articleLd({ title, description: desc, url, lang: 'en', updatedAt: '2026-10-30' }) + faqLd(faqs) + `
<nav class="crumb"><a href="/en/">Home</a> / <a href="/en/chinese-zodiac/">Chinese Zodiac</a> / 2027 Fire Goat</nav>
<h1>2027: Year of the Fire Goat</h1>
<div class="en">Chinese New Year: ${dEn(y.cny)} · 丁未 Ding-Wei</div>
<p class="def">Chinese New Year 2027 falls on <strong>${dEn(y.cny)}</strong>, opening the <strong>Year of the Fire Goat</strong>. Its stem-branch is 丁未 (Ding-Wei): Ding is Yin Fire, and Wei is the Earthly Branch of the <a href="/en/chinese-zodiac/goat/">Goat</a>. It follows 2026, the Year of the Fire Horse.</p>
<div class="facts"><div><b>Animal</b><span>Goat</span></div><div><b>Stem</b><span>Ding · Yin Fire</span></div><div><b>Branch</b><span>Wei · Yin Earth</span></div><div><b>Na Yin</b><span>${y.nayin}</span></div><div><b>Starts</b><span>Feb ${y.cny.getDay()}, 2027</span></div><div><b>Ends</b><span>${MONTHS_EN[y.end.getMonth() - 1].slice(0, 3)} ${y.end.getDay()}, ${y.end.getYear()}</span></div></div>
<h2 class="sec">When does the Year of the Goat start?</h2>
<p>By folk custom the Goat year runs from ${dEn(y.cny)} to ${dEn(y.end)}. BaZi astrology switches years at Lichun, the Start of Spring — in 2027 that’s ${dEn(y.lichun)} at ${tHm(y.lichun)} Beijing time, two days <em>before</em> New Year. A baby born on February 4 or 5, 2027 is a Horse by custom but already has a Ding-Wei year pillar in BaZi.</p>
<h2 class="sec">What does Ding-Wei mean?</h2>
<p><strong>Ding (丁)</strong>, the fourth Heavenly Stem, is Yin Fire — traditionally pictured as candle or lamp light: not the sun’s blaze, but a warm, focused glow that lights what’s close.</p>
<p><strong>Wei (未)</strong>, the eighth Earthly Branch, is Earth and corresponds to late summer, when crops are ripening before harvest. Its animal is the Goat (also called Sheep or Ram).</p>
<p>From Bing-Wu (2026) to Ding-Wei (2027), the stem moves from Yang Fire to Yin Fire. If the Fire Horse evokes bold, outward energy, the Fire Goat’s imagery is gentler — warmth, care and craft. That’s cultural symbolism, not a forecast.</p>
<h2 class="sec">Na Yin: Water of the Heavenly River</h2>
<p>Bing-Wu and Ding-Wei share the Na Yin "天河水", Water of the Heavenly River — rain falling from the sky. So you may hear 2027 babies called "water" by Na Yin and "fire" by stem; both are traditional, they measure different things. <a href="/en/term/nayin/">What is Na Yin?</a></p>
<h2 class="sec">Goat personality and Goat years</h2>
<p>${animalById.goat.traitEn}</p>
<p>Goat years: ${goats.map((g) => `<a href="${hrefEn.year(g.Y)}">${g.Y} (${nameEn(g)})</a>`).join(', ')}, and 2027 (Fire Goat).</p>
<a class="cta" href="/en/">Get your free BaZi chart →</a><a class="cta alt" href="/en/chinese-zodiac/">Find any year’s animal →</a>
${faqHtml(faqs, 'en')}
<div class="more"><h2>Related</h2><a href="/en/chinese-zodiac/goat/">Year of the Goat</a><a href="/en/chinese-zodiac/horse/">Year of the Horse</a><a href="/en/chinese-zodiac/2027/">2027 details</a><a href="/en/five-element-colors/">Five Element colors</a></div>
` + foot('en')
}

// ================= 五行配色（变现落地页） =================
function colorsPage(lang) {
  const isEn = lang === 'en'
  const url = isEn ? `${BASE}/en/five-element-colors/` : `${BASE}/wuxing-colors/`
  const shop = isEn ? (MONETIZE.shopUrlEn || MONETIZE.shopUrlZh) : (MONETIZE.shopUrlZh || MONETIZE.shopUrlEn)
  const title = isEn ? 'Five Element Colors & Materials: Wood, Fire, Earth, Metal, Water | ONEMING' : '五行对应的颜色与材质 · 喜用神配色参考 - 一命 ONEMING'
  const desc = isEn
    ? 'The traditional Five Element color correspondences — green for Wood, red for Fire, yellow for Earth, white and gold for Metal, black and blue for Water — with materials, directions and seasons, and how to find your favorable element.'
    : '五行对应的颜色：木青绿、火赤红、土黄棕、金白金、水黑蓝，以及对应的方位、季节与常见材质。先排盘看自己的喜用五行，再当作审美参考来搭配。'
  const order = ['wood', 'fire', 'earth', 'metal', 'water']
  const rows = order.map((e) => {
    const c = ELEMENT_COLORS[e]
    const chips = c.hex.map((h) => `<span class="chip" style="background:${h}"></span>`).join('')
    return isEn
      ? `<tr><td><strong style="color:${ELEMENT_META[e].color}">${EL_EN(e)}</strong> ${EL_ZH(e)}</td><td>${chips}<br>${c.colorsEn}</td><td>${c.dirEn} · ${c.seasonEn}</td><td>${c.materialsEn}</td></tr>`
      : `<tr><td><strong style="color:${ELEMENT_META[e].color}">${EL_ZH(e)}</strong></td><td>${chips}<br>${c.colorsZh}</td><td>${c.dirZh} · ${c.seasonZh}</td><td>${c.materialsZh}</td></tr>`
  }).join('')
  const faqs = isEn ? [
    { q: 'What is my lucky color by the Five Elements?', a: 'BaZi doesn’t assign a single lucky color by birth year. It looks at your whole chart to find your favorable elements (喜用神). Get your free chart, see which elements it favors, and use the matching colors as a style reference.' },
    { q: 'Will wearing an element’s color change my luck?', a: 'We don’t think so, and we don’t claim it. Colors and materials are a way to express a cultural idea you find meaningful — wear what you like.' },
  ] : [
    { q: '我该穿什么颜色？', a: '八字里没有"按生肖定幸运色"这回事。传统做法是看整张命盘的喜用五行，再对应颜色。先免费排盘看你的喜用，再把对应的颜色当作审美参考。' },
    { q: '戴对应五行的手串能改运吗？', a: '我们不这样认为，也不这样宣传。颜色和材质是一种你喜欢的文化表达，戴着开心就好；任何承诺"转运""开光"的说法都请谨慎。' },
  ]
  const shopBlock = shop
    ? `<a class="cta" href="${shop}" target="_blank" rel="noopener" onclick="window.gtag&&gtag('event','shop_click',{from:'colors_page'})">${isEn ? 'Browse Five Element pieces →' : '看看五行配色选物 →'}</a>`
    : `<p class="src">${isEn ? 'A small collection of element-colored beads and objects is in the works.' : '按五行配色挑选的手串与小物正在筹备中。'}</p>`
  return head(title, desc, url, { lang, ads: true, alt: { zh: `${BASE}/wuxing-colors/`, en: `${BASE}/en/five-element-colors/` } }) + articleLd({ title, description: desc, url, lang }) + faqLd(faqs) + `
<nav class="crumb"><a href="${isEn ? '/en/' : '/'}">${isEn ? 'Home' : '首页'}</a> / ${isEn ? 'Five Element Colors' : '五行配色'}</nav>
<h1>${isEn ? 'Five Element Colors &amp; Materials' : '五行对应的颜色与材质'}</h1>
<div class="en">${isEn ? 'A style reference from classical Chinese correspondences' : '一份来自传统五色、五方、五季对应的审美参考'}</div>
<p class="def">${isEn
    ? 'Classical Chinese thought links each of the Five Elements to a color, a direction and a season. Below are those correspondences with materials that share each element’s character.'
    : '传统上，五行各有对应的颜色（五色）、方位（五方）与季节（五季）。下面把这些对应关系整理成表，并附上气质相近的常见材质。'}</p>
<div class="table-wrap"><table><thead><tr><th>${isEn ? 'Element' : '五行'}</th><th>${isEn ? 'Colors' : '颜色'}</th><th>${isEn ? 'Direction · Season' : '方位 · 季节'}</th><th>${isEn ? 'Materials' : '常见材质'}</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2 class="sec">${isEn ? 'How to find your elements' : '怎么知道自己对应哪几个五行'}</h2>
<p>${isEn
    ? 'Your Day Master and the balance of your chart point to your <a href="/en/term/xiyong/">favorable elements</a>. Our free calculator works them out from your birth date and time and shows them on your result.'
    : '看<a href="/term/xiyong/">喜用神</a>。一命会根据你的出生时间排出八字，判断<a href="/term/rizhu/">日主</a>旺衰，并在结果里标出喜用五行。'}</p>
<a class="cta" href="${isEn ? '/en/' : '/'}">${isEn ? 'Find my favorable elements →' : '排盘查看我的喜用五行 →'}</a>
<h2 class="sec">${isEn ? 'Our stance' : '我们的态度'}</h2>
<p>${isEn
    ? 'This is an aesthetic and cultural guide. We don’t claim any color, stone or object changes your fate, and we never sell "consecrated" or "luck-changing" items.'
    : '这是一份审美与文化参考。我们不认为颜色、石头或物件能改变命运，也不售卖"开光""转运"类商品。'}</p>
${shopBlock}
${faqHtml(faqs, lang)}
<div class="more"><h2>${isEn ? 'Related' : '相关'}</h2>${isEn
    ? '<a href="/en/term/wuxing/">Five Elements</a><a href="/en/term/xiyong/">Favorable element</a><a href="/en/term/rizhu/">Day Master</a><a href="/en/chinese-zodiac/">Chinese zodiac</a>'
    : '<a href="/term/wuxing/">五行</a><a href="/term/xiyong/">喜用神</a><a href="/term/rizhu/">日主</a><a href="/shengxiao/">十二生肖</a>'}</div>
` + foot(lang)
}

// ================= 英文词条 =================
const KIND_EN = {
  term: { group: 'Core concepts', how: 'This is one of the building blocks of reading a Four Pillars chart. When you calculate your chart, terms like this appear on your result — tap them to see what they mean in context.' },
  shishen: { group: 'The Ten Gods', how: 'The Ten Gods (十神) describe how every other stem in your chart relates to your Day Master: same element, producing it, produced by it, controlling it, or controlled by it — each split by Yin/Yang. Your free chart labels the Ten God of each pillar.' },
  rizhu: { group: 'The ten Day Masters', how: 'Your Day Master is the Heavenly Stem of your birth day, and it represents you. Your free chart shows your Day Master, how strong it is, and which elements it favors.' },
}
function termPageEn(t, ALL) {
  const url = `${BASE}/en/term/${t.id}/`
  const k = KIND_EN[t.kind] || KIND_EN.term
  const zhName = baseName(t.zh)
  const title = t.kind === 'rizhu' ? `${t.en} Day Master (${zhName}): Personality in BaZi | ONEMING` : `${t.en} (${zhName}) in BaZi: Meaning Explained | ONEMING`
  const desc = `${t.defEn}`.slice(0, 155)
  const related = ALL.filter((x) => x.id !== t.id && x.kind === t.kind).slice(0, 12)
  return head(title, desc, url, { lang: 'en', ads: true, alt: { zh: `${BASE}/term/${t.id}/`, en: url } }) +
    articleLd({ title, description: desc, url, lang: 'en' }) +
    breadcrumbLd([{ name: 'Home', item: `${BASE}/en/` }, { name: 'Glossary', item: `${BASE}/en/term/` }, { name: t.en, item: url }]) + `
<nav class="crumb"><a href="/en/">Home</a> / <a href="/en/term/">Glossary</a> / ${esc(t.en)}</nav>
<h1>${esc(t.en)}${t.kind === 'rizhu' ? ' Day Master' : ''}</h1>
<div class="en">${esc(t.zh)}</div>
<p class="def">${esc(t.defEn)}</p>
<div class="box"><div class="lab">HOW IT INTERACTS</div>${esc(t.relEn)}</div>
<h2 class="sec">Where you’ll see it</h2>
<p>${k.how}</p>
<p class="src">Classical source: ${esc(t.src)} (public-domain Chinese classics), rewritten in plain language.</p>
<a class="cta" href="/en/">Calculate your free BaZi chart →</a>
<div class="more"><h2>${k.group}</h2>${related.map((x) => `<a href="/en/term/${x.id}/">${esc(x.en)}</a>`).join('')}</div>
` + foot('en')
}
function termHubEn(ALL) {
  const url = `${BASE}/en/term/`
  const title = 'BaZi Glossary: Day Master, Ten Gods, Five Elements Explained | ONEMING'
  const desc = 'Plain-English glossary of Chinese BaZi (Four Pillars) terms: Day Master, the Ten Gods, Five Elements, strong and weak charts, favorable elements, Na Yin and the ten Day Master personalities.'
  const groups = ['term', 'shishen', 'rizhu'].map((kind) => `<h2 class="sec">${KIND_EN[kind].group}</h2><ul class="list">${ALL.filter((x) => x.kind === kind).map((x) => `<li><a href="/en/term/${x.id}/" style="font-size:18px;font-weight:600">${esc(x.en)}</a> <span style="color:var(--soft)">${esc(baseName(x.zh))}</span><br><span style="color:var(--soft);font-size:14px">${esc(x.defEn.slice(0, 110))}…</span></li>`).join('')}</ul>`).join('')
  return head(title, desc, url, { lang: 'en', ads: true, alt: { zh: `${BASE}/term/`, en: url } }) + `
<nav class="crumb"><a href="/en/">Home</a> / Glossary</nav>
<h1>BaZi Glossary</h1>
<div class="en">Every term in a Four Pillars chart, in plain English</div>
<p class="def">BaZi ("eight characters") reads the Heavenly Stems and Earthly Branches of your birth year, month, day and hour. Here is every term you’ll meet in a chart — what it is, how it interacts, and where it comes from. We explain; we don’t predict.</p>
<a class="cta" href="/en/">Calculate your free chart →</a>
${groups}
` + foot('en')
}

// ================= 英文信任页 =================
export const LEGAL_EN = [
  {
    id: 'terms', title: 'Terms of Use', desc: 'ONEMING terms of use: what the service is, acceptable use and disclaimers.',
    body: `<p class="def">By using ONEMING (${SITE.domain}) you agree to these terms.</p>
<h2 class="sec">What this service is</h2><p>ONEMING provides BaZi (Four Pillars) charts and personality-tendency readings based on traditional Chinese metaphysics. It is <strong>cultural and entertainment content</strong> for reflection only. Nothing here is a prediction, promise or professional advice, and it cannot replace medical, legal, financial or psychological advice.</p>
<h2 class="sec">Acceptable use</h2><p>Don’t use the content to frighten or defraud anyone, and don’t scrape the site or abuse its API with automated tools. Users under 18 should use the site with a parent or guardian.</p>
<h2 class="sec">Disclaimer</h2><p>Charts use public calendar algorithms; readings use public-domain classical frameworks. We make no guarantee of accuracy or fitness for any purpose. You are responsible for any decision you make.</p>
<h2 class="sec">Changes</h2><p>We may update these terms; changes take effect when posted here.</p>`,
  },
  {
    id: 'privacy', title: 'Privacy', desc: 'ONEMING privacy: your birth data is calculated in your browser and never stored.',
    body: `<p class="def">Privacy is part of the product design, not a footnote.</p>
<h2 class="sec">Birth data stays in your browser</h2><p>Your birth date and time are processed <strong>in your own browser</strong>. There is no sign-up, no profile, and <strong>we don’t store your birth data on our servers</strong>.</p>
<h2 class="sec">AI readings: anonymized and stateless</h2><p>To write the AI text, we send only the eight stem-branch characters of the chart — no name, no birth date. The request is stateless and not logged. Results may be cached by chart (not by person) so identical charts don’t need a new request, and in your own browser for next time.</p>
<h2 class="sec">Sharing is your choice</h2><p>"Save / share chart" links contain your birth parameters; who you share them with is up to you. The default share card hides your full chart.</p>
<h2 class="sec">Analytics, cookies and ads</h2><p>The site is hosted on Cloudflare, which may produce anonymous aggregate traffic statistics. Where Google Analytics is enabled, we record page views and button events only (never birth data); it uses cookies. Where Google AdSense is enabled on knowledge pages, Google and other third-party vendors use cookies to serve ads based on your prior visits to this and other websites. You can opt out of personalized advertising at <a href="https://adssettings.google.com">Google Ads Settings</a>. The chart calculator itself shows no ads.</p>`,
  },
  {
    id: 'ai-notice', title: 'AI Notice', desc: 'Which ONEMING content involves AI and how we constrain it.',
    body: `<p class="def">An honest account of where AI is used and how it is constrained.</p>
<h2 class="sec">Deterministic calculation</h2><p>The Four Pillars, element counts, Day Master strength and favorable elements are <strong>rule-based calculations</strong> from public calendar algorithms and the classical fu-yi method. The same input always gives the same result. No AI is involved.</p>
<h2 class="sec">Where AI helps</h2><p>The wording of the reading is polished by an AI model from those calculated facts. The AI <strong>only phrases; it draws no new conclusions</strong>. It is explicitly forbidden to make predictions, fortune claims or "fate-changing" suggestions, and its output passes an independent compliance filter — anything that fails is replaced by fixed text.</p>
<h2 class="sec">In one line</h2><p>The math is rules, the phrasing may be AI, the red line is hard-coded: <strong>personality tendencies only — no predictions, no fate-changing.</strong></p>`,
  },
]
function legalPageEn(p) {
  const url = `${BASE}/en/${p.id}/`
  return head(`${p.title} | ONEMING`, p.desc, url, { lang: 'en', alt: { zh: `${BASE}/${p.id}/`, en: url } }) + `
<nav class="crumb"><a href="/en/">Home</a> / ${esc(p.title)}</nav>
<h1>${esc(p.title)}</h1>
${p.body}
<a class="cta" href="/en/">Back to the calculator →</a>
` + foot('en')
}

// ================= 入口 =================
export function buildGrowth({ write, ALL }) {
  const urls = []
  const put = (path, html) => { write(`${path.replace(/^\//, '')}index.html`, html); urls.push(`${BASE}${path}`) }

  // 英文词条与信任页
  put('/en/term/', termHubEn(ALL))
  for (const t of ALL) put(`/en/term/${t.id}/`, termPageEn(t, ALL))
  for (const p of LEGAL_EN) write(`en/${p.id}/index.html`, legalPageEn(p))

  // 生肖
  put('/shengxiao/', zodiacHubZh())
  put('/en/chinese-zodiac/', zodiacHubEn())
  for (const a of ANIMALS) {
    put(hrefZh.animal(a), animalPageZh(a))
    put(hrefEn.animal(a), animalPageEn(a))
  }
  for (let Y = YEAR_FROM; Y <= YEAR_TO; Y++) {
    put(hrefZh.year(Y), yearPageZh(Y))
    put(hrefEn.year(Y), yearPageEn(Y))
  }

  // 2027 专题
  put('/2027-huoyang/', fireGoatZh())
  put('/en/2027-year-of-the-fire-goat/', fireGoatEn())

  // 五行配色
  put('/wuxing-colors/', colorsPage('zh'))
  put('/en/five-element-colors/', colorsPage('en'))

  return { urls }
}

export { jsonLd }
