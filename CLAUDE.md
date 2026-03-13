# PrivacyQuest + BreachDefense

## Project Overview

Two HIPAA educational games in one project, connected through a hospital lobby hub world:
- **PrivacyQuest** — Privacy RPG exploration (walk rooms, talk NPCs, learn HIPAA Privacy Rule)
- **BreachDefense** — Security tower defense (place towers, stop cyber threats, learn HIPAA Security Rule)

Stack: Phaser 3 + React 18 + TypeScript + Vite 5 + Tailwind 3. Phaser handles canvas/gameplay, React handles menus/HUD/dialogue overlays. EventBridge (Phaser EventEmitter) connects them.

Routes: `/` → Hub World, `/privacy` → PrivacyQuest, `/breach` → BreachDefense.

## Design Philosophy — "The Nintendo Test"

These games teach HIPAA. HIPAA is not inherently exciting. Our job is to make players **forget they're learning** — the way Pokémon teaches type matchups, Zelda teaches spatial reasoning, and EarthBound makes mundane settings feel like adventures. Every feature, every line of dialogue, every interaction should pass this test: **would this feel at home in a polished Nintendo RPG?**

Full design reference with examples: `.planning/GAME_DESIGN_PRINCIPLES.md`

### The Commandments

1. **Every action needs a response.** No silent interactions. Player does something → audio cue + visual feedback + state change. If any channel is missing, it's not done. Tower placement without a sound is a bug. A correct answer without a celebration is a missed opportunity.

2. **Anticipation before reward.** Don't just give — build a beat first. Brief pause before a reveal. Screen dim before story text. Silence before a fanfare. Half a second of anticipation doubles the impact. Zelda chest opening, not vending machine dispensing.

3. **Teach through situations, not text.** Put the player in a scenario where they have to make a HIPAA decision. Let consequences reveal the rule. A modal explaining the Minimum Necessary principle is a lecture. A moment where the player must choose how much patient info to share — and sees what happens — is a game.

4. **NPCs are people, not rule-delivery systems.** They have names, quirks, opinions, and humor. A compliance officer who's exhausted from this week's third printer incident. A nurse who genuinely cares about her patients. Write them as people you'd meet in a real hospital, then let HIPAA knowledge flow from their personality and situation.

5. **Boring is a bug.** If any text reads like a compliance document, rewrite it. If a screen feels like a PowerPoint slide, redesign it. If an interaction feels like filling out a form, rethink it. The player should never think "oh, this is the educational part."

6. **Celebrate learning moments.** When a player gets something right, discovers something new, or completes a challenge — treat it like a Zelda item-get. Visual flair, satisfying sound, brief moment of glory. Learning HIPAA should feel like collecting badges.

7. **Pacing is a wave, not a line.** Tension and calm must alternate. Exploration (calm) → encounter (building) → decision (peak) → feedback (release). If the emotional graph is flat, something is wrong. Breathing room between intense moments is not wasted time — it's where learning consolidates.

8. **Feedback scales with moment size.** Button click → subtle tap. Correct answer → green flash + chime. Room complete → screen effect + fanfare + story reveal. Wave survived at 5% health → massive celebration. Proportional feedback teaches the player what matters.

9. **Show progress, reward collection.** Players should always see how far they've come. Codex entries, room checkmarks, score meters, completion percentages — make them visible, make them animate on change, make filling them up feel satisfying. Every new entry is a micro-celebration.

10. **Surprise creates memories.** Break patterns occasionally. An NPC who breaks the fourth wall. A hidden detail in a room. An unexpected animation on a perfect score. Predictable is comfortable; surprises are memorable.

### Anti-Patterns — Things We Do NOT Do

- **Text dumps.** Three paragraphs where one sentence works. Every modal passes the "would a player actually read this?" test.
- **Silent interactions.** Any action without audio + visual feedback. If it's quiet, it's not shipped.
- **Functional but flat.** "It works" ≠ "it's good." A score counter that updates is functional. One that flashes and pulses is good.
- **Explaining instead of showing.** A modal saying "click to place towers" vs. a glowing grid cell that invites clicking.
- **Corporate tone.** If it sounds like it was written by a legal department, rewrite it until it sounds like a human.
- **Modal addiction.** Full-screen interruption when a floating label, brief animation, or sound cue would do.
- **Feature without feel.** Adding a health bar without a low-health pulse. Adding enemy death without particles. The feature exists but has no texture.
- **Uniform everything.** Every room same size, every NPC same line count, every wave same structure. Variation creates interest.
- **Front-loading information.** Explaining all mechanics upfront instead of letting players discover them. Progressive disclosure, not a manual.

## HIPAA Content Review

These games serve as corporate HIPAA training. All educational content must be accurate, complete, and aligned with training requirements.

**Reference documents:**
- `.planning/HIPAA_TRAINING_FRAMEWORK.md` — Regulatory requirements mapped to game content, coverage ratings, and gap analysis
- `.planning/CONTENT_MANIFEST.md` — Index of every piece of educational content with file paths, IDs, and HIPAA topic tags

**When modifying educational content (dialogue, codex, tutorials, educational items):**
1. Verify HIPAA accuracy — rules, timelines, and penalties must reflect current 45 CFR Part 164
2. Check the Content Manifest — update it when adding, moving, or removing content
3. Map to the Training Framework — every scenario should teach a specific HIPAA topic listed in the framework
4. Maintain tone — content must pass the Nintendo Test (Commandment 5: "Boring is a bug"). Rewrite anything that reads like a compliance document.
5. Flag coverage changes — if a change removes or weakens coverage of a HIPAA topic rated `THIN` or `ADEQUATE`, call it out

**When reviewing content for accuracy, check:**
- Is the HIPAA rule cited correctly? (e.g., 30-day access rule, Minimum Necessary scope, authorization requirements)
- Are real-world examples verifiable? (breach cases, statistics, penalty amounts)
- Do wrong-answer feedback messages explain *why* it's wrong and what the correct rule is?
- Are score weights proportional to violation severity?

## Technical Conventions

- **Phaser** owns: canvas rendering, sprites, physics, tweens, particles, sound, game loops, scene transitions
- **React** owns: menus, HUD overlays, dialogue/text display, modals, educational content panels
- **EventBridge** (`client/src/phaser/EventBridge.ts`): Phaser EventEmitter singleton for React↔Phaser communication. Phaser emits gameplay events, React emits UI commands.
- Art style: 16-bit SNES-era pixel art, 32px tiles (PrivacyQuest), 64px cells (BreachDefense), "Press Start 2P" font
- Audio: Phaser WebAudioSoundManager, MP3/OGG format, small files
- State: PrivacyQuest saves to localStorage, BreachDefense is session-based
- All game data (towers, threats, waves, dialogue) lives in TypeScript constants files — not hardcoded in scenes
