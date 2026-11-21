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
