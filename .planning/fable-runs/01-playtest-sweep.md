# Run 01 — Playtest sweep
**Mode:** read-only (change no code) · **My checkpoint:** I triage your punch list

## The wish
Play the whole game the way an impatient first-timer would — every room, every NPC,
every door, and all three encounters (BreachDefense, PHI Sorter, Breach Triage). Be my
game tester, because I don't have the patience to sit through this and you do.

I want to know:
- Everywhere the **screen doesn't match what's supposed to be happening** (HUD wrong,
  checkmarks not firing, menus that open/close wrong, state that doesn't update).
- Everywhere the **flow breaks or dead-ends** — a door that goes nowhere, a locked path
  that should be open, an encounter you can't exit, progression that stalls.
- Everywhere I **do something and get no feedback** — by our rules that's a bug
  (Commandment 1: every action needs a response).
- Everywhere it just **feels janky, slow, confusing, or unpolished**, even if nothing is
  technically "broken." I want the polish gaps too, not only the crashes.

## Protect
- Read-only. Do not change code this run.
- Drive through `window.__QA__` / qa-bridge. If the bridge can't reach something, say so
  rather than guessing.

## Hand back
A punch list grouped by room/encounter. Each item gets:
- a **screenshot** (put them where I can flip through fast),
- a **severity** (breaks-the-game → cosmetic),
- a separate **hurts-the-fun rating**, so I can tell real bugs from polish gaps at a glance.

Figure out the traversal and what counts as "wrong" yourself. `useGameState`'s
UNLOCK_ORDER and `roomData.json` tell you what *should* happen at each step.
