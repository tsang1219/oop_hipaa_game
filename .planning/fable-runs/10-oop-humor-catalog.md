# Run 10 — Out-of-Pocket humor catalog (research, feeds Run 05)
**Mode:** own branch · doc-only (no game code) · **My checkpoint:** LIGHT — this is reference material, not shipped dialogue

## The wish

PrivacyQuest is a cute 8-bit HIPAA-training RPG. The mechanics and pixel art are there; what's missing is a specific comedic **taste** — the "healthcare, but funny" register of Nikhil Krishnan's *Out-of-Pocket* (I'm collaborating with him on the game). Before any dialogue pass, I want his comedic DNA extracted into a reference I can mine.

Produce a **catalog + playbook** of OOP's humor, pulled from the posts I've already cataloged, and translated into *this game's* voice — so a later humor pass (like `05-humor-and-joy-pass.md`) can generate in his taste without me feeding it examples by hand.

**The load-bearing translation.** OOP's humor is often clever one-liners, chart-gags, and deadpan zingers. This game's `VOICE_AND_HUMOR.md` explicitly *bans* that — no joke-writer's jokes, no prepared-sentence wit, no character announcing a punchline. So the job is NOT "put OOP's jokes in NPC mouths." It's: extract his comedic **lenses** — absurd-literalization of bureaucracy, weird-rules deadpan, the analogy-as-Trojan-horse-for-comprehension move — and show how each survives the game's grounded-speech filter. A device that can only work as a stand-up line is a device we can't use; say so.

## Inputs — study these first

- **The enumeration (source of truth, not a web crawl):** my vault's OOP source index — 101 posts across 13 clusters, every one at `https://www.outofpocket.health/p/<slug>`:
  `"/Users/all/Library/Mobile Documents/iCloud~md~obsidian/Documents/Health is Other People/+ Atlas/research/sources/Out of Pocket Source Index.md"`
- **Who he is:** `"/Users/all/ai_os/vault/+ Atlas/people/contacts/Nikhil Krishnan.md"` — persona, comedic instincts (the MACRA nested-acronym gag, "becoming the Joker," "F*** it we ball," memes-as-punctuation).
- **The target register (so the translation is real):** this repo's `.planning/VOICE_AND_HUMOR.md`, `.planning/GAME_DESIGN_PRINCIPLES.md`, and `.planning/CONTENT_MANIFEST.md` (dialogue lives in `client/src/data/gameData.json`).

## What to do

1. **Triage the 101 posts** by joke/meme potential. Extract deeply from the **top ~15–20 funniest** — weight the absurd/weird clusters and the privacy/HIPAA-adjacent ones (directly game-relevant). Strong first-tier bets from the index:
   - *Silly Little Rules in Healthcare* · *More Weird Rules in Healthcare* · *Weird Health Insurance Concepts*
   - *Using Marriage to Game Health Insurance (Theoretically)* · *Paying for Friends, Gaming Insurance, and Hacking CPAP Machines* · *(Ethically Dubious) Ways to Give Patients More Choice*
   - *Healthcare Ideas That Look Good But Are Bad* · *Medical Tourism: A Tarpit Idea* · *Time Toxicity in Healthcare*
   - ***Pixel Tracking, Healthcare Advertising, and HIPAA*** (privacy — closest to this game) · *uBiome — How Microbiome Testing Becomes Fraud* · *Emergent, Fringe Behaviors in Healthcare*
   - **Skip:** the *Predictions*, *Founder & Startup Advice*, *OOP Meta/Announcements* clusters, and **[S] sponsored** posts unless a bit is genuinely funny.
2. **Fetch each pick** at `outofpocket.health/p/<slug>`. If a post is members-only, log it and move on — don't fake coverage.
3. **Per post, capture:** topic (→ maps to a HIPAA room/level), 3–8 **verbatim** jokes (best-first, with the source URL), the **meme/visual format** used, the underlying **comedic device**, and a **game-use tag** (`npc-dialogue` · `item-desc` · `loading-screen` · `quiz-feedback` · `flavor-text`).
   - Device taxonomy to start from (extend as you find more): *absurd literalization* · *nested-acronym mockery* · *analogy smuggling* · *deadpan cynicism* · *self-deprecation / becoming-the-Joker* · *chart-as-punchline* · *fake-official artifact* (parody EOB / policy / job post).

## Protect

- **The game's grounding discipline wins.** Every OOP device gets filtered through `VOICE_AND_HUMOR.md`. If a device only lands as a stand-up line, mark it **unusable here** and explain why — don't smuggle AI-affect back in under an OOP banner.
- **HIPAA accuracy is never traded for a laugh.** This is a training game; humor is the Trojan horse, not the payload. Flag any bit too cynical/dark for a training context.
- **Verbatim ≠ shippable.** His exact lines are reference/inspiration. I'll get his green-light before any land in-game; default to generating *in the style*, not re-skinning his sentences.
- **Doc-only run.** Do NOT edit `gameData.json` or any game code — this run only writes to `.planning/research/`. (Keeps it collision-free with code-writing runs.)

## Hand back — three files in `.planning/research/`

1. **`OOP_HUMOR_CATALOG.md`** — one table, one row per post: `topic | best jokes (verbatim, trimmed, w/ URL) | meme format | device | game-use`. The raw seam I mine.
2. **`OOP_HUMOR_PLAYBOOK.md`** — the generator-ready brief. For each of the 6–8 usable devices: how it works, 2 real OOP examples, and **1 PrivacyQuest-adapted example** (device applied to HIPAA/privacy content, in grounded in-world speech — show the transfer). Plus: voice do/don'ts reconciled with `VOICE_AND_HUMOR.md`, and the register guardrail. Call out any device that did NOT survive the filter.
3. **`OOP_PAYWALLED.md`** — funny-looking posts skipped behind the members wall, for a later pass.

Plus a short **run report**: posts triaged, posts extracted, devices found (and which survived the grounding filter), jokes captured, members-only skips, and the 3 bits you think are funniest / riskiest so I look there first.

Propose boldly on the catalog; be conservative on what you claim survives the voice filter. I'll cut what doesn't land.
