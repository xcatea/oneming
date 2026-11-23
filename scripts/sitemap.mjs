// XML sitemap generation. Do not emit lastmod unless each URL has a trustworthy
// content-modification timestamp; a build timestamp is not a page-modification date.
const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

export function buildSitemap(urls) {
  const unique = [...new Set(urls.filter((url) => typeof url === 'string' && url.trim()))]
  const body = unique.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n${body}\\n</urlset>\\n`
}
