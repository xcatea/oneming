// 一命 · 出生时间校正：真太阳时 + 中国历史夏令时（1935–1991）
// 时柱以"太阳时"为准：北京时间是东经 120° 的标准时，出生地经度每差 1° 差 4 分钟，
// 再加上一年里地球轨道带来的"时差"（均时差，约 −14 到 +16 分钟）。
// 夏令时：只提示、由用户勾选确认后才减 1 小时，默认不改。

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

// 均时差（分钟）：NOAA 近似式，正值表示真太阳时快于平太阳时
export function equationOfTime(y, m, d, hh = 12) {
  const daysInYear = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365
  const g = ((2 * Math.PI) / daysInYear) * (dayOfYear(y, m, d) - 1 + (hh - 12) / 24)
  return 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
}

// 中国大陆夏令时：按主流排盘软件的通行口径，[年, 起月, 起日, 止月, 止日]，起止日都含，只看日期。
// 1988 年起始日主流口径为 4/10（IANA 为 4/17）；1979 年以前为简化的全国表。
// 口径参考开源项目 Renhuai123/ziwei-doushu（MIT）lib/ziwei/dst-cn.ts 的整理与核对说明。
const CN_DST = [
  [1935, 5, 1, 9, 30], [1936, 5, 1, 9, 30], [1937, 5, 1, 9, 30], [1938, 5, 1, 9, 30],
  [1939, 5, 1, 9, 30], [1940, 5, 1, 9, 30], [1941, 5, 1, 9, 30], [1942, 5, 1, 9, 30],
  [1943, 5, 1, 9, 30], [1944, 5, 1, 9, 30], [1945, 5, 1, 9, 30], [1946, 5, 1, 9, 30],
  [1947, 5, 1, 9, 30], [1948, 5, 1, 9, 30], [1949, 5, 1, 9, 30], [1950, 5, 1, 9, 30],
  [1951, 5, 1, 9, 30], [1952, 3, 1, 10, 31], [1953, 4, 1, 10, 31], [1954, 4, 1, 10, 31],
  [1955, 5, 1, 9, 30], [1956, 5, 1, 9, 30], [1957, 4, 1, 9, 30], [1958, 4, 1, 9, 30],
  [1959, 4, 1, 9, 30], [1960, 6, 1, 9, 30], [1961, 6, 1, 9, 30], [1974, 4, 1, 10, 31],
  [1975, 4, 1, 10, 31], [1979, 7, 1, 9, 30], [1986, 5, 4, 9, 14], [1987, 4, 12, 9, 13],
  [1988, 4, 10, 9, 11], [1989, 4, 16, 9, 17], [1990, 4, 15, 9, 16], [1991, 4, 14, 9, 15],
]
export function inChinaDST(y, m, d) {
  const r = CN_DST.find((x) => x[0] === y)
  if (!r) return false
  const v = m * 100 + d
  return v >= r[1] * 100 + r[2] && v <= r[3] * 100 + r[4]
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
  // 夏令时只在用户确认"填的是当年钟表时间"时才减 1 小时（程序无法替用户判断）
  if (input.dst && inChinaDST(t.y, t.m, t.d)) {
    t = shift(t.y, t.m, t.d, t.hh, t.mm, -60)
    notes.dst = true
  }
  const city = input.city && CITY_BY_ID[input.city]
  if (city) {
    const offset = (city.lon - 120) * 4 + equationOfTime(t.y, t.m, t.d, t.hh + t.mm / 60)
    t = shift(t.y, t.m, t.d, t.hh, t.mm, offset)
    notes.solar = { city: city.zh, lon: city.lon, offset: Math.round(offset) }
  }
  return { ...t, notes }
}
