> **⚠️ RECONCILIATION NOTICE (2026-07-01, Fable Run 02): HISTORICAL — this design SHIPPED as Phases 22–24 (2026-06-10); the queued/no-code-touched framing and file-structure sketch are outdated.** Phases 11–27 all shipped 2026-06-10; the game is a single route `/`. Do not act on status claims here — see `.planning/STATE_OF_TRUTH.md` ("Docs that lie" table) for what is actually true.

# PHI Sorter Redesign — "Papers, Please" Reimagining

**Status:** Spec — Phase 18 starting; Phases 19 + 20 queued
**Created:** 2026-05-07
**Updated:** 2026-05-08 (added Phoenix Wright + WarioWare references + Phase 22/23/24 sequencing)
**Target milestone:** v2.1 (resumes post-v2.2 sponsor demo)
**Branch:** Whenever build begins, cut `gsd/phase-XX-phi-sorter-redesign` off main
**Author intent:** "It works, but it's not quite there. The decision needs to mean something. It has to feel like you're doing something."

---

## 0. Phase Sequencing (added 2026-05-08)

The original brief described one big redesign at "Tier A / B / C" scope. The actual build is split into **three phases** in order of impact-per-hour, each independently shippable:

| Phase | Name | Scope | Effort | What player feels after |
|-------|------|-------|--------|-------------------------|
| **22** | Content + Connection | Rewrite items as fake patient charts with humor (Two Point Hospital tone), expand 6 → 8-12 items/set, NPC reactions during sort, Phoenix Wright "HOLD IT!" reveal on tricky calls | ~1.5 days | Reading the cards is funny. NPC participates. Game feels connected to the world. |
| **23** | Feedback Moments | Bucket counters animate, per-drop particles + camera shake, completion overlay before debrief, score animations, escalating NPC enthusiasm | ~1 day | Every action thwacks. Completion celebrates. Commandment 1 satisfied. |
| **24** | Format Shift | One-document-at-a-time on a desk, KEEP/REDACT stamps replace buckets, slide-in animation, soft visible clock, NPC portrait persistent | ~2-3 days | It's a different mini-game. Quiz → job. Papers Please-shaped. |

> Phase numbers 22/23/24 (not 18/19/20) because v2.2 Sponsor Demo took 18-21. The redesign trio lives in v2.1, on its own branches off `main`, in parallel with the active v2.2 work.

After Phase 22: funnier and connected. After 22+23: also satisfying. After 22+23+24: it's actually *Papers Please-shaped*. You can stop after any phase.

---

## 0.5 Game References (expanded 2026-05-08)

**Primary inspiration: Papers, Please** (Lucas Pope, 2013) — desk-and-stamps UI, NPC framing, soft time pressure, bureaucratic humor. Drives the Phase 20 format shift.

**Secondary inspirations folded into Phases 18+19:**

- **Two Point Hospital / Theme Hospital** — humor lives in the *admin chaos around the medicine*, not the medicine itself. Mrs. Henderson's emergency contact being her cat is funny because it's almost real (lonely elderly patient + intake form). Patient names, occupations, free-text fields = humor surface.
- **Phoenix Wright: Ace Attorney** — dramatic reveal moments. When the player nails a tricky call, the NPC delivers a one-shot "HOLD IT!" / "GOT YOU!" beat that explains *why* this was tricky. Elevates the correct-answer moment from "+1 score" to "you proved you understood."
- **WarioWare** — short punchy reactions on every interaction, vocal-bark energy. Each item gets its own micro-personality on flip ("PHI!" "NOT PHI!" "TRICKY!"). Converts drag-drop monotony into snappy beats.
- **Phoenix Wright (again, secondary mechanic)** — the "examine evidence" gesture: hover/click an item to see expanded chart context before stamping. Adds deliberation without changing the input model.

---

## 1. The Problem

