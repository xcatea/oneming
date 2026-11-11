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

// 十神英文名（lunar-javascript 返回中文）
export const SHISHEN_EN = {
  比肩: 'Friend', 劫财: 'Rob Wealth', 食神: 'Eating God', 伤官: 'Hurting Officer', 正财: 'Direct Wealth',
  偏财: 'Indirect Wealth', 正官: 'Direct Officer', 七杀: 'Seven Killings', 正印: 'Direct Resource', 偏印: 'Indirect Resource',
}

// 纳音英文意译
export const NAYIN_EN = {
  海中金: 'Gold in the Sea', 炉中火: 'Fire in the Furnace', 大林木: 'Wood of the Great Forest', 路旁土: 'Earth by the Roadside',
  剑锋金: 'Metal of the Sword Blade', 山头火: 'Fire on the Mountain', 涧下水: 'Water in the Ravine', 城头土: 'Earth on the City Wall',
  白蜡金: 'White Wax Metal', 杨柳木: 'Willow Wood', 泉中水: 'Water in the Spring', 屋上土: 'Earth on the Roof',
  霹雳火: 'Thunderbolt Fire', 松柏木: 'Pine and Cypress Wood', 长流水: 'Long-Flowing Water', 沙中金: 'Gold in the Sand',
  山下火: 'Fire at the Foot of the Mountain', 平地木: 'Wood of the Plain', 壁上土: 'Earth on the Wall', 金箔金: 'Gold Leaf Metal',
  覆灯火: 'Lamp Fire', 天河水: 'Water of the Heavenly River', 大驿土: 'Earth of the Great Post Road', 钗钏金: 'Hairpin and Bracelet Metal',
  桑柘木: 'Mulberry Wood', 大溪水: 'Water of the Great Stream', 沙中土: 'Earth in the Sand', 天上火: 'Fire in the Sky',
  石榴木: 'Pomegranate Wood', 大海水: 'Water of the Great Sea',
}
