# RELEASE CHECKLIST — Ship as the indie-identity game (target: ~2026-08-01)

_Written 2026-07-01 by Fable Run 02. Companion to `STATE_OF_TRUTH.md` (facts) and `IDENTITY_AUDIT.md` (direction). Ordered: each section gates the next where noted. Every item is checkable — if you can't check it, it didn't happen._

Owner key: **[YOU]** = needs the user's hands/taste · **[AGENT]** = delegable to a Claude run · **[YOU+AGENT]** = agent drafts, user signs off.

---

## 0. Trust the build (do first — everything else assumes these)

- [ ] **[AGENT] Verify production build resolves symlinked assets.** Run `npm run build`, serve `dist/`, confirm audio plays and spritesheets render (assets live behind the `client/public/attached_assets` symlink — never verified in a prod build). If broken, fix the asset pipeline before anything else.
- [ ] **[AGENT] Fix the test split brain.** (a) Add a `"test"` script that actually runs vitest on `client/src/**/*.test.ts` (the save-migration suite currently runs under NO command); (b) give `playwright.config.ts` an explicit `testMatch` for `*.spec.ts` only, so it stops collecting the two `.test.mts` node scripts; (c) either convert `tests/sorterData.test.mts` + `tests/breachTriageOverlay.test.mts` to vitest or wire them into the test script via `node --experimental-strip-types`; (d) confirm `npm run check && npm test && npm run test:visual` all pass green in one session.
- [ ] **[AGENT] Add a save-load guard.** In `client/src/lib/saveData.ts` `loadSave()`: check `version === 2` and validate array/number fields exist; fall back to `defaultSave` (or migrate) otherwise. Extend `saveData.test.ts` with a wrong-shape-but-valid-JSON case. Do NOT change the v2 schema itself.
- [ ] **[YOU] Triage the Run 01 playtest-sweep punch list.** The parallel playtest sweep (Run 01 / find-fix-verify loop) is producing the bug punch list — this checklist deliberately does not duplicate it. Read its report, mark blockers vs. polish, feed blockers into section 4.

## 1. Human verification debt (the deferred playthroughs)

- [ ] **[YOU] Full-game live playthrough, start menu → certificate** (~2.5–3 hr, one sitting like a real player). This is the deferred feel-calibration for Phases 16, 17, 22–27 in one pass. Specifically judge: PHI Sorter desk rhythm + humor (22–24), Breach Triage tension (17), dialogue portraits (25), room floors/furniture (26), next-door gold pulse + idle sparkles + checkmarks (27). Log every "feels off" moment — feel notes are the deliverable.
- [ ] **[YOU] Demo path run-through** (StartMenu → DEMO → 4 rooms → records_room capstone → certificate → Esc to menu). Phase 21 has no VERIFICATION doc — this run IS the verification. Confirm the dim → silent beat → fanfare → NPC handoff beat lands.
- [ ] **[YOU] Standalone TD run** (StartMenu → Tower Defense → 10 waves → win/lose → Back to Menu). Phase 19 also has no VERIFICATION doc. Confirm save isolation: full-game save untouched after an arcade session.

## 2. Identity-pivot workstreams (the declared priorities — this is the actual release content work)

- [ ] **[YOU+AGENT] Proof-of-concept NPC rewrite first.** Per IDENTITY_AUDIT's own recommendation: rewrite ONE NPC (Nurse Nina) in the target voice — a kid, a coffee order, a printer feud, 3–4 idle lines unrelated to HIPAA — and playtest her before touching the other 25. This teaches the voice and de-risks the whole pass. Gate: user says "that's the tone" before proceeding.
- [ ] **[YOU+AGENT] Character depth pass, all 26 named NPCs.** Each gets a non-HIPAA want/worry/running-joke expressed in 3–4 idle lines (`gameData.json` scenes + any idle-line mechanism). Keep existing HIPAA scenes intact; this is additive. Check: no named NPC exists solely to deliver a rule.
- [ ] **[YOU+AGENT] Editorial voice / hot-takes pass.** Home: the act-aware hallway bulletin boards (`hallwayContent.ts`) — already built, already paced, zero new UI needed. Write ~10–12 hot takes in the audit's register ("fax machines are 'secure' because Congress hadn't heard of email in 1996"). **Every take needs HIPAA-accuracy sign-off** (45 CFR Part 164) and a `CONTENT_MANIFEST.md` entry — opinionated ≠ inaccurate.
- [ ] **[YOU+AGENT] Three moments of pure play.** Concrete candidates: (1) recurring printer-jam gag escalating across acts, (2) one hidden/secret discovery in an existing room, (3) one fourth-wall or absurdist NPC beat (the cat-as-emergency-contact energy — note the sorter charts already do this; steal from them). Scenes that earn nothing except delight. Runs 05/06 (humor & joy pass) overlap here — if those runs execute, this item becomes "triage their output" instead.
- [ ] **[YOU+AGENT] Completion reframe.** `CertificateOverlay.tsx`: tone shifts from "you completed your training" to "thanks for playing our little game" — add a small credits beat and a "made by a small team, presented by [sponsor]" moment. Sponsor plumbing (`sponsorConfig.ts`) stays; only the words and framing change.
- [ ] **[AGENT] Demote coverage from KPI to reference.** Add a header to `HIPAA_TRAINING_FRAMEWORK.md`: it is now an *accuracy reference*, not a completeness checklist; GAP/THIN ratings are permission-to-skip, not a to-do list. Update `CLAUDE.md`'s HIPAA-review section to match the pivot (it still says "every scenario should teach a specific HIPAA topic listed in the framework").

