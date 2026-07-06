# Identity Audit — Current State vs. Target Direction

_Last updated: 2026-05-11_

## The pivot in one paragraph

PrivacyQuest is no longer trying to be a **passable corporate HIPAA training product**. That path has a huge moat (KnowBe4, Skillsoft, MedTrainer, procurement cycles, LMS/SCORM certifications) and forces the game to optimize for coverage completeness at the expense of feel.

Instead, PrivacyQuest is a **small, heartfelt, complete ~2-3 hour single-playthrough indie game in the spirit of _A Short Hike_, _Untitled Goose Game_, _Papers Please_, and _Stardew Valley_** — a game about hospital life that happens to be **educational, faithful to the policy and legislation, and informative** about HIPAA, but doesn't try to teach every rule. HIPAA is the *texture* of hospital work, not the *subject* of the lecture.

The business model shifts with it: **"presented by [sponsor]" patronage of a beloved small thing** (Patagonia-funds-a-short-film energy), not corporate-compliance lead-gen. Word-of-mouth happens because the game is genuinely good, not because of shareable score cards.

## What we ARE building

- **Educational, faithful, informative.** HIPAA content stays accurate — rules cited correctly, timelines right, penalties right. But coverage is no longer the goal.
- **Characters we love.** NPCs who are people, with goals, opinions, worries, and running jokes unrelated to teaching. A Nurse Nina who has a kid, a coffee order, a feud with the printer.
- **Hot takes and editorial POV.** HIPAA is genuinely interesting when someone with a point of view talks about it — the absurdity of fax machines being the "secure" channel, the reality that most breaches are lost laptops not hackers, the fact that a HIPAA violation costs less than a parking ticket if it's the first one. The game should have opinions.
- **Moments of joy.** Small surprises, humor, warmth, beauty. Things that exist just to delight — a cat listed as an emergency contact, a doctor's frustrated all-caps annotation, the printer as a recurring gag.
- **Complete, tight scope.** ~2-3 hours, clear ending, one playthrough. No sprawl.

## What we are NOT building

- ~~Comprehensive HIPAA coverage~~ — pick the 4-6 moments that hit *hard* and let the rest go
- ~~LMS/SCORM certification track~~
- ~~"Corporate training that happens to be a game"~~
- ~~Viral-hook mechanics or shareable score cards~~
- ~~Multi-playthrough replay loop~~
- ~~Sequels, expansions, live-service anything~~

## Current state vs. target — where we stand

### Aligned with target ✓

- **Scope is right.** 2.5-3 hr playthrough, clear arc, clear ending. Not sprawling.
- **Ambient texture is landing.** Recent polish work (microscope glow, NPC fidgets, hallway sconces, lab beakers, chair variety, ER urgency, fluorescent flicker) is doing exactly the right work. Rooms feel like places.
- **Sponsor surface exists.** Phase 21 wired pluggable "presented by" infrastructure — certificate + sponsor NPC + code reveal. The plumbing is there; only the framing needs to shift from "you passed your training" to "thanks for playing this thing."

### Misaligned with target ✗

- **Dialogue tone is compliance-shaped.** Nurse Nina: *"I need access to patient data to prepare for rounds tomorrow morning."* → HIPAA scenario in human packaging. Stardew's Leah: *"I've been thinking about my sculptures. Maybe I should try something different."* → a person. **No current NPC has a goal, opinion, or vulnerability unrelated to a HIPAA rule.**
- **No pure delight.** Patient stories are touching, room fanfares are satisfying, but nothing is *surprising*. No goose-honk equivalent. No "wait, that was good" moments unrelated to teaching. The PHI Sorter redesign brief (Phases 22-24) is the only place this is being designed for — queued, not shipped.
- **No editorial voice.** The game teaches HIPAA correctly and neutrally. It does not have opinions about HIPAA. It doesn't crack jokes about the absurdity of the fax loophole. It doesn't have a POV.
- **Roadmap is "more mechanics" not "more humanity."** Recent + upcoming phases are polish + new encounters (Sorter, Triage). No phase exists for NPC arcs, idle dialogue, exploration-for-its-own-sake, hot takes, or organic breathing room.

### The pattern under the gap

Everything currently in the game is **load-bearing for teaching HIPAA**. Every NPC line, every zone, every encounter exists to deliver a rule. The Nintendo Test doc reads as aspirational against the actual content because the aspiration was real — but the constraint ("must teach HIPAA accurately and comprehensively") quietly overrode it every time.

Committing to the indie-game identity means **that constraint has to relax**. Coverage stops being the goal. Character, joy, and voice compete for space with rule-teaching, and often win.

## Investment priorities going forward

In rough order:

1. **Character depth pass.** Each named NPC gets a non-HIPAA arc — a thing they want, a thing they're worried about, a running joke. Even if it's only 3-4 idle lines. Nina has a kid. Riley has a feud with the vending machine. The lab tech has an insufferable opinion about pour-over coffee. This is one of the highest-leverage changes we can make.

2. **Editorial voice / hot takes pass.** A codex or NPC channel where HIPAA gets talked *about* with a POV. Real hot takes: *"The Privacy Rule is 40% common sense and 60% lawsuit avoidance"* / *"Fax machines are considered secure because Congress hadn't heard of email in 1996"* / *"Most breaches aren't hackers — they're a nurse leaving a laptop on the bus."* This is what makes it feel like a smart small game, not a training product.

3. **Moments of pure play.** Scenes that earn nothing. A break room conversation about Real Housewives. A printer-jamming gag that recurs across the game. A hidden room. An easter-egg NPC who breaks the fourth wall. Idle NPCs you can eavesdrop on.
   _SHIPPED 2026-07-06 (whimsy pass):_ GERALD the printer fleet (8-beat gag across Reception/Records/IT, pays off, finds peace); Supply Closet B (hidden seam door off the break↔lab hallway) housing Mr. Whiskers (pettable, of emergency-contact fame) and Zz Test (the EHR test patient — carries the game's one fourth-wall line); ambient eavesdrop lines for the whole cast (`idleLines.ts`), including Riley's vending feud and the lab tech's pour-over doctrine. Content in `whimsyData.ts` / `idleLines.ts`.

4. **Reframe the completion artifact.** Sponsor certificate stays, but the surrounding tone becomes "thank you for playing our little game" not "congratulations on completing your training." A credits roll. A "made by a small team, funded by [sponsor]" moment.

5. **Cut the coverage checklist.** `HIPAA_TRAINING_FRAMEWORK.md` becomes a reference, not a checklist. We're allowed to skip topics we can't dramatize. We're allowed to teach the same rule twice if the scene is good enough. Coverage is no longer a KPI.

## What stays

- Current room polish work — keep going.
- Sponsor demo infrastructure — keep going, just reframe the tone.
- HIPAA accuracy — non-negotiable. Being informative and correct is *part of* the identity, not in tension with it.
- The Nintendo Test as the design bar.
- The existing narrative arc, room structure, and encounter design.

## Open decisions

- **How does this affect the queued Phase 22-24 (PHI Sorter redesign)?** The brief already points in the right direction ("moments of PHI joy"). Probably: proceed as planned, and add character-depth work as a parallel workstream.
- **What's the first concrete deliverable?** Options: (a) rewrite one NPC in the target tone as a proof-of-concept before committing, (b) draft the hot-takes codex, (c) add three purely delightful moments to existing rooms. Recommend (a) — cheapest, and it teaches us the voice.
- **Does the audit change how we pitch the sponsor?** Yes, probably — but not until we have the first rewritten NPC to show what the tone actually feels like.
