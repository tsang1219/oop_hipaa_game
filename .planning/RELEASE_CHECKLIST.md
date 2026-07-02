# RELEASE CHECKLIST — Ship as the indie-identity game (target: ~2026-08-01)

_Written 2026-07-01 by Fable Run 02; amended 2026-07-02 by the twin Run-02 session with live verification results and new deploy/hygiene items; updated again 2026-07-02 after the overnight batch merged to `main` (Run 07 fix loop + Run 04 proposal + Run 02 reconciliation) — §0 is now essentially done, and Run 07's user-flags are folded into §§1–4. Companion to `STATE_OF_TRUTH.md` (facts) and `IDENTITY_AUDIT.md` (direction). Ordered: each section gates the next where noted. Every item is checkable — if you can't check it, it didn't happen._

Owner key: **[YOU]** = needs the user's hands/taste · **[AGENT]** = delegable to a Claude run · **[YOU+AGENT]** = agent drafts, user signs off.

---

## 0. Trust the build (do first — everything else assumes these)

- [x] **[AGENT] Verify production build resolves symlinked assets.** ~~Never verified in a prod build~~ **Verified 2026-07-02 (Run 02 second pass):** `npm run build` clean; `dist/public/attached_assets/` materializes as real files through the symlink; CI additionally copies the folder pre-build. Residual risk moved to §6 (deployed-URL smoke test). Note for later: the client is one 2.24 MB chunk (562 KB gzip) — fine to ship, worth code-splitting someday.
- [x] **[AGENT] Fix the 2 failing progression tests.** **Done by Run 07 round 5b (`3b99504`):** root cause was stale hardcoded Riley coordinates in the specs plus a qa-room loader race — suite now **31 passed / 0 failed / 4 skipped-by-design** (re-confirmed on merged `main` 2026-07-02).
- [x] **[AGENT] Fix the test split brain.** **Done by Run 07 round 3 (`5715128`), verified in `package.json`/`saveData.ts` post-merge:** `npm test` = `test:unit` (vitest, scoped to `client/src/**/*.test.{ts,tsx}`) + `test:data` (tsx sorterData 188/188 + triage 26/26); Playwright `testMatch` limited to `*.spec.ts`.
- [x] **[AGENT] Add a save-load guard.** **Done by Run 07 round 3 (`5715128`):** new `validateSave()` — wrong version/shape resets gracefully, broken declared fields repaired, **extended fields preserved per the STATE_OF_TRUTH §6.2 caution** (never stripped). 5 new vitest cases; hostile-blob live smoke clean.
- [x] **[YOU→done] Triage the Run 01 playtest-sweep punch list.** Run 01 ran (read-only, `RUN_REPORT-01.md`, 117 screenshots) and produced findings F-01…F-26; **Run 07 fixed and screen-verified all of them** except two residuals now living in §4 (F-23 minor watch, reception-chairs art question). What's left for you from that pair is the flags list — also §4.

## 1. Human verification debt (the deferred playthroughs)

- [ ] **[YOU] Full-game live playthrough, start menu → certificate** (~2.5–3 hr, one sitting like a real player). This is the deferred feel-calibration for Phases 16, 17, 22–27 in one pass. Specifically judge: PHI Sorter desk rhythm + humor (22–24), Breach Triage tension (17), dialogue portraits (25), room floors/furniture (26), next-door gold pulse + idle sparkles + checkmarks (27). Log every "feels off" moment — feel notes are the deliverable. _Context: Run 07's machine traversal already proved the game is **beatable end-to-end** (fresh save → all 26 NPCs → PRIVACY GUARDIAN win, zero console errors) — so this run is purely about feel, not function._
- [ ] **[YOU] Demo path run-through** (StartMenu → DEMO → 4 rooms → records_room capstone → certificate → Esc to menu). Phase 21 has no VERIFICATION doc — this run IS the verification. Confirm the dim → silent beat → fanfare → NPC handoff beat lands.
- [ ] **[YOU] Standalone TD run** (StartMenu → Tower Defense → 10 waves → win/lose → Back to Menu). Phase 19 also has no VERIFICATION doc. Confirm save isolation: full-game save untouched after an arcade session.

## 2. Identity-pivot workstreams (the declared priorities — this is the actual release content work)

