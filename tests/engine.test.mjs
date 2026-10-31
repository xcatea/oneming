// 排盘引擎回归测试：立春交界、三柱、农历换算、旺衰喜用的确定性
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeBazi, lunarToSolar, solarToLunar, lunarLeapMonth } from '../src/bazi.js'
import { analyzeChart } from '../src/analyze.js'

const gz = (c, k) => { const p = c.pillars.find((x) => x.key === k); return p.gan + p.zhi }

test('年柱以立春为界（1990 年立春 2 月 4 日 10:14）', () => {
  assert.equal(gz(computeBazi(1990, 2, 4, 10, 10), 'year'), '己巳')
  assert.equal(gz(computeBazi(1990, 2, 4, 10, 20), 'year'), '庚午')
})

test('月柱以节气为界：惊蛰前后月柱不同', () => {
  const before = computeBazi(2026, 3, 4, 12, 0)
  const after = computeBazi(2026, 3, 6, 12, 0)
  assert.notEqual(gz(before, 'month'), gz(after, 'month'))
})

test('时辰未知：只有三柱，分析标记 hourKnown=false', () => {
  const c = computeBazi(1995, 8, 15, 0, 0, 'male', 'zh', false)
  assert.equal(c.pillars.length, 3)
  assert.ok(!c.pillars.some((p) => p.key === 'time'))
  assert.equal(Object.values(c.counts).reduce((a, b) => a + b, 0), 6)
  assert.equal(analyzeChart(c, 'zh').strength.hourKnown, false)
})

test('农历↔公历：2023 闰二月十五 = 2023-04-05', () => {
  assert.equal(lunarLeapMonth(2023), 2)
  assert.deepEqual(lunarToSolar(2023, 2, true, 15), { y: 2023, m: 4, d: 5 })
  assert.deepEqual(solarToLunar(2023, 4, 5), { y: 2023, m: 2, leap: true, d: 15 })
})

test('农历日超出当月天数时取当月最后一天', () => {
  // 2023 年闰二月只有 29 天
  assert.deepEqual(lunarToSolar(2023, 2, true, 30), lunarToSolar(2023, 2, true, 29))
})

test('示范盘的旺衰与喜用保持稳定（入门手册与网站共用）', () => {
  const c = computeBazi(1992, 3, 18, 9, 30, 'female', 'zh')
  assert.deepEqual(c.pillars.map((p) => p.gan + p.zhi), ['壬申', '癸卯', '癸巳', '丁巳'])
  const a = analyzeChart(c, 'zh')
  assert.equal(a.strength.tier, 'balanced')
  assert.deepEqual(a.favor.elements, ['earth'])
})

test('英文解读文本不混入中文标点', () => {
  const a = analyzeChart(computeBazi(1992, 3, 18, 9, 30, 'female', 'en'), 'en')
  for (const s of [a.traits.core, a.traits.leverage, a.favor.logic, a.strength.reason]) assert.doesNotMatch(s, /[。，；]/)
})
