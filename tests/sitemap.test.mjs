import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSitemap } from '../scripts/sitemap.mjs'

test('sitemap omits lastmod when per-page modification dates are not available', () => {
  const xml = buildSitemap(['https://oneming.net/', 'https://oneming.net/en/'])
  assert.ok(xml.includes('<loc>https://oneming.net/</loc>'))
  assert.ok(xml.includes('<loc>https://oneming.net/en/</loc>'))
  assert.ok(!xml.includes('<lastmod>'))
})

test('sitemap deduplicates URLs and escapes XML special characters', () => {
  const xml = buildSitemap([
    'https://oneming.net/',
    'https://oneming.net/?a=1&b=2',
    'https://oneming.net/',
    'https://oneming.net/path/<tag>',
    '',
    null,
  ])
  assert.equal((xml.match(/<url>/g) || []).length, 3)
  assert.ok(xml.includes('https://oneming.net/?a=1&amp;b=2'))
  assert.ok(xml.includes('https://oneming.net/path/&lt;tag&gt;'))
  assert.ok(xml.trimEnd().endsWith('</urlset>'))
})
