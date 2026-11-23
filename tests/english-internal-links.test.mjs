import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildGrowth } from '../scripts/gen-growth.mjs'
import { TERMS } from '../src/terms.js'
import { SHISHEN, RIZHU } from '../scripts/seo-data.mjs'

test('generated English growth pages do not link to missing English static pages', () => {
  const pages = new Map()
  const all = [
    ...TERMS.map((term) => ({ ...term, kind: 'term' })),
    ...SHISHEN,
    ...RIZHU,
  ]
  buildGrowth({ write: (path, html) => pages.set(path, html), ALL: all })

  const missing = []
  for (const [source, html] of pages) {
    if (!source.startsWith('en/')) continue
    const hrefs = [...html.matchAll(/href="(\/en\/[^"#?]*)"/g)].map((match) => match[1])
    for (const href of hrefs) {
      if (href === '/en/') continue
      const target = href.replace(/^\//, '').replace(/\/$/, '') + '/index.html'
      if (!pages.has(target)) missing.push({ source, href, target })
    }
  }
  assert.deepEqual(missing, [])
})
