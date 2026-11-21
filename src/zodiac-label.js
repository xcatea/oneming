// The lunar-javascript zodiac API returns Chinese animal names.
// Keep this display-only translation separate from the BaZi year pillar.
export const ZODIAC_ANIMAL_EN = Object.freeze({
  鼠: 'Rat', 牛: 'Ox', 虎: 'Tiger', 兔: 'Rabbit',
  龙: 'Dragon', 蛇: 'Snake', 马: 'Horse', 羊: 'Goat',
  猴: 'Monkey', 鸡: 'Rooster', 狗: 'Dog', 猪: 'Pig',
})

export function zodiacLabel(animal, lang = 'zh') {
  return lang === 'en' ? (ZODIAC_ANIMAL_EN[animal] || animal) : animal
}

export const WESTERN_SIGN_EN = Object.freeze({
  白羊: 'Aries', 金牛: 'Taurus', 双子: 'Gemini', 巨蟹: 'Cancer',
  狮子: 'Leo', 处女: 'Virgo', 天秤: 'Libra', 天蝎: 'Scorpio',
  射手: 'Sagittarius', 摩羯: 'Capricorn', 水瓶: 'Aquarius', 双鱼: 'Pisces',
  牡羊: 'Aries', 魔羯: 'Capricorn',
})

export function sunSignLabel(sign, lang = 'zh') {
  return lang === 'en' ? (WESTERN_SIGN_EN[sign] || sign) : sign
}
