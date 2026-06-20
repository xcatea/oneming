// 一命 · 解读引擎 第①层（确定性命理判读层）
// 范围：日主旺衰（简化三档）→ 喜用神倾向（扶抑法）→ 性格/可发挥方向
// 全部基于公有命理逻辑（扶抑用神，见《渊海子平》《滴天髓》），表达为原创口径。
// 严守口径：只输出性格/倾向/可发挥方向；不做宿命断言、不恐吓吉凶、不涉改运。

// 五行生克关系（X 生 GENERATES[X]；X 克 CONTROLS[X]）
const GENERATES = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' }
const CONTROLS = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' }
// 生我者（印）= GENERATED_BY[D]；克我者（官杀）= CONTROLLED_BY[D]
const GENERATED_BY = { fire: 'wood', earth: 'fire', metal: 'earth', water: 'metal', wood: 'water' }
const CONTROLLED_BY = { earth: 'wood', water: 'earth', fire: 'water', metal: 'fire', wood: 'metal' }

const EL_ZH = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }
const EL_EN = { wood: 'Wood', fire: 'Fire', earth: 'Earth', metal: 'Metal', water: 'Water' }

// 某字相对日主 D 的十神大类（用于判同党/异党）
function relationOf(D, O) {
  if (O === D) return 'bijie' // 比劫（同我）— 助
  if (GENERATED_BY[D] === O) return 'yin' // 印（生我）— 助
  if (GENERATES[D] === O) return 'shishang' // 食伤（我生）— 泄
  if (CONTROLS[D] === O) return 'cai' // 财（我克）— 耗
  if (CONTROLLED_BY[D] === O) return 'guansha' // 官杀（克我）— 克
  return 'unknown'
}
const isSupporter = (rel) => rel === 'bijie' || rel === 'yin'

// 日主基调（性格核心，按五行）
const ELEMENT_TRAIT = {
  wood: { zh: '成长型、向上生长，重方向与可能性，喜开拓', en: 'growth-minded, forward-reaching, drawn to direction and possibility' },
  fire: { zh: '表达型、热度高节奏快，有感染力，能点燃人', en: 'expressive, warm and fast-moving, naturally able to energize a room' },
  earth: { zh: '稳健型、重承诺讲实在，踏实包容、可托付', en: 'steady and dependable, grounded and inclusive, someone people trust' },
  metal: { zh: '条理型、标准清晰判断果断，善于把混乱收拢成秩序', en: 'principled and decisive, good at bringing order to messy situations' },
  water: { zh: '灵活型、善感知会变通，思路流动、适应力强', en: 'adaptable and perceptive, fluid in thinking with strong instincts' },
}

// 旺衰对基调的修饰
const STRENGTH_MOD = {
  strong: {
    zh: '这股能量偏旺、主见强、扛得住事，状态足时很有冲劲；要留意的是别太刚、给自己留点听劝和转弯的余地。',
    en: 'This energy runs strong — self-directed, resilient, with real drive when in form. The thing to watch is leaving room to bend and to take advice.',
  },
  balanced: {
    zh: '这股能量较为中和，既稳得住又能变通，可塑性强、能屈能伸，是比较好相处也好合作的一类。',
    en: 'This energy sits fairly balanced — steady yet flexible, adaptable, able to give and take. An easy temperament to work with.',
  },
  weak: {
    zh: '这股能量偏柔、更擅长借力与配合，灵活、不争；要留意的是关键决定上别被环境推着走，多给自己一点主张。',
    en: 'This energy runs softer — good at leaning on others and collaborating, flexible and non-confrontational. The thing to watch is holding your own view on the decisions that matter.',
  },
}

// 喜用五行 → 可发挥/宜亲近的方向（参考倾向，非改运处方）
const FAVOR_DIRECTION = {
  wood: { zh: '有成长性、讲规划和方向的事，教育、文创、从零做起的开拓', en: 'growth-oriented work with planning and direction — building, teaching, creative starts' },
  fire: { zh: '需要表达、展示、与人连接、有热度的场合', en: 'roles that involve expression, visibility and connecting with people' },
  earth: { zh: '踏实积累、讲秩序与信任关系的领域', en: 'steady, accumulative work built on order and trusted relationships' },
  metal: { zh: '讲规则、判断、精炼度和专业门槛的领域', en: 'fields that reward standards, judgment, precision and expertise' },
  water: { zh: '需要灵活、流动、信息与变通的领域', en: 'flexible, information-rich work that rewards adaptability' },
}

/**
 * 解读引擎第①层主函数
 * @param chart computeBazi() 的返回（含 pillars[]、dayElement）
 * @param lang 'zh' | 'en'
 */
