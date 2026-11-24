import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildInfo } from '../scripts/build-info.mjs'

const now = new Date('2026-11-25T01:00:00Z')
const sha = '0123456789abcdef0123456789abcdef01234567'

test('build-info publishes Cloudflare commit SHA and explicit build timestamp', () => {
  assert.deepEqual(buildInfo({ CF_PAGES_COMMIT_SHA: sha }, now), {
    app: 'oneming',
    commit: sha,
    builtAt: '2026-11-25T01:00:00.000Z',
  })
})

test('build-info omits untrusted environment data', () => {
  const info = buildInfo({
    CF_PAGES_COMMIT_SHA: 'invalid',
    DEEPSEEK_API_KEY: 'SECRET_DO_NOT_LEAK',
    GITHUB_SHA: sha,
  }, now)
  assert.equal(info.commit, sha)
  assert.ok(!JSON.stringify(info).includes('SECRET_DO_NOT_LEAK'))
  assert.equal(buildInfo({ CF_PAGES_COMMIT_SHA: 'bad' }, now).commit, null)
})

test('generated static pages include a build identifier but sitemap omits it', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../scripts/gen-static.mjs', import.meta.url), 'utf8')
  assert.ok(source.includes("write('build-info.json', JSON.stringify(buildInfo(process.env)"))
  assert.ok(!source.includes("${BASE}/build-info.json"))
})
