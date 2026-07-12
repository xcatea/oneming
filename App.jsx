import { useState, useMemo, useEffect, useRef } from 'react'
import { STRINGS } from './strings.js'
import { computeBazi, ELEMENTS, ELEMENT_META } from './bazi.js'
import { analyzeChart } from './analyze.js'
import { generateReading, fallbackProse } from './reading.js'
import { TERM_BY_ID } from './terms.js'

const SHOP_URL = 'https://example.com/shop' // TODO: 换成你的店铺/独立站地址（留 example.com 则显示"筹备中"）
const TIP_URL = 'https://ko-fi.com/oneming' // Ko-fi 已激活

// AI 文笔层：解读长度（'concise' 精简档 / 'standard' 标准档）
const READING_MODE = 'concise'

// 持久缓存：同一张盘+语言只调一次模型，跨会话生效（存浏览器本地，不上传）
const MEM_CACHE = new Map()
function cacheGet(key) {
  if (MEM_CACHE.has(key)) return MEM_CACHE.get(key)
  try {
    const v = localStorage.getItem('reading:' + key)
    if (v) { MEM_CACHE.set(key, v); return v }
  } catch (e) { /* localStorage 不可用则忽略 */ }
  return null
}
function cacheSet(key, val) {
  MEM_CACHE.set(key, val)
  try { localStorage.setItem('reading:' + key, val) } catch (e) { /* 忽略 */ }
}