export function analyzeChart(chart, lang = 'zh') {
  const L = (o) => (lang === 'en' ? o.en : o.zh)
  const D = chart.dayElement // 日主五行
  const byKey = Object.fromEntries(chart.pillars.map((p) => [p.key, p]))

  // —— 1) 得令：看月支五行是否 生/同 日主
  const monthZhiEl = byKey.month.zhiElement
  const inSeason = monthZhiEl === D || GENERATED_BY[D] === monthZhiEl

  // —— 2) 同党计数：除「日干」与「月支」外的其余 6 个字里，比劫/印 的数量
  const others = []
  for (const p of chart.pillars) {
    if (p.key !== 'day') others.push(p.ganElement) // 各柱天干（含日支所在柱的天干即日干→已排除 day 的天干）
    if (p.key !== 'month') others.push(p.zhiElement) // 各柱地支（排除月支）
  }
  // 上面会把「日干」排除（day 柱天干不入）、把「月支」排除（month 柱地支不入），共 6 个字
  let support = 0
  for (const el of others) if (isSupporter(relationOf(D, el))) support++

  // —— 3) 评分与三档（得令 +3；每个同党 +1，范围 0–9）
  const score = (inSeason ? 3 : 0) + support
  let tier = 'balanced'
  if (score >= 5) tier = 'strong'
  else if (score <= 2) tier = 'weak'

  // —— 4) 喜用神倾向（扶抑法）
  let favorEls, avoidEls, favorShishenZh, favorShishenEn
  if (tier === 'weak') {
    favorEls = [GENERATED_BY[D], D] // 印 + 比劫（生我、帮我）
    avoidEls = [GENERATES[D], CONTROLS[D], CONTROLLED_BY[D]]
    favorShishenZh = '印、比劫（生扶日主）'
    favorShishenEn = 'Resource & Companion (support the self)'
  } else if (tier === 'strong') {
    favorEls = [GENERATES[D], CONTROLS[D], CONTROLLED_BY[D]] // 食伤 + 财 + 官杀（泄、耗、克）
    avoidEls = [GENERATED_BY[D], D]
    favorShishenZh = '食伤、财、官杀（疏泄旺气）'
    favorShishenEn = 'Output, Wealth & Authority (channel the surplus)'
  } else {
    // 中和：顺势而为，倾向补「最少」的五行
    const counts = chart.counts
    const min = Math.min(...Object.values(counts))
    favorEls = Object.keys(counts).filter((e) => counts[e] === min)
    avoidEls = []
    favorShishenZh = '趋于平衡，缺什么补什么'
    favorShishenEn = 'balanced — lean toward whatever is least present'
  }
  favorEls = [...new Set(favorEls)]

  // —— 5) 组装文案（结构化 + 可读）
  const tierZh = { strong: '偏旺（身强）', balanced: '中和', weak: '偏弱（身弱）' }[tier]
  const tierEn = { strong: 'Strong', balanced: 'Balanced', weak: 'Weak' }[tier]

  const reasonZh =
    `日主为${EL_ZH[D]}，生于${EL_ZH[monthZhiEl]}月——` +
    (inSeason ? '当月之气生扶日主，属得令；' : '当月之气未生扶日主，属失令；') +
    `八字中生扶日主（印、比劫）的字共 ${support} 个。综合判为「${tierZh}」。`
  const reasonEn =
    `The Day Master is ${EL_EN[D]}, born in a ${EL_EN[monthZhiEl]} month — ` +
    (inSeason ? 'the season supports it (in-season); ' : 'the season does not support it (out-of-season); ') +
    `${support} of the other characters reinforce it. Overall: ${tierEn}.`

  const elNames = (arr) => arr.map((e) => (lang === 'en' ? EL_EN[e] : EL_ZH[e])).join(lang === 'en' ? ' / ' : '、')

  const favorLogic = lang === 'en'
    ? `As a ${tierEn.toLowerCase()} Day Master, the chart leans toward ${favorShishenEn}, i.e. the elements ${elNames(favorEls)}.`
    : `日主${tierZh}，喜用倾向于${favorShishenZh}，对应五行：${elNames(favorEls)}。`

  // 性格主述：基调 + 旺衰修饰
  const core = `${L(ELEMENT_TRAIT[D])}。${L(STRENGTH_MOD[tier])}`
  // 可发挥方向：由喜用五行映射
  const leverage = favorEls.map((e) => L(FAVOR_DIRECTION[e])).join(lang === 'en' ? '; ' : '；')

  return {
    dayElement: D,
    strength: { tier, label: lang === 'en' ? tierEn : tierZh, score, inSeason, supportCount: support, reason: lang === 'en' ? reasonEn : reasonZh },
    favor: { elements: favorEls, avoidElements: avoidEls, logic: favorLogic },
    traits: {
      core,
      leverage: lang === 'en' ? `Energy you can lean into: ${leverage}.` : `你顺手、可发挥的方向：${leverage}。`,
    },
    source: lang === 'en' ? 'Method: strength & favorable-element (fú-yì) analysis, from classics such as Yuanhai Ziping and Ditian Sui.' : '判法：扶抑用神法，源出《渊海子平》《滴天髓》等公有古籍。',
  }
}
