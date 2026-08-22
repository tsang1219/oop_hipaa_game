# Run 13 — HIPAA facts that are actually entertaining
**Mode:** own branch (`fable/trivia`) · **My checkpoint:** HEAVY — this is voice, this is mine
**Read first:** `.planning/POLISH_SPEC.md` (Pillar G), `IDENTITY_AUDIT.md`, `research/OOP_HUMOR_PLAYBOOK.md`, `HIPAA_TRAINING_FRAMEWORK.md`

## The wish

The game teaches HIPAA correctly and completely neutrally. It has no opinions. That's the gap.

HIPAA is genuinely funny once you look at it: fax machines are "secure" because Congress hadn't heard
of email in 1996. Most breaches aren't hackers, they're a laptop left on a bus. The Privacy Rule is
40% common sense and 60% lawsuit avoidance. I want that voice in the game — **facts that land as
gossip or absurdity, never as definitions.** The test for every one: *is this surprising?* If it only
qualifies as "true," it isn't content.

Three pieces:

1. **A bank of 20–30 hot takes / surprising facts** in the register above. Every one carries its
   45 CFR citation in a data field (so I can sign off on accuracy separately from tone) and a
   `CONTENT_MANIFEST.md` entry.
2. **Deliver them through characters and objects, never a floating panel.** The homes already exist:
   the act-aware hallway bulletin boards (`hallwayContent.ts`), Gerald's misprints, break-room
   gossip, marginalia on the sorter's charts. Zero facts get a modal that exists only to deliver a fact.
3. **One optional trivia mechanic**, prototyped and honestly judged. Three candidates — pick one,
   build it, and tell me if it's actually fun or if we should cut it:
   - **"HIPAA or Not?"** — a break-room arcade cabinet. Rapid-fire scenario calls against a clock,
     high-score board, unlocks a cosmetic. Diegetic, optional, replayable.
   - **Gerald's Fortunes** — the printer jams and spits out a hot take. Collectible as a set. Fits an
     eight-beat gag that already pays off.
   - **The Rumor Mill** — NPCs trade you a fact for a small favour, and **half the rumours are wrong**,
     so the game is asking you to judge rather than absorb. Highest ceiling, hardest to write.

## Protect

- **Opinionated ≠ inaccurate.** Every fact stays correct against 45 CFR Part 164. Where being funny
  risks the rule, flag the line — don't quietly soften either side.
- Nothing ships without my read. Draft boldly, then hand me options.
- Don't retrofit existing dialogue that already works. This is additive.
- Facts belong in data files, not hardcoded in components.

## Hand back

- A branch where I can walk the hallways and read the boards.
- The fact bank as a table: fact · citation · where it appears · tone-risk flag. Sorted by which ones
  you think are funniest, so I read the good ones first.
- The one mechanic, playable, with your honest verdict on whether it earns its place.
- For the ~5 facts you were least sure about, give me two phrasings each.
