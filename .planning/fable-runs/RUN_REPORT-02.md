# RUN REPORT — 02 Planning & Repo Reconciliation

_Executed 2026-07-01/02 · branch `fable/reconciliation` · mode: docs only (zero game-code changes)_

## What I did

1. **Read the full planning surface** — all ~25 docs in `.planning/` (ROADMAP, REQUIREMENTS, PROJECT, MILESTONES, STATE, ENHANCEMENT_BRIEF, IDENTITY + IDENTITY_AUDIT, PHI_SORTER_REDESIGN_BRIEF, FILE_CATALOG, HIPAA_TRAINING_FRAMEWORK, CONTENT_MANIFEST, DEBUG_LOG, DESIGN/POLISH/ROOM standards, VISUAL_INSPIRATIONS, VALIDATION_CHECKLIST, GAME_DESIGN_PRINCIPLES, codebase/×7, research/×5, milestones/×2, all 23 phase dirs) plus tests/qa-report.md and tests/RALPH_PROGRESSION.md — via three parallel exploration passes (two doc audits, one code ground-truth pass), with direct spot-checks of my own on routes, file sizes, component inventories, data files, test configs, and save code.
2. **Established code ground truth** and trusted it over docs everywhere they disagreed: single route `/`; phases 11–27 all shipped; PHI Sorter desk format (3 sets × 10 charts), Breach Triage (9 incidents), BreachDefense (6 towers / 8 threats / 10+4 waves), portraits, sponsor demo, save v2; `tsc` clean; old architecture confirmed dead in `_trash/`.
3. **Wrote the two deliverables** and marked the misleading docs stale in place (no deletions, no moves).

## What I created / changed

**Created:**
- `.planning/STATE_OF_TRUTH.md` — honest current status: feature + content inventory verified in code, position vs. the IDENTITY_AUDIT pivot (0 of 4 pivot workstreams started; Phases 22–24 shipped since the audit called them "queued"), a 27-row "docs that lie" table with verdicts and pointers, and a ranked scariest-tech-debt section.
- `.planning/RELEASE_CHECKLIST.md` — 6 gated sections, ~25 concrete checkable items, owner-tagged [YOU]/[AGENT]: build-trust gate (prod-build asset-symlink check, test-harness repair, save-load guard) → deferred human playthroughs (16/17/22–27, demo path, TD standalone) → the four identity-pivot workstreams as real tasks (Nina proof-of-concept first, per the audit) → sponsor readiness (SPONSOR_CONFIG is still 'Sponsor TBD') → Run-01-fed bug gate (referenced, not duplicated) → docs tail + ship gate.
- `.planning/fable-runs/RUN_REPORT-02.md` — this file.

**Modified (stale banners only, content untouched):** ROADMAP.md, PROJECT.md, MILESTONES.md, DEBUG_LOG.md, ENHANCEMENT_BRIEF.md, PHI_SORTER_REDESIGN_BRIEF.md, FILE_CATALOG.md, POLISH_STANDARD.md, GAME_DESIGN_PRINCIPLES.md, codebase/ARCHITECTURE.md, codebase/STRUCTURE.md, tests/RALPH_PROGRESSION.md — each got a one-line reconciliation notice pointing at STATE_OF_TRUTH.md. Nothing deleted, nothing moved (archival is a checklist item for a follow-up pass).

## Highest-value findings

1. **The game is code-complete but verification-naked.** Everything through Phase 27 shipped 2026-06-10; nothing from 16–27 has had a human playthrough, and Phases 19 & 21 (the two sponsor-facing flows) have no SUMMARY/VERIFICATION docs at all.
2. **Test split brain is worse than "config mismatch":** no npm script runs vitest, so the save-migration unit tests execute under NO command; Playwright's default glob mis-collects the two `.test.mts` node scripts; `tsc` typechecks zero test files.
3. **Save load never checks `version`** — corrupt JSON is handled, but wrong-shape valid JSON is trusted blindly. One small guard + one test closes it.
4. **Production asset risk:** every asset resolves through the `client/public/attached_assets` symlink; whether `vite build` follows it has never been verified. Checklist item #1.
5. **Docs actively lie in 4 dangerous ways:** "resume" instructions for shipped phases (ROADMAP/PROJECT/STATE), a 4×-cited file that doesn't exist (`tutorialContent.ts` in CONTENT_MANIFEST), live-route claims for dead `/privacy`//`/breach` (POLISH_STANDARD §7, RALPH_PROGRESSION:126), and eight "🔴 Open" bugs that DEBUG_LOG's own RESOLVED section closed in March.
6. **Identity pivot: direction set, execution not started.** The only accidental progress is the sorter-chart humor (Phase 22). Character depth, editorial voice, pure play, completion reframe — all still at zero; they are the actual release-content work, so the checklist makes them section 2.

## Needs your eyes

- **The two deliverables themselves** — your stated checkpoint for this run.
- **STATE_OF_TRUTH §6 risk ranking** — if you disagree with the order (I put test split-brain and save fragility above the monolith files), reorder before agents start executing the checklist.
- **RELEASE_CHECKLIST section 2 gating** — I encoded IDENTITY_AUDIT's own "rewrite one NPC first" recommendation as a hard gate before the 26-NPC pass. Confirm that's still your intent.
- **Archive-vs-repair decision** for ROADMAP/PROJECT: repair them, or archive both and let STATE_OF_TRUTH + a slim new roadmap replace them (my lean: archive; they're beyond patching).

## Open questions

1. **Sponsor status?** `sponsorConfig.ts` is placeholder. Checklist assumes a decision (real sponsor vs. tasteful self-sponsored default) by ship week.
2. **Does the 2–3 hr target hold after the character-depth pass?** Adding idle lines to 26 NPCs grows playtime; the pivot says "complete, tight scope" — someone should re-time a playthrough after section 2 lands.
3. **CLAUDE.md itself carries pre-pivot framing** ("every scenario should teach a specific HIPAA topic listed in the framework"). Updating it changes agent behavior repo-wide — flagged as a checklist item but left for your explicit call.
4. **Run 04 (refactor proposal) collision:** my checklist forbids ad-hoc splitting of the monolith quartet during release month. If Run 04's proposal gets approved, sequence it after ship or strictly on its own branch.

## What I'd do next

Morning order: read STATE_OF_TRUTH → triage Run 01's punch list into checklist §4 → run checklist §0 (build/asset check is 10 minutes and de-risks everything) → then the Nina proof-of-concept, because it's the cheapest test of whether the whole identity pivot works in practice.