## 3. Sponsor-demo readiness

- [ ] **[YOU] Populate `sponsorConfig.ts` with a real sponsor** (name, code, sprite, two dialogue lines) — currently `'Sponsor TBD'` / `'DEMO-CODE-PLACEHOLDER'`. If no sponsor is signed by ship, write a tasteful self-sponsored default instead of shipping "TBD."
- [ ] **[YOU] Sponsor-swap smoke test:** change the config, replay the capstone, confirm zero hardcoded leakage (Phase 21 claims this passes by construction — verify it once with eyes).
- [ ] **[YOU+AGENT] Pitch alignment check:** the demo's framing on screen matches the patronage pitch ("presented by," not "compliance product") — depends on the completion-reframe item above landing first.

## 4. Bug + polish gate (fed by Run 01 / the fix loop)

- [ ] **[YOU] All Run-01 blockers closed and re-verified** on the running game (screenshots or `window.__QA__` proof, per repo guardrails).
- [ ] **[AGENT] SPRITE-002:** NPCs have walk animations registered but never play them (statues). Either wire idle/walk anims or consciously accept and log the decision.
- [ ] **[YOU] FEEL-001..008** (DEBUG_LOG polish backlog): triage into fix-now vs. won't-fix; don't let a March list silently represent open work.

## 5. Docs & repo hygiene (mostly done by Run 02 — finish the tail)

- [ ] **[AGENT] Fix `CONTENT_MANIFEST.md`'s 4× false path** — `tutorialContent.ts` → `game/breach-defense/constants.ts` — and add Phase 23–25 mechanic updates (desk format, portraits).
- [ ] **[AGENT] Reconcile the status docs:** ROADMAP (check the 16–27 plan boxes, kill "Active/Paused/TBD"), PROJECT.md (current milestone + pivot), STATE.md frontmatter, MILESTONES.md (add v2.0–v2.3 entries), REQUIREMENTS.md checkboxes + footer. Or archive ROADMAP/PROJECT wholesale and let STATE_OF_TRUTH.md + a fresh slim roadmap replace them.
- [ ] **[AGENT] Move HISTORICAL docs to `.planning/archive/`** (DEBUG_LOG, ENHANCEMENT_BRIEF, PHI_SORTER_REDESIGN_BRIEF, qa-report, research/) — never delete, per guardrails. Stale banners from Run 02 are the interim fix.
- [ ] **[AGENT] Fix `tests/RALPH_PROGRESSION.md` line ~126** (`/breach` route claim) and extend its checklist past Phase 15 before anyone runs another Ralph loop off it.

## 6. Ship

- [ ] **[YOU] Decide the deploy target** (GitHub Pages is already plumbed via `BASE_URL`) and do a full smoke test on the deployed URL: audio, saves, all three encounters, demo path, on desktop + one laptop-sized screen.
- [ ] **[YOU] Final HIPAA sign-off** on everything section 2 added (hot takes, NPC lines, gags) — facts stay correct even when the voice gets opinionated. Update `CONTENT_MANIFEST.md` one last time.
- [ ] **[YOU] Fresh-profile cold-start test:** empty localStorage → StartMenu → first 10 minutes. First-time experience is what reviewers and the sponsor see.
- [ ] **[YOU] Ship it.** Tag the release, write the two-paragraph "what this is" note in the audit's voice, and stop adding features.

---

## Explicitly OUT of scope for this release (per IDENTITY_AUDIT)

LMS/SCORM anything · comprehensive-coverage expansion (the 4 GAP topics stay gaps unless a scene begs for one) · Outbound TD mode (ENHANCEMENT_BRIEF §4.3 — still unbuilt, stays unbuilt) · multi-playthrough/replay systems · the monolith refactor beyond what Run 04's approved proposal scopes (don't split 4,000-line files ad hoc during release month).
