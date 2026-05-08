# Phase 21: Completion + Sponsor Hook — Context

**Gathered:** 2026-05-08
**Status:** Ready for planning
**Source:** User-provided phase shepherd prompt + roadmap entry

<domain>
## Phase Boundary

This phase delivers the **capstone moment** of the v2.2 Sponsor Demo. When the demo player has cleared all 4 rooms (Reception → ER → Break Room → Medical Records) and exits Medical Records, the game must trigger a deliberate, paced celebration sequence:

```
dim → ~500ms beat → fanfare → certificate animation → sponsor code reveal
```

The certificate shows the configured sponsor's name and a code block in monospace font with a copy-to-clipboard button. An end NPC (rendered as part of the certificate overlay using the sponsor's `character_sprite`) speaks the two configured `two_dialogue_lines` to "hand the prize." After the player dismisses the certificate, the game reloads to the start menu.

This is a **demo-only** path. The full-game flow has its own existing end behavior and must remain untouched. `isDemoActive()` from `client/src/lib/demoSession.ts` is the gate.

</domain>

<decisions>
## Implementation Decisions (from user prompt — locked)

### Trigger
- Trigger fires when the player **exits Medical Records** AND all 4 demo rooms (`reception`, `er`, `break_room`, `records_room`) are marked complete in the demo session via `markRoomComplete`.
- Use `getCompletedDemoRooms()` from `demoSession.ts` to gate the capstone.
- The completion sequence ONLY fires when `isDemoActive()` is true.
- Full-game flow has its own end behavior (`pageMode === 'win'` via `EndScreen`) — that path is bit-for-bit unchanged.

### Sequence pacing (CERT-01, Commandment 2 — anticipation before reward)
1. **Dim** the screen (full overlay opacity ramps from 0 to ~0.85 over ~400ms).
2. **Beat:** ~500ms of silence/black.
3. **Fanfare:** play `sfx_fanfare` + camera flash effect / VFX (reuse Phase 15 fanfare pattern).
4. **Certificate animation in** (~600ms scale + fade-in).
5. **Sponsor code reveal** (slight delay + flourish, ~300ms after card lands).

### Certificate UI (CERT-02)
- React overlay component, no Phaser involvement.
- Displays `SPONSOR_CONFIG.name` in display heading.
- Code block: `SPONSOR_CONFIG.code` in monospace font (`'Press Start 2P', monospace` consistent with rest of app), inside a clearly-bordered box.
- "COPY CODE" button:
  - Uses `navigator.clipboard.writeText(code)` with fallback for non-secure contexts.
  - On press: visual flash (button changes color/border briefly), audio cue (`sfx_interact` or `sfx_sorter_correct`).
  - Button label updates to "COPIED ✓" for ~1.2s, then reverts.
- "RETURN TO MENU" / dismiss button → `window.location.reload()` (matches Phase 18/19 reload-to-menu pattern).

### End NPC handoff (CERT-03, Commandment 6)
- Implemented as part of the certificate React overlay (NOT a roomData.json edit, NOT a Phaser-spawned sprite).
- The NPC sprite is rendered as a React `<img>` element pulling from the same spritesheet asset path that BootScene preloads.
  - **Reasoning:** `SPONSOR_CONFIG.character_sprite` is a Phaser texture key (e.g., `npc_staff_sheet`). To render as a React `<img>`, we map the key to its source path. We can either:
    1. Read the source path directly from a known mapping table that mirrors BootScene preload paths.
    2. Extract the texture canvas from Phaser at runtime via `gameRef.current.textures.get(key)`.
  - **Decision:** Use approach 1 — a small `SPONSOR_SPRITE_PATHS` map keyed off the same `npc_*_sheet` keys BootScene already uses. Cleaner separation, no Phaser dependency in the React overlay. The map only needs to cover the 9 NPC types BootScene preloads.
  - Render the spritesheet such that only the idle-down frame (frame 0) is visible — use CSS `background-position` with a 32x32 frame from the 96x128 spritesheet (3 cols × 4 rows). Scale up 4x for visibility (128x128 displayed).
- Two dialogue lines render in a typewriter-style or fade-in sequence, advanceable with click/Space/Enter (familiar JRPG dialogue rhythm). After the second line is acknowledged, the certificate body (sponsor name + code + COPY button) reveals.
- **NOTE:** Implementation simplification — sequence dialogue inline within the same overlay as the certificate, with a phased reveal: NPC + line 1 → line 2 → certificate body. Less code than two separate overlays, same player-facing feel.

### Hook point in code (CERT-01 wiring)
- The trigger lives in `UnifiedGamePage.tsx` `handleExitRoom`, after `gameState.completeRoom(currentRoomId)` is called (so the room counts as complete).
- Specifically: when payload is door-nav (player walking out of `records_room`) AND `isDemoActive()` AND all 4 demo rooms have been visited/completed, fire the sequence INSTEAD OF transitioning to the next room.
- "All 4 demo rooms complete" check: `markRoomComplete(currentRoomId)` is already called in the demo flow — but verify; if not yet wired in Phase 18, add it. Then check `getCompletedDemoRooms().length === DEMO_ROOM_ORDER.length`.

