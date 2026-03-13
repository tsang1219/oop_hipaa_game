# QA Validation Checklist — PrivacyQuest

Run this checklist manually after **every code change** before marking a task done.
The in-game DEV panel (bottom-right corner) auto-verifies items marked ★.

---

## 0. Before you start
- [ ] Restart the workflow
- [ ] Hard-refresh the browser (Ctrl+Shift+R)
- [ ] Open the browser console and confirm no red errors on load

---

## 1. Reception Room — Entry

| # | Check | DEV Panel | How to verify |
|---|-------|-----------|---------------|
| 1.1 | ★ Sprite textures load | `Sprite textures loaded ✓` | All NPCs show colored characters, not black/white squares |
| 1.2 | ★ BGM starts | `BGM started ✓` | Hear music within 1 second of entering room |
| 1.3 | Player visible | — | Blue player character appears at spawn point |
| 1.4 | NPC labels visible | — | Name tags (e.g. "Riley") visible above NPCs |
| 1.5 | Room name HUD | — | Room name shown top-center of canvas |
| 1.6 | Progress HUD | — | Top-right shows NPC/item counters |

---

## 2. Dialogue Flow

| # | Check | DEV Panel | How to verify |
|---|-------|-----------|---------------|
| 2.1 | Dialogue opens | — | Walk to Riley, press SPACE — dialogue screen appears |
| 2.2 | Dialogue contained | ★ Overlay contained | Dialogue fills canvas only, not full browser window |
| 2.3 | SFX on choice | ★ SFX event fires | Hear sound when selecting a correct/incorrect answer |
| 2.4 | ★ Dialogue complete event | `Dialogue complete event fires ✓` | DEV panel updates after dialogue ends |
| 2.5 | ★ Keyboard restored | `Keyboard works post-dialogue ✓` | WASD moves player immediately after closing dialogue (no click needed) |
| 2.6 | NPC marked complete | — | Riley becomes slightly grayed with ✓ after dialogue |

---

## 3. Item Collection

| # | Check | DEV Panel | How to verify |
|---|-------|-----------|---------------|
| 3.1 | Item modal opens | — | Walk to item, press SPACE — educational modal appears |
| 3.2 | Modal contained | — | Modal fills canvas only |
| 3.3 | SFX on open/close | ★ SFX event fires | Hear `sfx_interact` when modal opens/closes |
| 3.4 | Item marked collected | — | Item sprite becomes faded after closing modal |

---

## 4. Room Cleared

| # | Check | DEV Panel | How to verify |
|---|-------|-----------|---------------|
| 4.1 | Banner appears | — | "Room Cleared!" banner shows after completing all objectives |
| 4.2 | Fanfare SFX | ★ SFX event fires | Hear `sfx_wave_start` when banner appears |
| 4.3 | Banner contained | — | Banner fills canvas only |
| 4.4 | Returns to hub | — | After banner dismisses, returns to hub world map |

---

## 5. Quick Regression — After Any Change

Before declaring any task done, run through:
1. Enter Reception
2. Talk to one NPC (dialogue + answer 1 question)  
3. Press WASD — confirm movement works  
4. Collect one item  
5. Check DEV panel — all 6 items should be ✓ or close

---

## 6. Common Root Causes of Failure

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Black/green square sprites | `sound.add()` threw before EventBridge listeners registered | Wrap music in try-catch; move listeners before music |
| Keyboard stops after dialogue | `onDialogueComplete` never called (listener not registered) | Same as above |
| Overlay bleeds outside canvas | Component uses `fixed inset-0` instead of `absolute inset-0` | Change to `absolute inset-0`; move render inside canvas `relative` div |
| No SFX | `REACT_PLAY_SFX` event not emitted, or Phaser listener not registered | Check EventBridge; check ExplorationScene `onPlaySfx` |
| BGM missing | Audio key not in cache (decode race or 404) | try-catch around `sound.add()`; check file path |
