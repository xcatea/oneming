import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizedAnalyticsUrl, track } from '../src/track.js'

test('analytics URL strips query strings and fragments', () => {
  assert.equal(
    sanitizedAnalyticsUrl('https://oneming.net/en/?d=1995-08-15&t=14:30&g=male#chart'),
    'https://oneming.net/en/',
  )
  assert.equal(
    sanitizedAnalyticsUrl('https://example.org/ref?birth=secret#section'),
    'https://example.org/ref',
  )
  assert.equal(sanitizedAnalyticsUrl('not a url'), '')
  assert.equal(sanitizedAnalyticsUrl('javascript:alert(1)'), '')
})

test('all interaction events override sensitive URL dimensions', () => {
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  const calls = []
  try {
    globalThis.window = {
      location: { href: 'https://oneming.net/en/?d=1995-08-15&t=14:30&g=male' },
      gtag: (...args) => calls.push(args),
    }
    globalThis.document = {
      referrer: 'https://oneming.net/?d=1988-02-18&t=08:30',
    }
    track('share_copy', {
      lang: 'en',
      page_location: 'https://oneming.net/en/?d=untrusted',
      page_referrer: 'https://oneming.net/?t=untrusted',
    })
    assert.equal(calls.length, 1)
    const [kind, eventName, params] = calls[0]
    assert.equal(kind, 'event')
    assert.equal(eventName, 'share_copy')
    assert.equal(params.lang, 'en')
    assert.equal(params.page_location, 'https://oneming.net/en/')
    assert.equal(params.page_referrer, 'https://oneming.net/')
    assert.ok(!JSON.stringify(params).includes('1995-08-15'))
    assert.ok(!JSON.stringify(params).includes('untrusted'))
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
    if (previousDocument === undefined) delete globalThis.document
    else globalThis.document = previousDocument
  }
})

test('tracking without configured analytics is safe', () => {
  assert.doesNotThrow(() => track('chart_submit', { lang: 'en' }))
})
