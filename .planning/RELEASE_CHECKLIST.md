# RELEASE CHECKLIST — Ship as the indie-identity game (target: ~2026-08-01)

_Written 2026-07-01 by Fable Run 02; amended 2026-07-02 by the twin Run-02 session with live verification results (build ✓, asset pipeline ✓, Playwright 29/2/4) and new deploy/hygiene items. Companion to `STATE_OF_TRUTH.md` (facts) and `IDENTITY_AUDIT.md` (direction). Ordered: each section gates the next where noted. Every item is checkable — if you can't check it, it didn't happen._

Owner key: **[YOU]** = needs the user's hands/taste · **[AGENT]** = delegable to a Claude run · **[YOU+AGENT]** = agent drafts, user signs off.

---

## 0. Trust the build (do first — everything else assumes these)

- [x] **[AGENT] Verify production build resolves symlinked assets.** ~~Never verified in a prod build~~ **Verified 2026-07-02 (Run 02 second pass):** `npm run build` clean; `dist/public/attached_assets/` materializes as real files through the symlink; CI additionally copies the folder pre-build. Residual risk moved to §6 (deployed-URL smoke test). Note for later: the client is one 2.24 MB chunk (562 KB gzip) — fine to ship, worth code-splitting someday.
- [ ] **[AGENT] Fix the 2 failing progression tests (live evidence, 2026-07-02).** `npx playwright test tests/progression/` → **29 passed / 2 failed / 4 skipped-by-design**. Both failures = Reception completion never registers: `room-completion.spec.ts:37` (`completedRooms` stays `[]` after meeting all requirements) and `door-unlocks.spec.ts:71` (break room never unlocks, downstream of the same root). Completion works elsewhere (hospital_entrance test passes). Start with: riley sits at tile (10,3), the test interacts at (10,4); check whether a Phase-26 furniture obstacle blocks adjacency or dialogue-completion handling drifted. Decide: game bug (fix game) vs. helper drift (fix test) — then make the suite fully green. Overlaps Run 07's lane; don't fix twice.
- [ ] **[AGENT] Fix the test split brain.** (a) Add a `"test"` script that actually runs vitest on `client/src/**/*.test.ts` (the save-migration suite currently runs under NO command); (b) give `playwright.config.ts` an explicit `testMatch` for `*.spec.ts` only, so it stops collecting the two `.test.mts` node scripts; (c) either convert `tests/sorterData.test.mts` + `tests/breachTriageOverlay.test.mts` to vitest or wire them into the test script via `node --experimental-strip-types`; (d) confirm `npm run check && npm test && npm run test:visual` all pass green in one session.
- [ ] **[AGENT] Add a save-load guard.** In `client/src/lib/saveData.ts` `loadSave()`: check `version === 2` and validate array/number fields exist; fall back to `defaultSave` (or migrate) otherwise. Extend `saveData.test.ts` with a wrong-shape-but-valid-JSON case. Do NOT change the v2 schema itself. **Caution (second-pass finding):** the persisted blob legitimately carries 8 fields beyond the `SaveDataV2` interface (`useGameState.ts:153-171` — `currentAct`, `decisions`, `encounterResults`, …). The guard must validate presence/types, never strip unknown fields — or first fold those fields into the interface so the type tells the truth.
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
- [ ] **[YOU] Character-select blurbs tone check.** `characters.ts` ships 3 playable characters (`you`, `alex`, `nikhil`) whose blurbs carry inside jokes ("Brown Brad Pitt", "Lead Gardener"). A playable Nikhil is a nice sponsor cameo — decide whether the blurbs are the humor you want strangers (and the sponsor) reading on screen two.

## 4. Bug + polish gate (fed by Run 01 / the fix loop)

- [ ] **[YOU] All Run-01 blockers closed and re-verified** on the running game (screenshots or `window.__QA__` proof, per repo guardrails).
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
