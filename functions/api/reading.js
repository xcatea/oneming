// 一命 · /api/reading —— DeepSeek 解读代理（Cloudflare Pages Function）
// 安全要点：
//  1. API Key 只来自 CF 环境密钥 env.DEEPSEEK_API_KEY，不进前端/不进 GitHub。
//  2. Prompt 在服务端构建，外部只能传"盘面事实"，无法把本接口当通用 LLM 滥用。
//  3. 无状态：只收到已脱敏的干支/旺衰事实，不接触出生日期，不存储、不日志化。
//  4. 反啰嗦：硬字数上限 + max_tokens 截断 + 禁过渡水词；并做服务端合规过滤。

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'

// —— 反啰嗦 + 合规 的服务端系统提示 ——
function systemPrompt(lang, mode) {
  const concise = mode !== 'standard'
  if (lang === 'en') {
    return `You write the BaZi reading for "ONEMING". Turn the given CHART FACTS into plain, specific English about this person.
HARD RULES (break any = fail):
- Use ONLY the given facts. Add no facts, terms, numbers, or predictions. Don't restate the facts back.
- NOT prediction: never mention future, luck, fortune, disaster, marriage, money, health, lifespan, years or events.
- No "destined/will definitely/inevitably". No fate-changing, charms, talismans, feng shui.
- Cover only: character tone, a direction they can lean into, one gentle reminder.
- Be specific, no Barnum filler ("you are kind"). Ground each point in this chart's element/strength.
${concise ? '- LENGTH: at most 90 words, at most 3 sentences. Punchy, not an essay.' : '- LENGTH: 150–230 words, 3 short paragraphs.'}
- Ban these filler openers: "Overall", "In summary", "It's worth noting", "Generally speaking", "As we can see".
- Warm, level, like a sharp friend. End implying it's reflection, not fixed fate.
Better short than padded.`
  }
  return `你为"一命"撰写八字解读。把给定的【盘面事实】写成具体、说人话的中文，是在说这个人。
铁律（违反任一条算失败）：
- 只用给定事实，不加任何事实/术语/数字/预测；不要复述盘面，直接说结论。
- 这不是预测：绝不提未来、运势、吉凶、灾祸、婚姻、财运、健康、寿命、年份或事件。
- 不写"命中注定/必然/一定会"；不沾改运、转运、开光、佩戴、风水。
- 只讲三件：性格基调、一个可发挥的方向、一句温和提醒。
- 要具体，禁巴纳姆废话（"你是个善良的人"）；每句落到这张盘的五行/旺衰上。
${concise ? '- 长度：最多 120 字、最多 3 句。要短、要狠、要准，不写小作文。' : '- 长度：200–280 字，3 段。'}
- 禁用这些水词开头：综合来看、总的来说、值得注意的是、由此可见、不难看出、首先其次最后。
- 语气平视、克制，像个懂行的朋友点你两句。结尾暗示这是参考、非命定。
宁可短，不可注水。`
}

function userPrompt(f, lang) {
  if (lang === 'en') {
    return `[CHART FACTS]
- Day Master: ${f.dayGan} (${f.dayElement})
- Strength: ${f.strengthLabel} — ${f.strengthReason}
- Favorable elements: ${(f.favorElements || []).join(' / ')} — ${f.favorLogic}
- Tone cue: ${f.core}
- Direction cue: ${f.leverage}
Write the reading now.`
  }
  return `【盘面事实】
- 日主：${f.dayGan}（${f.dayElement}）
- 旺衰：${f.strengthLabel}——${f.strengthReason}
- 喜用五行：${(f.favorElements || []).join('、')}——${f.favorLogic}
- 性格线索：${f.core}
- 方向线索：${f.leverage}
请据此撰写解读。`
}

// 服务端合规兜底过滤
const DENY = /(改运|转运|开运|开光|化解|招财|辟邪|消灾|护身符|风水|命中注定|注定|必然|一定会|大吉|大凶|凶险|劫难|灾祸|婚姻(会|将|方面)|财运(会|将|预测)|寿命|哪一年|change (your )?(fate|luck)|fortune-?tell|destined|lucky charm|talisman|feng ?shui|disaster|lifespan)/i

function allowOrigin(request) {
  const o = (request.headers.get('origin') || request.headers.get('referer') || '').toLowerCase()
  if (!o) return true // 同源直连可能无 origin，放行
  return /oneming\.net|\.pages\.dev|localhost|127\.0\.0\.1/.test(o)
}

export async function onRequestPost(context) {
  const { request, env } = context
  try {
    if (!allowOrigin(request)) return json({ error: 'forbidden' }, 403)
    if (!env.DEEPSEEK_API_KEY) return json({ error: 'no_key' }, 500)

    const f = await request.json()
    // 最小校验：必须带核心事实，否则拒绝（防滥用）
    if (!f || !f.dayGan || !f.dayElement || !f.strengthLabel) {
      return json({ error: 'bad_facts' }, 400)
    }
    const lang = f.lang === 'en' ? 'en' : 'zh'
    const mode = f.mode === 'standard' ? 'standard' : 'concise'
    const maxTokens = mode === 'standard' ? 480 : 240

    const resp = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt(lang, mode) },
          { role: 'user', content: userPrompt(f, lang) },
        ],
        max_tokens: maxTokens,
        temperature: 0.6,
        stream: false,
      }),
    })

    if (!resp.ok) return json({ error: 'upstream', status: resp.status }, 502)
    const data = await resp.json()
    const text = data?.choices?.[0]?.message?.content?.trim() || ''
    if (!text || DENY.test(text)) return json({ error: 'rejected' }, 422)

    return json({ text }, 200)
  } catch (e) {
    return json({ error: 'server' }, 500)
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
