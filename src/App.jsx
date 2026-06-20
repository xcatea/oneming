import { useState, useMemo, useEffect } from 'react'
import { STRINGS } from './strings.js'
import { computeBazi, ELEMENTS, ELEMENT_META } from './bazi.js'
import { analyzeChart } from './analyze.js'
import { generateReading, fallbackProse } from './reading.js'
import { TERM_BY_ID } from './terms.js'

const SHOP_URL = 'https://example.com/shop' // TODO: 换成你的店铺/独立站地址（留 example.com 则显示"筹备中"）
const TIP_URL = 'https://ko-fi.com/oneming' // Ko-fi 已激活

// AI 文笔层：解读长度（'concise' 精简档 / 'standard' 标准档）
const READING_MODE = 'concise'

// 会话内缓存：同一张盘+语言只调一次模型
const readingCache = new Map()

// DeepSeek 适配器：把脱敏盘面事实发给后端函数 /api/reading（Key 在服务端）。
// 任何失败（接口未部署 / 超时 / 违规被拒）都会抛错 → 编排器自动回退到兜底文案。
async function callModel(_prompt, ctx) {
  const { analysis, chart, lang } = ctx
  const key = chart.pillars.map((p) => p.gan + p.zhi).join('') + ':' + lang + ':' + READING_MODE
  if (readingCache.has(key)) return readingCache.get(key)

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
    readingCache.set(key, d.text)
    return d.text
  } catch (e) {
    clearTimeout(timer)
    throw e
  }
}

const SHOP_READY = !SHOP_URL.includes('example.com')
const TIP_READY = true // Ko-fi 已绑定，按钮激活

const STRENGTH_TERM = { weak: 'shenruo', balanced: 'zhonghe', strong: 'shenqiang' }


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
        <h1 className="font-zh text-5xl font-black leading-tight tracking-tight md:text-7xl">
          {lang === 'zh' ? '一命' : 'One fate,'}
          <span className="block text-[var(--color-jade)]">{lang === 'zh' ? '排在第一位' : 'dealt first.'}</span>
        </h1>
        <p className="font-en mt-6 max-w-md text-lg leading-relaxed text-[var(--color-ink-soft)]">
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

function BaziForm({ t, onSubmit }) {
  const [date, setDate] = useState('1995-08-15')
  const [time, setTime] = useState('14:30')
  const [gender, setGender] = useState('male')

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

  return (
    <div className="mt-9 border-t border-[rgba(33,29,24,0.1)] pt-7">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-zh text-lg font-semibold">{t.readingTitle}</h3>
        <span className="text-[11px] text-[var(--color-ink-soft)]">{t.glossaryHint}</span>
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

      <div className="mt-4 flex flex-wrap gap-1.5">
        {['rizhu', 'wuxing', 'xiyong', 'bijie', 'yinshou', 'shishang', 'caixing', 'guansha', 'nayin'].map((id) => (
          <button key={id} onClick={() => onTerm(id)} className="rounded-full border border-[rgba(33,29,24,0.15)] px-2.5 py-1 text-[11px] text-[var(--color-ink-soft)] transition hover:border-[var(--color-jade)] hover:text-[var(--color-jade)]">
            {lang === 'en' ? TERM_BY_ID[id].en.split(' (')[0] : TERM_BY_ID[id].zh.split('（')[0]}
          </button>
        ))}
      </div>
    </div>
  )
}

function Result({ data, t, lang, onTerm }) {
  return (
    <section className="mx-auto max-w-3xl px-6 pb-16 md:px-12">
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

        {/* four pillars */}
        <div className="mt-7 grid grid-cols-4 gap-2.5 md:gap-4">
          {data.pillars.map((p) => <Pillar key={p.key} p={p} lang={lang} />)}
        </div>

        {/* elements + tone */}
        <div className="mt-9 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-zh mb-3 text-lg font-semibold">{t.elementsLabel}</h3>
            <ElementsBar counts={data.counts} lang={lang} />
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">{data.balance}</p>
          </div>
          <div>
            <h3 className="font-zh mb-3 text-lg font-semibold">{t.toneTitle}</h3>
            <p className="text-[15px] leading-relaxed">{data.tone}</p>
          </div>
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
      <h3 className="font-zh mb-2 text-sm font-semibold tracking-wide text-[var(--color-ink-soft)]">{t.disclaimerTitle}</h3>
      <p className="text-xs leading-relaxed text-[var(--color-ink-soft)]">{t.disclaimer}</p>
    </section>
  )
}

export default function App() {
  const [lang, setLang] = useState('zh')
  const [input, setInput] = useState(null)
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen">
      <Header lang={lang} setLang={setLang} t={t} onHome={goHome} />
      <Hero t={t} lang={lang} onStart={scrollToForm} />
      <BaziForm t={t} onSubmit={setInput} />
      {data && <Result key={lang + JSON.stringify(input)} data={data} t={t} lang={lang} onTerm={setActiveTerm} />}
      <Support t={t} />
      <Shop t={t} />
      <Disclaimer t={t} />
      <footer className="border-t border-[rgba(33,29,24,0.12)] px-6 py-8 text-center md:px-12">
        <p className="font-zh text-sm text-[var(--color-ink-soft)]">{t.footerTag}</p>
        <p className="mt-2 text-[11px] tracking-widest text-[var(--color-ink-soft)]">ONEMING · oneming.net</p>
      </footer>
      {activeTerm && <TermModal id={activeTerm} lang={lang} t={t} onClose={() => setActiveTerm(null)} />}
    </div>
  )
}
