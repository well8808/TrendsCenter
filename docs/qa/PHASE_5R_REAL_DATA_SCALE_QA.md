# Phase 5R Real Data Scale QA

Audit time: 2026-05-02 08:34:00 -03:00

Production URL: https://trends-center.vercel.app

Goal: validate the Viral Library with a larger but controlled real-data sample. No cache/proxy, no fake media, no redesign, no schema/auth/env/API changes.

## Profiles Tested

All collections used `profile_reels` with `maxPerProfile: 1`.

| Profile | Market | Result | Imported |
| --- | --- | --- | ---: |
| netflixbrasil | BR | imported | 1 |
| espn | BR | imported | 1 |
| gshow | BR | imported | 1 |
| nubank | BR | imported | 1 |
| ifoodbrasil | BR | imported | 1 |
| netflix | US | imported | 1 |
| nba | US | imported | 1 |
| complex | US | imported | 1 |
| duolingo | US | imported | 1 |
| redbull | US | imported | 1 |

Note: ESPN and Netflix Brasil were already present before this phase, so the provider returned one Reel for each, but database dedupe kept the final total correct.

## Database Audit

| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Reels/videos | 2 | 10 | +8 |
| Signals | 2 | 10 | +8 |
| Videos with thumbnailUrl | 2 | 10 | +8 |
| Videos with real media | 2 | 10 | +8 |
| Fallback-only videos | 0 | 0 | 0 |
| Duplicate Reel URLs | 0 | 0 | 0 |
| Duplicate Signal dedupe keys | 0 | 0 | 0 |

## Media Hosts And Stability

| Host | Count | Stability |
| --- | ---: | --- |
| scontent-dfw5-3.cdninstagram.com | 2 | likely-expiring |
| scontent-phl2-1.cdninstagram.com | 2 | likely-expiring |
| scontent-lga3-1.cdninstagram.com | 1 | likely-expiring |
| scontent-sea1-1.cdninstagram.com | 1 | likely-expiring |
| scontent-dfw6-1.cdninstagram.com | 1 | likely-expiring |
| scontent-lga3-2.cdninstagram.com | 1 | likely-expiring |
| scontent-msp1-1.cdninstagram.com | 1 | likely-expiring |
| scontent-lax3-1.cdninstagram.com | 1 | likely-expiring |

All 10 Reels use `sourceField: thumbnail`, `mediaKind: image`, and `mediaConfidence: high`.

## Sample Media Rows

| Creator | Market | Views | Score | thumbnailUrl | Host | Fallback |
| --- | --- | ---: | ---: | --- | --- | --- |
| redbull | US | 16491148 | 66 | yes | scontent-dfw5-3.cdninstagram.com | no |
| duolingo | US | 3728253 | 59 | yes | scontent-lga3-1.cdninstagram.com | no |
| complex | US | 84567 | 87 | yes | scontent-sea1-1.cdninstagram.com | no |
| nba | US | 1724896 | 87 | yes | scontent-phl2-1.cdninstagram.com | no |
| netflix | US | 814588 | 86 | yes | scontent-phl2-1.cdninstagram.com | no |
| tanakings | BR | 13390 | 80 | yes | scontent-dfw6-1.cdninstagram.com | no |
| nubank | BR | 132652 | 59 | yes | scontent-dfw5-3.cdninstagram.com | no |
| globoreporter | BR | 502216 | 87 | yes | scontent-lga3-2.cdninstagram.com | no |
| espn | BR | 4004264 | 53 | yes | scontent-msp1-1.cdninstagram.com | no |
| netflixbrasil | BR | 3360751 | 48 | yes | scontent-lax3-1.cdninstagram.com | no |

## Browser QA

| Surface | Result |
| --- | --- |
| /login | loaded, 0 canvas |
| dashboard authenticated | loaded, 10 Signals before reload and 10 after reload |
| /trends desktop 1440x900 | 10 artifacts, 10 real-media cards, 1 canvas |
| /trends mobile 390x844 | 10 artifacts, 10 real-media cards, 0 canvas |
| /trends reduced motion | 10 real-media cards, 0 canvas |
| /trends reload x3 | no normal image 403/404/410 |
| controlled image failure | 9 requested images fell to fallback premium; 1 stayed served from cache; no broken layout |

Console results in normal QA:

| Surface | Errors | Warnings | PageErrors |
| --- | ---: | ---: | ---: |
| /login | 0 | 0 | 0 |
| dashboard + /trends desktop | 0 | 4 | 0 |
| /trends mobile | 0 | 0 | 0 |
| /trends reduced motion | 0 | 0 | 0 |

The 4 desktop warnings were Chromium headless WebGL `ReadPixels` performance warnings. They did not appear on mobile or reduced motion. Normal image responses returned 200; no normal 403/404/410 was observed.

The fallback test intentionally blocked `/_next/image` with 410 responses. Those errors were expected in that isolated test and did not occur in normal use.

## Validation Commands

| Command | Result |
| --- | --- |
| npm run lint | passed |
| npm run build | passed |
| npm run db:status | passed |
| npx vitest run src/lib/trends/reel-media.test.ts src/lib/instagram/bright-data.test.ts src/lib/trends/scoring.test.ts src/lib/trends/signal-bridge.test.ts src/lib/ingestion/dedupe.test.ts | passed, 26 tests |

## Cache/Proxy Decision

Decision: Cache/proxy continua desnecessario agora.

Evidence:

- 10 real Reels loaded with real thumbnails.
- 0 fallback-only videos in the database.
- 0 duplicate Reel URLs.
- 0 duplicate Signal dedupe keys.
- Normal production image responses returned 200.
- No recurring 403/404/410 was observed in normal use.
- Mobile and reduced motion keep 0 canvas.
- The existing premium fallback works when image loading is intentionally blocked.

Plan a future media cache/proxy phase only if fresh thumbnails start failing repeatedly in normal production use.
