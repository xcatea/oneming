import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildGrowth } from '../scripts/gen-growth.mjs'
import { STRINGS } from '../src/strings.js'
import { ga4Tags } from '../scripts/page-kit.mjs'

test('English privacy and AI notice explain the real DeepSeek data flow', () => {
  const pages = new Map()
  buildGrowth({ write: (path, html) => pages.set(path, html), ALL: [] })
  const privacy = pages.get('en/privacy/index.html')
  const aiNotice = pages.get('en/ai-notice/index.html')
  assert.ok(privacy.includes('DeepSeek'))
  assert.ok(privacy.includes('optional and off by default'))
  assert.ok(privacy.includes('raw birth date, birth time, name and birthplace'))
  assert.ok(privacy.includes('up to 30 days'))
  assert.ok(privacy.includes('Cloudflare infrastructure'))
  assert.ok(privacy.includes('an existing cached reading may still be served'))
  assert.ok(privacy.includes('provider'))
  assert.ok(aiNotice.includes('DeepSeek'))
  assert.ok(aiNotice.includes('optional and off by default'))
  assert.ok(aiNotice.includes('/en/privacy/'))
})

test('both calculator languages disclose AI-derived chart facts before use', () => {
  assert.ok(STRINGS.en.aiDataNote.includes('DeepSeek'))
  assert.ok(STRINGS.en.aiDataNote.includes('raw birth date'))
  assert.ok(STRINGS.zh.aiDataNote.includes('DeepSeek'))
  assert.ok(STRINGS.zh.aiDataNote.includes('原始出生日期'))
  assert.ok(STRINGS.en.privacyLink)
  assert.ok(STRINGS.en.shareHint.includes('birth date, time, gender'))
  assert.ok(STRINGS.en.aiOptInLabel)
  assert.ok(STRINGS.en.aiOptInHint)
  assert.ok(STRINGS.en.readingSourceAI)
  assert.ok(STRINGS.en.readingSourceFallback)
  assert.ok(STRINGS.zh.privacyLink)
  assert.ok(STRINGS.zh.shareHint.includes('出生日期、时间、性别'))
  assert.ok(STRINGS.zh.aiOptInLabel)
  assert.ok(STRINGS.zh.aiOptInHint)
  assert.ok(STRINGS.zh.readingSourceAI)
  assert.ok(STRINGS.zh.readingSourceFallback)
})

test('Chinese privacy and AI notice source describes derived facts and caching', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../scripts/gen-static.mjs', import.meta.url), 'utf8')
  assert.ok(source.includes('DeepSeek'))
  assert.ok(source.includes('最多 30 天'))
  assert.ok(source.includes('AI 辅助措辞为可选项，默认关闭'))
  assert.ok(source.includes('AI 辅助措辞默认关闭'))
  assert.ok(source.includes('已有缓存结果仍可返回'))
  assert.ok(source.includes('原始出生日期、出生时间、姓名和出生地不会发送给 AI 服务'))
})

test('third-party AI reading is off by default and called only after opt-in', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')
  assert.ok(source.includes('const [aiEnabled, setAiEnabled] = useState(false)'))
  assert.ok(source.includes('aiEnabled ? callModel : null'))
  assert.ok(source.includes('checked={aiEnabled}'))
})

test('English privacy page explains share-link URL parameters and request exposure', () => {
  const pages = new Map()
  buildGrowth({ write: (path, html) => pages.set(path, html), ALL: [] })
  const privacy = pages.get('en/privacy/index.html')
  assert.ok(privacy.includes('URL query string'))
  assert.ok(privacy.includes('hosting/CDN infrastructure'))
  assert.ok(privacy.includes('browser history'))
  assert.ok(privacy.includes('does not include your name'))
})

test('GA4 page views strip query parameters from both location and referrer', () => {
  const tags = ga4Tags('G-TEST123')
  assert.ok(tags.includes('send_page_view:false'))
  assert.ok(tags.includes('u.origin + u.pathname'))
  assert.ok(tags.includes('page_location:pageLocation'))
  assert.ok(tags.includes('page_referrer:pageReferrer'))
  assert.ok(!tags.includes("gtag('config','G-TEST123');"))
  assert.equal(ga4Tags(''), '')
})

test('privacy notices disclose GA4 query-string stripping', () => {
  const pages = new Map()
  buildGrowth({ write: (path, html) => pages.set(path, html), ALL: [] })
  const privacy = pages.get('en/privacy/index.html')
  assert.ok(privacy.includes('query strings are removed'))
  assert.ok(privacy.includes('not sent to GA4'))
})
