import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ZODIAC_ANIMAL_EN, zodiacLabel } from '../src/zodiac-label.js'
import { computeBazi } from '../src/bazi.js'

test('all twelve lunar zodiac animals have English labels', () => {
  assert.equal(Object.keys(ZODIAC_ANIMAL_EN).length, 12)
  for (const [zh, en] of Object.entries(ZODIAC_ANIMAL_EN)) {
    assert.equal(zodiacLabel(zh, 'en'), en)
    assert.equal(zodiacLabel(zh, 'zh'), zh)
  }
})

test('lunar zodiac label is independent of BaZi year pillar around Li Chun', () => {
  const chart = computeBazi(1975, 2, 6, 12, 0, 'male', 'en')
  assert.equal(zodiacLabel(chart.shengxiao, 'en'), 'Tiger')
  assert.equal(chart.pillars.find((p) => p.key === 'year').gan + chart.pillars.find((p) => p.key === 'year').zhi, '乙卯')
})

test('unknown animal labels are not silently replaced with invented translations', () => {
  assert.equal(zodiacLabel('?', 'en'), '?')
})
