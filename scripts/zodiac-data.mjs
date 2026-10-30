// 一命 · 十二生肖资料（构建期生成生肖页 / 年份页用）
// 口径：生肖性格是民俗印象，按"传统上常说"的语气写；只谈文化与性格倾向，不预测运势、不谈化解。
// 结构性知识（地支、时辰、节气月、三合、六合、六冲）是传统历法与命理的公有框架。

export const ANIMALS = [
  {
    id: 'rat', zh: '鼠', en: 'Rat', zhi: '子', el: 'water', yang: true, hour: '23:00–01:00', monthZh: '大雪至小寒（约 12 月 7 日—1 月 5 日）', monthEn: 'Daxue to Xiaohan (about Dec 7 – Jan 5)',
    traitZh: '传统上常说属鼠的人机灵、反应快、善于发现机会，对资源和信息很敏感，适应力强；也常被认为心思细、警觉性高，做事讲究先留后路。',
    traitEn: 'Folk tradition describes Rat people as quick-witted, resourceful and alert to opportunity — adaptable, observant and good with information. They are often said to plan ahead and keep a fallback in mind.',
    cultureZh: '鼠居十二生肖之首。民间"老鼠嫁女"等年画故事流传很广，鼠也常被看作多子、聚财的象征。',
    cultureEn: 'The Rat leads the zodiac. In the folk tale of the Great Race it rode on the Ox and leapt ahead at the finish — a story that captures its reputation for cleverness.',
  },
  {
    id: 'ox', zh: '牛', en: 'Ox', zhi: '丑', el: 'earth', yang: false, hour: '01:00–03:00', monthZh: '小寒至立春（约 1 月 6 日—2 月 3 日）', monthEn: 'Xiaohan to Lichun (about Jan 6 – Feb 3)',
    traitZh: '传统上常说属牛的人踏实、能吃苦、有耐力，认定的事情会一步步做完；性子稳、不爱张扬，重信用，有时也被认为固执、不轻易改变主意。',
    traitEn: 'Ox people are traditionally seen as steady, hardworking and patient — the kind who finish what they start. Reliable and understated, they can also be described as stubborn once their mind is made up.',
    cultureZh: '牛在农耕文化里地位很高，"春牛图""鞭春牛"都与立春迎农事有关，象征勤劳与丰收。',
    cultureEn: 'In an agricultural society the Ox stood for labor and harvest; spring rituals such as "whipping the spring ox" welcomed the farming year.',
  },
  {
    id: 'tiger', zh: '虎', en: 'Tiger', zhi: '寅', el: 'wood', yang: true, hour: '03:00–05:00', monthZh: '立春至惊蛰（约 2 月 4 日—3 月 5 日）', monthEn: 'Lichun to Jingzhe (about Feb 4 – Mar 5)',
    traitZh: '传统上常说属虎的人有魄力、敢闯、有领头的气场，遇事愿意站出来；性情直率、讲义气，也常被认为容易急、不喜欢被约束。',
    traitEn: 'Tigers are traditionally described as bold, confident and natural leaders who step up when it counts. Direct and loyal, they are also said to be impatient and to dislike being fenced in.',
    cultureZh: '虎被视为百兽之王，额上的纹路常被附会成"王"字；民间给孩子穿虎头鞋、戴虎头帽，取其威武、护佑之意。',
    cultureEn: 'The Tiger is "king of the beasts"; the stripes on its forehead are said to form the character 王 (king). Tiger-head shoes and hats for children are a well-loved folk craft.',
  },
  {
    id: 'rabbit', zh: '兔', en: 'Rabbit', zhi: '卯', el: 'wood', yang: false, hour: '05:00–07:00', monthZh: '惊蛰至清明（约 3 月 6 日—4 月 4 日）', monthEn: 'Jingzhe to Qingming (about Mar 6 – Apr 4)',
    traitZh: '传统上常说属兔的人温和、细腻、有分寸，审美好，善于营造让人舒服的氛围；不喜正面冲突，也常被认为谨慎、需要安全感。',
    traitEn: 'Rabbit people are traditionally seen as gentle, tactful and refined, with a good eye and a talent for making others comfortable. They avoid open conflict and are often described as cautious and security-minded.',
    cultureZh: '兔与月亮的联系最深——"玉兔捣药"的传说让兔成为中秋文化的一部分，象征清雅与安宁。',
    cultureEn: 'The Rabbit is tied to the Moon: the Jade Rabbit pounds the elixir of life beside Chang’e, which is why rabbits appear everywhere at the Mid-Autumn Festival.',
  },
  {
    id: 'dragon', zh: '龙', en: 'Dragon', zhi: '辰', el: 'earth', yang: true, hour: '07:00–09:00', monthZh: '清明至立夏（约 4 月 5 日—5 月 5 日）', monthEn: 'Qingming to Lixia (about Apr 5 – May 5)',
    traitZh: '传统上常说属龙的人气场强、有抱负、精力充沛，喜欢做大事、被人看见；自信、有感染力，也常被认为要求高、不轻易服输。',
    traitEn: 'Dragons are traditionally described as charismatic, ambitious and energetic — drawn to big goals and to being seen. Confident and inspiring, they are also said to hold high standards and to hate losing.',
    cultureZh: '龙是十二生肖里唯一的神话动物，是中华文化最重要的图腾之一；龙年出生在民间常被认为是好兆头，龙年生育高峰屡见于统计。',
    cultureEn: 'The only mythical creature in the zodiac, the Dragon is a central symbol of Chinese culture. Dragon years have historically seen noticeable baby booms across the Chinese-speaking world.',
  },
  {
    id: 'snake', zh: '蛇', en: 'Snake', zhi: '巳', el: 'fire', yang: false, hour: '09:00–11:00', monthZh: '立夏至芒种（约 5 月 6 日—6 月 5 日）', monthEn: 'Lixia to Mangzhong (about May 6 – Jun 5)',
    traitZh: '传统上常说属蛇的人冷静、有洞察力、心里有数，喜欢想清楚再行动；不张扬但有主见，也常被认为戒心较重、不轻易交底。',
    traitEn: 'Snake people are traditionally seen as calm, perceptive and deliberate — they think things through before moving. Quietly self-assured, they are also described as private and slow to trust.',
    cultureZh: '民间常把蛇称作"小龙"。白蛇传等故事让蛇在文化中兼具灵性与柔情的形象。',
    cultureEn: 'Snakes are affectionately called "little dragons". The Legend of the White Snake, one of China’s four great folk tales, gave the Snake an image of wisdom and devotion.',
  },
  {
    id: 'horse', zh: '马', en: 'Horse', zhi: '午', el: 'fire', yang: true, hour: '11:00–13:00', monthZh: '芒种至小暑（约 6 月 6 日—7 月 6 日）', monthEn: 'Mangzhong to Xiaoshu (about Jun 6 – Jul 6)',
    traitZh: '传统上常说属马的人热情、爽快、行动力强，喜欢自由和新鲜感，走到哪儿都带着活力；也常被认为耐心不足、讨厌被管太多。',
    traitEn: 'Horses are traditionally described as warm, outgoing and quick to act — lovers of freedom and new experiences who bring energy wherever they go. They are also said to run low on patience and resist being micromanaged.',
    cultureZh: '"马到成功""一马当先"等成语都借马表达进取。马年出生的人在民间常被说成"闲不住"。',
    cultureEn: 'Idioms like "success upon the horse’s arrival" use the Horse as a symbol of momentum and getting things done.',
  },
  {
    id: 'goat', zh: '羊', en: 'Goat', zhi: '未', el: 'earth', yang: false, hour: '13:00–15:00', monthZh: '小暑至立秋（约 7 月 7 日—8 月 7 日）', monthEn: 'Xiaoshu to Liqiu (about Jul 7 – Aug 7)',
    traitZh: '传统上常说属羊的人温厚、有同理心、富有艺术气质，重感情，善于照顾人；性格柔和不爱争，也常被认为犹豫、容易多想。',
    traitEn: 'Goat (also called Sheep or Ram) people are traditionally seen as kind, empathetic and artistic — warm-hearted and good at caring for others. Gentle and non-competitive, they are also described as indecisive or prone to overthinking.',
    cultureZh: '"羊"与"祥"古字相通，"三阳开泰"常写作"三羊开泰"，羊因此有吉祥、和顺的寓意。',
    cultureEn: 'In classical Chinese 羊 (goat) was used for 祥 (auspicious), so the Goat carries a sense of harmony and good fortune in art and greetings.',
  },
  {
    id: 'monkey', zh: '猴', en: 'Monkey', zhi: '申', el: 'metal', yang: true, hour: '15:00–17:00', monthZh: '立秋至白露（约 8 月 8 日—9 月 7 日）', monthEn: 'Liqiu to Bailu (about Aug 8 – Sep 7)',
    traitZh: '传统上常说属猴的人聪明、灵活、点子多，学得快、会变通，幽默有趣；也常被认为好动、三分钟热度，需要新挑战保持兴趣。',
    traitEn: 'Monkeys are traditionally described as clever, inventive and quick learners — witty, flexible and full of ideas. They are also said to get restless and need fresh challenges to stay interested.',
    cultureZh: '《西游记》里的孙悟空让猴成为机智与反叛的代名词，是中国家喻户晓的形象。',
    cultureEn: 'Sun Wukong, the Monkey King of Journey to the West, made the Monkey a byword for brilliance and mischief.',
  },
  {
    id: 'rooster', zh: '鸡', en: 'Rooster', zhi: '酉', el: 'metal', yang: false, hour: '17:00–19:00', monthZh: '白露至寒露（约 9 月 8 日—10 月 7 日）', monthEn: 'Bailu to Hanlu (about Sep 8 – Oct 7)',
    traitZh: '传统上常说属鸡的人勤奋、守时、注重细节，做事有条理、标准清楚，敢于直言；也常被认为挑剔、对自己和别人都要求高。',
    traitEn: 'Rooster people are traditionally seen as diligent, punctual and detail-oriented — organized, clear about standards and willing to speak their mind. They are also described as perfectionists, demanding of themselves and others.',
    cultureZh: '"鸡"与"吉"谐音，雄鸡报晓象征守时与光明，民间年画里的大公鸡寓意"大吉"。',
    cultureEn: 'The word for chicken (jī) sounds like 吉 (auspicious). The crowing rooster heralds the dawn and stands for punctuality and a fresh start.',
  },
  {
    id: 'dog', zh: '狗', en: 'Dog', zhi: '戌', el: 'earth', yang: true, hour: '19:00–21:00', monthZh: '寒露至立冬（约 10 月 8 日—11 月 6 日）', monthEn: 'Hanlu to Lidong (about Oct 8 – Nov 6)',
    traitZh: '传统上常说属狗的人忠诚、正直、有责任感，重视公平，对认定的人和事很投入；也常被认为容易担心、对不公之事较真。',
    traitEn: 'Dogs are traditionally described as loyal, honest and responsible, with a strong sense of fairness and deep commitment to the people they care about. They are also said to worry easily and to take injustice personally.',
    cultureZh: '狗是人类最古老的伙伴之一，民间以狗为忠义、守护的象征，"狗来富"的说法流传甚广。',
    cultureEn: 'One of humanity’s oldest companions, the Dog symbolizes loyalty and protection in Chinese folk culture.',
  },
  {
    id: 'pig', zh: '猪', en: 'Pig', zhi: '亥', el: 'water', yang: false, hour: '21:00–23:00', monthZh: '立冬至大雪（约 11 月 7 日—12 月 6 日）', monthEn: 'Lidong to Daxue (about Nov 7 – Dec 6)',
    traitZh: '传统上常说属猪的人真诚、宽厚、乐观，懂得享受生活，待人不设防，人缘好；也常被认为心太软、不太会拒绝别人。',
    traitEn: 'Pig (Boar) people are traditionally seen as sincere, generous and easygoing — they enjoy life, trust openly and are well liked. They are also described as soft-hearted and not great at saying no.',
    cultureZh: '猪在农耕社会象征富足与福气，"家"字就是屋檐下有豕（猪），可见其在生活中的分量。',
    cultureEn: 'In farming households the Pig meant plenty: the character 家 (home) shows a pig under a roof.',
  },
]

