import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rateLimitStatus } from '../functions/api/reading.js'

const request = () => new Request('https://oneming.net/api/reading', {
  method: 'POST',
  headers: { 'cf-connecting-ip': '203.0.113.10' },
})

test('paid AI endpoint is unavailable when RATE_KV is not configured', async () => {
  assert.equal(await rateLimitStatus(request(), {}), 'unavailable')
})

test('rate limiter increments a per-IP minute counter with a short TTL', async () => {
  let written
  const env = {
    RATE_KV: {
      get: async () => '4',
      put: async (...args) => { written = args },
    },
  }
  assert.equal(await rateLimitStatus(request(), env), 'ok')
  assert.deepEqual(written, ['rl:203.0.113.10:' + Math.floor(Date.now() / 60000), '5', { expirationTtl: 120 }])
})

test('rate limiter blocks the 21st request in a minute', async () => {
  let writes = 0
  const env = {
    RATE_KV: {
      get: async () => '20',
      put: async () => { writes++ },
    },
  }
  assert.equal(await rateLimitStatus(request(), env), 'limited')
  assert.equal(writes, 0)
})

test('rate limiter fails closed when KV is unavailable', async () => {
  const env = { RATE_KV: { get: async () => { throw new Error('KV unavailable') } } }
  assert.equal(await rateLimitStatus(request(), env), 'unavailable')
})
