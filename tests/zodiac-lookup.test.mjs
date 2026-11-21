import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildGrowth } from '../scripts/gen-growth.mjs'

test('zodiac date checker covers 1900–2100 while detailed year pages stay bounded', () => {
  const pages = new Map()
  buildGrowth({ write: (path, html) => pages.set(path, html), ALL: [] })
  const hub = pages.get('en/chinese-zodiac/index.html')
  assert.ok(hub, 'English zodiac hub is generated')
  assert.match(hub, /min="1900-01-01" max="2100-12-31"/)
  assert.match(hub, /Date checker: 1900–2100/)
  assert.match(hub, /Detailed year guides: 1930–2035/)
  assert.match(hub, /h\[1\]>=1930&&h\[1\]<=2035/)
  assert.ok(pages.has('en/chinese-zodiac/1975/index.html'))
  assert.ok(!pages.has('en/chinese-zodiac/2100/index.html'))
  const woodRabbit = pages.get('en/chinese-zodiac/1975/index.html')
  assert.match(woodRabbit, /1975e\.pdf/)
  assert.match(woodRabbit, /San Ming Tong Hui/)
  assert.match(woodRabbit, /Li Chun time shown on this page/)
  const otherYear = pages.get('en/chinese-zodiac/1976/index.html')
  assert.doesNotMatch(otherYear, /1975e\.pdf/)
  const queryYears = [
    [1986, '1986e\\.pdf', 'Fire Tiger', '丙寅'],
    [1995, '1995e\\.pdf', 'Wood Pig', '乙亥'],
    [1998, '1998e\\.pdf', 'Earth Tiger', '戊寅'],
  ]
  for (const [year, source, label, stemBranch] of queryYears) {
    const page = pages.get(`en/chinese-zodiac/${year}/index.html`)
    assert.ok(page, `year page ${year} is generated`)
    assert.match(page, new RegExp(source))
    assert.match(page, new RegExp(label))
    assert.match(page, new RegExp(stemBranch))
    assert.match(page, /San Ming Tong Hui/)
  }
})
