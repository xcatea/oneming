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
  assert.match(hub, /some BaZi schools and practitioners use Li Chun as the year-pillar boundary/)
  assert.doesNotMatch(hub, /BaZi year pillar usually changes at Li Chun/)
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
test('English animal pages use their own linked five-element year examples', () => {
  const pages = new Map()
  buildGrowth({ write: (path, html) => pages.set(path, html), ALL: [] })
  const animals = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig']
  const elements = ['Wood', 'Fire', 'Earth', 'Metal', 'Water']
  for (const animal of animals) {
    const page = pages.get(`en/chinese-zodiac/${animal}/index.html`)
    assert.ok(page, `English ${animal} page is generated`)
    for (const element of elements) {
      assert.match(page, new RegExp(`<strong>${element} ${animal[0].toUpperCase() + animal.slice(1)}</strong>: <a href="/en/chinese-zodiac/\\d{4}/">`))
    }
  }
  const rabbit = pages.get('en/chinese-zodiac/rabbit/index.html')
  assert.match(rabbit, /The year’s element comes from its Heavenly Stem/)
  assert.doesNotMatch(rabbit, /ELEMENT_FLAVOR/)
})
test('Li Chun date itself gets a time-sensitive note and valid result container markup', () => {
  const pages = new Map()
  buildGrowth({ write: (path, html) => pages.set(path, html), ALL: [] })
  const hub = pages.get('en/chinese-zodiac/index.html')
  assert.match(hub, /<div id="zl-r" aria-live="polite"/)
  assert.match(hub, /This is the date of Li Chun/)
  assert.match(hub, /Whether a Li Chun-based BaZi year pillar has changed depends on your exact birth time/)
  const script = hub.split('<script>').slice(1).map((part) => part.split('</script>')[0]).join('\n')
  assert.doesNotThrow(() => new Function(script))
})

test('twelve English animal pages explain culture, calendrical branches and traditional relationships', () => {
  const pages = new Map()
  buildGrowth({ write: (path, html) => pages.set(path, html), ALL: [] })
  for (const animal of ['rat','ox','tiger','rabbit','dragon','snake','horse','goat','monkey','rooster','dog','pig']) {
    const html = pages.get(`en/chinese-zodiac/${animal}/index.html`)
    assert.ok(html)
    for (const phrase of ['in Chinese culture</h2>', 'Traditional zodiac relationships', 'These descriptions are folklore', 'year start on January 1', 'Six Harmony pair is the <a href="/en/chinese-zodiac/', 'Three Harmony group with <a href="/en/chinese-zodiac/', 'Some BaZi schools and practitioners use Li Chun (Start of Spring) as the year-pillar boundary']) {
      assert.ok(html.includes(phrase), `${animal}: missing ${phrase}`)
    }
  }
})

test('Five Elements explorer appears in both language pages with correct symbolic cycles', () => {
  const pages = new Map()
  buildGrowth({ write: (path, html) => pages.set(path, html), ALL: [] })
  for (const path of ['en/five-element-colors/index.html', 'wuxing-colors/index.html']) {
    const html = pages.get(path)
    assert.ok(html, path)
    assert.ok(html.includes('id="element-explorer"'))
    assert.ok(html.includes('aria-pressed="false"'))
    assert.ok(html.includes('id="element-result" aria-live="polite"'))
    const scripts = html.split('<script>').slice(1).map((part) => part.split('</script>')[0])
    assert.ok(scripts.length > 0)
    for (const script of scripts) assert.doesNotThrow(() => new Function(script))
    assert.ok(html.includes('"id":"wood"'))
    assert.ok(html.includes('"produces":"fire"'))
    assert.ok(html.includes('"controls":"earth"'))
    assert.ok(html.includes('"id":"water"'))
    assert.ok(html.includes('"produces":"wood"'))
    assert.ok(html.includes('"controls":"fire"'))
  }
})

