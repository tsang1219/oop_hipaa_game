# Run 04 — Refactor proposal (then, only if I approve, the refactor)
**Mode:** proposal = read-only · execution = worktree · **My checkpoint:** I approve the plan before any code moves

## The wish
A few files are monsters and make everything slow to change:
- `client/src/phaser/SpriteFactory.ts` (~4,000 lines)
- `client/src/phaser/scenes/ExplorationScene.ts` (~3,400)
- `client/src/phaser/scenes/BreachDefenseScene.ts` (~2,200)
- `client/src/pages/UnifiedGamePage.tsx` (~2,000)

**First, just show me a plan** — how you'd break these into sane modules, what moves where,
what could go wrong, and in what order you'd do it. I approve before you touch anything.
**Then, in a separate run,** execute it without changing a single behavior.

## Protect
- Proposal run: change no code.
- Execution run: worktree, **behavior-preserving only**, screenshot- and test-verified after
  each extraction. If any screen changes, you broke it — a refactor that alters behavior failed.
- No feature changes smuggled into a refactor. Structure only.

## Hand back
- A before/after **module map**: what each new file owns, why, risk notes, and the order.
- Then (post-approval only): the refactor, with proof nothing changed.

Use your architecture judgment. Match the conventions already in `CLAUDE.md`.
