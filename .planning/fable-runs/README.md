# Fable Runs

Overnight jobs for Claude Fable. Each file is a self-contained prompt: a **wish**
(what a good outcome looks like), what to **protect**, and what to **hand back**.
On purpose they don't tell Fable *how* — it explores the repo and figures that out.
If a run feels over-specified, cut it down. Loose reins are the point.

## Verified harness facts (smoke-tested 2026-07-01 — start here, don't rediscover)
- **Dev server:** `npm run dev` → http://127.0.0.1:8080 (Express + tsx; may already be running).
- **Boot into a LIVE scene via deep-link params — do NOT click the menu buttons.**
  The FULL GAME / DEMO / TOWER DEFENSE menu buttons will NOT reliably drop you into a
  playable scene from automation. Use the QA params the existing tests use:
  - `/?qa-no-save&qa-skip-onboarding&qa_no_encounter=1` → straight into `hospital_entrance`, canvas live.
  - `/?qa-room=<roomId>&qa-no-save&qa_no_encounter=1` → jump directly to a specific room.
- **Bridge:** `window.__QA__` exposes state (`currentRoomId`, `roomNPCs`, `roomDoors`,
  `completedRooms/NPCs/Zones`, `collectedItems`, `breachState`, `sceneReady`, …) plus
  `commands` = `{ movePlayerTo, pressSpace, navigateToDoor, teleportTo }`, `waitFor`, `emit`.
- **Lean on the existing helpers:** `tests/helpers/qa-helpers.ts` + `tests/progression/*.spec.ts`
  already encode correct boot + drive + assert. Playwright browsers are installed; run with
  `npx playwright test` / `npm run test:visual`.

## How to run one
1. Open a Claude Code session on this repo, model = Fable.
2. Paste the run file (or say "follow `.planning/fable-runs/01-playtest-sweep.md`").
3. Let it go overnight. One branch/worktree per run. Read the RUN_REPORT in the morning.

## Orchestration — match the mechanism to the work
Three shapes, decided by one question: *does the run converge in one pass, or does its
own output feed the next pass?*

- **One-shot discovery → parallel chats.** `02` and the proposal half of `04` finish in one
  pass. Fire and forget.
- **Find → fix → re-verify → a loop.** `07` (which subsumes `01` + `03`). Keeps going until a
  real stop condition instead of quitting after one pass. Run it *after* the parallel ones.
- **Taste-gated → you-in-the-loop, daytime.** `05` and `06` iterate, but need your taste each
  cycle. NOT unattended overnight — one evolving chat each, you steer.

**Collision rule:** runs that write game code to the same files (the loop, humor, refactor)
will merge-conflict if run in parallel. Only parallelize runs that DON'T write game code:
`01` (read-only), `02` (docs), `04`-proposal (docs). Everything else = separate branch,
integrated one at a time.

## Tonight's launch (2 parallel + 1 loop)
- **Chat A** (unattended): `02-planning-reconciliation` → branch `fable/reconciliation`
- **Chat B** (unattended): `04-refactor-proposal` (proposal only) → branch `fable/refactor-proposal`
- **Chat C** (the loop): `07-find-fix-verify-loop` → branch `fable/fix-loop`

All three are collision-free (A and B are docs; C writes code on its own branch). In the
morning: read the three reports, approve/adjust the refactor plan, triage what the loop flagged.
Then queue `05` / `06` as daytime sessions when you have taste to spend.

## Shared guardrails (apply to EVERY run)
1. **Own branch or worktree. Never commit to `main`.** One run = one branch.
2. **Trust the screen, not the code.** Prove anything you call "done" against the
   running game — `window.__QA__` / qa-bridge, screenshots, Playwright. No proof, not done.
3. **HIPAA content is regulated corporate training.** Facts must stay correct
   (45 CFR Part 164). You may draft/propose content, but *flag every factual or
   regulatory change for human sign-off*, and keep `.planning/CONTENT_MANIFEST.md` in sync.
4. **Hold the Nintendo Test** (see `CLAUDE.md` commandments): every action gets
   audio + visual + state feedback; nothing should read like a compliance document.
5. **Don't break the save format or the single-route (`/`) architecture** without
   flagging it loudly first.
6. **Don't stall.** Blocked? Note the workaround, keep moving, tell me in the report.
7. **Leave a `RUN_REPORT.md`** in this folder: what you did, what changed, what needs
   my eyes, open questions, what you'd do next.

## Where my taste is required (don't decide these solo)
Fun/feel calibration · humor that lands · final HIPAA sign-off · new-mechanic direction.
For these, *propose and show me options* — don't silently ship.
