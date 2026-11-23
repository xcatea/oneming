import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildFacts, userPrompt } from '../functions/api/reading.js'

const pillars = [
  { key: 'year', gan: '壬', zhi: '申' },
  { key: 'month', gan: '癸', zhi: '卯' },
  { key: 'day', gan: '癸', zhi: '巳' },
  { key: 'time', gan: '丁', zhi: '巳' },
]

test('server-derived AI facts contain only chart interpretation fields', () => {
  const facts = buildFacts(pillars, 'en')
  assert.deepEqual(Object.keys(facts).sort(), [
    'core', 'dayElement', 'dayGan', 'favorElements', 'favorLogic',
    'leverage', 'strengthLabel', 'strengthReason',
  ].sort())
})

test('DeepSeek prompt excludes raw birth details, identity and birthplace in both languages', () => {
  const facts = buildFacts(pillars, 'en')
  const sensitive = {
    ...facts,
    birthDate: 'DOB_SENTINEL_1975_02_06',
    birthTime: 'TIME_SENTINEL_09_30',
    name: 'NAME_SENTINEL',
    birthplace: 'PLACE_SENTINEL',
    latitude: 123.456,
    longitude: 45.678,
  }
  for (const lang of ['en', 'zh']) {
    const prompt = userPrompt(sensitive, lang)
    for (const value of ['DOB_SENTINEL', 'TIME_SENTINEL', 'NAME_SENTINEL', 'PLACE_SENTINEL', '123.456', '45.678']) {
      assert.ok(!prompt.includes(value), `${lang} prompt leaked ${value}`)
    }
    assert.ok(prompt.includes(facts.dayGan))
  }
})
