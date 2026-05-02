# Phase 5P Real Media Stability QA

Audit time: 2026-05-02 08:17:07 -03:00

Production URL: https://trends-center.vercel.app

Deployment tested: `dpl_DkkYzWniGpMkNu7Cp2CHWPXKuvqB` (`READY`, production)

## Scope

- Validate production media reliability after real Bright Data thumbnails.
- Run a small controlled Bright Data collection.
- Decide whether thumbnail cache/proxy is already necessary.
- Do not implement cache/proxy in this phase.

## Controlled Collection

| Source | Mode | Limit | Result | Imported |
| --- | --- | ---: | --- | ---: |
| https://www.instagram.com/espn/ | profile_reels | 1 | imported | 1 |
| https://www.instagram.com/netflixbrasil/ | profile_reels | 1 | imported | 1 |

Both jobs finished as `SUCCEEDED`.

## Database Media Audit

Workspace: `Codex QA Radar`

| Metric | Count |
| --- | ---: |
| Reels/videos | 2 |
| Signals | 2 |
| Sources | 11 |
| Videos with thumbnailUrl | 2 |
| Videos with video media only | 0 |
| Videos with real media | 2 |
| Fallback-only videos | 0 |

## Real Media Table

| Reel URL | Creator | thumbnailUrl saved | sourceField | mediaKind | mediaConfidence | mediaHost | mediaStability | fallbackReason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| https://www.instagram.com/p/DXMkE1hgaSU/ | netflixbrasil | yes | thumbnail | image | high | scontent-sea5-1.cdninstagram.com | likely-expiring | real_media_available |
| https://www.instagram.com/p/DXUf10UDDdn/ | espn | yes | thumbnail | image | high | scontent-lax7-1.cdninstagram.com | likely-expiring | real_media_available |

## Visual QA

| Surface | Result |
| --- | --- |
| /login | loaded, 0 canvas |
| dashboard authenticated | loaded, reload did not duplicate signal text/state |
| /trends desktop 1440x900 | 2 real image artifacts, 1 canvas |
| /trends mobile 390x844 | 2 real image artifacts, 0 canvas |
| /trends reduced motion | 2 real image artifacts, 0 canvas |
| /trends reload x3 | thumbnails still rendered as real media |
| controlled image failure | both cards fell back to premium 9:16 fallback, no broken layout |

Normal production QA produced 0 app errors and 0 pageErrors. Desktop WebGL emitted Chromium headless `ReadPixels` performance warnings only; mobile and reduced-motion emitted no warnings.

The fallback test intentionally blocked `/_next/image` and produced expected image request errors in that isolated run only.

## Validation Commands

| Command | Result |
| --- | --- |
| npm run lint | passed |
| npm run build | passed |
| npm run db:status | passed |
| npx vitest run src/lib/trends/reel-media.test.ts src/lib/instagram/bright-data.test.ts | passed, 18 tests |
| npx vitest run src/lib/trends/reel-media.test.ts src/lib/instagram/bright-data.test.ts src/lib/trends/scoring.test.ts src/lib/trends/signal-bridge.test.ts src/lib/ingestion/dedupe.test.ts | passed, 26 tests |

## Cache/Proxy Decision

Decision: Ainda nao precisa cache/proxy.

Evidence:

- Real thumbnails load in production.
- Two independent sources returned real thumbnail media.
- Both thumbnails render in `/trends` desktop, mobile, and reduced motion.
- The existing fallback works when image loading is intentionally blocked.
- There is no evidence yet of recurring 403/404/410 expiration during normal use.
- Layout remains stable even when the image fails.

## Phase 5Q Checkpoint

This report is the safe checkpoint for Phase 5Q. It preserves the current decision: do not build cache/proxy yet.

Plan a future dedicated `Licensed Media Cache/Proxy` phase only if one of these happens in normal usage:

- Multiple fresh thumbnails return 403, 404, or 410.
- Freshly collected media falls back frequently.
- Instagram CDN expiration makes the Viral Library unreliable.
- The lack of persisted licensed media cache hurts product utility.

Until then, keep the current safer model: use real provider media when available, classify `cdninstagram.com` as `likely-expiring`, and fall back cleanly without fake media.
