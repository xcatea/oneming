import { Solar } from 'lunar-javascript'

import { GAN_WUXING, ZHI_WUXING, ELEMENTS, ELEMENT_META, tally } from './wuxing.js'

export { ELEMENTS, ELEMENT_META }

// 日主性格基调（以日干五行为锚，纯倾向描述，不做吉凶断言）
const DAYMASTER_TONE = {
  wood: {
    zh: '你偏向成长型的思路，喜欢往前推进、向上生长，重视方向感与可能性，遇事更愿意主动开拓，但有时会铺得太开、需要聚焦。',
    en: 'You lean toward a growth-minded outlook — drawn to progress, direction and possibility. You tend to initiate rather than wait, though focus can sometimes get spread thin.',
  },
  fire: {
    zh: '你偏向表达型的能量，热度高、节奏快，感染力强，容易点燃一群人；状态好时光彩夺目，也需要留意持续性与节奏的收放。',
    en: 'You carry expressive, fast-moving energy and natural charisma that lights up a room. The trade-off to watch is pacing and staying power over the long run.',
  },
  earth: {
    zh: '你偏向稳健型的性子，重承诺、讲实在，是别人愿意托付的那一类；优势在踏实与包容，偶尔会因为求稳而错过窗口。',
    en: 'You lean steady and dependable — the kind people trust to follow through. Your strength is groundedness; the thing to watch is moving when a window actually opens.',
  },
  metal: {
    zh: '你偏向条理型的头脑，标准清晰、判断果断，擅长把复杂的事收拢成秩序；锋利是优势，柔软的余地留一点会更顺。',
    en: 'You think in clear standards and decisive judgment, good at bringing order to messy situations. The edge is an asset — leaving a little room for softness makes it land better.',
  },
  water: {
    zh: '你偏向灵活型的智慧，善于感知与变通，思路流动、适应力强；优势在洞察与圆融，定一个锚点会让流动更有去处。',
    en: 'You move with adaptable, perceptive intelligence — fluid thinking and strong instincts for reading a situation. An anchor point gives all that flow somewhere to go.',
  },
}

// 五行强弱的轻量提示（参考性，非命理裁决）
function balanceNote(counts, dayElement, lang) {
  const max = Math.max(...Object.values(counts))
  const min = Math.min(...Object.values(counts))
  const strong = ELEMENTS.filter((e) => counts[e] === max)
  const weak = ELEMENTS.filter((e) => counts[e] === min)
  const m = (e) => ELEMENT_META[e][lang === 'en' ? 'en' : 'zh']
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (lang === 'en') {
    return `Across your ${total === 8 ? 'eight' : 'six'} characters, ${strong.map(m).join(' / ')} shows up most and ${weak.map(m).join(' / ')} least. Read it as where your energy naturally pools versus where you may want to lean in on purpose — not as a verdict.`
  }
  return `你${total === 8 ? '八' : '六'}个字里，${strong.map(m).join('、')}出现得最多，${weak.map(m).join('、')}相对最少。可以把它当作"精力天然汇聚在哪、又可以有意识补哪一块"的参考，而不是结论。`
}

// hourKnown=false：不知道出生时辰 → 只排年/月/日三柱（按正午取日柱，避开子时换日问题）
export function computeBazi(year, month, day, hour, minute, gender, lang = 'zh', hourKnown = true) {
  const solar = hourKnown ? Solar.fromYmdHms(year, month, day, hour, minute, 0) : Solar.fromYmdHms(year, month, day, 12, 0, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()

  const pillars = [
    { key: 'year', labelZh: '年柱', labelEn: 'Year', gan: ec.getYearGan(), zhi: ec.getYearZhi(), shishen: ec.getYearShiShenGan(), nayin: ec.getYearNaYin() },
    { key: 'month', labelZh: '月柱', labelEn: 'Month', gan: ec.getMonthGan(), zhi: ec.getMonthZhi(), shishen: ec.getMonthShiShenGan(), nayin: ec.getMonthNaYin() },
    { key: 'day', labelZh: '日柱', labelEn: 'Day', gan: ec.getDayGan(), zhi: ec.getDayZhi(), shishen: lang === 'en' ? 'Self' : '日主', nayin: ec.getDayNaYin() },
    { key: 'time', labelZh: '时柱', labelEn: 'Hour', gan: ec.getTimeGan(), zhi: ec.getTimeZhi(), shishen: ec.getTimeShiShenGan(), nayin: ec.getTimeNaYin() },
  ].filter((p) => hourKnown || p.key !== 'time').map((p) => ({
    ...p,
    ganElement: GAN_WUXING[p.gan],
    zhiElement: ZHI_WUXING[p.zhi],
  }))

  const counts = tally(pillars)
  const dayElement = GAN_WUXING[ec.getDayGan()]

  return {
    solarText: lang === 'en'
      ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${hourKnown ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` : '(hour unknown)'}`
      : `${year}年${month}月${day}日 ${hourKnown ? `${hour}时${minute}分` : '（时辰未知）'}`,
    hourKnown,
    lunarText: lunar.toString(),
    shengxiao: lunar.getYearShengXiao(),
    xingzuo: solar.getXingZuo(),
    dayGan: ec.getDayGan(),
    dayElement,
    pillars,
    counts,
    tone: DAYMASTER_TONE[dayElement][lang === 'en' ? 'en' : 'zh'],
    balance: balanceNote(counts, dayElement, lang),
  }
}
