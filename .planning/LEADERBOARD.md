# Highscores & Online Leaderboard

_Last updated 2026-11-27._

## What ships today (local)

- **Score formulas:** `shared/scoring.ts`. These are pure functions, shared by the client and the dormant API route.
  - **PrivacyQuest:** Trust% x 50, plus 200 per scenario, 100 per Safe Harbor identifier and 150 per patient story. A win adds 2,500 and a speed bonus of up to 2,000 (full at 30 min or less, zero at 180 min or more).
  - **Tower Defense (standalone):** 500 per wave held. A win adds Security% x 30, 2,000, and 50 per tower under 20 ("lean defense").
  - The in-game meters (Community Trust, Security) are unchanged. Points are a separate arcade layer on top.
- **Storage:** `client/src/lib/highscores.ts` keeps a top 10 per mode under `hq:highscores:v1`.
  - Every `hq:*` key survives New Game, Play Again and resetProgress, via `clearProgressKeepingHighscores()`.
  - Each run is recorded at most once (deduplicated by `runId`), and the stored score is always recomputed from stats.
- **UI:**
  - End-of-run tally (`RunScorePanel`) on the PrivacyQuest end screen and the standalone TD result card.
  - Arcade initials entry (`InitialsEntry`).
  - Hall of Fame screen (`HighscoresScreen`), reached from the start menu's HIGH SCORES row or from a result screen.
  - Demo runs show the tally but are never recorded.

## Plug-in seam (online)

`client/src/lib/leaderboard/index.ts` defines `LeaderboardProvider` (`getTop`, `submit`).

- The local provider is always on.
- An HTTP provider turns on only when the build sets `VITE_LEADERBOARD_URL`. When it is on:
  - The Hall of Fame gets a THIS DEVICE / WORLDWIDE switch.
  - Every finished run is also sent online (fire-and-forget).
- The client holds no credentials.

`api/leaderboard.ts` is a ready Vercel function backed by Upstash Redis sorted sets, called over REST with no SDK. It answers `503 not_configured` until its env vars exist.

## Recommendation: Vercel function + Upstash Redis

**Why:**
- The repo already deploys to Vercel and already has an `api/` function (`feedback.ts`) that follows the same keep-the-secret-server-side pattern.
- Redis sorted sets (`ZADD` / `ZREVRANGE` / `ZREVRANK`) are a leaderboard data structure out of the box.
- Upstash can be added from the Vercel Marketplace, which injects the env vars for you.

**To turn it on (about 10 minutes):**
1. In Vercel, go to Storage / Marketplace, then Upstash Redis, then connect it to the project. This sets `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
2. Set `VITE_LEADERBOARD_URL=/api/leaderboard` for the build and redeploy.

**Cost** (checked 2026-11-27 on upstash.com/pricing/redis):
- The free tier is 500K commands/month and 250 MB. Each submit uses about 6 commands and each board view uses 1, so the free tier covers tens of thousands of plays a month.
- Pay-as-you-go is $0.20 per 100K commands.
- The Vercel Hobby plan is for non-commercial use only. A sponsored or corporate-training deployment belongs on Vercel Pro (per-seat, about $20/mo). That cost applies whether or not the leaderboard exists.

### Alternatives considered

| Option | Cost | Anti-cheat | Notes |
|---|---|---|---|
| **Vercel fn + Upstash (recommended)** | $0 at this scale | Server recomputes scores; rate limit; dedup | Fits the existing deploy; no new vendor login for players |
| Supabase (Postgres + RLS / Edge Function) | Free tier pauses after 1 week of low activity; Pro from $25/mo | Weak if the client inserts directly; OK via an Edge Function | Worth it only if we also want accounts / cloud saves |
| Firebase Firestore + App Check | Generous free tier | App Check blocks scripted clients, but not a player editing their own requests | Adds Google SDK weight to the bundle |
| Hosted game-backend (LootLocker, PlayFab) | Free tiers, then per-MAU | Built-in validation hooks | Another vendor, SDK and account model; overkill for two boards |

## Anti-cheat: what's in and what's next

A browser game can't be made cheat-proof, because the player owns the client. The goal is to make cheating not worth the effort and to keep the board clean.

**Already in `api/leaderboard.ts`:**
1. The score is **recomputed from stats** on the server, and a mismatch is refused.
2. **Plausibility bounds** (`SCORE_BOUNDS`): trust and security stay within 0 to 100, plus caps on waves, NPCs and identifiers.
3. **Speed floor:** a PrivacyQuest win under 10 minutes is refused.
4. **One submission per `runId`**, and **20 submits/hour per IP**.
5. **Initials only** (3 characters, with a small blocklist). The board never stores a name or email, which keeps it clear of HR and PII concerns for a training product.

**Next steps, only if cheating actually shows up:**
- **Signed run ticket:** the server issues an HMAC-signed `{runId, startedAt}` when a run starts, and the submit must present it. This kills forged run IDs and gives a trusted duration.
- **Event log replay** for TD (towers placed per wave, breaches): the server re-simulates and checks the numbers. This is the strongest option and also the most work.
- **Moderation:** a hidden flag on suspicious rows, plus a small admin `DEL` script.
