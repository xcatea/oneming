import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildGrowth } from '../scripts/gen-growth.mjs'
import { STRINGS } from '../src/strings.js'

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
  assert.ok(STRINGS.en.aiOptInLabel)
  assert.ok(STRINGS.en.aiOptInHint)
  assert.ok(STRINGS.zh.privacyLink)
  assert.ok(STRINGS.zh.aiOptInLabel)
  assert.ok(STRINGS.zh.aiOptInHint)
})

test('Chinese privacy and AI notice source describes derived facts and caching', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../scripts/gen-static.mjs', import.meta.url), 'utf8')
  assert.ok(source.includes('DeepSeek'))
  assert.ok(source.includes('最多 30 天'))
  assert.ok(source.includes('原始出生日期、出生时间、姓名和出生地不会发送给 AI 服务'))
})

test('third-party AI reading is off by default and called only after opt-in', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')
  assert.ok(source.includes('const [aiEnabled, setAiEnabled] = useState(false)'))
  assert.ok(source.includes('aiEnabled ? callModel : null'))
  assert.ok(source.includes('checked={aiEnabled}'))
})