// DeepSeek 适配器：把脱敏盘面事实发给后端函数 /api/reading（Key 在服务端）。
// 任何失败（接口未部署 / 超时 / 违规被拒）都会抛错 → 编排器自动回退到兜底文案。
async function callModel(_prompt, ctx) {
  const { analysis, chart, lang } = ctx
  const key = chart.pillars.map((p) => p.gan + p.zhi).join('') + ':' + lang + ':' + READING_MODE
  const cached = cacheGet(key)
  if (cached) return cached

  const elName = (e) => ELEMENT_META[e][lang === 'en' ? 'en' : 'zh']
  const facts = {
    dayGan: chart.dayGan,
    dayElement: elName(analysis.dayElement),
    strengthLabel: analysis.strength.label,
    strengthReason: analysis.strength.reason,
    favorElements: analysis.favor.elements.map(elName),
    favorLogic: analysis.favor.logic,
    core: analysis.traits.core,
    leverage: analysis.traits.leverage,
    lang,
    mode: READING_MODE,
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  try {
    const r = await fetch('/api/reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(facts),
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!r.ok) throw new Error('api ' + r.status)
    const d = await r.json()
    if (!d.text) throw new Error('no text')
    cacheSet(key, d.text)
    return d.text
  } catch (e) {
    clearTimeout(timer)
    throw e
  }
}

const SHOP_READY = !SHOP_URL.includes('example.com')
const TIP_READY = true // Ko-fi 已绑定，按钮激活

const STRENGTH_TERM = { weak: 'shenruo', balanced: 'zhonghe', strong: 'shenqiang' }

// 命盘结果 → 静态百科页 的映射（用于"相关阅读"闭环）
const DAYGAN_PAGE = {
  甲: { id: 'jiamu', en: 'Jia Wood' }, 乙: { id: 'yimu', en: 'Yi Wood' },
  丙: { id: 'binghuo', en: 'Bing Fire' }, 丁: { id: 'dinghuo', en: 'Ding Fire' },
  戊: { id: 'wutu', en: 'Wu Earth' }, 己: { id: 'jitu', en: 'Ji Earth' },
  庚: { id: 'gengjin', en: 'Geng Metal' }, 辛: { id: 'xinjin', en: 'Xin Metal' },
  壬: { id: 'renshui', en: 'Ren Water' }, 癸: { id: 'guishui', en: 'Gui Water' },
}
const SHISHEN_PAGE = {
  正官: { id: 'zhengguan', en: 'Direct Officer' }, 七杀: { id: 'qisha', en: 'Seven Killings' },
  正印: { id: 'zhengyin', en: 'Direct Resource' }, 偏印: { id: 'pianyin', en: 'Indirect Resource' },
  正财: { id: 'zhengcai', en: 'Direct Wealth' }, 偏财: { id: 'piancai', en: 'Indirect Wealth' },
  食神: { id: 'shishen', en: 'Eating God' }, 伤官: { id: 'shangguan', en: 'Hurting Officer' },
  比肩: { id: 'bijian', en: 'Friend' }, 劫财: { id: 'jiecai', en: 'Rob Wealth' },
}
// 十神名 → 应用内词条（TermModal 的五大类）
const SHISHEN_MODAL = {
  正官: 'guansha', 七杀: 'guansha', 正印: 'yinshou', 偏印: 'yinshou',
  食神: 'shishang', 伤官: 'shishang', 正财: 'caixing', 偏财: 'caixing',
  比肩: 'bijie', 劫财: 'bijie',
}

// 从 URL 还原命盘：oneming.net/?d=1995-08-15&t=14:30&g=male
function parseUrlSeed() {
  try {
    const p = new URLSearchParams(window.location.search)
    const d = p.get('d')
    if (!d) return null
    const tm = p.get('t') || '12:00'
    const g = p.get('g') === 'female' ? 'female' : 'male'
    const [y, m, dd] = d.split('-').map(Number)
    const [hh, mm] = tm.split(':').map(Number)
    if (!y || !m || !dd) return null
    return { input: { y, m, d: dd, hh: hh || 0, mm: mm || 0, gender: g }, fields: { date: d, time: tm, gender: g } }
  } catch (e) {
    return null
  }
}

function buildShareUrl(input) {
  const d = `${input.y}-${String(input.m).padStart(2, '0')}-${String(input.d).padStart(2, '0')}`
  const tm = `${String(input.hh).padStart(2, '0')}:${String(input.mm).padStart(2, '0')}`
  return `${window.location.origin}/?d=${d}&t=${tm}&g=${input.gender}`
}


function Header({ lang, setLang, t, onHome }) {
  return (
    <header className="flex items-center justify-between px-6 py-5 md:px-12">
      <button
        type="button"
        onClick={onHome}
        aria-label={lang === 'zh' ? '返回主页' : 'Back to home'}
        className="flex items-center gap-3 rounded-lg transition hover:opacity-80"
      >
        <span className="seal flex h-9 w-9 items-center justify-center text-lg leading-none">命</span>
        <div className="text-left leading-tight">
          <div className="font-zh text-xl font-bold tracking-wide">ONEMING</div>
          <div className="text-[11px] tracking-[0.3em] text-[var(--color-ink-soft)]">{lang === 'zh' ? '一 命' : '一命'}</div>
        </div>
      </button>
      <div className="flex items-center gap-4">
        <span className="hidden rounded-full border border-[rgba(33,29,24,0.18)] px-3 py-1 text-[11px] tracking-wide text-[var(--color-ink-soft)] sm:inline">
          {t.badge}
        </span>
        <button
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          className="font-ui rounded-full border border-[var(--color-jade)] px-4 py-1.5 text-sm text-[var(--color-jade)] transition hover:bg-[var(--color-jade)] hover:text-[var(--color-paper)]"
        >
          {t.langBtn}
        </button>
      </div>
    </header>
  )
}

function Hero({ t, lang, onStart }) {
  return (
    <section className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 md:grid-cols-[1fr_auto] md:px-12 md:py-20">
      <div className="rise">
        <h1 className="font-zh">
          <span className="block text-5xl font-black leading-tight tracking-tight md:text-7xl">
            {lang === 'zh' ? '一命' : 'One fate,'}
            <span className="block text-[var(--color-jade)]">{lang === 'zh' ? '排在第一位' : 'dealt first.'}</span>
          </span>
          <span className="mt-5 block max-w-md text-lg font-medium leading-relaxed md:text-xl">
            {t.heroSeo}
          </span>
        </h1>
        <p className="font-en mt-4 max-w-md text-base leading-relaxed text-[var(--color-ink-soft)]">
          {t.heroLead}
        </p>
        <button
          onClick={onStart}
          className="mt-8 rounded-full bg-[var(--color-ink)] px-7 py-3 text-base text-[var(--color-paper)] transition hover:bg-[var(--jade-deep)]"
        >
          {t.cta}
        </button>
      </div>

      {/* signature: vertical proverb */}
      <div className="rise flex justify-center gap-5 md:gap-7" style={{ animationDelay: '0.15s' }}>
        {t.proverb.map((seg, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className={`text-[10px] tracking-widest text-[var(--color-ink-soft)] ${lang === 'en' ? 'mb-2' : ''}`}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div
              className={`proverb-col text-2xl md:text-3xl ${i === 0 ? 'text-[var(--color-seal)]' : 'text-[var(--color-ink)]'}`}
              style={{ writingMode: lang === 'en' ? 'horizontal-tb' : 'vertical-rl', minHeight: lang === 'en' ? 'auto' : '8.5rem' }}
            >
              {seg}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-[var(--color-ink-soft)]">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  'w-full rounded-lg border border-[rgba(33,29,24,0.18)] bg-[rgba(255,255,255,0.5)] px-3 py-2.5 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-jade)]'

function BaziForm({ t, onSubmit, initial }) {
  const [date, setDate] = useState(initial?.date || '1995-08-15')
  const [time, setTime] = useState(initial?.time || '14:30')
  const [gender, setGender] = useState(initial?.gender || 'male')

  function handle() {
    const [y, m, d] = date.split('-').map(Number)
    const [hh, mm] = time.split(':').map(Number)
    if (!y || !m || !d) return
    onSubmit({ y, m, d, hh: hh || 0, mm: mm || 0, gender })
  }

  return (
    <section id="form" className="mx-auto max-w-xl px-6 pb-8 md:px-12">
      <div className="rounded-2xl border border-[rgba(33,29,24,0.12)] bg-[rgba(255,255,255,0.28)] p-6 md:p-8">
        <h2 className="font-zh text-2xl font-semibold">{t.formTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">{t.formHint}</p>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={t.date}>
            <input type="date" value={date} min="1901-01-01" max="2099-12-31" onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label={t.time}>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </Field>
          <Field label={t.gender}>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
              <option value="male">{t.male}</option>
              <option value="female">{t.female}</option>
            </select>
          </Field>
          <div className="flex items-end">
            <button onClick={handle} className="w-full rounded-lg bg-[var(--color-jade)] px-5 py-2.5 text-[var(--color-paper)] transition hover:bg-[var(--jade-deep)]">
              {t.submit}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Pillar({ p, lang }) {
  return (
    <div className="pillar rise flex flex-col items-center rounded-xl px-2 py-4">
      <span className="mb-3 text-xs tracking-wider text-[var(--color-ink-soft)]">{lang === 'en' ? p.labelEn : p.labelZh}</span>
      <span className="pillar-glyph text-4xl md:text-5xl" style={{ color: ELEMENT_META[p.ganElement].color }}>{p.gan}</span>
      <span className="pillar-glyph mt-1 text-4xl md:text-5xl" style={{ color: ELEMENT_META[p.zhiElement].color }}>{p.zhi}</span>
      <span className="mt-3 text-[11px] text-[var(--color-ink-soft)]">{p.shishen}</span>
      <span className="mt-0.5 text-[11px] text-[var(--color-ink-soft)]">{p.nayin}</span>
    </div>
  )
}

function ElementsBar({ counts, lang }) {
  const total = ELEMENTS.reduce((s, e) => s + counts[e], 0) || 1
  return (
    <div className="space-y-2.5">
      {ELEMENTS.map((e) => (
        <div key={e} className="flex items-center gap-3">
          <span className="font-zh w-5 text-lg" style={{ color: ELEMENT_META[e].color }}>{ELEMENT_META[e].zh}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[rgba(33,29,24,0.08)]">
            <div className="h-full rounded-full" style={{ width: `${(counts[e] / total) * 100}%`, background: ELEMENT_META[e].color }} />
          </div>
          <span className="w-5 text-right text-sm text-[var(--color-ink-soft)]">{counts[e]}</span>
        </div>
      ))}
    </div>
  )
}

function TermLink({ id, onTerm, children }) {
  if (!TERM_BY_ID[id]) return <span>{children}</span>
  return (
    <button
      type="button"
      onClick={() => onTerm(id)}
      className="cursor-help underline decoration-dotted decoration-[var(--color-jade)] underline-offset-4 transition hover:text-[var(--color-jade)]"
    >
      {children}
    </button>
  )
}

function TermModal({ id, lang, t, onClose }) {
  const term = TERM_BY_ID[id]
  if (!term) return null
  const v = (zh, en) => (lang === 'en' ? en : zh)
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(20,18,15,0.45)] p-0 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl bg-[var(--color-paper)] p-6 shadow-2xl md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-zh text-xl font-bold">{v(term.zh, term.en)}</h3>
          <button onClick={onClose} className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            {t.termClose} ✕
          </button>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed">{v(term.defZh, term.defEn)}</p>
        <div className="mt-4 rounded-lg bg-[rgba(76,107,94,0.08)] p-3">
          <div className="text-[11px] tracking-wider text-[var(--color-jade)]">{t.termRelation}</div>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">{v(term.relZh, term.relEn)}</p>
        </div>
        <p className="mt-3 text-xs text-[var(--color-ink-soft)]">{t.termSource}：{v(term.src, term.src)}</p>
      </div>
    </div>
  )
}

function SaveShare({ input, t }) {
  const [done, setDone] = useState(false)
  if (!input) return null
  async function share() {
    const url = buildShareUrl(input)
    try {
      await navigator.clipboard.writeText(url)
    } catch (e) {
      // 退化方案：用临时输入框
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch (e2) { /* 忽略 */ }
      document.body.removeChild(ta)
    }
    setDone(true)
    setTimeout(() => setDone(false), 2200)
  }
  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        onClick={share}
        className="rounded-full border border-[var(--color-jade)] px-4 py-1.5 text-sm text-[var(--color-jade)] transition hover:bg-[var(--color-jade)] hover:text-[var(--color-paper)]"
      >
        {done ? t.shareDone : t.shareLabel}
      </button>
      <span className="text-[11px] text-[var(--color-ink-soft)]">{t.shareHint}</span>
    </div>
  )
}

// ===== 命盘卡片（canvas 本地绘制） =====
const CARD = { w: 1080, h: 1440, pad: 90, paper: '#ece5d6', ink: '#211d18', soft: '#6b6457', jade: '#4c6b5e', seal: '#9e342a' }

function firstSentence(text) {
  const s = (text || '').replace(/\n+/g, ' ').split(/[。.!?！？]/).map((x) => x.trim()).filter(Boolean)
  return s[0] || ''
}
function wrapLines(ctx, text, maxWidth, isEn) {
  const lines = []
  if (isEn) {
    let line = ''
    for (const w of text.split(' ')) {
      const test = line ? line + ' ' + w : w
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w } else line = test
    }
    if (line) lines.push(line)
  } else {
    let line = ''
    for (const ch of text) {
      const test = line + ch
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = ch } else line = test
    }
    if (line) lines.push(line)
  }
  return lines
}

function drawCard(ctx, { chart, analysis, reading, lang, full }) {
  const { w, h, pad } = CARD
  const isEn = lang === 'en'
  const serif = '"Noto Serif SC", serif'
  const elZh = (e) => ELEMENT_META[e].zh
  const elName = (e) => (isEn ? ELEMENT_META[e].en : ELEMENT_META[e].zh)
  const elColor = (e) => ELEMENT_META[e].color

  // 背景
  ctx.fillStyle = CARD.paper
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(0,0,0,0.015)'
  ctx.beginPath(); ctx.arc(w * 0.18, h * 0.1, 260, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(w * 0.85, h * 0.9, 300, 0, Math.PI * 2); ctx.fill()
  // 边框
  ctx.strokeStyle = 'rgba(33,29,24,0.14)'; ctx.lineWidth = 2
  ctx.strokeRect(40, 40, w - 80, h - 80)

  // —— 顶部品牌 ——
  ctx.fillStyle = CARD.seal
  roundRect(ctx, pad, 86, 92, 92, 14); ctx.fill()
  ctx.fillStyle = '#f3ece1'; ctx.font = `700 54px ${serif}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('命', pad + 46, 86 + 50)
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'
  ctx.fillStyle = CARD.ink; ctx.font = `700 42px ${serif}`
  ctx.fillText('ONEMING', pad + 116, 132)
  ctx.fillStyle = CARD.soft; ctx.font = `400 24px ${serif}`
  ctx.fillText(isEn ? 'YI MING' : '一 命', pad + 118, 172)
  // 右上角 生肖·星座
  ctx.textAlign = 'right'; ctx.fillStyle = CARD.soft; ctx.font = `400 28px ${serif}`
  ctx.fillText(`${chart.shengxiao} · ${chart.xingzuo}`, w - pad, 150)
  ctx.textAlign = 'left'

  const cx = w / 2

  if (!full) {
    // —— 氛围卡：日主大字 + 旺衰 + 金句 ——
    ctx.textAlign = 'center'
    ctx.fillStyle = CARD.soft; ctx.font = `400 30px ${serif}`
    ctx.fillText(isEn ? 'DAY MASTER' : '日　主', cx, 372)
    ctx.fillStyle = elColor(analysis.dayElement); ctx.font = `700 156px ${serif}`
    ctx.fillText(`${chart.dayGan}${elZh(analysis.dayElement)}`, cx, 540)
    ctx.fillStyle = CARD.ink; ctx.font = `400 46px ${serif}`
    ctx.fillText(analysis.strength.label, cx, 612)
    // 分隔
    ctx.strokeStyle = 'rgba(76,107,94,0.5)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(cx - 60, 668); ctx.lineTo(cx + 60, 668); ctx.stroke()
    // 金句
    ctx.fillStyle = CARD.ink; ctx.font = `400 46px ${serif}`
    const quote = firstSentence(reading)
    const lines = wrapLines(ctx, quote, w - 2 * pad - 60, isEn).slice(0, 3)
    let qy = 752
    for (const ln of lines) { ctx.fillText(ln, cx, qy); qy += 70 }
  } else {
    // —— 完整卡：四柱 ——
    const cols = chart.pillars
    const labels = isEn ? ['Year', 'Month', 'Day', 'Hour'] : ['年', '月', '日', '时']
    const colW = (w - 2 * pad) / 4
    ctx.textAlign = 'center'
    cols.forEach((p, i) => {
      const x = pad + colW * (i + 0.5)
      ctx.fillStyle = CARD.soft; ctx.font = `400 30px ${serif}`
      ctx.fillText(labels[i], x, 332)
      ctx.fillStyle = elColor(p.ganElement); ctx.font = `700 92px ${serif}`
      ctx.fillText(p.gan, x, 446)
      ctx.fillStyle = elColor(p.zhiElement); ctx.font = `700 92px ${serif}`
      ctx.fillText(p.zhi, x, 552)
    })
    ctx.fillStyle = CARD.ink; ctx.font = `400 42px ${serif}`
    ctx.fillText(`${isEn ? 'Day Master ' : '日主 '}${chart.dayGan}${elZh(analysis.dayElement)} · ${analysis.strength.label}`, cx, 648)
    ctx.strokeStyle = 'rgba(76,107,94,0.5)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(cx - 60, 700); ctx.lineTo(cx + 60, 700); ctx.stroke()
    ctx.fillStyle = CARD.ink; ctx.font = `400 42px ${serif}`
    const quote = firstSentence(reading)
    const lines = wrapLines(ctx, quote, w - 2 * pad - 60, isEn).slice(0, 2)
    let qy = 768
    for (const ln of lines) { ctx.fillText(ln, cx, qy); qy += 60 }
  }

  // —— 五行分布（柱状） ——
  ctx.textAlign = 'center'
  ctx.fillStyle = CARD.soft; ctx.font = `400 30px ${serif}`
  ctx.fillText(isEn ? 'FIVE ELEMENTS' : '五　行', cx, 980)
  const counts = chart.counts
  const maxC = Math.max(...ELEMENTS.map((e) => counts[e]), 1)
  const barW = 64, gap = 44
  const totalW = ELEMENTS.length * barW + (ELEMENTS.length - 1) * gap
  const startX = (w - totalW) / 2
  const barsBottom = 1168, barMaxH = 116
  ELEMENTS.forEach((e, i) => {
    const x = startX + i * (barW + gap)
    const hh = counts[e] === 0 ? 4 : Math.max(10, (counts[e] / maxC) * barMaxH)
    ctx.fillStyle = elColor(e)
    roundRect(ctx, x, barsBottom - hh, barW, hh, 8); ctx.fill()
    ctx.fillStyle = CARD.soft; ctx.font = `400 28px ${serif}`
    ctx.fillText(String(counts[e]), x + barW / 2, barsBottom - hh - 14)
    ctx.fillStyle = elColor(e); ctx.font = `700 38px ${serif}`
    ctx.fillText(elZh(e), x + barW / 2, barsBottom + 46)
  })

  // —— 喜用 ——
  ctx.fillStyle = CARD.soft; ctx.font = `400 34px ${serif}`
  const favorLabel = isEn ? 'Favors  ' : '喜用　'
  const favs = analysis.favor.elements
  // 居中排：标签 + 元素色块
  ctx.textAlign = 'left'
  const chipW = 64, chipGap = 18
  const labelW = ctx.measureText(favorLabel).width
  const rowW = labelW + favs.length * chipW + (favs.length - 1) * chipGap
  let fx = cx - rowW / 2
  const fy = 1276
  ctx.fillText(favorLabel, fx, fy + 44)
  fx += labelW
  favs.forEach((e) => {
    ctx.fillStyle = elColor(e) + '26'
    roundRect(ctx, fx, fy, chipW, chipW, 14); ctx.fill()
    ctx.fillStyle = elColor(e); ctx.font = `700 40px ${serif}`; ctx.textAlign = 'center'
    ctx.fillText(elZh(e), fx + chipW / 2, fy + 46)
    ctx.textAlign = 'left'; ctx.font = `400 34px ${serif}`
    fx += chipW + chipGap
  })

  // —— 水印 ——
  ctx.textAlign = 'center'
  ctx.fillStyle = CARD.jade; ctx.font = `700 36px ${serif}`
  ctx.fillText('oneming.net', cx, 1388)
  ctx.fillStyle = CARD.soft; ctx.font = `400 24px ${serif}`
  ctx.fillText(isEn ? 'Free BaZi · for fun' : '免费排八字 · 传统文化娱乐参考', cx, 1422)
  ctx.textAlign = 'left'
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function CardModal({ chart, analysis, reading, lang, t, onClose }) {
  const canvasRef = useRef(null)
  const [full, setFull] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        await document.fonts.load(`700 150px "Noto Serif SC"`)
        await document.fonts.load(`400 46px "Noto Serif SC"`)
        await document.fonts.ready
      } catch (e) { /* 字体加载失败也尽量画 */ }
      if (cancelled || !canvasRef.current) return
      drawCard(canvasRef.current.getContext('2d'), { chart, analysis, reading, lang, full })
    }
    run()
    return () => { cancelled = true }
  }, [full, lang, chart, analysis, reading])

  function download() {
    const c = canvasRef.current
    if (!c) return
    c.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'oneming-card.png'
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[rgba(20,18,15,0.55)] p-0 md:items-center md:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-[var(--color-paper)] p-5 shadow-2xl md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div className="inline-flex rounded-full border border-[rgba(33,29,24,0.15)] p-0.5 text-sm">
            <button onClick={() => setFull(false)} className={`rounded-full px-3 py-1 transition ${!full ? 'bg-[var(--color-jade)] text-[var(--color-paper)]' : 'text-[var(--color-ink-soft)]'}`}>{t.cardVibe}</button>
            <button onClick={() => setFull(true)} className={`rounded-full px-3 py-1 transition ${full ? 'bg-[var(--color-jade)] text-[var(--color-paper)]' : 'text-[var(--color-ink-soft)]'}`}>{t.cardFull}</button>
          </div>
          <button onClick={onClose} className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">{t.cardClose} ✕</button>
        </div>

        <canvas ref={canvasRef} width={CARD.w} height={CARD.h} className="w-full rounded-xl shadow-md" style={{ aspectRatio: '3 / 4' }} />

        {full && <p className="mt-3 text-xs leading-relaxed text-[var(--color-ink-soft)]">{t.cardPrivacy}</p>}

        <button onClick={download} className="mt-4 w-full rounded-full bg-[var(--color-ink)] py-3 text-[var(--color-paper)] transition hover:bg-[var(--jade-deep)]">
          {t.cardDownload}
        </button>
        <p className="mt-2 text-center text-[11px] text-[var(--color-ink-soft)]">{t.cardSaved}</p>
      </div>
    </div>
  )
}

function Reading({ data, t, lang, onTerm }) {
  const analysis = useMemo(() => analyzeChart(data, lang), [data, lang])
  const [reading, setReading] = useState(() => fallbackProse(analysis, lang))
  useEffect(() => {
    let alive = true
    setReading(fallbackProse(analysis, lang))
    generateReading(analysis, data, lang, callModel).then((r) => { if (alive) setReading(r.text) })
    return () => { alive = false }
  }, [analysis, data, lang])

  const elName = (e) => ELEMENT_META[e][lang === 'en' ? 'en' : 'zh']
  const [cardOpen, setCardOpen] = useState(false)

  // 本命盘涉及的术语（打开应用内 TermModal 底部抽屉）
  const chartTerms = useMemo(() => {
    const list = [
      { label: lang === 'en' ? 'Day Master' : '日主', id: 'rizhu' },
      { label: lang === 'en' ? 'Five Elements' : '五行', id: 'wuxing' },
      { label: analysis.strength.label, id: STRENGTH_TERM[analysis.strength.tier] },
      { label: lang === 'en' ? 'Favorable' : '喜用神', id: 'xiyong' },
    ]
    const seen = new Set()
    for (const p of data.pillars) {
      if (p.key === 'day') continue
      const mid = SHISHEN_MODAL[p.shishen]
      if (mid && !seen.has(p.shishen)) { seen.add(p.shishen); list.push({ label: lang === 'en' ? p.shishen : p.shishen, id: mid }) }
    }
    list.push({ label: lang === 'en' ? 'Na Yin' : '纳音', id: 'nayin' })
    return list
  }, [data, analysis, lang])

  const related = useMemo(() => {
    const out = []
    const dg = DAYGAN_PAGE[data.dayGan]
    if (dg) out.push({ href: `/term/${dg.id}/`, zh: `${data.dayGan}${ELEMENT_META[analysis.dayElement].zh}日主的性格特点`, en: `${dg.en} Day Master personality` })
    const st = STRENGTH_TERM[analysis.strength.tier]
    out.push({ href: `/term/${st}/`, zh: `${analysis.strength.label}是什么意思？`, en: `What does "${analysis.strength.label}" mean?` })
    out.push({ href: '/term/xiyong/', zh: `喜用神是什么？为什么我喜${analysis.favor.elements.map((e) => ELEMENT_META[e].zh).join('')}`, en: 'What is the favorable element?' })
    const seen = new Set()
    for (const p of data.pillars) {
      if (p.key === 'day') continue
      const sp = SHISHEN_PAGE[p.shishen]
      if (sp && !seen.has(sp.id)) { seen.add(sp.id); out.push({ href: `/term/${sp.id}/`, zh: `${p.shishen}是什么意思？`, en: `What is ${sp.en}?` }) }
    }
    return out
  }, [data, analysis, lang])

  return (
    <div className="mt-9 border-t border-[rgba(33,29,24,0.1)] pt-7">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-zh text-lg font-semibold">{t.readingTitle}</h3>
        <span className="text-[11px] text-[var(--color-ink-soft)]">{t.glossaryHint}</span>
      </div>

      <div className="mt-3 rounded-xl border border-[rgba(76,107,94,0.22)] bg-[rgba(76,107,94,0.06)] px-3.5 py-2.5">
        <span className="text-xs text-[var(--color-ink-soft)]">
          {t.termsBarPrefix} <strong className="text-[var(--color-jade)]">{chartTerms.length}</strong> {t.termsBarSuffix}
        </span>
        <span className="mt-1.5 flex flex-wrap gap-1.5">
          {chartTerms.map((c, i) => (
            <button
              key={i}
              onClick={() => onTerm(c.id)}
              className="rounded-full bg-[var(--color-paper)] px-2.5 py-1 text-xs text-[var(--color-jade)] shadow-sm transition hover:bg-[var(--color-jade)] hover:text-[var(--color-paper)]"
            >
              {c.label}
            </button>
          ))}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <span>
          <span className="text-[var(--color-ink-soft)]">{t.strengthLabel}：</span>
          <TermLink id={STRENGTH_TERM[analysis.strength.tier]} onTerm={onTerm}>{analysis.strength.label}</TermLink>
        </span>
        <span className="flex items-center gap-1.5">
          <TermLink id="xiyong" onTerm={onTerm}>{t.favorLabel}</TermLink>
          <span className="text-[var(--color-ink-soft)]">：</span>
          {analysis.favor.elements.map((e) => (
            <span key={e} className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${ELEMENT_META[e].color}1f`, color: ELEMENT_META[e].color }}>
              {elName(e)}
            </span>
          ))}
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-soft)]">{analysis.strength.reason}</p>

      <div className="mt-4 space-y-3 text-[15px] leading-relaxed">
        {reading.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
      </div>

      <p className="mt-5 text-xs leading-relaxed text-[var(--color-ink-soft)]">{t.readingFoot}</p>

      <div className="mt-6">
        <h4 className="font-zh text-sm font-semibold text-[var(--color-ink-soft)]">{t.relatedTitle}</h4>
        <ul className="mt-2 space-y-1.5">
          {related.map((r, i) => (
            <li key={i}>
              <a href={r.href} target="_blank" rel="noopener" className="text-sm text-[var(--color-jade)] underline decoration-dotted underline-offset-4 transition hover:opacity-75">
                {(lang === 'en' ? r.en : r.zh)} →
              </a>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => setCardOpen(true)}
        className="mt-6 rounded-full bg-[var(--color-jade)] px-6 py-2.5 text-sm text-[var(--color-paper)] transition hover:bg-[var(--jade-deep)]"
      >
        {t.cardLabel}
      </button>

      {cardOpen && (
        <CardModal chart={data} analysis={analysis} reading={reading} lang={lang} t={t} onClose={() => setCardOpen(false)} />
      )}
    </div>
  )
}

function Result({ data, input, t, lang, onTerm }) {
  return (
    <section id="result" className="mx-auto max-w-3xl px-6 pb-16 md:px-12">
      <div className="rise rounded-2xl border border-[rgba(33,29,24,0.12)] bg-[rgba(255,255,255,0.3)] p-6 md:p-9">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-zh text-3xl font-bold">{t.resultTitle}</h2>
          <span className="text-xs tracking-widest text-[var(--color-ink-soft)]">{t.chartLabel}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--color-ink-soft)]">
          <span>{data.solarText}</span>
          <span>· {t.shengxiao} {data.shengxiao}</span>
          <span>· {t.xingzuo} {data.xingzuo}</span>
          <span>· {t.dayMaster} {data.dayGan}（{ELEMENT_META[data.dayElement][lang === 'en' ? 'en' : 'zh']}）</span>
        </div>

        <SaveShare input={input} t={t} />

        {/* four pillars */}
        <div className="mt-7 grid grid-cols-4 gap-2.5 md:gap-4">
          {data.pillars.map((p) => <Pillar key={p.key} p={p} lang={lang} />)}
        </div>

        {/* 五行分布（性格解读已由下方 AI 解读覆盖，去掉重复的"性格基调"） */}
        <div className="mt-9">
          <h3 className="font-zh mb-3 text-lg font-semibold">{t.elementsLabel}</h3>
          <ElementsBar counts={data.counts} lang={lang} />
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-ink-soft)]">{data.balance}</p>
        </div>

        <Reading data={data} t={t} lang={lang} onTerm={onTerm} />
      </div>
    </section>
  )
}

