# OneMing Global Zodiac — Phase 1

**Market:** Global English-speaking audience  
**North star:** Help people discover Chinese zodiac culture through their birth date, then guide interested readers toward the Five Elements and BaZi.

## Product positioning

OneMing is an educational guide to Chinese zodiac, the Five Elements, and BaZi. Explain traditional concepts in accessible English. Treat fortune and personality descriptions as cultural interpretations, not scientific findings or guaranteed predictions.

## Phase 1 scope

1. Improve the existing English zodiac year pages rather than creating a parallel page generator.
2. Use the existing `lunar-javascript` calendar pipeline for year data and boundaries.
3. Upgrade the 1975 Wood Rabbit page as the first editorial-quality sample.
4. Explain the distinction between Chinese New Year zodiac-year boundaries and the Li Chun BaZi year-pillar boundary.
5. Measure English search impressions, clicks, countries, and engagement before scaling content production.

## Audience journey

Search (“1975 Chinese zodiac”) → direct answer and date range → animal and stem-branch explanation → Five Elements and Na Yin distinction → traditional cultural associations → related guides and existing date checker → optional BaZi learning path.

## Editorial rules

- Lead with the direct answer and date range.
- Do not use Gregorian January 1 as the Chinese zodiac year boundary.
- Keep the popular zodiac animal and BaZi year pillar as separate concepts.
- Explain that Yi (乙) is associated with Yin Wood while Yi-Mao (乙卯) has Na Yin Da Xi Shui (大溪水); these are different traditional classification layers.
- Use “traditionally associated with” and “some interpretations describe”; avoid deterministic claims about health, money, marriage, or future events.
- Avoid thin pages created only to target keyword variations.
- Keep English natural and explanatory; explain Chinese terms on first use.

## Technical rules

- Reuse `scripts/gen-growth.mjs`, `src/bazi.js`, and the existing `lunar-javascript` dependency.
- Preserve current canonical URLs and internal linking patterns.
- Add tests for Chinese New Year and Li Chun boundaries.
- Near a boundary, show that BaZi requires exact birth time and location/timezone.
- Do not send birth date/time/place to analytics. Track only coarse interaction events.

## Rollout and measurement

1. Review the 1975 page in generated HTML.
2. Run `npm test` and `npm run build`.
3. Inspect canonical URL, title, description, breadcrumb, FAQ markup, and sitemap.
4. Deploy only after review.
5. Compare Google Search Console baseline at 14, 28, and 56 days.
6. Expand to other years only when the page demonstrates useful impressions, clicks, and engagement.

## Out of scope

- Bulk generation of hundreds of near-identical pages.
- Replacing the existing calendar or BaZi engine.
- Treating astrology as scientifically validated prediction.
- Changing existing URL conventions without evidence.
