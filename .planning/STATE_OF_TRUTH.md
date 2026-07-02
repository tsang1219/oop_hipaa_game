# STATE OF TRUTH — What the Game Actually Is

_Written 2026-07-01 by Fable Run 02 (planning reconciliation). Ground truth verified against code at commit `673184c` on branch `fable/reconciliation`. When any other planning doc disagrees with this one, this one wins — and when this one disagrees with the code, the code wins._

---

## 1. The one-paragraph truth

PrivacyQuest is **one unified game at a single route (`/`)**: a 12-room hospital RPG (6 content rooms + 6 hallway connectors) with 26 named NPCs, three distinct encounters (BreachDefense tower defense, PHI Sorter Papers-Please desk, Breach Triage queue), a three-act soft narrative, a v2 localStorage save, a sponsor-demo path with certificate capstone, and a standalone tower-defense arcade mode reachable from the start menu. **Phases 11–27 are all code-complete and shipped as of 2026-06-10.** `tsc` passes clean. What has NOT happened: any live human playthrough of the Phase 16–27 work, and any of the four identity-pivot workstreams from `IDENTITY_AUDIT.md` (character depth, editorial voice, pure play, completion reframe).

## 2. Where we stand against the identity pivot (2026-05-11 `IDENTITY_AUDIT.md`)

The audit predates the June-10 ship day, so its snapshot is stale in one important way: it called Phases 22–24 (PHI Sorter redesign) "queued, not shipped." **They shipped**, and they are the closest thing in the game to the audit's "moments of PHI joy" — 45 humor-bearing chart fields, HOLD IT reveals, deadpan Daria/Veep tone, stamp-rhythm desk play.

| Audit priority | Status today |
|---|---|
| 1. Character depth pass (non-HIPAA arcs, idle lines) | **Not started.** 50 dialogue scenes in `gameData.json` are still all HIPAA-load-bearing. No NPC has a goal/worry/joke unrelated to a rule. |
| 2. Editorial voice / hot takes | **Not started.** No codex exists (`CodexModal.tsx` is in `_trash/`). Natural home: hallway bulletin boards (`hallwayContent.ts`, already act-aware). |
| 3. Moments of pure play | **Partially started by accident** — sorter chart humor (Phase 22) is real delight; nothing outside the sorter. No printer gag, no hidden room, no fourth-wall NPC. |
| 4. Completion reframe ("thanks for playing" not "training complete") | **Not started.** `CertificateOverlay.tsx` (350 lines) still frames completion as training; `SPONSOR_CONFIG` is placeholder (`'Sponsor TBD'`, `'DEMO-CODE-PLACEHOLDER'`). |
| 5. Coverage stops being a KPI | **Docs not updated.** `HIPAA_TRAINING_FRAMEWORK.md` (18 STRONG / 12 ADEQUATE / 2 THIN / 4 GAP) still reads as a coverage checklist; `CONTENT_MANIFEST.md` header still says "check coverage." |

Scope, ambient texture, and sponsor plumbing — the three things the audit rated "aligned" — have only gotten stronger since (Phases 25–27).

## 3. Verified feature inventory (all confirmed in code, not docs)

**Routing & shell**
- `client/src/App.tsx`: exactly two routes — `/` → `UnifiedGamePage`, catch-all → `NotFound`. `/privacy` and `/breach` are dead (removed Phase 12). Router honors `import.meta.env.BASE_URL` (GitHub-Pages ready).
- `client/src/components/StartMenu.tsx` (434 lines): DEMO / Tower Defense / Full Game.

**Exploration loop** (`client/src/phaser/scenes/ExplorationScene.ts`, 3,379 lines)
- Door-to-door navigation with BFS routing; door states `'locked' | 'available' | 'completed' | 'next'` — the `'next'` state breathes gold (Phase 27).
- Idle-hint sparkles on un-met objectives (9s grace / 5s interval), live zone-glow kill + checkmark pop-in + NPC fade on completion, room fanfares, floor treatments per room type (`FLOOR_STYLES`), furniture idle animations, dialogue portraits via `DialoguePortrait.tsx` cropping PNG sheets (`NPCSprite.tsx` deleted Phase 25 — only a comment at `SpriteFactory.ts:32` remains).

