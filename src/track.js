// 一命 · 轻量事件埋点
// 只发送非敏感事件参数。尤其避免分享链接中的出生信息混入 GA4 URL 维度。
// 所有事件（不只是 page_view）都覆盖 URL / referrer，移除查询参数和锚点。

export function sanitizedAnalyticsUrl(value) {
  try {
    if (!value) return ''
    const u = new URL(value)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return ''
    return u.origin + u.pathname
  } catch (e) {
    return ''
  }
}

export function track(name, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      const pageLocation = sanitizedAnalyticsUrl(window.location.href)
      const pageReferrer = typeof document !== 'undefined'
        ? sanitizedAnalyticsUrl(document.referrer)
        : ''
      // Sanitized values last: callers cannot override them via params.
      window.gtag('event', name, {
        ...params,
        page_location: pageLocation,
        page_referrer: pageReferrer,
      })
    }
  } catch (e) {
    /* 埋点失败不影响功能 */
  }
}
