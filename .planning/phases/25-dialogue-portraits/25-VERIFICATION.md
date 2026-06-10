---
phase: 25-dialogue-portraits
verified: 2026-06-10T07:15:00Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Walk to Riley in Reception, trigger dialogue, observe portrait"
    expected: "96px pixelated receptionist spritesheet crop in a framed plate; 'Riley' name in gold Press Start 2P; portrait crop bobs subtly (~2px, ~2.4s loop); no SVG circle icon anywhere in the header"
    why_human: "CSS animation rendering and visual appearance of the spritesheet crop cannot be confirmed programmatically; need to confirm the PNG asset loads correctly and the breathing-bob is perceptible but not distracting"
  - test: "Talk to an ER NPC (e.g. Dr. Martinez), observe portrait"
    expected: "Doctor spritesheet renders (different sheet from receptionist); 'Dr. Martinez' name plate visible; breathing-bob present"
    why_human: "Confirms multi-sheet resolution in practice; automated checks only verify the code path, not the rendered output"
  - test: "Check browser console during any NPC dialogue"
    expected: "No '[DialoguePortrait] No sprite mapping' warnings for named NPCs"
    why_human: "Runtime dev-mode warning can only be confirmed in a live browser session"
  - test: "Observe TRUST meter position in dialogue header"
    expected: "TRUST meter top-aligned and readable at far right; portrait (~108px tall) does not push the meter out of the header; layout is not awkward"
    why_human: "Visual layout correctness with the new taller portrait requires eyeball verification"
---

# Phase 25: Dialogue Portraits Verification Report

**Phase Goal:** Every dialogue overlay shows the speaking NPC as a large pixelated portrait cropped from their actual in-world spritesheet — the 32px placeholder SVG is gone, every named NPC in roomData.json maps to the correct sheet, and the portrait has presence (frame, name plate, subtle life animation).

**Verified:** 2026-06-10T07:15:00Z
**Status:** human_needed (all automated checks passed; 4 live look-check items deferred to user)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Every named NPC in roomData.json carries a sprite field whose value is one of the 9 sheet types BootScene preloads | VERIFIED | Python assertion: 26/26 NPCs with valid sprite types across 7 rooms; all values in `{receptionist, nurse, doctor, it_tech, officer, boss, staff, patient, visitor}` |
| 2 | `getNPCPortraitPath(npcId)` returns the correct PNG sheet path for all 26 named NPCs | VERIFIED | `spriteAssetPaths.ts` exports the function; module-level IIFE builds `NPC_SPRITE_TYPE_BY_ID` from roomData; all 9 sheet keys present in `SPONSOR_SPRITE_PATHS`; resolution chain verified by code inspection |
| 3 | An unknown npcId falls back to the staff sheet AND logs a `console.warn` in dev mode — never a silent generic fallback | VERIFIED | `import.meta.env.DEV` guard + `console.warn(...)` present at lines 80-85 of spriteAssetPaths.ts; returns `SPONSOR_SPRITE_PATHS.npc_staff_sheet` as fallback |
| 4 | VIS-01, VIS-02, VIS-03 are defined in REQUIREMENTS.md with traceability rows | VERIFIED | `grep -c "VIS-0[123]" REQUIREMENTS.md` = 6 (3 definitions in v2.3 section, 3 traceability rows marked Complete); REQUIREMENTS.md lines 145-147, 248-250 |
| 5 | The NPCSprite SVG placeholder renders nowhere; NPCSprite.tsx is deleted from the repo | VERIFIED | `ls client/src/components/NPCSprite.tsx` returns DELETED; only remaining reference is the SpriteFactory.ts line-32 comment (updated to explain the deletion); zero import references in client/src |

