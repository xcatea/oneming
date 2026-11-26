import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildGrowth } from '../scripts/gen-growth.mjs'
import { TERMS } from '../src/terms.js'
import { SHISHEN, RIZHU } from '../scripts/seo-data.mjs'

function generatedPages() {
  const pages = new Map()
  const ALL = [...TERMS.map((term) => ({ ...term, kind: 'term' })), ...SHISHEN, ...RIZHU]
  buildGrowth({ write: (path, html) => pages.set(path, html), ALL })
  return pages
}

test('1975 English zodiac page distinguishes Wood stem from Na Yin Water', () => {
  const pages = generatedPages()
  const html = pages.get('en/chinese-zodiac/1975/index.html')
  assert.ok(html)
  assert.ok(html.includes('Year of the Wood Rabbit'))
  assert.ok(html.includes('February 11, 1975'))
  assert.ok(html.includes('Da Xi Shui'))
  assert.ok(html.includes('Big Stream Water'))
  assert.ok(html.includes('two different layers'))
})

test('year pages qualify Lichun as a convention, not a universal official rule', () => {
  const pages = generatedPages()
  for (const [path, html] of pages) {
    if (!/^en\/chinese-zodiac\/\d{4}\/index\.html$/.test(path) &&
        !/^shengxiao\/\d{4}\/index\.html$/.test(path)) continue
    assert.ok(!html.includes('BaZi uses Lichun (Start of Spring) as the year boundary'), path)
    assert.ok(html.includes('Some BaZi schools and practitioners use Lichun'), path)
    assert.ok(html.includes('Hong Kong Observatory'), path)
  }
})

test('Chinese year pages explain the difference between official lunar-year and Lichun conventions', () => {
  const pages = generatedPages()
  for (const [path, html] of pages) {
    if (!/^shengxiao\/\d{4}\/index\.html$/.test(path)) continue
    assert.ok(html.includes('部分八字流派和命理实践以立春作为年柱分界'), path)
    assert.ok(html.includes('官方农历干支纪年则以正月初一为岁首'), path)
    assert.ok(html.includes('香港天文台《今夕是何年？》'), path)
  }
})
