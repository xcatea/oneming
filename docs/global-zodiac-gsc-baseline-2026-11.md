# OneMing Global Zodiac — Google Search Console baseline

**Captured:** 2026-11-21  
**Market focus:** Global English-language search  
**Source:** User-provided Google Search Console screenshots in the OneMing project conversation  
**Purpose:** Preserve the initial measurement baseline before Global Zodiac content and date-checker improvements.

## Site-wide performance

Google Search Console Performance report, three-month view (visible chart range approximately 2026-08-20 to 2026-11-18):

| Metric | Observed value |
|---|---:|
| Clicks | 0 |
| Impressions | 12,500 (displayed as 1.25万) |
| CTR | 0% |
| Average position | 67.2 |

Interpretation: Google has begun showing OneMing pages for relevant queries, but the average position is still low and the screenshots show no clicks. This is an early baseline, not evidence of stable traffic or product-market fit.

## Visible English query opportunities

The site-wide query table showed:

| Query | Impressions visible |
|---|---:|
| 1986 chinese zodiac | 36 |
| 1998 chinese zodiac | 27 |
| 1995 chinese zodiac | 26 |

These are small samples. They indicate query relevance, not established demand. Existing year pages were prioritized for improvement rather than creating duplicate URLs.

## Rabbit page performance

Page filter: `/en/chinese-zodiac/rabbit/`

Comparison view:
- Current period: 2026-11-07 to 2026-11-13
- Previous period: 2026-10-31 to 2026-11-06

| Metric | Current | Previous |
|---|---:|---:|
| Impressions | 93 | 0 |
| Clicks | 0 | 0 |
| CTR | 0% | 0% |
| Average position | 63 | 0 / no meaningful prior data |

The visible query `1975 chinese year` showed 3 impressions in the current period. This is an early signal only.

## Index coverage snapshot

The Indexing report last updated 2026-11-16:

| Status | Count |
|---|---:|
| Indexed | 324 |
| Not indexed | 10 |
| Alternate page with proper canonical | 5 |
| Not found (404) | 2 |
| Page with redirect | 2 |
| Crawled — currently not indexed | 1 |

A later URL Inspection screenshot for `/shengxiao/tiger/` showed “URL is on Google” and indexed status. Treat the summary report as a delayed aggregate; use URL Inspection for the current status of an individual URL.

## Work completed against this baseline

1. PR #3: enriched the existing 1975 English Wood Rabbit year page; added regression tests for the 1975 Chinese New Year and Li Chun boundaries.
2. PR #4: extended the interactive birth-date checker to 1900–2100 while keeping detailed year-guide pages bounded to 1930–2035.
3. PR #5: added Hong Kong Observatory calendar references and the classical Na Yin source to the 1975 page.
4. PR #6: improved the existing 1986, 1995, and 1998 English year pages in response to the visible Search Console queries.

All four PRs were merged to `main`; CI passed on their respective PR commits. Production deployment should still be checked in Cloudflare Pages after each merge.

## Measurement protocol

At the next review, export Search Console data rather than relying only on dashboard screenshots:

- Performance → Search results → Web
- Date ranges: last 28 days and previous 28 days; also retain a 3-month view
- Export both Queries and Pages
- For the English Zodiac hub and the four target year pages, compare clicks, impressions, CTR, average position, query mix, country, and device

Review after 14, 28, and 56 days. Do not make major content decisions from a single low-volume week.

## Guardrails

- Do not equate impressions with visits or users.
- Do not infer country demand without the Country tab or export.
- Do not bulk-create thin year pages.
- Keep the popular zodiac-year boundary (Chinese New Year) distinct from the BaZi year-pillar boundary (Li Chun).
- Treat personality and fortune statements as cultural interpretations, not scientific predictions.
- Preserve existing canonical URLs unless there is verified evidence of a technical issue.