**Encounters**
- **BreachDefense** (`BreachDefenseScene.ts`, 2,160 lines; `game/breach-defense/constants.ts`): 6 towers, 8 threats, 10 waves standalone / 4 curated waves (`ENCOUNTER_WAVES_INBOUND`) as IT Office encounter. Standalone arcade wired through StartMenu (Phase 19), save-isolated by construction.
- **PHI Sorter** (Papers-Please desk format, Phases 16+22–24): 11 components in `client/src/components/phi-sorter/` (StampPad, DeskDocument, ShiftClock, OutgoingTray, NPCReactionBubble w/ portrait, …). Data: `sorterData.ts` — 3 document sets × 10 items = 30 charts, act-scaled difficulty, HOLD IT reveals; `sorterReactions.ts` (384 lines) of NPC voice. Old drag-to-bucket components deleted.
- **Breach Triage** (Phase 17): 4 components in `client/src/components/breach-triage/`; `triageData.ts` — 9 incidents (misdirected-fax, unencrypted/encrypted-laptop, hr-snooping, good-faith-glance, vendor-breach, internal-misuse, deceased-records, ransomware). Priya the Privacy Officer, Act-3-gated.

**Sponsor demo** (Phases 18–21): `demoSession.ts` (4-room `DEMO_ROOM_ORDER`), capstone certificate in `records_room` when all 4 demo rooms genuinely cleared, `CertificateOverlay.tsx` with dim → silent beat → fanfare → NPC handoff phase machine, `sponsorConfig.ts` fully pluggable but **placeholder-valued**.

**Save system** (`client/src/lib/saveData.ts`, 187 lines): `SaveDataV2` (15 fields), key `pq:save:v2`, `migrateV1toV2` collapses 29 legacy keys, write-before-delete, idempotent, has a real vitest suite (`saveData.test.ts`) — see §6 for why that suite never runs.

**QA bridge** (`client/src/phaser/qa-bridge.ts`, 345 lines): `window.__QA__` with `movePlayerTo`/`navigateToDoor`/`teleportTo`, `waitFor.event/roomLoad/sceneReady`, full state snapshot incl. `breachState` and `eventLog`. Initialized in `main.tsx` before render.

**Build health**: `npx tsc --noEmit` → 0 errors. `npm run build` exists (vite + esbuild server bundle) — not exercised this run. Zero TODO/FIXME/HACK markers in `client/src`.

## 4. Content inventory

| Content | Count | Where |
|---|---|---|
| Rooms | 12 (6 content + 6 hallways) | `roomData.json` |
| Named NPCs (all with `sprite` field) | 26 | `roomData.json` |
| Interaction zones | 16 | `roomData.json` |
| Educational items | 13 | `roomData.json` |
| Doors | 22 | `roomData.json` |
| Dialogue scenes (with choices) | 50 (~145 text lines) | `gameData.json` |
| PHI Sorter charts | 30 (3 sets × 10) | `sorterData.ts` |
| Sorter NPC reaction lines | 384-line bank | `sorterReactions.ts` |
| Breach Triage incidents | 9 | `triageData.ts` |
| Towers / threats / waves | 6 / 8 / 10 (+4 encounter) | `game/breach-defense/constants.ts` |
| Hallway bulletin boards | act-aware | `hallwayContent.ts` |
| Codex | **none** (removed to `_trash/`) | — |
| Audio | 243 `.ogg` | `attached_assets/` (symlinked into `client/public/`) |
| Images/spritesheets | 40 | `attached_assets/generated_images/` |

Acts are a *soft* concept: no `act` field on rooms; act shows up in `sorterData.ts` difficulty, hallway boards, music selection, and Priya's Act-3 spawn gate.

## 5. Docs that lie — reconciliation table

Verdicts: **CURRENT** (trust it) · **MOSTLY CURRENT** (trust with the listed corrections) · **STALE** (actively misleads) · **HISTORICAL** (fine as archive, wrong as status).