// 三合（三个地支合成一局五行）
export const SANHE = [
  { zhis: ['申', '子', '辰'], el: 'water' },
  { zhis: ['亥', '卯', '未'], el: 'wood' },
  { zhis: ['寅', '午', '戌'], el: 'fire' },
  { zhis: ['巳', '酉', '丑'], el: 'metal' },
]
// 六合
export const LIUHE = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']]
// 六冲
export const LIUCHONG = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']]

export const STEM_EN = { 甲: 'Jia', 乙: 'Yi', 丙: 'Bing', 丁: 'Ding', 戊: 'Wu', 己: 'Ji', 庚: 'Geng', 辛: 'Xin', 壬: 'Ren', 癸: 'Gui' }
export const BRANCH_EN = { 子: 'Zi', 丑: 'Chou', 寅: 'Yin', 卯: 'Mao', 辰: 'Chen', 巳: 'Si', 午: 'Wu', 未: 'Wei', 申: 'Shen', 酉: 'You', 戌: 'Xu', 亥: 'Hai' }
export const YANG_STEMS = ['甲', '丙', '戊', '庚', '壬']

// 五行 × 生肖 的气质修饰（年干五行）——民俗说法，写成倾向
export const ELEMENT_FLAVOR = {
  wood: { zh: '木主生发，民俗上认为木年生人更添一分仁厚与向上的韧劲。', en: 'Wood brings growth: folk tradition adds warmth, generosity and a forward-reaching streak.' },
  fire: { zh: '火主光热，民俗上认为火年生人更添一分热情与表现力。', en: 'Fire brings heat and light: folk tradition adds passion, visibility and expressiveness.' },
  earth: { zh: '土主承载，民俗上认为土年生人更添一分稳重与包容。', en: 'Earth brings steadiness: folk tradition adds patience, practicality and reliability.' },
  metal: { zh: '金主收敛，民俗上认为金年生人更添一分果断与原则感。', en: 'Metal brings structure: folk tradition adds decisiveness, discipline and clear principles.' },
  water: { zh: '水主流动，民俗上认为水年生人更添一分灵活与洞察力。', en: 'Water brings flow: folk tradition adds adaptability, insight and intuition.' },
}

