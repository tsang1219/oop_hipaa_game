# Phase 21 — Completion Sequence + Sponsor Hook

**Milestone:** v2.2 Sponsor Demo
**Status:** Not started
**Created:** 2026-05-08
**Owner:** phase-shepherd

## Goal

Exiting Medical Records as the final demo room triggers a deliberate **dim → ~500ms beat → fanfare → certificate animation → sponsor code reveal** sequence. The certificate displays the configured sponsor's name and a copy-to-clipboard code block in monospace font. An end NPC (rendered inside the certificate overlay using the configured `character_sprite`) speaks the two configured `two_dialogue_lines` to "hand the prize." After dismissal, the page reloads to the start menu.

Demo-only path (gated by `isDemoActive()`). Full-game flow is untouched.

## Requirements

- **CERT-01**: Completion sequence plays in this order: dim → beat → fanfare → certificate animation → sponsor code reveal
- **CERT-02**: Certificate displays sponsor name + monospace code block + copy-to-clipboard button (with audio + visual confirmation on press)
- **CERT-03**: End NPC uses `SPONSOR_CONFIG.character_sprite` and speaks both `SPONSOR_CONFIG.two_dialogue_lines` to hand the prize
- (CERT-04 was completed in Phase 18 — this phase exercises the sponsor-config-only swap test)

## Approach

The trigger lives in `UnifiedGamePage.tsx`'s `handleExitRoom`. When the player exits a demo room, we:

1. Mark the room complete in the demo session (`markRoomComplete`).
2. Check whether all 4 demo rooms are now complete (`getCompletedDemoRooms().length === DEMO_ROOM_ORDER.length`).
3. If yes AND the player is exiting `records_room` AND `isDemoActive()` — flip `pageMode` to a new `'demo-complete'` mode INSTEAD OF transitioning to the next room.
4. Render `CertificateOverlay` for that pageMode.

The capstone sequence is implemented as **CSS-driven phases inside the React overlay** so timing stays observable in one file and we don't need to coordinate Phaser tweens with React state. The fanfare audio fires through the existing `REACT_PLAY_SFX` event so it routes through the same WebAudio sound manager as everything else.

The end NPC handoff is integrated into the same overlay (per user guidance — easier path, demo-only by construction). The NPC sprite is rendered as a CSS-cropped frame from the spritesheet (3×4 grid, 32×32 frames; we use frame 0 = idle-down). A small `SPONSOR_SPRITE_PATHS` map mirrors BootScene's preloads — the only 9 keys we need to support.

### Sequence phase machine (inside `CertificateOverlay`)

```
mount → dim (400ms fade-in)
     → beat (500ms silent black)
     → fanfare (emit sfx_fanfare; flash effect)
     → npc-enter (NPC slides in + line 1 appears)
     → line 2 (player advances with click/Space)
     → cert-reveal (sponsor name + code box + COPY button + RETURN button)
```

Each phase is a `useState<'dim' | 'beat' | 'fanfare' | 'npc' | 'line2' | 'cert'>` with `setTimeout`-driven transitions for the fixed-duration ones. Player advances `npc → line2 → cert` with click/keyboard.

### Trigger gating

```
if (isDemoActive() && currentRoomId === 'records_room'
    && targetRoomId !== 'records_room'  // genuinely exiting
    && getCompletedDemoRooms() includes all 4) {
  setPageMode('demo-complete');
  return; // do NOT call REACT_LOAD_ROOM
}
```

### Files modified (Phase 21 only)

- **NEW:** `client/src/components/CertificateOverlay.tsx` — capstone overlay (sequence machine + NPC handoff + certificate card)
- **NEW:** `client/src/data/spriteAssetPaths.ts` — small key→path map for the 9 preloaded NPC sheets
- **MODIFIED:** `client/src/pages/UnifiedGamePage.tsx` — extend PageMode union with `'demo-complete'`, wire trigger in `handleExitRoom`, render overlay, ensure `markRoomComplete` fires for demo rooms on exit

### Files explicitly NOT touched (per user constraints)

- `client/src/data/roomData.json` — no new in-world NPC; the NPC handoff lives entirely in the React overlay
- `client/src/data/sponsorConfig.ts` — read-only consumer; Phase 18 already shipped the shape
- `client/src/components/StartMenu.tsx`, `TitleScreen.tsx`, `index.css`, `PixelComputerLogo.tsx` — pre-existing user UI work, leave alone
- Phase 16, 18, 19, 20 logic — only extend, never modify
- `client/src/lib/demoSession.ts` — API is settled; we only call existing functions