function Support({ t }) {
  return (
    <section className="border-y border-[rgba(33,29,24,0.12)] bg-[rgba(76,107,94,0.07)]">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 px-6 py-12 md:flex-row md:items-center md:justify-between md:px-12">
        <div className="max-w-xl">
          <div className="text-xs tracking-[0.3em] text-[var(--color-jade)]">{t.tipEyebrow}</div>
          <h2 className="font-zh mt-2 text-2xl font-semibold">{t.tipTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">{t.tipBody}</p>
        </div>
        {TIP_READY ? (
          <a
            href={TIP_URL}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full bg-[var(--color-ink)] px-7 py-3 text-[var(--color-paper)] transition hover:bg-[var(--jade-deep)]"
          >
            {t.tipCta}
          </a>
        ) : (
          <span
            className="shrink-0 cursor-not-allowed rounded-full border border-[rgba(33,29,24,0.25)] px-7 py-3 text-[var(--color-ink-soft)]"
            title="设置 TIP_URL 后启用"
          >
            {t.tipCta}
          </span>
        )}
      </div>
    </section>
  )
}

function Shop({ t }) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-10 md:px-12">
      <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <div className="text-[11px] tracking-[0.3em] text-[var(--color-ink-soft)]">{t.shopEyebrow}</div>
          <h2 className="font-zh mt-1.5 text-lg font-semibold text-[var(--color-ink-soft)]">{t.shopTitle}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">{t.shopBody}</p>
        </div>
        {SHOP_READY ? (
          <a
            href={SHOP_URL}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full border border-[var(--color-jade)] px-6 py-2.5 text-sm text-[var(--color-jade)] transition hover:bg-[var(--color-jade)] hover:text-[var(--color-paper)]"
          >
            {t.shopCta}
          </a>
        ) : (
          <span className="shrink-0 rounded-full border border-[rgba(33,29,24,0.15)] px-5 py-2 text-xs tracking-wider text-[var(--color-ink-soft)]">
            {t.shopSoon}
          </span>
        )}
      </div>
    </section>
  )
}

