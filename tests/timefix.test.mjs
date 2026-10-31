// 出生时间校正：夏令时口径、真太阳时、海外时区
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inChinaDST, correctTime, equationOfTime, placeClockHint } from '../src/timefix.js'
import { placeById, CN_PROVINCES } from '../src/places.js'

const hm = (r) => `${r.y}-${r.m}-${r.d} ${String(r.hh).padStart(2, '0')}:${String(r.mm).padStart(2, '0')}`

test('中国夏令时按通行口径：1988 起始 4/10，起止日都含', () => {
  assert.equal(inChinaDST(1988, 4, 10), true)
  assert.equal(inChinaDST(1988, 4, 9), false)
  assert.equal(inChinaDST(1991, 9, 15), true)
  assert.equal(inChinaDST(1991, 9, 16), false)
  assert.equal(inChinaDST(1995, 7, 1), false)
})

test('不选出生地、不确认夏令时：时间原样', () => {
  assert.equal(hm(correctTime({ y: 1990, m: 7, d: 1, hh: 9, mm: 0 })), '1990-7-1 09:00')
})

test('大陆夏令时只在用户确认后扣 1 小时，可跨日', () => {
  assert.equal(hm(correctTime({ y: 1990, m: 7, d: 1, hh: 0, mm: 30, dst: false })), '1990-7-1 00:30')
  const r = correctTime({ y: 1990, m: 7, d: 1, hh: 0, mm: 30, dst: true })
  assert.equal(hm(r), '1990-6-30 23:30')
  assert.equal(r.notes.dst, 60)
})

test('真太阳时：乌鲁木齐 8:00 约为 5:46', () => {
  const r = correctTime({ y: 1995, m: 8, d: 15, hh: 8, mm: 0, place: 'cn:新疆维吾尔自治区:乌鲁木齐' })
  assert.equal(r.hh, 5)
  assert.ok(r.mm >= 44 && r.mm <= 48, `got ${hm(r)}`)
})

test('海外：纽约 1990-07-01 09:00 夏令时 → 真太阳时约 08:01', () => {
  assert.deepEqual(placeClockHint('w:New York', 1990, 7, 1, 9, 0), { kind: 'zone-dst', diff: 60 })
  const r = correctTime({ y: 1990, m: 7, d: 1, hh: 9, mm: 0, place: 'w:New York', dst: true })
  assert.equal(hm(r), '1990-7-1 08:01')
})

test('海外旧时区：新加坡 1980 年为 +7:30，无夏令时提示', () => {
  assert.equal(placeClockHint('w:Singapore', 1980, 3, 1, 12, 0), null)
  const r = correctTime({ y: 1980, m: 3, d: 1, hh: 12, mm: 0, place: 'w:Singapore', dst: true })
  assert.equal(hm(r), '1980-3-1 11:13')
})

test('均时差在合理范围（2 月约 −14，11 月约 +16 分钟）', () => {
  assert.ok(Math.abs(equationOfTime(2026, 2, 11) + 14.2) < 0.5)
  assert.ok(Math.abs(equationOfTime(2026, 11, 3) - 16.4) < 0.5)
})

test('地点表：每个城市都有合理经度，ID 可回查', () => {
  for (const p of CN_PROVINCES) for (const c of p.cities) {
    assert.ok(c.lon > 73 && c.lon < 136, `${p.name} ${c.name} ${c.lon}`)
    assert.ok(placeById(`cn:${p.name}:${c.name}`))
  }
})
