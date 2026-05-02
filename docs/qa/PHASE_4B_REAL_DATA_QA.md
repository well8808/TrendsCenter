# Phase 4B Real Data QA

## Scope

- Account: `codex.qa.validator@trends-center.test`
- Workspace: `Codex QA Radar`
- Goal: validate the real-data path without fake signals, fake videos, or visual masking.

## Current Data State

- signals: 0
- videos: 0
- sources: 1
- trendSources: 4
- jobRuns: 1
- ingestRequests: 1
- importBatches: 1
- evidence: 0
- trendEvidence: 0

## Diagnosis

The existing `source` and `jobRun` are baseline provisioning records, not a collection run.

Evidence:

- `src/lib/tenant/provisioning.ts` creates the baseline request/batch/job with `externalIntegrations: false`.
- The QA job is `tenant-baseline-seed` with handler `generic`.
- That baseline only registers connectors and official source references. It intentionally does not create `Signal` or `Video` records.

The real provider pipeline is:

1. `POST /api/v1/reels/provider-import`
2. `startProviderReelsImport`
3. `startBrightDataReels`
4. Bright Data snapshot polling
5. `normalizeBrightDataReelsSnapshot`
6. `ingestTrendVideos`
7. `Video`, `TrendSnapshot`, and `TrendEvidence` persistence
8. `/trends` and Command Center reel stats update

## Blocker

Local `.env.local` does not define `BRIGHT_DATA_API_KEY` or `BRIGHT_DATA_REELS_DATASET_ID`.

`src/lib/instagram/bright-data.ts` requires `BRIGHT_DATA_API_KEY` before any Bright Data collection can start. Without it, a real provider import would fail before creating useful videos.

## Not Used

`APIFY_API_TOKEN` exists locally, but the current production pipeline for the Command Center is Bright Data. The legacy `/api/trends/reels` route calls Apify with hard-coded profiles and does not persist results into the workspace, so it was not used for this QA.

## Next Minimum Step

Configure:

- `BRIGHT_DATA_API_KEY`
- optional `BRIGHT_DATA_REELS_DATASET_ID` if the default dataset must be overridden

Then run a Bright Data collection from the authenticated `/trends` UI or `POST /api/v1/reels/provider-import`.

## QA Result

The local environment is data-blocked for Bright Data because `.env.local` does not include `BRIGHT_DATA_API_KEY`.

Production is not data-blocked: Vercel has `BRIGHT_DATA_API_KEY`, and the authenticated QA account successfully imported one real Reel through the Bright Data provider flow.

## Production Verification

- URL: `https://trends-center.vercel.app`
- Account: `codex.qa.validator@trends-center.test`
- Provider route: `POST /api/v1/reels/provider-import`
- Source: `https://www.instagram.com/espn/`
- Job: `licensed-reels-import`
- Result: `SUCCEEDED`
- Imported videos: 1
- Videos after run: 1
- Sources after run: 2
- Job runs after run: 3
- Signals after run: 0
- `/trends`: shows 1 real Reel, BR market, average score 66.
- Dashboard: shows 1 indexed Reel and explains that strategic signal cards were not generated yet.

## Remaining Product Gap

The Bright Data pipeline currently creates `Video`, `TrendSnapshot`, and `TrendEvidence` records for the Reels library.
It does not automatically create strategic `Signal` cards for the Command Center. That is why `/trends` has real Reels while the dashboard signal list remains at `0 de 0 sinais`.

## QA Correction

During production reduced-motion QA, the dashboard emitted React hydration error `#418`.
The local fix keeps `AnimatedNumber` hydration stable by starting from the server-safe value and updating after mount, including in reduced motion.
