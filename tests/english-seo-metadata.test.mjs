import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { buildGrowth } from '../scripts/gen-growth.mjs'
import { TERMS } from '../src/terms.js'
import { SHISHEN, RIZHU } from '../scripts/seo-data.mjs'

test('every generated English page has a unique canonical, title and description', () => {
  const pages = new Map()
  const all = [
    ...TERMS.map((term) => ({ ...term, kind: 'term' })),
    ...SHISHEN,
    ...RIZHU,
  ]
  buildGrowth({ write: (path, html) => pages.set(path, html), ALL: all })

  const canonicals = new Set()
  const titles = new Set()
  const failures = []
  for (const [path, html] of pages) {
    if (!path.startsWith('en/')) continue
    const expected = `https://oneming.net/${path.replace(/index\.html$/, '')}`
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1]
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1]
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]

    if (!html.includes('<html lang="en">')) failures.push({ path, issue: 'missing en language declaration' })
    if (!title?.trim()) failures.push({ path, issue: 'missing title' })
    if (!description?.trim()) failures.push({ path, issue: 'missing description' })
    if (canonical !== expected) failures.push({ path, issue: 'canonical mismatch', canonical, expected })
    if (canonical && canonicals.has(canonical)) failures.push({ path, issue: 'duplicate canonical', canonical })
    if (title && titles.has(title)) failures.push({ path, issue: 'duplicate title', title })
    if (canonical) canonicals.add(canonical)
    if (title) titles.add(title)
  }
  assert.deepEqual(failures, [])
})

test('English calculator homepage title, static heading and app heading share one search intent', () => {
  const staticBuilder = readFileSync(new URL('../scripts/gen-static.mjs', import.meta.url), 'utf8')
  const appStrings = readFileSync(new URL('../src/strings.js', import.meta.url), 'utf8')
  assert.ok(staticBuilder.includes('<title>Free BaZi Calculator | Four Pillars &amp; Five Elements Chart | ONEMING</title>'))
  assert.ok(staticBuilder.includes('<h1>Free BaZi Calculator — Four Pillars &amp; Five Elements Chart</h1>'))
  assert.ok(staticBuilder.includes('Free BaZi calculator for your Four Pillars of Destiny. Explore your Day Master, Five Elements balance and Ten Gods in plain English. Calculated in your browser.'))
  assert.ok(appStrings.includes("heroSeo: 'Free BaZi Calculator — Four Pillars & Five Elements Chart'"))
  assert.ok(appStrings.includes('Create your Four Pillars of Destiny (BaZi) chart, explore your Five Elements balance and Ten Gods'))
})