| Doc | Verdict | Worst false claim(s) → reality |
|---|---|---|
| `IDENTITY.md` | CURRENT | — (this + `IDENTITY_AUDIT.md` are the docs to reconcile everything else TO) |
| `IDENTITY_AUDIT.md` | CURRENT (one stale line) | "Phases 22–24 … queued, not shipped" (§Misaligned) → shipped 2026-06-10 |
| `ROADMAP.md` | STALE | v2.3 "active" / v2.1 "Paused" (~line 184) → both SHIPPED; unchecked plan boxes for 16-03/04, 17-xx, 22–27 contradict its own "Complete" tags; Phase 18/19/20 "Plans: TBD" → all executed; malformed progress-table rows (16/18/25/26/27) |
| `PROJECT.md` | STALE | "Current Milestone: v2.2" (frozen at 2026-05-07 kickoff); v2.1 "paused at 98%"; "Validated" list still contains HallwayHub / hub-world-between-two-games (dead since Phase 12); predates the identity pivot entirely |
| `STATE.md` | MOSTLY CURRENT | Frontmatter `milestone: v2.0`, `status: unknown`, "Current focus: v2.2" → v2.3 shipped; "Phase 16 Plan 04 paused at 98%" contradicted by its own velocity table (16-04 done, 25m) |
| `MILESTONES.md` | HISTORICAL | Ledger stops at v1.1 — no v2.0/2.1/2.2/2.3 entries; portraits/furniture/floors listed "deferred to v2.x" → shipped (25/26); cites removed HubWorldScene |
| `REQUIREMENTS.md` | MOSTLY CURRENT | v2.1/v2.3 rows accurate; but FOUN/NAV/NARR/DEMO/FIX boxes unchecked + "Pending" though shipped; footer "Last updated 2026-05-08" wrong; TRIA-06 uses pre-pivot coverage-KPI framing |
| `ENHANCEMENT_BRIEF.md` | HISTORICAL | "two disconnected games," `/privacy` + `/breach` + HallwayHub as current; §4.1 Sorter + §4.4 Triage "DEFERRED TO V2.1" → shipped; §12 success criteria are pre-pivot KPIs; §4.3 Outbound TD correctly still unbuilt |
| `PHI_SORTER_REDESIGN_BRIEF.md` | HISTORICAL | "Phase 18 starting; 19+20 queued" (wrong numbers AND status); "No code touched yet" → fully realized as Phases 22–24; sketched file structure (`phi-sorter-v2/`, `SorterDeskOverlay.tsx`) diverges from shipped structure |
| `FILE_CATALOG.md` | STALE | Lists deleted `NPCSprite.tsx`/`BucketZone.tsx`/`SorterItem.tsx`/`SorterTakeawaysPanel.tsx` as live; omits the 9 shipped desk components + `DialoguePortrait.tsx`; "63 files" and line counts wrong |
| `DEBUG_LOG.md` | HISTORICAL | BUG-001..008 flagged "🔴 Open" at top, but its own RESOLVED section (2026-03-27, lines ~163–188) closes all eight; every file/line pointer cites deleted `PrivacyQuestPage.tsx`/`HubWorldScene` (now `_trash/`). Only FEEL-001..008 + SPRITE-001/002 remain live (polish, cosmetic) |
| `VALIDATION_CHECKLIST.md` | MOSTLY CURRENT | Line ~59 "returns to hub world map" → continuous door navigation now; silent on everything post-Phase-15 |
| `DESIGN_STANDARD.md` | MOSTLY CURRENT | Line ~224 "ExplorationScene already 1500+ lines" → 3,379 now (concern under-stated, not wrong) |
| `POLISH_STANDARD.md` | STALE | §7 (lines ~251–258) tests navigation to `/privacy` and `/breach` → routes removed Phase 12; names `RecapModal`/`CodexModal` as live → both in `_trash/` |
| `ROOM_DESIGN_STANDARDS.md` | CURRENT | — |
| `VISUAL_INSPIRATIONS.md` | CURRENT | — |
| `GAME_DESIGN_PRINCIPLES.md` | STALE | Two-games framing throughout ("both games complete", "Cross-Game Moments"); "Hub World as Home Base" pacing rows → hub removed; "HIPAA Guardian certification" framing → contradicts pivot |
| `CONTENT_MANIFEST.md` | MOSTLY CURRENT | Cites `client/src/game/breach-defense/tutorialContent.ts` **4×** (lines ~183/199/216/231) → file is in `_trash/`; content lives in `constants.ts`. Not updated for Phase 23–25 mechanic changes; pre-pivot "check coverage" header |
| `HIPAA_TRAINING_FRAMEWORK.md` | STALE framing / current facts | Declares itself the authority on "adequate HIPAA education" coverage → pivot retired coverage-as-KPI. Facts current to Phase 17 (18 STRONG / 12 ADEQUATE / 2 THIN / 4 GAP). Dangling `sam_access` scene ref (~line 324) not in manifest |
| `codebase/ARCHITECTURE.md`, `codebase/STRUCTURE.md` | STALE | Both describe the pre-v2.0 three-route architecture (`/ → HubWorldPage`, `/privacy`, `/breach`) |
| `codebase/CONCERNS.md` | MOSTLY CURRENT | v2-aware, but "ExplorationScene 1500+ lines" stale; predates 16–27 |
| `codebase/CONVENTIONS.md`, `STACK.md`, `INTEGRATIONS.md`, `TESTING.md` | MOSTLY CURRENT | Versions/conventions hold; TESTING counts predate 16–27 |
| `research/*` (5 files) | HISTORICAL | Legitimate v2.0 pre-implementation research; reads as such |
| `tests/qa-report.md` | HISTORICAL | Mar-28 snapshot; correctly diagnoses dead routes; "Hub World loads" PASS now meaningless |
| `tests/RALPH_PROGRESSION.md` | STALE | Line ~126 "BreachDefense standalone page is at `/breach`" → false (and internally inconsistent with its own line 125); feature scope stops at Phase 15 |

