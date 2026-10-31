// 一命 · 轻量事件埋点
// 只发事件名和非敏感参数（语言、日主五行等），绝不发出生日期/时间。
// 未配置 GA4 时为空操作。

export function track(name, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', name, params)
    }
  } catch (e) {
    /* 埋点失败不影响功能 */
  }
}
