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

test('English year pages qualify Lichun as a convention, not a universal official rule', () => {
  const pages = generatedPages()
  for (const [path, html] of pages) {
    const parts = path.split('/')
    if (parts.length !== 4 || parts[0] !== 'en' || parts[1] !== 'chinese-zodiac' ||
        !/^[0-9]{4}$/.test(parts[2]) || parts[3] !== 'index.html') continue
    assert.ok(!html.includes('BaZi uses Lichun (Start of Spring) as the year boundary'), path)
    assert.ok(html.includes('Some BaZi schools and practitioners use Lichun'), path)
    assert.ok(html.includes('Hong Kong Observatory'), path)
  }
})

test('Chinese year pages explain the difference between official lunar-year and Lichun conventions', () => {
  const pages = generatedPages()
  for (const [path, html] of pages) {
    const parts = path.split('/')
    if (parts.length !== 3 || parts[0] !== 'shengxiao' ||
        !/^[0-9]{4}$/.test(parts[1]) || parts[2] !== 'index.html') continue
    assert.ok(html.includes('部分八字流派和命理实践以立春作为年柱分界'), path)
    assert.ok(html.includes('官方农历干支纪年则以正月初一为岁首'), path)
    assert.ok(html.includes('香港天文台《今夕是何年？》'), path)
  }
})

test('zodiac hubs and 2027 / beginner pages use qualified boundary language', () => {
  const pages = generatedPages()
  const zhHub = pages.get('shengxiao/index.html')
  const enHub = pages.get('en/chinese-zodiac/index.html')
  const zh2027 = pages.get('2027-huoyang/index.html')
  const en2027 = pages.get('en/2027-year-of-the-fire-goat/index.html')
  const beginner = pages.get('en/bazi-for-beginners/index.html')

  assert.ok(zhHub.includes('部分八字流派和命理实践'))
  assert.ok(enHub.includes('Some BaZi schools and practitioners'))
  assert.ok(zh2027.includes('部分八字流派采用立春换年'))
  assert.ok(zh2027.includes('采用立春换年口径的八字年柱已是丁未'))
  assert.ok(!zh2027.includes('八字年柱却已是丁未'))
  assert.ok(zh2027.includes('香港天文台《今夕是何年？》'))
  assert.ok(zh2027.includes('https://www.weather.gov.hk/sc/education/astronomy-and-time/time-service/00506-what-year-is-it-today.html'))
  assert.ok(en2027.includes('Some BaZi schools and practitioners use Lichun'))
  assert.ok(en2027.includes('Hong Kong Observatory explanation'))
  assert.ok(en2027.includes('https://www.weather.gov.hk/en/education/astronomy-and-time/time-service/00506-what-year-is-it-today.html'))
  assert.ok(beginner.includes('Month pillars traditionally follow solar terms'))
  assert.ok(beginner.includes('some BaZi schools also use Li Chun'))
  assert.ok(!beginner.includes('In BaZi, the year pillar commonly changes'))
})
