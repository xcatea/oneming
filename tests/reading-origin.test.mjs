import { test } from 'node:test'
import assert from 'node:assert/strict'
import { allowOrigin } from '../functions/api/reading.js'

const requestWith = (origin, referer) => new Request('https://oneming.net/api/reading', {
  method: 'POST',
  headers: {
    ...(origin ? { Origin: origin } : {}),
    ...(referer ? { Referer: referer } : {}),
  },
})

test('production and explicitly configured canonical hosts are allowed', () => {
  assert.equal(allowOrigin(requestWith('https://oneming.net')), true)
  assert.equal(allowOrigin(requestWith('https://www.oneming.org')), true)
})

test('arbitrary Cloudflare Pages projects are not trusted as preview origins', () => {
  assert.equal(allowOrigin(requestWith('https://random-project.pages.dev')), false)
  assert.equal(allowOrigin(requestWith('https://random-project.pages.dev'), {
    ONEMING_PREVIEW_HOST: 'preview-oneming.pages.dev',
  }), false)
})

test('only the exact configured preview hostname is allowed', () => {
  const env = { ONEMING_PREVIEW_HOST: 'preview-oneming.pages.dev' }
  assert.equal(allowOrigin(requestWith('https://preview-oneming.pages.dev'), env), true)
  assert.equal(allowOrigin(requestWith('https://preview-oneming.pages.dev.attacker.com'), env), false)
})

test('an untrusted Origin cannot fall back to a trusted Referer', () => {
  assert.equal(allowOrigin(requestWith('https://attacker.pages.dev', 'https://oneming.net')), false)
})

test('local development origins are disabled by default and require explicit opt-in', () => {
  assert.equal(allowOrigin(requestWith('http://localhost:5173')), false)
  assert.equal(allowOrigin(requestWith('http://127.0.0.1:8788')), false)
  const env = { ONEMING_ALLOW_LOCAL_ORIGINS: 'true' }
  assert.equal(allowOrigin(requestWith('http://localhost:5173'), env), true)
  assert.equal(allowOrigin(requestWith('http://127.0.0.1:8788'), env), true)
})
