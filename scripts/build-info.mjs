// Small, non-sensitive deployment identifier for checking Cloudflare Pages freshness.
// Do not use this timestamp as a page modification date or sitemap lastmod.
export function buildInfo(env = {}, now = new Date()) {
  const candidates = [env.CF_PAGES_COMMIT_SHA, env.GITHUB_SHA]
  const commit = candidates.find((sha) => typeof sha === 'string' && /^[a-f0-9]{40}$/i.test(sha)) || null
  return {
    app: 'oneming',
    commit,
    builtAt: now.toISOString(),
  }
}
