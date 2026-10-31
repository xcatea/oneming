// 一命 · 出生时间校正：出生地真太阳时 + 夏令时 / 旧时区（中国大陆按通行口径表，港澳台与海外按 IANA 时区）
// 时柱以"太阳时"为准：北京时间是东经 120° 的标准时，出生地经度每差 1° 差 4 分钟，
// 再加上一年里地球轨道带来的"时差"（均时差，约 −14 到 +16 分钟）。
// 夏令时：只提示、由用户勾选确认后才减 1 小时，默认不改。

import { placeById } from './places.js'

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

// —— 海外时区（浏览器内置 IANA 时区库，含历史夏令时与旧时区）——
function zoneOffsetAtUTC(tz, utcMs) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
  const p = Object.fromEntries(f.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]))
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute)
  return Math.round((asUTC - Math.floor(utcMs / 60000) * 60000) / 60000)
}
// 当地钟表时间 → 当时实际的 UTC 偏移（分钟）
export function zoneOffsetForLocal(tz, y, m, d, hh, mm) {
  const local = Date.UTC(y, m - 1, d, hh, mm)
  let off = zoneOffsetAtUTC(tz, local)
  off = zoneOffsetAtUTC(tz, local - off * 60000)
  return off
}
// 当年的标准偏移（冬夏两个时刻里较小的那个）
export function zoneStandardOffset(tz, y) {
  return Math.min(zoneOffsetAtUTC(tz, Date.UTC(y, 0, 15, 12)), zoneOffsetAtUTC(tz, Date.UTC(y, 6, 15, 12)))
}

/**
 * 出生地提示信息（表单用）：这天是否在夏令时 / 非标准时间
 * @returns { kind: 'cn-dst' | 'zone-dst' | null, diff?: 分钟 }
 */
export function placeClockHint(placeId, y, m, d, hh, mm) {
  const place = placeById(placeId)
  if (!place || place.cn) return inChinaDST(y, m, d) ? { kind: 'cn-dst', diff: 60 } : null
  try {
    const diff = zoneOffsetForLocal(place.tz, y, m, d, hh, mm) - zoneStandardOffset(place.tz, y)
    return diff ? { kind: 'zone-dst', diff } : null
  } catch (e) { return null }
}

/**
 * 把用户填的出生钟表时间换算成排盘用的"出生地真太阳时"
 * @param input { y,m,d,hh,mm, place?: placeId, dst?: boolean }
 *   - 不选出生地：按北京时间，不做经度校正（夏令时仍可勾选扣除）
 *   - 中国大陆：东八区 + 经度差 + 均时差；夏令时按通行口径表，用户勾选才扣
 *   - 港澳台与海外：用 IANA 时区；勾选 dst 时按当年实际钟表规则换算（含夏令时、旧时区），否则按当年标准时区
 * @returns { y,m,d,hh,mm, notes:{ dst?, solar?:{ place, lon, offset } } }
 */
export function correctTime(input) {
  const { y, m, d, hh, mm } = input
  const notes = {}
  const place = placeById(input.place)
  let utc
  if (!place || place.cn) {
    let off = 480
    if (input.dst && inChinaDST(y, m, d)) { off = 540; notes.dst = 60 }
    utc = Date.UTC(y, m - 1, d, hh, mm) - off * 60000
    if (!place) {
      const t = new Date(utc + 480 * 60000)
      return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), hh: t.getUTCHours(), mm: t.getUTCMinutes(), notes }
    }
  } else {
    let off = zoneStandardOffset(place.tz, y)
    if (input.dst) {
      const actual = zoneOffsetForLocal(place.tz, y, m, d, hh, mm)
      if (actual !== off) { notes.dst = actual - off; off = actual }
    }
    utc = Date.UTC(y, m - 1, d, hh, mm) - off * 60000
  }
  // 地方平太阳时 = UTC + 经度 × 4 分钟；再加均时差得真太阳时
  const lmt = utc + place.lon * 4 * 60000
  const lt = new Date(lmt)
  const eot = equationOfTime(lt.getUTCFullYear(), lt.getUTCMonth() + 1, lt.getUTCDate(), lt.getUTCHours() + lt.getUTCMinutes() / 60)
  const t = new Date(Math.round((lmt + eot * 60000) / 60000) * 60000)
  const offset = Math.round((t.getTime() - Date.UTC(y, m - 1, d, hh, mm)) / 60000)
  notes.solar = { place: place.zh, placeEn: place.en, lon: place.lon, offset }
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), hh: t.getUTCHours(), mm: t.getUTCMinutes(), notes }
}