## Plans

This phase is a **single atomic plan** because the changes are tightly coupled — overlay component, page wiring, sprite path map, and demo-session marking must all land together to be testable. Splitting would create intermediate states with incomplete capstone behavior.

- [ ] **21-01-PLAN.md** — Wire the capstone: CertificateOverlay component + sprite path map + UnifiedGamePage trigger + room-complete marking on demo exit

## Success Criteria (verbatim from ROADMAP.md)

1. Exiting Medical Records as the fourth and final demo room triggers a deliberate sequence in this exact order: screen dim, brief anticipatory beat (~500ms silence), fanfare (audio + VFX), certificate animation in, then sponsor code reveal — pacing follows Commandment 2 (anticipation before reward).
2. The completion certificate displays the configured sponsor's name and shows the sponsor code in monospace font with a clearly labeled copy-to-clipboard button that gives audio + visual confirmation when pressed (Commandment 1).
3. An end NPC in the Medical Records closer renders using the sponsor's `character_sprite` and speaks the two configured `two_dialogue_lines` from the sponsor config — handing the prize feels like an in-world Zelda item-get moment (Commandment 6).
4. Editing only the sponsor config file (no source-code changes) changes the certificate name, code, end-NPC sprite, and end-NPC dialogue lines on the next launch — verified by a swap test with a second sponsor config.

## Out of Scope

- New roomData.json content (NPCs, scenes) — pure curation milestone.
- Phaser-spawned in-world end-NPC sprite — chose the React-overlay path per user guidance.
- Backend certificate generation, analytics, or PDF export — future roadmap.
- Modifying full-game `EndScreen` or its trigger — full-game flow stays bit-for-bit identical.
- Sponsor-specific themed VFX (gold particles, etc. beyond reused fanfare) — out of 1-2 day budget; the existing fanfare is good enough.

## Verification

- **CERT-01:** Play through demo, complete all 4 rooms, exit Medical Records → observe ordered sequence. Each beat is timed (dim ~400ms, beat ~500ms, fanfare audio fires, cert animation in ~600ms, code reveal flourish).
- **CERT-02:** Certificate shows `SPONSOR_CONFIG.name`. Code in monospace box. Click "COPY CODE" → button flashes, audio cue plays, label changes to "COPIED ✓", clipboard contains the code. After ~1.2s, label resets.
- **CERT-03:** NPC sprite visible, matches `SPONSOR_CONFIG.character_sprite`. Both `two_dialogue_lines` appear in sequence (line 1 → click/Space → line 2 → click/Space → certificate body reveals).
- **Sponsor swap test:** Edit only `sponsorConfig.ts` (e.g., change `name` to "Out-of-Pocket", `code` to `"OOP-PRESS-START-2026"`, `character_sprite` to `"npc_doctor_sheet"`, `two_dialogue_lines` to `["Yo, you actually finished this thing.", "We've got a code for you."]`). Reload → run demo to end → all four fields show the new values; no other code change required.
- **Full-game regression:** Press FULL GAME → existing flow unchanged (resume / new game, EndScreen on win, no certificate overlay).
- **Demo Esc regression:** Press DEMO → before completing all 4 rooms, press Esc → returns to start menu (no certificate fires prematurely).
- **Build:** `npm run build` and `tsc --noEmit` succeed.

## Risk register

| Risk | Mitigation |
|---|---|
| Spritesheet path mismatch (key in config doesn't exist in BootScene) | Use existing 9 NPC keys only. Default `npc_staff_sheet`. Fallback to a generic silhouette if the key map misses. |
| `navigator.clipboard.writeText` fails in non-secure context | Wrap in try/catch; fall back to `document.execCommand('copy')` via a hidden textarea; either way the button still flashes. |
| `markRoomComplete` not yet called for demo rooms in Phase 18 wiring | Verify; if not present, add the call in `handleExitRoom` for demo rooms. |
| Trigger fires twice (player walks back and forth across the records_room exit door) | Mode change to `'demo-complete'` is one-way — once fired, the page is in cert mode and no other handlers can re-fire it. |
| Overlay z-index collides with other overlays | Use z-index high enough (e.g., 200, above existing 150 banner). Demo-complete mode also short-circuits before any other overlays render. |
