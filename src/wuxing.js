// 一命 · 干支五行基础表（无依赖，前端 / 构建脚本 / 接口共用）

export const GAN_WUXING = {
  甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire', 戊: 'earth',
  己: 'earth', 庚: 'metal', 辛: 'metal', 壬: 'water', 癸: 'water',
}
export const ZHI_WUXING = {
  寅: 'wood', 卯: 'wood', 巳: 'fire', 午: 'fire',
  辰: 'earth', 戌: 'earth', 丑: 'earth', 未: 'earth',
  申: 'metal', 酉: 'metal', 亥: 'water', 子: 'water',
}

export const GANS = Object.keys(GAN_WUXING)
export const ZHIS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water']

export const ELEMENT_META = {
  wood: { zh: '木', en: 'Wood', color: '#3F7A5B' },
  fire: { zh: '火', en: 'Fire', color: '#B5483A' },
  earth: { zh: '土', en: 'Earth', color: '#B08A3E' },
  metal: { zh: '金', en: 'Metal', color: '#9C8A57' },
  water: { zh: '水', en: 'Water', color: '#3A6079' },
}

export function tally(pillars) {
  const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  pillars.forEach((p) => {
    counts[GAN_WUXING[p.gan]]++
    counts[ZHI_WUXING[p.zhi]]++
  })
  return counts
}

// 只凭干支重建分析所需的最小盘面（接口端用：客户端只传干支，不传任何自由文本）
export function chartFromPillars(pillars) {
  const ps = pillars.map((p) => ({
    key: p.key,
    gan: p.gan,
    zhi: p.zhi,
    ganElement: GAN_WUXING[p.gan],
    zhiElement: ZHI_WUXING[p.zhi],
  }))
  const day = ps.find((p) => p.key === 'day')
  return { pillars: ps, counts: tally(ps), dayGan: day.gan, dayElement: day.ganElement }
}

export function isValidPillars(pillars) {
  if (!Array.isArray(pillars) || pillars.length < 3 || pillars.length > 4) return false
  const keys = pillars.map((p) => p && p.key)
  if (!['year', 'month', 'day'].every((k) => keys.includes(k))) return false
  if (new Set(keys).size !== keys.length) return false
  return pillars.every((p) =>
    ['year', 'month', 'day', 'time'].includes(p.key) && GAN_WUXING[p.gan] && ZHI_WUXING[p.zhi])
}