function Disclaimer({ t }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12 md:px-12">
      <div className="mb-8 rounded-2xl border border-[rgba(76,107,94,0.25)] bg-[rgba(76,107,94,0.06)] p-5 md:p-6">
        <h3 className="font-zh text-base font-semibold text-[var(--color-jade)]">{t.trustTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed">{t.trustBody}</p>
        <a href="/ai-notice/" className="mt-2 inline-block text-xs text-[var(--color-jade)] underline decoration-dotted underline-offset-4">{t.trustLink} →</a>
      </div>
      <h3 className="font-zh mb-2 text-sm font-semibold tracking-wide text-[var(--color-ink-soft)]">{t.disclaimerTitle}</h3>
      <p className="text-xs leading-relaxed text-[var(--color-ink-soft)]">{t.disclaimer}</p>
      <p className="mt-3 text-xs text-[var(--color-ink-soft)]">
        <a href="/terms/" className="underline decoration-dotted underline-offset-4 hover:text-[var(--color-jade)]">{t.footTerms}</a>
        {' · '}
        <a href="/privacy/" className="underline decoration-dotted underline-offset-4 hover:text-[var(--color-jade)]">{t.footPrivacy}</a>
        {' · '}
        <a href="/ai-notice/" className="underline decoration-dotted underline-offset-4 hover:text-[var(--color-jade)]">{t.footAi}</a>
      </p>
    </section>
  )
}