- [ ] **[YOU+AGENT] Proof-of-concept NPC rewrite first.** Per IDENTITY_AUDIT's own recommendation: rewrite ONE NPC (Nurse Nina) in the target voice — a kid, a coffee order, a printer feud, 3–4 idle lines unrelated to HIPAA — and playtest her before touching the other 25. This teaches the voice and de-risks the whole pass. Gate: user says "that's the tone" before proceeding. **Status: drafts exist, awaiting your read** — Run 05 left `CHARACTER_NINA_DRAFT.md`, `CHARACTER_RILEY_DRAFT.md`, `CAST.md`, and `VOICE_AND_HUMOR.md` in `.planning/` (uncommitted). Your yes/no on Nina IS this gate.
- [ ] **[YOU+AGENT] Character depth pass, all 26 named NPCs.** Each gets a non-HIPAA want/worry/running-joke expressed in 3–4 idle lines (`gameData.json` scenes + any idle-line mechanism). Keep existing HIPAA scenes intact; this is additive. Check: no named NPC exists solely to deliver a rule.
- [ ] **[YOU+AGENT] Editorial voice / hot-takes pass.** Home: the act-aware hallway bulletin boards (`hallwayContent.ts`) — already built, already paced, zero new UI needed. Write ~10–12 hot takes in the audit's register ("fax machines are 'secure' because Congress hadn't heard of email in 1996"). **Every take needs HIPAA-accuracy sign-off** (45 CFR Part 164) and a `CONTENT_MANIFEST.md` entry — opinionated ≠ inaccurate.
- [ ] **[YOU+AGENT] Three moments of pure play.** Concrete candidates: (1) recurring printer-jam gag escalating across acts, (2) one hidden/secret discovery in an existing room, (3) one fourth-wall or absurdist NPC beat (the cat-as-emergency-contact energy — note the sorter charts already do this; steal from them). Scenes that earn nothing except delight. Runs 05/06 (humor & joy pass) overlap here — if those runs execute, this item becomes "triage their output" instead.
- [ ] **[YOU+AGENT] Completion reframe.** `CertificateOverlay.tsx`: tone shifts from "you completed your training" to "thanks for playing our little game" — add a small credits beat and a "made by a small team, presented by [sponsor]" moment. Sponsor plumbing (`sponsorConfig.ts`) stays; only the words and framing change.
- [ ] **[AGENT] Demote coverage from KPI to reference.** Add a header to `HIPAA_TRAINING_FRAMEWORK.md`: it is now an *accuracy reference*, not a completeness checklist; GAP/THIN ratings are permission-to-skip, not a to-do list. Update `CLAUDE.md`'s HIPAA-review section to match the pivot (it still says "every scenario should teach a specific HIPAA topic listed in the framework").

## 3. Sponsor-demo readiness

- [ ] **[YOU] Populate `sponsorConfig.ts` with a real sponsor** (name, code, sprite, two dialogue lines) — currently `'Sponsor TBD'` / `'DEMO-CODE-PLACEHOLDER'`. If no sponsor is signed by ship, write a tasteful self-sponsored default instead of shipping "TBD."
- [ ] **[YOU] Sponsor-swap smoke test:** change the config, replay the capstone, confirm zero hardcoded leakage (Phase 21 claims this passes by construction — verify it once with eyes).
- [ ] **[YOU+AGENT] Pitch alignment check:** the demo's framing on screen matches the patronage pitch ("presented by," not "compliance product") — depends on the completion-reframe item above landing first.
- [ ] **[YOU] Character-select blurbs tone check.** `characters.ts` ships 3 playable characters (`you`, `alex`, `nikhil`) whose blurbs carry inside jokes ("Brown Brad Pitt", "Lead Gardener"). A playable Nikhil is a nice sponsor cameo — decide whether the blurbs are the humor you want strangers (and the sponsor) reading on screen two.

## 4. Bug + polish gate (fed by Run 01 / the fix loop)

- [x] **[AGENT] All Run-01 blockers closed and re-verified.** **Done by Run 07** — F-01…F-26 fixed with per-fix proof screenshots (`screenshots/run07/`, 37/37 driver checks), including two new criticals it found itself (F-25 dead `shutdown()` listener leak, F-26 patient-story unmounting the whole game). See `RUN_REPORT-07.md` final punch list.
- [ ] **[YOU] Tone-review Run 07's new player-facing copy** (all short, none HIPAA-load-bearing, but it shipped words in your game): 4 post-encounter NPC lines (`completedText` in `roomData.json`), 3 sorter opener lines (`sorterReactions.ts`), defeat header **"SYSTEMS BREACHED"** + retry hint, locked-door prompt "[LOCKED] … finish this area first", "\<NPC\> is ready to talk now" notify, onboarding "SPACE at a door".
- [ ] **[YOU] Ratify Run 07's three design calls** (it flagged them; reverting any is a small diff): (1) **records choice gate** — both records NPCs now reachable, "who do you assist FIRST" is literal, the choice still recorded as a decision flag; (2) **defeat is retryable** — losing an encounter no longer locks in a 0 (only victory writes the registry); (3) **win condition** — ending needs all 26 NPCs incl. 4 encounter victories, standalone TD stays optional. If any of these was intended otherwise, say so before the content work builds on them.
- [ ] **[AGENT] F-23 (minor, watch):** social-gate double-toast under rapid keypresses — behaves correctly at human pace; re-check after any input-handling change.
- [ ] **[YOU] Reception's knocked-over chairs** (run 01 open question, `screenshots/run01/B05-reception-done`): art intent or rotated-sprite bug? Two-second call when you're in the room.
- [ ] **[AGENT] SPRITE-002:** NPCs have walk animations registered but never play them (statues). Either wire idle/walk anims or consciously accept and log the decision.
- [ ] **[YOU] FEEL-001..008** (DEBUG_LOG polish backlog): triage into fix-now vs. won't-fix; don't let a March list silently represent open work.
- [ ] **[AGENT] Defuse the conditional-hooks time bomb.** 46 `eslint-disable react-hooks/rules-of-hooks` sit inside `PHISorterOverlay.tsx` (31) and `BreachTriageOverlay.tsx` (15) — hooks called conditionally. Either restructure so hooks run unconditionally (disables → 0) or document why each is provably safe. Small, mechanical, prevents a whole class of "sorter randomly breaks after refactor" bugs. Coordinate with Run 04 scope — don't restructure the same files twice.

