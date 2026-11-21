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
})