The current PHI Sorter (Phase 16, shipped 2026-05-06) is **functional but flat**. It teaches the right HIPAA content — the 18 identifiers, Safe Harbor edge cases, scaling difficulty across acts — but the **interaction is a multiple-choice quiz dressed as a card sort**. The decisions don't carry weight. There's no time pressure. There's no character pulling you through the moment. No physical satisfaction in the act of judging.

The bucket-sort UI is a UI for a quiz. We want a UI for a *job*.

---

## 2. The Vision — "A Shift at the Front Desk"

The player works behind a hospital admin counter. Patient charts and forms slide onto the desk. An NPC stands above the counter and talks while you work. You stamp documents — **KEEP** or **REDACT** — using satisfying physical-feeling stamps. The clock is visible. The pile is visible. You're not taking a quiz; you're **holding a job at a hospital**.

> The reference is *Papers, Please* (Lucas Pope, 2013) — but warmer, funnier, less dystopian. A small mid-shift moment in a community hospital, not a totalitarian border. The HIPAA content stays accurate; the framing makes the player *want* to be there.

### Design north star

**The decision is the gameplay.** Every interaction must satisfy three checks:

1. **The decision means something** — there's a reason this specific document landed on your desk, an NPC waiting on you, a consequence visible.
2. **The act of deciding feels physical** — stamp thunk, paper rustle, ink mark appears, document slides off the desk into the next pile.
3. **The information itself is funny** — patient names, emergency contacts, fake diagnoses, weird chart annotations. Humor lives in the data, not in the chrome.

If any of those three fails, we haven't made the game. We've made a quiz with a stamp animation.

---

## 3. What Changes vs. The Current Build

### What we keep

- All HIPAA content from `client/src/data/sorterData.ts` — the 3 document sets, the 18-identifier accuracy, the educational explanations. **Content layer survives.**
- Phase 13 encounter trigger infrastructure (proximity tile → ENCOUNTER_TRIGGERED → narrative-card → encounter overlay → debrief → registry guard). **Routing layer survives.**
- The Phaser/React split. **Architecture layer survives.**
- The unified compliance score contribution (`Math.round((correct/total) * 12)`). **Scoring layer survives.**
- The keyboard parity requirement (no input mode is a fallback). **Accessibility commitment survives.**
- The close button + abort path shipped 2026-05-07. **Player-respect minimum survives.**

### What changes

- **The UI metaphor** — bucket sort → desk-and-stamps.
- **The pacing** — untimed → soft time pressure (visible clock, score bonus for clearing the pile fast, no hard fail).
- **The character** — silent stack of items → an NPC standing at the counter who reacts to the player's work.
- **The feedback** — generic chime/thud → physical stamp thunk, paper slide, ink mark, NPC reaction line.
- **The data presentation** — abstract item labels → fake patient charts with names, ages, diagnoses, contact info, free-form notes (humor lives here).
- **The ambient feel** — black overlay → wood-grain desk surface, ambient hospital sounds (PA distant chatter, printer, soft phones).

---

## 4. The Feel — Eleven Specifics

These are non-negotiable. If we can't ship all of them, we ship fewer features at higher polish — never these flat.