## 5. Docs & repo hygiene (mostly done by Run 02 — finish the tail)

- [ ] **[AGENT] Fix `CONTENT_MANIFEST.md`'s 4× false path** — `tutorialContent.ts` → `game/breach-defense/constants.ts` — and add Phase 23–25 mechanic updates (desk format, portraits).
- [ ] **[AGENT] Reconcile the status docs:** ROADMAP (check the 16–27 plan boxes, kill "Active/Paused/TBD"), PROJECT.md (current milestone + pivot), STATE.md frontmatter, MILESTONES.md (add v2.0–v2.3 entries), REQUIREMENTS.md checkboxes + footer. Or archive ROADMAP/PROJECT wholesale and let STATE_OF_TRUTH.md + a fresh slim roadmap replace them.
- [ ] **[AGENT] Move HISTORICAL docs to `.planning/archive/`** (DEBUG_LOG, ENHANCEMENT_BRIEF, PHI_SORTER_REDESIGN_BRIEF, qa-report, research/) — never delete, per guardrails. Stale banners from Run 02 are the interim fix.
- [ ] **[AGENT] Fix `tests/RALPH_PROGRESSION.md` line ~126** (`/breach` route claim) and extend its checklist past Phase 15 before anyone runs another Ralph loop off it.
- [ ] **[AGENT] Repo hygiene sweep.** (a) Remove the 7 stale 2026-03-11 worktrees + their `worktree-agent-*` branches (`git worktree remove` + `git branch -D`) — each holds a full pre-unification codebase copy that pollutes searches; (b) delete the broken `.replit` `[deployment]` block (runs `dist/index.cjs`, which the build never produces) or fix it if Replit hosting is still wanted; (c) delete `vercel.json` unless Vercel is the chosen target (§6); (d) drop vestigial `drizzle.config.ts`/postgres scaffolding and the unused `GEMINI_API_KEY` env entry, or leave one comment saying why they stay.

## 6. Ship

- [ ] **[YOU] Decide the deploy target — knowing GitHub Pages is already live-wired.** `.github/workflows/deploy.yml` builds and deploys on **every push to `main`** (base `/oop_hipaa_game/`, SPA 404 fallback) — the game is presumably already serving at `https://tsang1219.github.io/oop_hipaa_game/`, and every merge to main ships instantly. Confirm that's the intended target and cadence (or gate the workflow behind a tag/manual dispatch); then kill or fix the other two configs (broken `.replit` deployment, `vercel.json` — see §5 hygiene item).
- [ ] **[YOU] Full smoke test on the deployed URL:** audio plays, sprites render (asset symlink — the last unverified link in the chain), saves persist, all three encounters run, demo path completes — on desktop + one laptop-sized screen.
- [ ] **[YOU] Final HIPAA sign-off** on everything section 2 added (hot takes, NPC lines, gags) — facts stay correct even when the voice gets opinionated. Update `CONTENT_MANIFEST.md` one last time.
- [ ] **[YOU] Fresh-profile cold-start test:** empty localStorage → StartMenu → first 10 minutes. First-time experience is what reviewers and the sponsor see.
- [ ] **[YOU] Ship it.** Tag the release, write the two-paragraph "what this is" note in the audit's voice, and stop adding features.

---

## Explicitly OUT of scope for this release (per IDENTITY_AUDIT)

LMS/SCORM anything · comprehensive-coverage expansion (the 4 GAP topics stay gaps unless a scene begs for one) · Outbound TD mode (ENHANCEMENT_BRIEF §4.3 — still unbuilt, stays unbuilt) · multi-playthrough/replay systems · the monolith refactor beyond what Run 04's approved proposal scopes (don't split 4,000-line files ad hoc during release month).
