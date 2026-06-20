// 一命 · 解读引擎 第②层（AI 文笔层 · 模型无关）
// 职责：把第①层 analyze.js 的【结构化事实】转成流畅、具体、像在说"你这个人"的解读。
// 设计原则：
//   1. 模型无关——本模块只负责"造提示词 + 校验输出 + 兜底"，真正的模型调用由外部 callModel 注入。
//   2. 事实约束——AI 只能改写给定事实，不得新增预测/术语/数字。
//   3. 合规兜底——输出过一道关键词拦截；不过则重试或回退到确定性文案。
//   4. 永不崩——没接模型 / 模型不可用 / 输出违规，都回退到 fallbackProse，站点照常出文。

const EL_ZH = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }
const EL_EN = { wood: 'Wood', fire: 'Fire', earth: 'Earth', metal: 'Metal', water: 'Water' }

// ---------- Prompt 构建 ----------

const SYSTEM_ZH = `你是"一命"的命理解读撰写助手。你的唯一任务：把我给你的【盘面事实】改写成一段流畅、具体、像在对一个真实的人说话的中文解读。

严格规则（违反任一条都算失败）：
1. 只能使用我提供的【盘面事实】。不得新增任何事实、术语、推断或数字，每一句都要能追溯到给定事实。事实不足以支撑的话，就不写。
2. 这是自我认知与文化参考工具，不是预测。禁止对未来、运势、吉凶、灾祸、婚姻、财运、健康、寿命、具体年份或事件作任何预测或断言。
3. 禁止"命中注定/必然/一定会"式断言；用"倾向、往往、容易、可以"这类描述性、留余地的措辞。
4. 禁止任何改运、转运、开运、化解、佩戴某物、风水布置等改命或带货暗示。
5. 只写三件事：① 性格基调（结合日主与旺衰）；② 你顺手、可发挥的方向（结合喜用）；③ 一个温和、建设性的自我提醒（是提醒，不是警告灾祸）。
6. 要具体、忌空泛：不写"你是个善良的人"这类放之四海皆准的废话；结合这张盘的五行/旺衰组合，举可感知的行为例子（如"在团队里你往往…"）。
7. 语气温和、平视、克制，像一个懂行又不端架子的朋友，不神神叨叨、不装大师。
8. 220–320 字，3–4 段，不分小标题、不用列表。
9. 结尾点明一句：这是对你天生倾向的参考性描述，怎么走仍在你自己。

宁可短，不可编。`

const SYSTEM_EN = `You are the reading writer for "ONEMING", a free Chinese BaZi (Four Pillars) tool. Your only task: turn the [CHART FACTS] I give you into one fluent, specific English passage that reads like it's about a real person.

Strict rules (breaking any one is a failure):
1. Use ONLY the [CHART FACTS] provided. Add no new facts, terms, inferences or numbers; every sentence must trace to a given fact. If a fact isn't there, don't write it.
2. This is a self-reflection and cultural tool, NOT prediction. Never predict or assert anything about the future, luck, fortune, disaster, marriage, money, health, lifespan, specific years or events.
3. No "destined / will definitely / inevitably" claims. Use descriptive, open-ended wording: "tends to, often, can, may".
4. No fate-changing or product hints: no luck-changing, charms, talismans, feng shui, "wear X to attract Y".
5. Write only three things: (a) character tone (from Day Master + strength); (b) directions you can lean into (from favorable elements); (c) one gentle, constructive self-reminder (a reminder, not a warning of doom).
6. Be specific, avoid generic filler. No Barnum lines like "you are a kind person". Ground it in this chart's element/strength mix, with observable behavioral examples ("on a team, you tend to…").
7. Briefly gloss Chinese concepts for a non-Chinese reader (e.g. "Day Master — your core self"). Warm, level, restrained tone; a knowledgeable friend, not a mystic.
8. 180–260 words, 3–4 short paragraphs, no headers, no lists.
9. End by noting this describes natural tendencies for reflection — where you take it is up to you.

Better short than invented.`