**IMPORTANT — gating safety:** Per user prompt, "Medical Records exit alone is not enough — though if all 4 are forced-unlocked from start, the player MIGHT exit Records first; you should require all 4 marked complete OR design the trigger sensibly." We require all 4 marked complete. Player who skips through rooms without satisfying their requirements simply lands at the next demo room normally; the capstone only fires once all 4 rooms have actually been cleared.

### Reload-to-menu pattern
- Match Phase 18 ESC handler and Phase 19 BACK TO MENU: `endDemo()` then `window.location.reload()`.

### Sponsor swap test (CERT-04 — already shipped in Phase 18; this phase exercises it)
- Editing only `client/src/data/sponsorConfig.ts` (changing `name`, `code`, `character_sprite` to one of the 9 preloaded NPC keys, `two_dialogue_lines` to any two strings) must change the on-screen output completely — name on certificate, code displayed, NPC sprite, both dialogue lines — with no other source edits.
- Verify by code-review of the implementation: the certificate overlay must read all four fields from `SPONSOR_CONFIG` directly with no hardcoded fallbacks anywhere.

### Constraints & guardrails (from user prompt)
- DO NOT modify `roomData.json` (no new NPCs in scene data).
- DO NOT modify Phase 16, 18, 19, 20 work — only EXTEND.
- DO NOT touch pre-existing uncommitted user files: `StartMenu.tsx`, `TitleScreen.tsx`, `index.css`, `IDENTITY.md`, `PixelComputerLogo.tsx`, the modified planning files.
- Tech: Phaser 3.90 + React 18 + TS + Vite 5 + Tailwind 3.
- Identity (IDENTITY.md): deadpan JRPG, NOT corporate. 16-bit pixel. Chip audio.
- Nintendo Test commandments — especially Cmd 1 (every action audio+visual+state), Cmd 2 (anticipation before reward — that 500ms beat is the whole point), Cmd 6 (Zelda item-get celebration), Cmd 8 (feedback scales with moment size — this is the BIGGEST moment in the demo).

### Claude's Discretion
- Exact CSS animation timings (within the broad sequence above).
- Color palette of the certificate (should feel premium pixel-art — gold/celebratory but consistent with existing Press-Start-2P theme).
- Whether the dim is a black overlay or a colored gradient.
- Whether the NPC sprite uses CSS spritesheet cropping or just `object-position`.
- Component decomposition inside the overlay (one `CertificateOverlay.tsx` file vs. split into NPC-handoff + cert-card subcomponents — author's call, leaning single file for cohesion).
- Whether to play a separate "code reveal" SFX or rely on the fanfare carrying through.

</decisions>

<specifics>
## Specific Ideas

- **Reusable patterns to draw from:**
  - Phase 15 fanfare (`ExplorationScene.handleFanfareEvent`): camera flash + particle burst + `sfx_fanfare` chime. The capstone can mirror this beat-for-beat but in a React overlay context — for the dim+flash, use CSS animations; for the chime, emit `REACT_PLAY_SFX` event with `sfx_fanfare` key.
  - Phase 19 reload-to-menu: `window.location.reload()` after `endDemo()`.
  - Existing CSS animation pattern from `index.css` (already has `score-float-up`, `scan-sweep`, `star-twinkle`, `pixel-drift-up`, etc. — keep additions consistent in style).

- **Files we KNOW we'll touch (Phase 21 only):**
  - `client/src/components/CertificateOverlay.tsx` (NEW)
  - `client/src/pages/UnifiedGamePage.tsx` (extend `handleExitRoom` + `pageMode` union with `'demo-complete'`, render overlay)
  - `client/src/lib/demoSession.ts` — verify `markRoomComplete()` is called at the right moment; if Phase 18 didn't wire it, wire it in `handleExitRoom` for demo rooms
  - `client/src/data/spriteAssetPaths.ts` (NEW — or inline the small map in CertificateOverlay) — small key→path map for the 9 NPC sheets

- **Files we MIGHT touch:**
  - `client/src/index.css` — DO NOT TOUCH per user constraint. If we need certificate-specific keyframes, define them inline in the component using a `<style>` tag or via Tailwind utilities.

- **Files we WILL NOT touch:**
  - `client/src/data/roomData.json`
  - `client/src/data/sponsorConfig.ts` (already shipped in Phase 18; we read it, not edit it)
  - `client/src/lib/demoSession.ts` (we'll only add a call site if needed; the API is settled)
  - `client/src/components/StartMenu.tsx`, `TitleScreen.tsx`, `index.css`, `PixelComputerLogo.tsx`, `IDENTITY.md` (pre-existing user UI work)
  - Anything in the planning directory beyond Phase 21's own files.

</specifics>

<deferred>
## Deferred Ideas

- Backend-issued certificate (analytics, signed PDFs) — out of scope for v2.2; future roadmap.
- Multiple sponsor variants in one build (A/B testing) — single config file is sufficient.
- Additional fanfare variants per sponsor — out of scope; the fanfare itself is generic.
- Replay/share buttons on the certificate — out of scope.
- Phaser-side end-NPC sprite spawn in the world before the cert — explicitly chosen the React-overlay path per user guidance ("Easier path: integrate the NPC handoff INTO the certificate overlay React component"). Defer the in-world spawn to v2.3 if a sponsor bites.

</deferred>

---

*Phase: 21-completion-sponsor-hook*
*Context gathered: 2026-05-08*