export default function App() {
  const urlSeed = useMemo(() => parseUrlSeed(), [])
  const [lang, setLang] = useState('zh')
  const [input, setInput] = useState(urlSeed?.input ?? null)
  const [activeTerm, setActiveTerm] = useState(null)
  const t = STRINGS[lang]

  const data = useMemo(() => {
    if (!input) return null
    return computeBazi(input.y, input.m, input.d, input.hh, input.mm, input.gender, lang)
  }, [input, lang])

  function scrollToForm() {
    document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' })
  }

  function goHome() {
    setInput(null)
    setActiveTerm(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    if (urlSeed) {
      const id = setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 300)
      return () => clearTimeout(id)
    }
  }, [])

  return (
    <div className="min-h-screen">
      <Header lang={lang} setLang={setLang} t={t} onHome={goHome} />
      <Hero t={t} lang={lang} onStart={scrollToForm} />
      <BaziForm t={t} onSubmit={setInput} initial={urlSeed?.fields} />
      {data && <Result key={lang + JSON.stringify(input)} data={data} input={input} t={t} lang={lang} onTerm={setActiveTerm} />}
      <Support t={t} />
      <Shop t={t} />
      <Disclaimer t={t} />
      <footer className="border-t border-[rgba(33,29,24,0.12)] px-6 py-8 text-center md:px-12">
        <p className="font-zh text-sm text-[var(--color-ink-soft)]">{t.footerTag}</p>
        <p className="mt-2 text-[11px] tracking-widest text-[var(--color-ink-soft)]">
          <a href="/term/" className="underline decoration-dotted underline-offset-4 hover:text-[var(--color-jade)]">{lang === 'en' ? 'Glossary' : '命理小词典'}</a>
          {' · '}ONEMING · oneming.net
        </p>
      </footer>
      {activeTerm && <TermModal id={activeTerm} lang={lang} t={t} onClose={() => setActiveTerm(null)} />}
    </div>
  )
}
