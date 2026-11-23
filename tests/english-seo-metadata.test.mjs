import { test } from 'node:test'
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
    const expected = `https://oneming.net/${path.replace(/index\\.html$/, '')}`
    const title = html.match(/<title>([^<]+)<\\/title>/)?.[1]
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