**Score:** 5/5 truths verified (automated)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/REQUIREMENTS.md` | v2.3 section defining VIS-01..03 | VERIFIED | Section exists at lines 139-147; VIS-01..03 checked `[x]`; traceability rows at 248-250 marked Complete |
| `client/src/data/roomData.json` | sprite field on all 26 named NPCs | VERIFIED | Python check: 26/26 valid; 22 fields added, 4 pre-existing preserved |
| `client/src/data/spriteAssetPaths.ts` | Data-driven npcId -> sheet path resolver; exports `getNPCPortraitPath` | VERIFIED | 97 lines; `getNPCPortraitPath` and `getSponsorSpritePath` both exported; `SPONSOR_SPRITE_PATHS` untouched |
| `client/src/components/DialoguePortrait.tsx` | Framed 96px CSS-crop portrait with name plate and breathing-bob; >=40 lines | VERIFIED | 72 lines; `portrait-breathe` keyframe; 3x crop (`288px 384px`); `data-testid="npc-battle-sprite"` preserved; name plate inside frame |
| `client/src/components/BattleEncounterScreen.tsx` | Renders DialoguePortrait instead of NPCSprite | VERIFIED | Line 4: `import DialoguePortrait from './DialoguePortrait'`; line 190: `<DialoguePortrait npcId={npcId} npcName={npcName} />`; no NPCSprite reference |
| `client/src/components/NPCSprite.tsx` | Deleted (zero consumers) | VERIFIED | File does not exist on disk; removed via `git rm` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `spriteAssetPaths.ts` | `roomData.json` | Module-level IIFE index `NPC_SPRITE_TYPE_BY_ID` | VERIFIED | `import roomData from './roomData.json'` at line 24; IIFE at lines 45-56 iterates all rooms and npcs |
| `getNPCPortraitPath` | `SPONSOR_SPRITE_PATHS` | `npc_${type}_sheet` key lookup | VERIFIED | Lines 72-78: builds `sheetKey`, returns `SPONSOR_SPRITE_PATHS[sheetKey]` |
| `BattleEncounterScreen.tsx` | `DialoguePortrait.tsx` | `npcId`/`npcName` props | VERIFIED | Line 190: `<DialoguePortrait npcId={npcId} npcName={npcName} />` |
| `DialoguePortrait.tsx` | `spriteAssetPaths.ts` | `getNPCPortraitPath(npcId)` | VERIFIED | Line 1 import; line 22 call: `const spriteUrl = getNPCPortraitPath(npcId)` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| VIS-01 | 25-02 | SVG placeholder gone; >=96px pixelated CSS-crop from BootScene sheet | SATISFIED | DialoguePortrait.tsx 72 lines; NPCSprite.tsx deleted; BattleEncounterScreen wired to DialoguePortrait |
| VIS-02 | 25-01 | All 26 NPCs have sprite field; data-driven resolver; dev-warn fallback | SATISFIED | Python assertion passes 26/26; `getNPCPortraitPath` exported with console.warn guard |
| VIS-03 | 25-02 | Framed plate with name + breathing-bob; zero dialogue logic regression | SATISFIED | `portrait-breathe` keyframe in DialoguePortrait.tsx; `npm run check` and `npm run build` both clean; `git diff --quiet GameContainer UnifiedGamePage ExplorationScene` = ZERO DIFF |

No orphaned requirements — all 3 VIS IDs declared in plan frontmatter are accounted for.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No anti-patterns detected | — | — |

DialoguePortrait.tsx: no TODO/FIXME/placeholder comments, no stub returns (`return null`, empty bodies), no console.log implementations. Implementation is substantive and complete.

---

### Build and Type Check

| Check | Result |
|-------|--------|
| `npm run check` (tsc) | CLEAN — exits 0, no type errors |
| `npm run build` (Vite production) | CLEAN — 1737 modules transformed, no errors |
| `git diff GameContainer.tsx` | ZERO DIFF — zero regression |
| `git diff UnifiedGamePage.tsx` | ZERO DIFF — zero regression |
| `git diff ExplorationScene.ts` | ZERO DIFF — zero regression |

---

### Commit Verification

All 6 task commits confirmed in git log:

| Commit | Description |
|--------|-------------|
| `f7cfc73` | feat(25-01): define VIS-01..03 requirements |
| `09470ba` | feat(25-01): add sprite field to all 26 named NPCs |
| `bc3f430` | feat(25-01): add getNPCPortraitPath resolver |
| `40ecbd9` | feat(25-02): create DialoguePortrait component |
| `ea3c678` | feat(25-02): swap DialoguePortrait into BattleEncounterScreen |
| `3fe2dfb` | chore(25-02): delete NPCSprite.tsx + update SpriteFactory comment |

---

### Human Verification Required

The following items require a live browser session. They are not gaps — automated checks confirm the code is correct. These confirm the visual result is correct.

#### 1. Receptionist portrait renders in Riley's dialogue

**Test:** `npm run dev` → open `http://localhost:5173` → Start Full Game → walk to Reception → approach Riley → trigger dialogue

**Expected:** 96px pixelated receptionist spritesheet crop in a framed pink border plate; "Riley" name in 7px gold Press Start 2P inside the frame; the crop layer bobs gently (~2px, ~2.4s); no SVG circle icon in the header

**Why human:** CSS animation rendering and whether the PNG asset loads and crops correctly cannot be confirmed without a running browser

#### 2. Different NPC resolves a different sheet

**Test:** Navigate to ER → talk to Dr. Martinez

**Expected:** Doctor spritesheet portrait (visually distinct from receptionist); "Dr. Martinez" name plate; breathing-bob present

**Why human:** Confirms multi-sheet resolution works in practice, not just in the code path

#### 3. No console warnings for named NPCs

**Test:** Open DevTools console during any NPC dialogue

**Expected:** No `[DialoguePortrait] No sprite mapping` warnings for named NPCs

**Why human:** Runtime `import.meta.env.DEV` console.warn can only be confirmed in a live browser with `DEV=true`

#### 4. TRUST meter layout with taller portrait

**Test:** Trigger any NPC dialogue that shows the TRUST meter (any scored encounter)

**Expected:** TRUST meter top-aligned at far right; portrait (~108px tall) does not push the meter out of the header; layout reads cleanly without awkwardness

**Why human:** Visual layout correctness with the new portrait height requires eyeball verification

---

### Gaps Summary

No gaps. All automated must-haves are verified. The 4 human-verification items are visual/runtime checks deferred to user per the established v2.2/v2.3 pattern.

---

_Verified: 2026-06-10T07:15:00Z_
_Verifier: Claude (gsd-verifier)_
