---
phase: 18-demo-mode
plan: 01
status: complete
completed: 2026-05-08
---

# Plan 18-01: Sponsor Config Scaffold + Demo Session Module — SUMMARY

## What was built

Two foundation files that lock the contracts downstream Phase 18 plans (and Phase 21) consume:

**`client/src/data/sponsorConfig.ts`** (CERT-04)
- `SponsorConfig` interface: `{ name, character_sprite, two_dialogue_lines: [string, string], code }`
- `SPONSOR_CONFIG` default with placeholder values aligned to IDENTITY.md (deadpan one-liners, not corporate cheer)
- `character_sprite: 'npc_staff_sheet'` matches the existing BootScene preload key (verified at `client/src/phaser/scenes/BootScene.ts:60`)

**`client/src/lib/demoSession.ts`** (DEMO-04, DEMO-06 foundation)
- `DEMO_ROOM_ORDER` constant: `['reception', 'er', 'break_room', 'records_room']` — exact curated order from REQUIREMENTS DEMO-04
- Module-scoped session state (zero localStorage / sessionStorage calls) — verified isolation
- API: `startDemo`, `endDemo`, `isDemoActive`, `getDemoRoomOrder`, `getDemoRoomIndex`, `markRoomComplete`, `getCompletedDemoRooms`

## Verification

- TypeScript strict typecheck: zero new errors related to these files
- Required exports all present in both files
- `grep -cE "localStorage|sessionStorage" demoSession.ts` → 0 matches (DEMO-06 isolation verified at the module level)

## Key decisions

- Demo session held in module-private `let session: DemoSessionState | null = null` — simplest pattern, no React context overhead, no class
- `endDemo()` clears state to null so the next `startDemo()` starts fresh
- Sprite key picked: `npc_staff_sheet` (existing preloaded sheet — see BootScene line 60). Phase 21 will swap to a sponsor-themed sprite when the real sponsor lands.

## Files changed

- `client/src/data/sponsorConfig.ts` (new, 35 lines)
- `client/src/lib/demoSession.ts` (new, 86 lines)

## Commit

- `2eeae81` — feat(18-01): add sponsor config scaffold + demo session module

## Self-Check

- [x] All required exports present
- [x] TypeScript passes
- [x] No localStorage/sessionStorage in demoSession.ts
- [x] Sprite key matches BootScene preload
- [x] DEMO_ROOM_ORDER exactly matches REQUIREMENTS DEMO-04 order
- [x] Atomic commit with explicit file list (no `git add -A`)
- [x] Phase 16 in-flight files untouched
