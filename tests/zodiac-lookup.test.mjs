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

test('date checker shows the exact zodiac-year interval and flags the Li Chun-to-New Year gap', () => {
  const pages = new Map()
  buildGrowth({ write: (path, html) => pages.set(path, html), ALL: [] })
  const hub = pages.get('en/chinese-zodiac/index.html')
  assert.ok(hub)
  assert.doesNotMatch(hub, /value="1990-06-15"/, 'do not prefill an arbitrary birth date')
  assert.match(hub, /aria-live="polite"/, 'announce lookup results accessibly')
  assert.match(hub, /Your Chinese zodiac animal is/)
  assert.match(hub, /Zodiac year/)
  assert.match(hub, /This date falls between Li Chun/)
  const scripts = hub.split('<script>').slice(1).map((part) => part.split('</script>')[0])
  assert.ok(scripts.length > 0, 'generated lookup script exists')
  for (const script of scripts) assert.doesNotThrow(() => new Function(script), 'generated inline JavaScript parses')
  const dataStart = hub.indexOf('var ZD=') + 'var ZD='.length
  const dataEnd = hub.indexOf(',ZH=null;', dataStart)
  assert.ok(dataStart >= 'var ZD='.length && dataEnd > dataStart, 'lookup date data is embedded')
  const rows = JSON.parse(hub.slice(dataStart, dataEnd))
  const rabbit1975 = rows.find((row) => row[1] === 1975)
  assert.deepEqual(rabbit1975.slice(0, 3), ['1975-02-11', 1975, 'rabbit'])
  assert.deepEqual(rabbit1975.slice(10, 14), ['1976-01-30', '1975-02-04', '18:59', 'before'])
})