1. **Document slide-in.** Each new chart slides onto the desk from off-screen with a paper-rustle sound. Slight wobble on land. Not instant. The player should feel like the work is being handed to them.
2. **Stamp anticipation.** Hovering the stamp over the document shows a faint pre-stamp shadow at full opacity. Gives the player a half-beat to commit. Click = stamp slams down.
3. **Stamp thunk.** A *real* stamp sound (not a UI ding) — wood-on-paper impact, ink squelch. Audio is doing 50% of the work here.
4. **Ink leaves a mark.** The KEEP / REDACT mark stays on the document for 200-300ms, then the document slides off the desk into the relevant tray. The mark must be visible long enough to register satisfaction.
5. **NPC reaction.** Riley (or whoever's running the encounter) reacts to each stamp — eye-flick, brief line on every 3rd item, occasional comment on a wrong call. Not every stamp. Pacing matters.
6. **Visible clock.** A small wall clock or wristwatch in the corner. Counts down soft (no hard fail). Hitting "shift over" with items left = "let the auditor sort the rest" debrief, not a failure screen.
7. **Visible pile.** The remaining stack is a *physical stack of papers* on the right side of the desk, not a list. Stack height communicates progress without numbers.
8. **Outgoing trays.** Two trays — KEEP and REDACT — visible on the desk. Stamped documents slide into them. End-of-shift, the trays show their counts. Tactile feedback for completion.
9. **Wrong calls don't punish — they teach.** A wrong stamp triggers an NPC line ("Oh — wait, that's a phone number, that's PHI even without a name") and the document briefly returns to the desk for re-stamping. Low-friction correction; player learns the rule by doing.
10. **Soft variation between rounds.** The order of documents is fixed within a set (HIPAA accuracy: same content), but the NPC's lines vary, and ambient elements drift (a phone rings on round 2 of the shift, a coworker walks past on round 3). Replays don't feel identical.
11. **Moments of PHI joy.** This is the user's literal request. The chart for "Henderson, Margaret" lists her emergency contact as "Mr. Whiskers (cat)." The diagnosis on a Lab chart says "patient insists their fitbit gave them tachycardia." The notes field has a doctor's frustrated all-caps annotation. The humor IS the engagement — the player wants to read the next chart.

---

## 5. Art Layer — What We Need

Pixel-art aesthetic, consistent with existing sprites. No 3D, no photorealism. **All assets must read at the project's existing 32px / 64px / "Press Start 2P" font scale.**

### Required art

| Asset | Scope | Notes |
|-------|-------|-------|
| Desk surface background | 1 image | Wood grain, top-down 3/4 perspective. Visible left/right tray slots. Paper texture under documents. ~1280×720 source, scales down. |
| Document templates | 4 chart types | (a) Intake form, (b) Lab order, (c) Discharge summary, (d) Insurance claim. Each is a paper-textured rectangle with form fields. Reusable — content fills the fields. |
| KEEP stamp | 1 sprite + 3-frame animation | Wood handle, green ink. Animation: hover, slam, lift. |
| REDACT stamp | 1 sprite + 3-frame animation | Wood handle, red ink. Same animation arcs. |
| Stamp marks | 2 ink overlays | "KEEP" green ink stamp impression, "REDACT" red ink stamp impression. Slight rotation randomized per stamp for organic feel. |
| Paper-stack indicator | 1 sprite + variants | A pile of papers on the right side of the desk. 5 visual states: tall, mid, short, single, empty. |
| Outgoing trays | 2 sprites | Wire mesh trays, KEEP / REDACT labels. Filled state shows paper visible inside. |
| NPC counter portrait | 3-5 portraits | Riley (Reception), Lab Tech (Lab encounter), Records Clerk (Records). 3-frame expressions: neutral, smiling, eyebrow-raise (wrong-call reaction). Same scale as existing portraits. |
| Ambient elements | 4-6 small sprites | Wall clock, coffee mug, desk phone, sticky-note pad, calendar, framed photo. Static decoration. Each room can vary which ambient items appear for environmental storytelling. |
| Particle: ink splatter | 1 small particle | 8-frame burst on stamp impact. |

### Art workflow recommendation

- **Source first**: search Itch.io / OpenGameArt for CC0 office/desk pixel art. The project already vendors Kenney assets — extend that pattern.
- **Generate second**: for the missing pieces (stamp animations, document templates, NPC reaction frames), use the same AI pipeline that produced the existing character spritesheets (per `.planning/STATE.md`: "Generated 10 character PNG spritesheets via Python/PIL at 32x32 frame size").
- **Adjust last**: hand-tweak in Aseprite or similar for stamp ink consistency and tray-fill registration.

**Estimated art effort:** 1-2 days for an experienced pixel artist; 2-3 days using AI generation + cleanup. This is the longest pole.

---

## 6. Audio Layer

Existing audio in the project is sparse — 6 Kenney CC0 OGG files (per `.planning/PROJECT.md`). Phase 16 added two more (`sfx_sorter_correct`, `sfx_sorter_wrong`). The redesign needs ~6 more, all small files, all CC0-licensable.

### Required SFX

| Cue | Source recommendation | Trigger |
|-----|----------------------|---------|
| Stamp thunk (KEEP) | Search Freesound for "rubber stamp" / "office stamp impact" CC0 | KEEP stamp slam |
| Stamp thunk (REDACT) | Slightly different rubber stamp sample — pitch shift if necessary | REDACT stamp slam |
| Paper slide | Freesound: "paper slide" / "paper movement" | Document slides onto desk or off into tray |
| Paper rustle | Freesound: "paper crumple" / "stack rustle" | New chart appears, end-of-pile fanfare |
| Pen scratch | Freesound: "pen on paper" | NPC writes a note, optional ambient touch |
| Soft clock tick | Freesound: "wall clock tick" — looped quietly | Background ambient under the encounter |

### Required ambient bed

A 30-60 second loop of "hospital admin office" — distant PA chatter, soft printer hum, occasional phone, no music. The current Phase 14 act-based music can drop to 0.05 volume during the encounter and the ambient bed comes up to 0.4. Restore on exit.

### Required NPC voice

**Recommendation: text-only, no voice acting.** Voice acting blows up scope and asset weight. NPC dialogue lines render in the existing dialogue text style ("Press Start 2P") with a soft typewriter effect. The pen-scratch SFX plays under each character reveal, giving the impression of real-time thought without recording any audio.

---

## 7. Feedback Loops — The Decision Engine

This is the core of the user's note: *"there needs to be feedback loops, right? Dragging and dropping or approving or denying, or like whatever, like some compliance stamp. It has to mean something, it has to feel like it's something doing something."*

Every player action fires through **all four feedback channels** — visual, audio, NPC reaction, and state. If any channel is missing, the action feels flat.

### The stamp interaction — full breakdown

| Phase | Visual | Audio | NPC | State |
|-------|--------|-------|-----|-------|
| Stamp hovered over doc | Stamp moves with cursor; faint shadow on document | None (silence is the anticipation beat) | Eyes track stamp | None |
| Stamp committed (click / Enter) | Stamp slams down (3-frame animation, 80ms total); ink mark appears at full opacity; ink-splatter particle burst | Stamp thunk SFX (loud, satisfying) | Eye-flick if right; head-tilt if wrong | Score updates by ±1 |
| Document slides off | Stamp lifts; document slides to tray with rotation; tray-paper count increments | Paper-slide SFX | Brief reaction line every 3rd item | Pile shortens |
| Wrong call recovery (≥3s educational pause) | Document briefly returns to desk; "wait — " thought bubble | Pen scratch under NPC line | NPC delivers explanation in 1-2 sentences | Item flagged for retry; can re-stamp |
| Pile empty | Final document slides; pile sprite empty; small paper-rustle | Stack-rustle SFX → 600ms beat → fanfare | NPC line ("Nice — you can leave the rest for tomorrow") | Encounter completes; debrief opens |
| Player presses Esc / X | Stamps fade; documents return to in-tray | Paper-slide reverse | NPC neutral ("Take a breath, come back when you can") | Aborted: no scoring, no registry write |

### Why this works mechanically

- **The stamp action does four things at once.** The player has done one input — clicked. The game has responded with sight, sound, character, and state. That's the feedback loop. That's why *Papers, Please* feels good despite being a UI game.
- **NPC reaction creates social pressure without punishment.** The player wants the NPC to nod, not because there's a score for it, but because they're in a room with someone. This is the difference between testing and working.
- **Time pressure is soft.** The clock counts down but the encounter doesn't fail at zero — it completes with whatever's stamped, and the rest "go to the auditor." This preserves replay (the player who messed up can come back) while still creating urgency in the moment.
- **Wrong calls are not punishments — they're teaching moments embedded in NPC dialogue.** The HIPAA accuracy lives in the recovery, not in a modal.

---

## 8. Time Pressure — Soft Mechanics

Time is the engine that turns a sort into a *shift*. It must be present, but never punitive.

### Mechanic

- **Visible clock** in the desk corner — wristwatch or wall clock sprite. Ticks down from a per-set duration.
- **Set 1 (Reception, 6 items):** 90 seconds. Generous — this is the introduction.
- **Set 2 (Lab, 8 items):** 75 seconds. Tighter — the player knows the rhythm now.
- **Set 3 (Records, 5 items, edge cases):** 60 seconds. Most pressure on the trickiest content.
- **No hard fail** — at 0:00 remaining, the encounter wraps with whatever's been stamped. NPC says something like "shift's over, leave the rest for the auditor." Unstamped items don't count toward score. This is generous and intentional.

### Why soft

The user's brief says HIPAA training "is not inherently exciting" and the Nintendo Test calls out **proportional feedback**. Hard-fail timers turn an educational moment into a stress test. Soft timers create the *feeling* of pressure (which is what makes the decision feel real) without the punishment loop that breaks educational games.

### Score bonus for speed

Optional stretch: if the pile clears with > 30% time remaining, award a small score bonus (+2). Surface this at the debrief: "Cleared 30 seconds early — bonus +2." Creates a self-imposed challenge for replay players. Not required for MVP redesign.

---

## 9. Humor Layer — "Moments of PHI Joy"

User quote: *"It has to have like fun information, like very interesting like moments of PHI joy."*

This is where the redesign can carry massive cultural weight without scope. **The game is teaching HIPAA. The fake patient charts can be funny. The sorter framework doesn't change — only the data does.**

### Examples — Set 1 (Reception, "obvious" identifiers)

Current item: `"Patient name: John Smith"` → category PHI
Redesigned: A full intake form with:
- **Name:** Henderson, Margaret
- **DOB:** 03/14/1952
- **Emergency Contact:** Mr. Whiskers (cat) — `(no phone, lives in same house)`
- **Reason for Visit:** "Says her son keeps forwarding her chain emails about her hip"
- **Insurance:** Medicare + supplemental that her son set up "without permission, allegedly"

Same item ID. Same `category: 'phi'`. Same explanation. But now the player **wants** to read the chart.

### Examples — Set 2 (Lab, "subtle" identifiers)

- Patient: "Lopez, R." (just last name + initial — counts as PHI per Safe Harbor when combined with diagnosis)
- Lab Order: COVID test #4 of the month
- Doctor's Note (handwritten field): "patient brought their own thermometer 'for accuracy comparison'"

The **diagnosis + initials** is the PHI trigger. The thermometer note is irrelevant to the PHI judgment but makes the chart memorable.

### Examples — Set 3 (Records, edge cases)

- De-identified data set with month/year only ("treated 03/2024") — NOT PHI per Safe Harbor (no full date)
- Patient note attached: "this is from the trial where everyone got a free fitbit"

Player learns the date rule AND has a moment of "wait, why did everyone get a free fitbit." Memorable lesson.

### Humor rules

- **Always grounded in real hospital admin tedium.** Not surreal, not sci-fi. The cat as emergency contact is funny because it's almost real.
- **Never punching down.** No mocking patients for their conditions, ages, demographics. Humor is in the SYSTEM (Medicare paperwork chaos, doctors' frustrated annotations, fax-machine politics) not in the people.
- **HIPAA accuracy first, joke second.** If a joke would require fudging the rule, the rule wins.
- **Patient names should feel real.** Not "John Doe / Jane Smith." Use varied surnames. The HIPAA Training Framework should review the name list to ensure no real-person collisions.

### Estimated content effort

- **6 items × 3 sets = 18 fake charts.** Each chart needs ~10 fields filled with content that ranges from purely informational (name, DOB) to character-building (emergency contact: cat).
- **Writing time: ~2-3 hours for a strong writer.** Less if humor lands on first draft.

---

## 10. Component Architecture (For Future Plan)

Not a binding decision — but a sketch of where things land if the build follows the current Phase 16 pattern.

```
client/src/components/phi-sorter-v2/
├── SorterDeskOverlay.tsx          // top-level state machine (replaces PHISorterOverlay)
├── DeskBackground.tsx              // wood-grain desk surface, fixed
├── DocumentChart.tsx               // renders a fake patient chart with content from sorterData
├── StampHandle.tsx                 // hovers with cursor, animates on click
├── StampMark.tsx                   // ink impression that lands on document
├── PaperStack.tsx                  // visible remaining-pile sprite + variants
├── OutgoingTray.tsx                // KEEP and REDACT trays with fill state
├── NPCCounterPortrait.tsx          // NPC sprite + line bubble
├── DeskClock.tsx                   // visible countdown clock
├── AmbientLayer.tsx                // wall clock, coffee mug, etc — pure decoration
└── SorterDeskHUD.tsx               // score + pile count in the corner

client/src/data/
├── sorterData.ts                   // EXISTING — keep
└── sorterChartContent.ts           // NEW — fake patient chart fills, references sorterData IDs

client/src/audio/
└── (new SFX in attached_assets — preloaded in BootScene)
```

The existing `sorterData.ts` API (item IDs, categories, explanations, takeaways) is the contract. The new `sorterChartContent.ts` extends each item with chart-fill data (name, DOB, fields, humor notes) but doesn't change the HIPAA classification logic.

---

## 11. Scope Tiers — What Ships at What Level

Given this is meaningful work and the user's life context (baby due 2026-06-01, sponsor demo urgent), three viable scope tiers:

### Tier A — "Full vision" (3-5 days)
Everything in this brief. Desk, stamps, NPC, trays, clock, fake charts, ambient bed, soft time pressure. This is the version that wins hearts. Recommended only if there's runway.

### Tier B — "Stamp + Charts" (2-3 days)
Desk + stamps + fake charts + NPC reactions. Skip: ambient bed, visible clock, outgoing trays (keep current bucket-replacement). 80% of the feel for 50% of the effort.

### Tier C — "Charts only" (1-2 days)
Just rewrite `sorterData.ts` items as fake patient charts with humor. Keep the existing bucket UI. **This alone would solve 70% of the user's complaint** ("it has to have fun information"). Lowest-risk improvement.

**Recommendation:** Start with Tier C as a fast win, then evaluate whether Tier B or A is worth the additional investment based on user reaction. Tier C doesn't preclude Tier A — it's a strict subset.

---

## 12. Out of Scope (Even at Tier A)

- **Voice acting** — text-only NPC dialogue, scope killer otherwise
- **Branching narrative within the encounter** — chart order is fixed per HIPAA accuracy
- **Multiplayer / leaderboards** — requires backend
- **Procedural chart generation** — fixed, hand-authored charts (humor requires human writing)
- **Advanced stamp customization** — KEEP / REDACT only, no "FORWARD TO LEGAL" / "QUERY" / etc.
- **Save mid-shift** — encounter is short (60-90s), no mid-state persistence
- **Touch / mobile optimization** — keyboard + mouse only

---

## 13. HIPAA Accuracy Notes (Carries Forward From Current Build)

These constraints survive the redesign — they live in the data, not the UI.

- The 18 identifiers per **45 CFR §164.514(b)(2) Safe Harbor** are the source of truth for `category` field per item.
- Date rule: full dates (MM/DD/YYYY) are PHI; year-only is generally not. Set 3 includes both for the Safe Harbor edge case.
- ZIP code rule: ZIP5 is PHI for populations < 20,000; ZIP3 is generally OK. Surfaced in Set 3.
- Age rule: ages > 89 must be aggregated to "90+." Set 3 includes a 92-year-old patient where the age must be redacted.
- Reference document: `.planning/HIPAA_TRAINING_FRAMEWORK.md` for coverage ratings; `.planning/CONTENT_MANIFEST.md` must be updated when humor-rewritten chart content lands.

---

## 14. Open Questions (Resolve During Plan-Phase)

1. **Time pressure UX** — visible clock from the start, or revealed mid-encounter? The reveal could be a dramatic moment ("the auditor's at the door").
2. **NPC variation across acts** — does Riley appear in all three sets, or do Lab Tech / Records Clerk take over their respective sets? The brief assumes the latter (gives each set a distinct character).
3. **Stamp swap mechanic** — does the player have one stamp that toggles, or two stamps physically on the desk that they pick up? Two stamps is more tactile but requires more art and adds a "selection" step. Recommend: one stamp, KEEP/REDACT chosen by which side of the desk you click (left = REDACT tray, right = KEEP tray, mirroring the current bucket layout).
4. **Score formula adjustment** — current formula is `Math.round((correct/total) * 12)` capped at 12. With time bonus stretch, max becomes 14? Or rebalance so perfect-with-time-bonus = 12 and slow-perfect = 10?
5. **Set 3 "edge case" framing** — Records Clerk encounter currently triggers in Act 3. Does it stay in Act 3 or move to Act 2's Lab if the v2.2 demo flow rearranges narrative beats?
6. **Sponsor demo inclusion** — if v2.2 wins a sponsor, does the redesigned PHI Sorter become a v2.2.1 follow-on (showcase asset) or stay deferred to v2.1 resumption? User's call.

---

## 15. Success Criteria (Forward-Declared for Future Phase)

The redesign is successful when:

1. **A playtester says "that was fun" without prompting** — the Nintendo Test for an educational game.
2. **The decision feels physical** — playtesters describe the stamp action with words like "satisfying," "thunk," "good feedback." Never "clicked through it."
3. **The HIPAA content lands harder, not softer** — post-encounter quiz scores match or exceed the current build's. Humor doesn't dilute learning; it embeds it.
4. **A playtester reads at least one chart out loud to a friend** — moments of PHI joy create shared cultural moments. This is the leading indicator that we shipped the vision.
5. **All Phase 16 success criteria still hold** — keyboard parity, audio + visual feedback, scaling difficulty, debrief with takeaways, unified score, replayability after abort.
6. **Build effort doesn't blow past Tier B (2-3 days)** unless explicit Tier A approval. Scope discipline is part of the success metric.

---

## 16. Next Steps (When Build Begins)

1. `/gsd:add-phase` — append the redesign as a v2.1 phase (suggested number: Phase 18 since Phase 17 is Breach Triage)
2. `/gsd:discuss-phase 18` — capture decisions on the open questions in §14
3. `/gsd:plan-phase 18` — break into plans (likely: data rewrite → art + audio → desk components → integration)
4. Cut a feature branch: `gsd/phase-18-phi-sorter-redesign`
5. Build at Tier C first, evaluate, ladder up to B or A only if it's clearly working.

---

## 17. Files This Spec References

- `client/src/components/phi-sorter/PHISorterOverlay.tsx` — current implementation, to be superseded
- `client/src/data/sorterData.ts` — content layer, **kept**
- `client/src/phaser/EventBridge.ts` — encounter contract, **kept**
- `client/src/phaser/scenes/ExplorationScene.ts` — trigger zones, **kept**
- `client/src/pages/UnifiedGamePage.tsx` — encounter routing, **modified to mount new overlay**
- `.planning/ENHANCEMENT_BRIEF.md` — original §4.1 PHI Sorting design, **superseded by this brief**
- `.planning/HIPAA_TRAINING_FRAMEWORK.md` — coverage requirements, **referenced**
- `.planning/CONTENT_MANIFEST.md` — must be updated when humor-rewritten content lands
- `.planning/GAME_DESIGN_PRINCIPLES.md` — Nintendo Test commandments, **honored**

---

*End of brief. Save as-is until v2.2 sponsor demo ships and v2.1 resumes. No code touched yet.*