test('English BaZi beginner guide is generated and linked from both entry hubs', () => {
  const pages = new Map()
  const { urls } = buildGrowth({ write: (path, html) => pages.set(path, html), ALL: [] })
  const path = 'en/bazi-for-beginners/index.html'
  const html = pages.get(path)
  assert.ok(html, 'BaZi beginner guide is generated')
  assert.ok(urls.includes('https://oneming.net/en/bazi-for-beginners/'), 'guide is included in the sitemap URL list')
  for (const phrase of ['BaZi for Beginners', 'The four pillars at a glance', 'BaZi versus the Chinese zodiac', 'What is the Day Master?', 'What are the Ten Gods?', 'Li Chun', '1975', 'not a scientifically validated']) {
    assert.ok(html.includes(phrase), phrase)
  }
  for (const hub of ['en/chinese-zodiac/index.html', 'en/term/index.html']) {
    assert.ok(pages.get(hub).includes('/en/bazi-for-beginners/'), hub)
  }
  assert.ok(html.includes('<link rel="canonical" href="https://oneming.net/en/bazi-for-beginners/"'))
  assert.ok(html.includes('application/ld+json'))
})

test('English glossary entries link back to the BaZi beginner learning guide', () => {
  const pages = new Map()
  const sample = [{ id: 'rizhu-test', kind: 'rizhu', en: 'Day Master', zh: '日主', defEn: 'The Day Master is the day stem.', relEn: 'It is the reference point for traditional relationships.', src: '滴天髓' }]
  buildGrowth({ write: (path, html) => pages.set(path, html), ALL: sample })
  const html = pages.get('en/term/rizhu-test/index.html')
  assert.ok(html)
  assert.ok(html.includes('/en/bazi-for-beginners/'))
  assert.ok(html.includes('beginner’s guide to the Four Pillars'))
  assert.ok(html.includes('HOW IT INTERACTS'))
})

test('five highest-impression English animal pages get concise titles and an early BaZi tool link', () => {
  const pages = new Map()
  buildGrowth({ write: (path, html) => pages.set(path, html), ALL: [] })
  const expected = {
    snake: ['Year of the Snake: Years, Traits & Five Elements | Chinese Zodiac', 'Explore Snake years, Chinese New Year dates, Five Element variations, traditional traits and zodiac relationships. See how a full BaZi chart reads all four pillars.'],
    monkey: ['Year of the Monkey: Years & Compatibility | Chinese Zodiac', 'Find Monkey years, Chinese New Year dates, traditional traits, Five Element variations and zodiac relationships. Try the free BaZi calculator for all four pillars.'],
    rabbit: ['Year of the Rabbit: Traits & Five Elements | Chinese Zodiac', 'Explore Rabbit years, exact Chinese New Year dates, Five Element variations and traditional symbolism. A full BaZi chart reads your month, day and hour pillars.'],
    rat: ['Year of the Rat: Years, Traits & Compatibility | Chinese Zodiac', 'Find Rat years, Chinese New Year dates, traditional traits, Five Element variations and zodiac relationships. Explore all four pillars with a BaZi chart.'],
    goat: ['Year of the Goat: Years & Five Elements | Chinese Zodiac', 'Explore Goat years, Chinese New Year dates, Five Element variations and traditional symbolism. Use a free BaZi calculator to read all four pillars.'],
  }
  for (const [animal, [title, description]] of Object.entries(expected)) {
    const html = pages.get('en/chinese-zodiac/' + animal + '/index.html')
    assert.ok(html, animal)
    const actualTitle = html.slice(html.indexOf('<title>') + 7, html.indexOf('</title>'))
    assert.equal(actualTitle, title)
    assert.equal(html.match(/<meta name="description" content="([^"]*)"/)?.[1], description)
    const link = html.indexOf('href="/en/">free BaZi calculator</a>')
    const firstSection = html.indexOf('<h2 class="sec">The ')
    assert.ok(link > 0 && link < firstSection, animal + ': contextual tool link should appear before the first content section')
  }
  const ox = pages.get('en/chinese-zodiac/ox/index.html')
  assert.ok(ox)
  assert.ok(!ox.includes('href="/en/">free BaZi calculator</a>'))
})
