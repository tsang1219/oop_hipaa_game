# Run 07 — Find → fix → verify loop
**Mode:** own branch, iterative · **My checkpoint:** morning triage of the report
**This run subsumes 01 (playtest) and 03 (bugfix).** Don't run those separately if you run this.

## The wish
Be my tester *and* my fixer, on repeat, until the game stops being broken. Each round:

1. **Play it** the way an impatient first-timer would — every room, NPC, door, and all three
   encounters (BreachDefense, PHI Sorter, Breach Triage). Screenshot every screen.
2. **Log what's wrong:** screen not matching state, flow dead-ends, actions with no feedback
   (Commandment 1 — that's a bug), plus janky/confusing/unpolished spots.
3. **Fix the clear ones.** Anything that needs my judgment — is-this-intended, a design call,
   a content/HIPAA change — **flag it, don't guess.**
4. **Re-verify** with before/after screenshots. Confirm the fix didn't break something else.
5. **Go again.**

## Stop condition (pick whichever hits first)
- A full playthrough pass finds **no new high-severity bugs**, OR
- **5 rounds** completed, OR
- You're down to only items flagged for my judgment (nothing left you can safely fix).

## Protect
- Own branch (`fable/fix-loop`). Never commit to `main`.
- **Trust the screen, not the code** — a fix isn't done until a screenshot proves it.
- Smallest change that fixes it. Don't gold-plate, don't refactor, don't rewrite what works.
- Don't "fix" intended behavior. Don't touch HIPAA facts or save format without flagging.

## Hand back (update after every round, not just at the end)
- `RUN_REPORT.md`: per round — what you found, what you fixed (with proof), what you flagged
  for me and why, and the running punch list with severity + hurts-the-fun ratings.
- If you hit the stop condition early, say why.

You decide traversal order and what counts as "wrong." `useGameState` UNLOCK_ORDER and
`roomData.json` tell you what *should* happen at each step.