Phase-doc gaps: phase dirs 19 and 21 have **neither SUMMARY nor VERIFICATION**; 20 has only VERIFICATION; 11–15 have SUMMARYs but no VERIFICATION. Phases 07–10 never existed (numbering jumps 06→11 by design).

## 6. Scariest tech debt & risk hotspots

Ranked by (likelihood of biting during next month's ship) × (blast radius).

1. **Test-harness split brain.** Three test dialects share overlapping globs with no coherent runner: 11 Playwright `.spec.ts` in `tests/`; 2 node strip-types `.test.mts` scripts (`sorterData`, `breachTriageOverlay`) with bare `assert()`; 1 real vitest file (`client/src/lib/saveData.test.ts`). **No npm script runs vitest at all** — the save-migration tests are unreachable. `npm run test:visual` (Playwright, `testDir: './tests'`) mis-collects the two `.mts` files (no `test()` calls). A bare `npx vitest` would collect the Playwright specs and break. `tsconfig.json` excludes `**/*.test.ts` and doesn't include `tests/`, so **zero test files are typechecked** by `npm run check`. The safety net everyone assumes exists, doesn't.
2. **Save-format fragility.** `loadSave` does `JSON.parse(...) as SaveDataV2` — the `version` field is **never checked on load**, no shape validation. Corrupt JSON safely falls back to `defaultSave`, but structurally-valid-wrong-shape JSON (a v1 blob, a hand-edited save, a future v3) is trusted blindly → latent `.length`/`.map` crash on the very first screen. One guard function fixes this.
3. **The monolith quartet.** `SpriteFactory.ts` **4,005** lines (retirement deferred since v1.1 — two milestones ago), `ExplorationScene.ts` **3,379**, `BreachDefenseScene.ts` **2,160**, `UnifiedGamePage.tsx` **1,979**. Four files hold most of the game's logic; every feature phase made them bigger. Run 04 (refactor proposal) is scoped to this — do not start ad-hoc splitting outside it.
4. **Verification debt.** Nothing from Phases 16–27 has had a live human playthrough — all feel-calibration was explicitly deferred to the user. Phase 19 (TD standalone) and 21 (sponsor capstone) have no SUMMARY/VERIFICATION docs at all, and they are precisely the two flows a sponsor will see first. Run 01 (playtest sweep) covers the automated half; the human half is still open.
5. **Asset pipeline via symlink.** Zero assets live in `client/public/` directly — everything (243 audio, 40 images) resolves through a `client/public/attached_assets` **symlink** into the repo root. Works in dev; whether `vite build` follows it into `dist/` for production/GitHub-Pages deploy has never been verified. If it doesn't, the shipped game is silent and invisible.
6. **`window.location.reload()` as teardown.** Demo-exit, TD win/lose, and capstone-exit all "clean up" by full page reload. Works, but it's load-bearing jank: any future persistence-on-exit or analytics beacon will silently break, and it makes those flows untestable in a single Playwright context.
7. **Docs rot as a risk in itself.** Before this run, an agent (or human) trusting `.planning/` would try to "resume" already-shipped phases, open 4× nonexistent `tutorialContent.ts`, test dead `/breach` routes, or re-fix eight bugs closed in March. This doc + the stale banners are the mitigation; the checklist has the follow-through.

Minor but real: SPRITE-002 (NPC walk animations registered but never played — NPCs are statues), FEEL-001..008 polish backlog in DEBUG_LOG, dangling `sam_access` reference in the training framework.
