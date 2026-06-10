---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: One Game
status: unknown
last_updated: "2026-06-10T04:38:24.931Z"
progress:
  total_phases: 18
  completed_phases: 14
  total_plans: 47
  completed_plans: 43
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-07)

**Core value:** The player should forget they're doing compliance training. One continuous game.
**Current focus:** v2.2 Sponsor Demo — curated 4-room demo path + start menu + completion certificate for Out-of-Pocket pitch

## Current Position

Phase: Phase 21 — Completion + Sponsor Hook (Complete)
Plan: 21-01 (Complete)
Status: Shipped — CERT-01..03 verified by build + type check; manual verification deferred to user. CAPSTONE LANDED.
Last activity: 2026-05-08 — Phase 21 shipped. Sponsor demo capstone overlay (CertificateOverlay) wires the deliberate dim → 500ms silent beat → fanfare → end-NPC handoff (sprite + 2 dialogue lines) → certificate body reveal (sponsor name + monospace code box + COPY CODE button + RETURN TO MENU) sequence. Trigger lives in UnifiedGamePage.handleExitRoom door-nav branch and fires only when isDemoActive() && currentRoomId === 'records_room' && all 4 demo rooms marked complete. Demo-only path; full-game EndScreen flow untouched. Sponsor swap test passes by construction — overlay reads name/code/character_sprite/two_dialogue_lines straight from SPONSOR_CONFIG with no hardcoded fallbacks.

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 19 (v2.0) + 3 (Phase 16 partial) = 22
- Average duration: ~7m/plan
- Total execution time: ~135m

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 11. Pre-Restructure Foundation | 4/4 | ~31m | ~8m |
| 12. Unified Navigation | 4/4 | ~67m | ~17m |
| 13. Encounter Integration | 4/4 | ~9m | ~2m |
| 14. Three-Act Narrative Arc | 4/4 | ~8m | ~2m |
| 15. Polish and Completion | 3/3 | ~20m | ~7m |
| 16. PHI Sorter Encounter | 3/4 | (paused) | — |

*Updated after each plan completion*
| Phase 22-phi-sorter-content-connection P02 | 12 | 2 tasks | 2 files |
| Phase 22-phi-sorter-content-connection P01 | 6min | 3 tasks | 3 files |
| Phase 22-phi-sorter-content-connection P03 | 8 | 2 tasks | 2 files |
| Phase 22-phi-sorter-content-connection P04 | 15 | 1 tasks | 2 files |
| Phase 16-phi-sorter-encounter P04 | 25 | 2 tasks | 4 files |
| Phase 17-breach-triage-encounter P01 | 5min | 3 tasks | 3 files |

## Accumulated Context

### Decisions

