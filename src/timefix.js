// 一命 · 出生时间校正：真太阳时 + 中国 1986–1991 夏令时
// 时柱以"太阳时"为准：北京时间是东经 120° 的标准时，出生地经度每差 1° 差 4 分钟，
// 再加上一年里地球轨道带来的"时差"（均时差，约 −14 到 +16 分钟）。

// 常用出生地（经度，东经为正）。按拼音顺序便于查找。
export const CITIES = [
  ['beijing', '北京', 116.41], ['shanghai', '上海', 121.47], ['tianjin', '天津', 117.2], ['chongqing', '重庆', 106.55],
  ['guangzhou', '广州', 113.26], ['shenzhen', '深圳', 114.06], ['hangzhou', '杭州', 120.16], ['nanjing', '南京', 118.8],
  ['suzhou', '苏州', 120.62], ['wuhan', '武汉', 114.31], ['chengdu', '成都', 104.07], ['xian', '西安', 108.94],
  ['zhengzhou', '郑州', 113.63], ['changsha', '长沙', 112.94], ['jinan', '济南', 117.0], ['qingdao', '青岛', 120.38],
  ['shijiazhuang', '石家庄', 114.51], ['taiyuan', '太原', 112.55], ['hefei', '合肥', 117.23], ['nanchang', '南昌', 115.86],
  ['fuzhou', '福州', 119.3], ['xiamen', '厦门', 118.09], ['nanning', '南宁', 108.37], ['haikou', '海口', 110.2],
  ['kunming', '昆明', 102.83], ['guiyang', '贵阳', 106.63], ['lanzhou', '兰州', 103.83], ['xining', '西宁', 101.78],
  ['yinchuan', '银川', 106.23], ['huhehaote', '呼和浩特', 111.75], ['shenyang', '沈阳', 123.43], ['dalian', '大连', 121.61],
  ['changchun', '长春', 125.32], ['haerbin', '哈尔滨', 126.53], ['wulumuqi', '乌鲁木齐', 87.62], ['lasa', '拉萨', 91.13],
  ['xianggang', '香港', 114.17], ['aomen', '澳门', 113.54], ['taibei', '台北', 121.56],
]
export const CITY_BY_ID = Object.fromEntries(CITIES.map(([id, zh, lon]) => [id, { id, zh, lon }]))

function dayOfYear(y, m, d) {
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1
}

// 均时差（分钟），常用近似公式，误差约 ±1 分钟
export function equationOfTime(y, m, d) {
  const B = (2 * Math.PI * (dayOfYear(y, m, d) - 81)) / 364
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
}

// 中国夏令时（1986–1991）：起止日的凌晨 2 点切换
const CN_DST = {
  1986: [[5, 4], [9, 14]], 1987: [[4, 12], [9, 13]], 1988: [[4, 17], [9, 11]],
  1989: [[4, 16], [9, 17]], 1990: [[4, 15], [9, 16]], 1991: [[4, 14], [9, 15]],
}
export function inChinaDST(y, m, d, hh) {
  const r = CN_DST[y]
  if (!r) return false
  const t = Date.UTC(y, m - 1, d, hh)
  const start = Date.UTC(y, r[0][0] - 1, r[0][1], 2)
  const end = Date.UTC(y, r[1][0] - 1, r[1][1], 2)
  return t >= start && t < end
}

function shift(y, m, d, hh, mm, minutes) {
  const t = new Date(Date.UTC(y, m - 1, d, hh, mm) + Math.round(minutes) * 60000)
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), hh: t.getUTCHours(), mm: t.getUTCMinutes() }
}

/**
 * 把用户填的北京时间换算成排盘用的时间
 * @param input { y,m,d,hh,mm, city?:cityId, dst?:boolean }
 * @returns { y,m,d,hh,mm, notes:{ dst?:true, solar?:{ city, lon, offset } } }
 */
export function correctTime(input) {
  let t = { y: input.y, m: input.m, d: input.d, hh: input.hh, mm: input.mm }
  const notes = {}
  if (input.dst && inChinaDST(t.y, t.m, t.d, t.hh)) {
    t = shift(t.y, t.m, t.d, t.hh, t.mm, -60)
    notes.dst = true
  }
  const city = input.city && CITY_BY_ID[input.city]
  if (city) {
    const offset = (city.lon - 120) * 4 + equationOfTime(t.y, t.m, t.d)
    t = shift(t.y, t.m, t.d, t.hh, t.mm, offset)
    notes.solar = { city: city.zh, lon: city.lon, offset: Math.round(offset) }
  }
  return { ...t, notes }
}