// 五行配色（传统对应：五色、五方、五季 + 常见材质），用于五行配色页
export const ELEMENT_COLORS = {
  wood: {
    colorsZh: '青、绿', colorsEn: 'green, teal', hex: ['#3F7A5B', '#7FA37A', '#2F5D50'],
    dirZh: '东', dirEn: 'East', seasonZh: '春', seasonEn: 'Spring',
    materialsZh: '木质、竹、绿檀、绿色系天然石（如绿幽灵、东陵玉）、棉麻', materialsEn: 'wood, bamboo, green sandalwood, green stones such as aventurine or green phantom quartz, linen',
  },
  fire: {
    colorsZh: '赤、红、紫、橙', colorsEn: 'red, purple, orange', hex: ['#B5483A', '#C76B4B', '#7A3B5E'],
    dirZh: '南', dirEn: 'South', seasonZh: '夏', seasonEn: 'Summer',
    materialsZh: '红色系天然石（如南红、石榴石、红玛瑙）、紫水晶、红绳编织', materialsEn: 'red stones such as carnelian, garnet or red agate, amethyst, red cord',
  },
  earth: {
    colorsZh: '黄、棕、米、咖', colorsEn: 'yellow, brown, beige', hex: ['#B08A3E', '#C9A66B', '#8A6A3A'],
    dirZh: '中', dirEn: 'Center', seasonZh: '四季之末（长夏）', seasonEn: 'Late summer / seasonal transitions',
    materialsZh: '陶、瓷、黄玉、虎眼石、黄水晶、蜜蜡', materialsEn: 'ceramic, clay, yellow jade, tiger’s eye, citrine, amber',
  },
  metal: {
    colorsZh: '白、金、银、灰', colorsEn: 'white, gold, silver, grey', hex: ['#9C8A57', '#C8C2B4', '#7D7A73'],
    dirZh: '西', dirEn: 'West', seasonZh: '秋', seasonEn: 'Autumn',
    materialsZh: '金属饰件（银、钛、黄铜）、白水晶、月光石、白砗磲', materialsEn: 'metal (silver, titanium, brass), clear quartz, moonstone, white shell',
  },
  water: {
    colorsZh: '黑、蓝、深灰', colorsEn: 'black, blue, navy', hex: ['#3A6079', '#22313F', '#5B7C99'],
    dirZh: '北', dirEn: 'North', seasonZh: '冬', seasonEn: 'Winter',
    materialsZh: '黑曜石、青金石、海蓝宝、黑檀、玻璃', materialsEn: 'obsidian, lapis lazuli, aquamarine, ebony, glass',
  },
}