- [v1.0]: Global anim registration in BootScene — walk anims available in all scenes without re-registration
- [v1.1]: Character spritesheets shipped (96x128px, 3x4 grid, 32x32 frames) — integrated into all scenes
- [v1.1-partial]: Remaining sprite work (portraits, furniture, tiles) deferred to v2.x
- [v2.0-roadmap]: FOUN-04 + FOUN-03 isolated in Phase 11 — must ship and verify before any restructure code lands
- [v2.0-roadmap]: FOUN-01 + FOUN-02 merged into Phase 12 with NAV-01..08 — UnifiedGamePage and useGameState are immediately consumed by the door system; split would create a phase delivering nothing visible
- [v2.0-roadmap]: Phase 14 depends on both 12 and 13 — act advancement conditions include encounter completion results; wiring act logic before encounters are stable creates false completion states
- [Phase 11]: SaveDataV2 schema includes sfxMuted and musicVolume per user decision
- [Phase 11]: Module-level migrateV1toV2() runs before React render for earliest migration
- [Phase 11]: sfx_muted standalone key still written on toggle for ExplorationScene backward compat
- [Phase 11]: GameContainer passes finalPrivacyScore via callback instead of orphan localStorage key
- [Phase 12]: HubWorldScene retired to room data (hospital_entrance in roomData.json) — not preserved as special intro scene
- [Phase 12]: BootScene no longer starts any scene — just emits SCENE_READY for React to decide
- [Phase 12]: Door auto-triggers on proximity (no key press) for smooth RPG navigation
- [Phase 12]: Spawn offset 1 tile inward from door side to prevent re-trigger
- [Phase 12]: Room completion checked on door exit, not ESC, to support continuous flow
- [Phase 12]: UNLOCK_ORDER hallways resolved via findPrecedingDepartment mapping
- [Phase 13]: Fixed encounter tower set: FIREWALL, MFA, TRAINING, ACCESS (4 of 6)
- [Phase 13]: Wave selection indices 0,2,4,7 — PHISHING, RANSOMWARE, INSIDER, multi-vector boss
- [Phase 13]: Score contribution: Math.round((securityScore / 100) * 12) — up to +12 at perfect defense
- [Phase 13]: React ENCOUNTER_COMPLETE handler is single source of truth for encounter score (no double-counting)
- [Phase 13]: IT Office encounter zone at tile (9,6) near workstation cluster — auto-triggers on proximity
- [Phase 13]: /breach route already removed in Phase 12 — confirmed no-op
- [Phase 14]: Act 3 music base volume 0.15 (breach theme reduced for RPG dialogue)
- [Phase 14]: Extended existing useGameState hook (not parallel hook) for act + decision state
- [Phase 14]: Decision flags emitted via CHOICE_FLAG_SET from GameContainer, not callback chain
- [Phase 14]: NPC variant routing via ref-based decision lookup in EventBridge callbacks
- [Phase 14]: Music on scene init always starts music_exploration — FIXED in Phase 15 (act-aware init)
- [Phase 15]: Hallway boards use hallwayBoard interactable type with isHallwayBoard flag to skip collection
- [Phase 15]: Fanfare fires in-room on last requirement met (not on exit) per user decision
- [Phase 15]: Two-beat completion flow: in-room VFX+chime then exit GameBanner
- [Phase 15]: Music init reads current act: Act 1=music_hub, Act 2=music_exploration, Act 3=music_breach (vol 0.15)
- [Phase 15]: DepartmentBreadcrumb bottom-center z-10 pointer-events-none, DEPARTMENT_ORDER exported
- [Phase 16-01]: sorterData.ts exports SorterItem + SorterDocumentSet types and 3 document sets keyed by ID
- [Phase 16-01]: Set 3 uses triggerLocation 'medical_records' + act 3 (better narrative fit for de-id edge cases vs lab)
- [Phase 16-01]: identifierType 'other' for ages 90+ per 45 CFR §164.514(b)(2) explicit clause
- [Phase 16-02]: Discriminator approach: extend ENCOUNTER_TRIGGERED payload with optional type field — no new BRIDGE_EVENTS constants (smaller diff, matches Phase 13 payload-extension precedent)
- [Phase 16-02]: Registry write strategy: extend REACT_RETURN_FROM_ENCOUNTER with optional encounterId — ExplorationScene's onReturnFromEncounter writes proximity guard for pure-React encounters
- [Phase 16-02]: SFX keys for sorter: sfx_sorter_correct (confirmation_001.ogg chime) + sfx_sorter_wrong (error_001.ogg soft thud) — Commandment 8 proportional feedback
- [Phase 16-03]: PHISorterOverlay starts in sorting phase directly — SorterContextCard owned by UnifiedGamePage (BLOCKER 2 fix, single render path)
- [Phase 16-03]: draggingOverBucket state separate from hoveredBucket — per-bucket drag-enter handlers prevent dual highlight (W2 fix)
- [Phase 16-03]: takeaways passed through in onComplete from docSet.takeaways directly (W4 — avoids redundant re-fetch in Plan 04)
- [Phase 16-03]: SorterContextCard uses calm blue/teal palette (#1a2a3e + #4FB3D9) — distinct from NarrativeContextCard red SECURITY ALERT
- [v2.2-roadmap]: 4-phase shape (18 → 19 → 20 → 21). Phase 18 owns CERT-04 sponsor config scaffold so Phase 21 can populate without source-edits. Phase 20 (polish) sequenced after Phase 18 so the 4 demo rooms are known before fixes are scoped.
- [v2.2-roadmap]: Phase 19 (TD standalone) is independent of Phases 20/21 — can run in parallel with polish work if needed.
- [v2.2-roadmap]: Phase 21 depends on Phase 18 (demo flow + sponsor config) and Phase 20 (rooms polished); must sequence after both.
- [v2.2-roadmap]: Pure curation milestone — reuses roomData.json verbatim. No new scenes, NPCs, or dialogue authored. Anything that requires new content is out of scope.
- [Phase 19]: BreachDefenseScene's encounterId===null branch already supports standalone arcade mode — Phase 19 wiring lives entirely in UnifiedGamePage.tsx (no scene refactor needed beyond adding totalWaves to broadcastState payload).
- [Phase 19]: Standalone TD reuses EncounterGameUI HUD with all 6 tower IDs passed in. Educational pauses at waves 3/5/7/9 are unstuck via React-side onWaveComplete → REACT_DISMISS_TUTORIAL — keeps the sponsor-pitch flow unbroken without scene-side flag refactoring.
- [Phase 19]: Win/lose "Back to Menu" path uses window.location.reload() — same pattern as demo Esc. Guarantees clean teardown of Phaser scene + React state and brings the player to the cold-boot StartMenu.
- [Phase 19]: Save isolation (TD-03) achieved by NOT calling any gameState mutator from the standalone code path — no addScore, no recordEncounterResult, no completeRoom. Persistence useEffect only fires when gameState.state changes, which it doesn't here.
- [Phase 21]: End-NPC handoff lives INSIDE the React CertificateOverlay (not as a Phaser-world spawn) per user guidance — keeps the moment cohesive, demo-only by construction, no roomData.json edit needed.
- [Phase 21]: NPC sprite rendered via CSS `background-image` cropping of the same spritesheet BootScene preloads (frame 0 = idle-down, top-left of 3×4 grid), upscaled 4× with `image-rendering: pixelated`. Path resolved through `spriteAssetPaths.ts` — small parallel map mirroring BootScene's 9 NPC preload paths.
- [Phase 21]: 500ms anticipatory beat is genuinely silent (Commandment 2). Phase machine transitions: dim (400ms ease) → beat (500ms void) → fanfare (sfx_fanfare + 600ms gold flash) → npc → line2 → cert. Player advances dialogue with click/Space/Enter; Esc returns to menu at any point.
- [Phase 21]: Capstone trigger gated by `isDemoActive() && currentRoomId === 'records_room' && DEMO_ROOM_ORDER.every(id => getCompletedDemoRooms().includes(id))`. `markRoomComplete` called for each demo room as it completes on exit, so all 4 must have been actually cleared (not just walked through).
- [Phase 21]: Sponsor swap test passes by construction — overlay consumes name/code/character_sprite/two_dialogue_lines straight from SPONSOR_CONFIG with no hardcoded fallbacks except defensive sprite-path lookup that falls back to npc_staff_sheet for typo'd keys.
- [Phase 21]: Reload-to-menu pattern (window.location.reload after endDemo) reused from Phase 18/19 — guarantees clean Phaser teardown + fresh StartMenu boot.
- [Phase 22-phi-sorter-content-connection]: Dr. Tovar placed at (14, 10) in records_room — NOT added to requiredNpcs, encounter is optional
- [Phase 22-phi-sorter-content-connection]: NPC reaction banks keyed by npcId; voice differentiation enforced in copy (Tovar uses Safe Harbor + identifier numbers; Marcus uses tonal nicknames; Aiyana references the auditor)
- [Phase 22-phi-sorter-content-connection]: HOLD IT item selection: s1-dob (full birth date vs year-only) for Set 1; s2-diagnosis-with-mrn (MRN as identifier) for Set 2; s3-zip3 (not-PHI subversion) for Set 3 — Each HOLD IT chosen for maximum instructional value at its act level. Set 3 uses a not_phi item to subvert expectation and reward correct reasoning.
- [Phase 22-phi-sorter-content-connection]: SorterChart humor tone locked: deadpan Daria/Veep (admin-system absurdity), never surreal or punching down. 45 humor-bearing fields in 30 items. — Per CLAUDE.md Commandment 5 + 22-CONTEXT.md spec. Humor surfaces in doctorNote/emergencyContact/reasonForVisit/miscField only, never in category/identifierType.
- [Phase 22-phi-sorter-content-connection]: HOLD IT variant implemented inline (prop-driven border+scale swap, no sub-component); screen pulse / SFX / portrait deferred to Phase 23/24
- [Phase 22-phi-sorter-content-connection]: ChartLine extracted as private function inside SorterItem.tsx; fields render in order: patientName+age, role, reasonForVisit, emergencyContact, doctorNote, miscField
- [Phase 22-phi-sorter-content-connection]: HOLD IT SFX reuses sfx_fanfare at 0.4 volume — no new asset; screen pulse deferred to Phase 23; SORTER_LOCATION_LABELS data-only change to NPC names (SORTV2-06); holdItReveal dwells 3.5s; opener seeded on mount via good-band fallback
- [Phase 16-phi-sorter-encounter]: Proximity tile triggers replaced by NPC-driven encounterTrigger fields (explicit player agency via EncounterRequestModal)
- [Phase 16-phi-sorter-encounter]: SorterDebrief standalone component supersedes SorterTakeawaysPanel-sibling approach — purpose-built sorter debrief with accuracy bar + KEY LEARNINGS, no TD content bleed
- [Phase 16-phi-sorter-encounter]: Abort path added: Esc/X emits aborted:true in REACT_RETURN_FROM_ENCOUNTER, resets paused but skips registry guard so encounter stays replayable
- [Phase 17-breach-triage-encounter]: Priya the Privacy Officer is the NPC for Breach Triage — exhausted, third queue today, precise because she has to be
- [Phase 17-breach-triage-encounter]: 72-hour deadline used only as GDPR-trap wrong answer in Breach Triage; correct answers use 'without unreasonable delay, 60 days' per HIPAA_TRAINING_FRAMEWORK.md 2026-03-11 fix

### Pending Todos

None.

### Blockers/Concerns

- RESOLVED: Unified score formula: addScore() updates both privacyScore and unifiedScore; encounter contributes up to +12
- RESOLVED: /breach standalone mode removed per user decision; BreachDefenseScene only runs as encounter — NOTE: Phase 19 (TD-01) re-introduces standalone-launch path through start menu, not through `/breach` route
- SpriteFactory.ts still active — retirement deferred to v2.1 (was v1.1)
- RESOLVED: HubWorldScene became room data entry (Phase 12 decision)
- RESOLVED: Music on scene init now reads current act and starts the correct track (fixed in Phase 15).
- v2.1 Phase 16 Plan 04 paused at 98% — will resume after v2.2 ships and sponsor outreach lands.

## Session Continuity

Last session: 2026-05-08
Stopped at: Phase 21 shipped — sponsor demo CAPSTONE LANDED. CertificateOverlay wires the full dim → beat → fanfare → cert + handoff sequence; demo-only; sponsor swap via single config edit. v2.2 Sponsor Demo milestone is now functionally complete (Phases 18/19/20/21 all shipped).
Resume: v2.2 audit + sponsor outreach (Out-of-Pocket / Nikhil pitch). Then resume v2.1 Phase 16 Plan 04 + Phase 17.

**Paused work (v2.1):** Phase 16 PHI Sorter Plan 04 (Phaser triggers + UnifiedGamePage routing) — resume after v2.2 ships and sponsor interest is gauged.
