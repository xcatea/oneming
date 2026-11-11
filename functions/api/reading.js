// 一命 · /api/reading —— DeepSeek 解读代理（Cloudflare Pages Function）
// 安全要点：
//  1. API Key 只来自 CF 环境密钥 env.DEEPSEEK_API_KEY，不进前端/不进 GitHub。
//  2. 客户端只传"干支"（最多 8 个字）+ 语言，服务端自己重算旺衰/喜用并构建 Prompt，
//     外部无法注入任何自由文本，本接口不能被当成通用 LLM 盗用。
//  3. 无状态：不接触出生日期，不存储、不日志化。
//  4. 同一张盘的结果走 Cloudflare Cache API 缓存（盘面组合有限，命中率高，几乎不重复花钱）。
//  5. 可选限流：绑定 KV（变量名 RATE_KV）后按 IP 每分钟限次；不绑定则跳过。
//  6. 反啰嗦 + 合规：硬字数上限 + max_tokens 截断 + 服务端合规过滤。

import { analyzeChart } from '../../src/analyze.js'
import { chartFromPillars, isValidPillars, ELEMENT_META } from '../../src/wuxing.js'
import { SITE } from '../../src/site.config.js'

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const PROMPT_VERSION = 'v2' // 改 Prompt 时 +1，旧缓存自动失效
const RATE_LIMIT_PER_MIN = 20

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
- Favorable elements: ${f.favorElements.join(' / ')} — ${f.favorLogic}
- Tone cue: ${f.core}
- Direction cue: ${f.leverage}
Write the reading now.`
  }
  return `【盘面事实】
- 日主：${f.dayGan}（${f.dayElement}）
- 旺衰：${f.strengthLabel}——${f.strengthReason}
- 喜用五行：${f.favorElements.join('、')}——${f.favorLogic}
- 性格线索：${f.core}
- 方向线索：${f.leverage}
请据此撰写解读。`
}

// 服务端用确定性引擎自己算事实（不信任客户端传来的任何文字）
function buildFacts(pillars, lang) {
  const chart = chartFromPillars(pillars)
  const a = analyzeChart(chart, lang)
  const el = (e) => ELEMENT_META[e][lang === 'en' ? 'en' : 'zh']
  return {
    dayGan: chart.dayGan,
    dayElement: el(a.dayElement),
    strengthLabel: a.strength.label,
    strengthReason: a.strength.reason,
    favorElements: a.favor.elements.map(el),
    favorLogic: a.favor.logic,
    core: a.traits.core,
    leverage: a.traits.leverage,
  }
}

// 服务端合规兜底过滤
const DENY = /(改运|转运|开运|开光|化解|招财|辟邪|消灾|护身符|风水|命中注定|注定|必然|一定会|大吉|大凶|凶险|劫难|灾祸|婚姻(会|将|方面)|财运(会|将|预测)|寿命|哪一年|change (your )?(fate|luck)|fortune-?tell|destined|lucky charm|talisman|feng ?shui|disaster|lifespan)/i

function hostOf(v) {
  try { return new URL(v).hostname.toLowerCase() } catch (e) { return '' }
}

// 浏览器的同源 POST 一定带 Origin；没有 Origin/Referer 的一律视为脚本调用，拒绝
function allowOrigin(request) {
  const host = hostOf(request.headers.get('origin') || '') || hostOf(request.headers.get('referer') || '')
  if (!host) return false
  if (SITE.allowedHosts.includes(host)) return true
  if (SITE.allowPreviewHosts && host.endsWith('.pages.dev')) return true
  return host === 'localhost' || host === '127.0.0.1'
}

async function rateLimited(request, env) {
  if (!env.RATE_KV) return false
  try {
    const ip = request.headers.get('cf-connecting-ip') || 'unknown'
    const key = `rl:${ip}:${Math.floor(Date.now() / 60000)}`
    const n = parseInt((await env.RATE_KV.get(key)) || '0', 10)
    if (n >= RATE_LIMIT_PER_MIN) return true
    await env.RATE_KV.put(key, String(n + 1), { expirationTtl: 120 })
  } catch (e) { /* KV 异常时不拦截 */ }
  return false
}

function cacheRequest(pillars, lang, mode) {
  const id = pillars.map((p) => p.key[0] + p.gan + p.zhi).join('')
  return new Request(`https://cache.${SITE.domain}/reading/${PROMPT_VERSION}/${lang}/${mode}/${encodeURIComponent(id)}`)
}

export async function onRequestPost(context) {
  const { request, env } = context
  try {
    if (!allowOrigin(request)) return json({ error: 'forbidden' }, 403)

    const body = await request.json().catch(() => null)
    if (!body || !isValidPillars(body.pillars)) return json({ error: 'bad_pillars' }, 400)
    const pillars = body.pillars.map((p) => ({ key: p.key, gan: p.gan, zhi: p.zhi }))
    const lang = body.lang === 'en' ? 'en' : 'zh'
    const mode = body.mode === 'standard' ? 'standard' : 'concise'

    // 1) 先查缓存
    const cache = typeof caches !== 'undefined' ? caches.default : null
    const ckey = cacheRequest(pillars, lang, mode)
    if (cache) {
      const hit = await cache.match(ckey)
      if (hit) return json({ text: (await hit.json()).text, cached: true }, 200)
    }

    // 2) 再限流（命中缓存的请求不计次）
    if (await rateLimited(request, env)) return json({ error: 'rate_limited' }, 429)
    if (!env.DEEPSEEK_API_KEY) return json({ error: 'no_key' }, 500)

    const facts = buildFacts(pillars, lang)
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
          { role: 'user', content: userPrompt(facts, lang) },
        ],
        max_tokens: mode === 'standard' ? 480 : 240,
        temperature: 0.6,
        stream: false,
      }),
      signal: AbortSignal.timeout(12000),
    })

    if (!resp.ok) return json({ error: 'upstream', status: resp.status }, 502)
    const data = await resp.json()
    const text = data?.choices?.[0]?.message?.content?.trim() || ''
    if (!text || DENY.test(text)) return json({ error: 'rejected' }, 422)

    // 3) 写缓存（30 天）
    if (cache) {
      const toCache = new Response(JSON.stringify({ text }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=2592000' },
      })
      context.waitUntil(cache.put(ckey, toCache))
    }
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