export function buildPrompt(analysis, chart, lang = 'zh') {
  const elName = (e) => (lang === 'en' ? EL_EN[e] : EL_ZH[e])
  const favorList = analysis.favor.elements.map(elName).join(lang === 'en' ? ' / ' : '、')

  if (lang === 'en') {
    const user = `[CHART FACTS]
- Day Master: ${chart.dayGan} (${EL_EN[analysis.dayElement]})
- Strength: ${analysis.strength.label} — ${analysis.strength.reason}
- Favorable-element lean: ${favorList} — ${analysis.favor.logic}
- Character-tone cue: ${analysis.traits.core}
- Direction cue: ${analysis.traits.leverage}

Write the reading now.`
    return { system: SYSTEM_EN, user }
  }
  const user = `【盘面事实】
- 日主：${chart.dayGan}（${EL_ZH[analysis.dayElement]}）
- 旺衰：${analysis.strength.label}——${analysis.strength.reason}
- 喜用五行倾向：${favorList}——${analysis.favor.logic}
- 性格基调线索：${analysis.traits.core}
- 可发挥方向线索：${analysis.traits.leverage}

请据此撰写解读。`
  return { system: SYSTEM_ZH, user }
}

// ---------- 合规拦截（安全网，非主控） ----------
// 主控是"只喂事实 + 系统提示"。此处是独立于模型的兜底过滤，
// 即便本地小模型不听话，违规词命中也会触发重写或回退。
const DENY_ZH = /(改运|转运|开运|开光|化解|招财|辟邪|消灾|护身符|风水|命中注定|注定|必然|一定会|大吉|大凶|凶险|劫难|灾祸|婚姻(会|将|方面)|财运(会|将|预测)|寿命|享年|活到|哪一年|某年|本命佛|戴.{0,4}(可|能|招|辟))/
const DENY_EN = /(change (your )?(fate|luck|destiny)|good luck|bad luck|fortune-?tell|destined|will (definitely|surely|certainly)|inevitabl|marriage will|wealth will|money will|lucky charm|talisman|amulet|feng ?shui|disaster|misfortune|lifespan|live to|which year)/i

export function validateReading(text, lang = 'zh') {
  if (!text || text.trim().length < 40) return { ok: false, reason: 'too_short' }
  const deny = lang === 'en' ? DENY_EN : DENY_ZH
  const m = text.match(deny)
  if (m) return { ok: false, reason: 'deny_hit', hit: m[0] }
  return { ok: true }
}

// ---------- 确定性兜底文案（无需任何模型） ----------
const WATCH = {
  strong: { zh: '你天生的劲头足，偶尔记得给别人和别的可能性留点位置，会让这股力量更顺。', en: 'Your drive runs strong; leaving room for other people and other options now and then lets it land better.' },
  balanced: { zh: '你能稳也能变，难点反而是别太"什么都行"，在要紧处明确给个方向。', en: 'You can be steady or flexible; the catch is not being endlessly easygoing — pick a clear direction where it counts.' },
  weak: { zh: '你善于借力，这是优点；只是在真正要紧的选择上，别让环境替你做主。', en: 'Leaning on others is a strength; just don’t let circumstances make the calls that are really yours.' },
}

export function fallbackProse(analysis, lang = 'zh') {
  const t = analysis.strength.tier
  if (lang === 'en') {
    return [
      `Your Day Master — your core self — reads as ${analysis.strength.label.toLowerCase()}. ${analysis.traits.core}`,
      `${analysis.traits.leverage}`,
      `${WATCH[t].en}`,
      `This describes natural tendencies for reflection, not a fixed fate — where you take it is up to you.`,
    ].join('\n\n')
  }
  return [
    `你的日主（也就是"你自己"）整体${analysis.strength.label}。${analysis.traits.core}`,
    `${analysis.traits.leverage}`,
    `${WATCH[t].zh}`,
    `这是对你天生倾向的一种参考性描述，而非命定——怎么走，仍然在你自己。`,
  ].join('\n\n')
}

// ---------- 编排器（模型无关） ----------
/**
 * @param analysis  analyzeChart() 的输出
 * @param chart     computeBazi() 的输出
 * @param lang      'zh' | 'en'
 * @param callModel async ({system, user}) => string   —— 由外部注入（Ollama / API / 站内代理 / artifact）。不传则直接用兜底文案。
 * @param opts      { maxRetries=1 }
 * @returns { text, source }  source: 'ai' | 'fallback'
 */
export async function generateReading(analysis, chart, lang = 'zh', callModel = null, opts = {}) {
  const maxRetries = opts.maxRetries ?? 1
  if (typeof callModel !== 'function') {
    return { text: fallbackProse(analysis, lang), source: 'fallback' }
  }
  const prompt = buildPrompt(analysis, chart, lang)
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const out = await callModel(prompt, { analysis, chart, lang })
      const v = validateReading(out, lang)
      if (v.ok) return { text: out.trim(), source: 'ai' }
      // 违规则重试；最后一次仍违规则回退
    } catch (e) {
      break // 模型异常直接回退
    }
  }
  return { text: fallbackProse(analysis, lang), source: 'fallback' }
}
