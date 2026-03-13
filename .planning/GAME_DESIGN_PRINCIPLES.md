# Game Design Principles — Full Reference

This document expands on the design commandments in `CLAUDE.md` with concrete examples, patterns, and techniques mapped to PrivacyQuest and BreachDefense. Read this when working on UX, content, interactions, or polish.

---

## 1. Feedback & Juice

"Juice" means layered feedback that makes interactions feel alive. A single player action should produce responses across multiple channels simultaneously.

### The Four Feedback Channels

| Channel | What it is | Example |
|---------|-----------|---------|
| **Visual** | Tweens, particles, flashes, shakes, color changes | Tower pops in at 1.2x scale → settles to 1.0x |
| **Audio** | Sound effects, pitch shifts, silence for contrast | Placement "thunk", enemy death "crunch" |
| **State** | Score change, unlock, meter fill, counter update | Budget number flashes when deducted |
| **Narrative** | Text response, character reaction, flavor text | "Firewall deployed. Let's see them get past THIS." |

### Layering Rule

Any significant action should hit at least 2-3 channels. Examples:

**Tower placement (BreachDefense):**
- Visual: pop-in scale tween (0 → 1.15 → 1.0)
- Audio: satisfying placement thunk
- State: budget number flashes, decrements
- Optional narrative: brief floating text ("Deployed!")

**Correct HIPAA answer (PrivacyQuest):**
- Visual: green flash on feedback card, checkmark animation
- Audio: bright chime
- State: trust score pulses upward
- Narrative: explanation text with warm tone

**Wrong HIPAA answer (PrivacyQuest):**
- Visual: red flash, brief screen shake (small — 2-3px, 200ms)
- Audio: low thud (not harsh — teaching, not punishing)
- State: trust score drops with visible animation
- Narrative: empathetic explanation ("That's a common mistake — here's why...")

**Enemy death (BreachDefense):**
- Visual: color-burst particles (already exists), brief screen shake on tough enemies
- Audio: satisfying "eliminated" crunch/pop
- State: implicit (one fewer enemy on screen)
- Optional: floating "+10" score text at death location

### Proportionality Scale

| Moment size | Feedback intensity | Example |
|------------|-------------------|---------|
| Tiny | Single channel, subtle | Button hover → slight scale or color shift |
| Small | 2 channels, quick | Dialogue advance → blip sound + text appears |
| Medium | 2-3 channels, noticeable | Tower fires → recoil tween + projectile sound + muzzle flash |
| Large | 3-4 channels, momentary pause | Room complete → screen dim + fanfare + story reveal + stats |
| Climactic | Everything, hold the moment | Both games complete → full celebration, certificate, emotional payoff |

---

## 2. Anticipation → Action → Reward

The most powerful pattern in game design. Nintendo never just gives you something — there's always a beat of build-up.

### The Pattern

```
ANTICIPATION (build tension)  →  ACTION (the thing happens)  →  REWARD (payoff)
     0.3-1.0 seconds                instant                    0.5-2.0 seconds
```

### Applied Examples

**Zelda treasure chest:**
1. Anticipation: Link walks to chest, reaches out, lid opens slowly
2. Action: Item rises above his head
3. Reward: Fanfare plays, text describes the item, player holds it for a beat

**PrivacyQuest room completion:**
1. Anticipation: Screen dims slightly, brief pause, "Room Cleared" text sweeps in
2. Action: Patient story card appears
3. Reward: Story types out (typewriter), emotional music sting, "This is who you protected"

**BreachDefense wave clear:**
1. Anticipation: Last enemy dies, brief moment of silence (no more combat sounds)
2. Action: "Wave Complete" banner
3. Reward: Recap card with concept learned, stats shown, next wave preview

**BreachDefense new tower unlock:**
1. Anticipation: "New Defense Available!" notification slides in
2. Action: Tower icon revealed with glow effect
3. Reward: Brief description + tower appears in selection panel with highlight

**PrivacyQuest NPC discovery:**
1. Anticipation: Walk near NPC, interaction prompt pulses ("Press SPACE")
2. Action: Camera focuses slightly toward NPC, dialogue opens
3. Reward: Character introduces themselves with personality

### The Mistake to Avoid

Skipping anticipation. Don't just pop a modal. Don't just add a score. Don't just show text. The half-second before the thing happens is what makes the thing feel important.

---

## 3. Teaching Through Play

The goal: players learn HIPAA rules by experiencing situations where those rules matter — not by reading about them.

### The Spectrum (worst → best)

| Level | Approach | Example | Feel |
|-------|----------|---------|------|
| 1 — Lecture | Text explains rule, then quizzes | "The Minimum Necessary Rule states... Q: What is the Minimum Necessary Rule?" | Textbook |
| 2 — Scenario + Quiz | Situation described, then choice | "A coworker asks for patient records. Do you: A) Give all records B) Give relevant records" | Training module |
| 3 — Embedded Choice | Player is IN the situation, choice has consequences | Player is at a computer terminal. Coworker approaches sprite. Dialogue: "Hey, can you pull up Martinez's full chart? I just need the med list." Choice: share full chart vs. just meds vs. refuse. | Game |
| 4 — Discovery | Player discovers the rule through natural exploration | Player notices a whiteboard in the ER with patient names visible. Interacting with it triggers: "Wait — anyone walking by could read these names. That's a violation." The rule emerges from observation. | Nintendo |

**We aim for levels 3 and 4.** Level 2 is acceptable when time-constrained. Level 1 is never acceptable.

### Pokémon's Teaching Model

Pokémon teaches type matchups — a complex system with 18 types and hundreds of interactions — without ever showing a chart. How?

1. **First encounter:** You fight a Rock-type with your Water starter. You win easily. You notice "It's super effective!"
2. **Reinforcement:** Next Rock-type, same result. Pattern forming.
3. **Test:** You encounter a Water-type. Your Water moves do nothing. "It's not very effective..." Now you UNDERSTAND the system.
4. **Mastery:** You start choosing Pokémon based on type matchups before battles begin.

Applied to BreachDefense:
1. First wave: Phishing enemies. Player has MFA tower. MFA destroys phishing fast. Player notices the bonus.
2. Reinforcement: More phishing in later waves. MFA keeps shredding them.
3. Test: Ransomware appears. MFA doesn't help much. Player needs BACKUP tower.
4. Mastery: Player starts reading wave previews and choosing towers based on threat types.

The tower/threat matchup system IS the teaching. The Codex is the reference book, not the teacher.

### One Concept Per Moment

Each room (PrivacyQuest) and each wave (BreachDefense) should teach ONE primary concept. It's okay to reinforce previous concepts, but there should be one clear takeaway.

- Wave 3 teaches: "Software patching prevents known exploits" → PATCH tower introduced
- Reception room teaches: "Sign-in sheets can expose patient information" → sign-in sheet interaction is the key moment

If a player can't answer "what did I just learn?" after a room/wave, the design failed.

---

## 4. Character & Personality

### The EarthBound Principle

EarthBound's setting is literally suburban America — houses, shops, hospitals, offices. It's one of the most beloved RPGs ever made. Why? Because every NPC has a voice. A guy standing in front of a drug store says: "This is a drug store. But you probably already knew that, since you can read the sign. You CAN read, right?"

That's not a joke exactly. It's personality. It's a character with an opinion and a point of view, reacting to the absurdity of being an NPC in a video game.

### NPC Voice Guidelines

**Instead of:** "HIPAA requires that you verify a patient's identity before sharing their information."

**Write:** "Last Tuesday, someone called claiming to be Mrs. Chen's daughter. Turned out to be a reporter. ALWAYS verify. I don't care if they sound like they're crying — verify first, empathize second."

**Instead of:** "The Security Rule requires technical safeguards including access controls."

**Write:** "You know what my password used to be? 'password123'. I'm not proud of it. But that was before I watched someone walk into the server room with a USB drive and nearly take down the entire network. Now my password is... well, I'm not telling you. That's the point."

### Character Archetypes That Work

| Archetype | Personality | Teaching style |
|-----------|------------|----------------|
| The Veteran | Seen everything, slightly tired, deeply caring | War stories: "Let me tell you what happened when..." |
| The Newbie | Eager, asks questions the player is thinking | Relatable: "Wait, so I can't just look up anyone's chart?" |
| The Stickler | Rules-focused, initially annoying, ultimately right | Earns respect: "I know I'm annoying. But I've never had a breach." |
| The Cautionary Tale | Made a mistake, learned from it, wants to help | Vulnerable: "I left a chart open on screen once. Just once." |
| The Tech Nerd | Enthusiastic about security, speaks in analogies | Makes complex simple: "Think of encryption like a locked diary..." |
| The Protector | Patient-focused, emotional core, reminds you of stakes | Grounding: "Elena trusted us with her HIV status. Let that sink in." |

### Humor Guidelines

- **Situational humor** > jokes. Funny situations from real hospital life, not forced punchlines.
- **Self-deprecating** > mocking. Characters who admit their own past mistakes, not characters who make fun of the player.
- **Absurdist observations** > slapstick. "Someone faxed patient records to a pizza place. I wish I was making that up."
- **Fourth-wall breaks** used sparingly. Once or twice per game, not constantly. "Look, I know this is a training game. But SERIOUSLY, don't share passwords."
- **Never punch down.** Don't mock patients, don't make light of actual breaches that hurt people. The humor is in the absurdity of human behavior, not in suffering.

---

## 5. Pacing & Rhythm

### The Wave Pattern

Every great game follows a wave: tension builds, peaks, releases, rests. Then builds again, higher.

```
         ╱╲         ╱╲╲         ╱╲╲╲
        ╱  ╲       ╱  ╲╲       ╱  ╲╲╲
calm → ╱    ╲  →  ╱    ╲╲  →  ╱    ╲╲╲  →  resolution
              ╲  ╱       ╲╲ ╱        ╲╲╲╱
               ╲╱         ╲╱          ╲╱
```

Each peak is higher than the last. Each valley is a chance to process.

### PrivacyQuest Pacing Map

| Phase | Tension level | Feel | Design notes |
|-------|--------------|------|-------------|
| Hub world | Lowest | Safe, choosing what's next | Calm music, no pressure, visible progress |
| Room entry | Low | Curiosity, exploration | New space to discover, ambient sound |
| NPC approach | Medium-low | Anticipation | "Who is this? What will they teach me?" |
| Dialogue | Medium | Engaged, reading | Character personality hooks attention |
| Choice moment | Medium-high | Decision pressure | Stakes feel real, timer optional |
| Feedback | Release (up or down) | Learn from result | Satisfying if right, gentle if wrong |
| Room complete | Peak then release | Accomplishment → emotion | Celebration → patient story → warmth |
| Return to hub | Low | Rest, plan next move | New room available, progress visible |

### BreachDefense Pacing Map

| Phase | Tension level | Feel | Design notes |
|-------|--------------|------|-------------|
| Pre-wave | Low | Strategic planning | Place towers, read wave preview, prepare |
| Wave start | Rising | Here they come | Spawn announcement, first enemies appear |
| Mid-wave | High | Active defense | Multiple enemies, towers firing, managing |
| Crisis moment | Peak | Will I survive? | Health dropping, enemies near exit |
| Wave end | Release | Made it | Last enemy dies, brief silence |
| Recap | Low | Learn and breathe | What just happened, what it means |
| Next prep | Low-medium | Building for next | New budget, maybe new tower, anticipation |

### Breathing Room

The moment between waves/encounters is not dead time. It's where:
- The player processes what they just learned
- Tension resets so it can build again
- The player feels agency (choosing what to do next)
- Anticipation for the next challenge builds

**Don't rush through transitions.** A 1-2 second pause between "wave cleared" and the recap modal is more effective than instant pop-up.

### Escalation Principles

Escalation should be felt, not just calculated. It's not enough to increase HP by 20% per wave.

**Make escalation tangible:**
- More enemies visible on screen at once (visual density)
- Faster spawn intervals (rhythmic urgency)
- New threat types appearing (novelty + learning challenge)
- Audio intensity increasing (faster music, more layered sounds)
- HUD showing strain (budget getting tight, health bar in danger zone)

---

## 6. Progression & Collection

### The Pokédex Effect

People are intrinsically motivated to complete collections. This isn't about external rewards — the act of filling in an empty slot feels good on its own.

### Progression Elements Already in the Games

| Element | Game | Current state | Enhancement opportunity |
|---------|------|--------------|----------------------|
| Room completion checkmarks | PQ | Green check on hub | Add percentage, visual flair on completion |
| NPC completion markers | PQ | 50% alpha + checkmark | Add to a "people met" list/journal |
| Trust/Privacy score | PQ | Numeric percentage | Make it a prominent, animated meter |
| Codex entries | BD | Unlocked on encounter | Notification on new entry, completion counter |
| Wave progression | BD | Implicit (wave counter) | Wave map showing progress through all 10 |
| Tower unlocks | BD | Available in panel silently | "New tower!" announcement with fanfare |
| Patient stories | PQ | Revealed after room | Story collection screen, journal/book metaphor |
| Educational items | PQ | Collected, fade when done | Item inventory / knowledge checklist |

### Micro-Celebration Checklist

Every time the player achieves something, there should be a proportional celebration:

- **New Codex entry:** Brief slide-in notification with icon + name. Not a modal — non-intrusive.
- **NPC completed:** Checkmark pop-in + brief chime. Already has the checkmark — add the pop-in tween.
- **Room complete:** Full celebration sequence (anticipation → reveal → story → stats).
- **Wave survived:** Banner + stats + recap.
- **Tower unlocked:** "NEW" badge on the tower panel button + brief highlight.
- **All rooms/waves complete:** Major celebration — this is the "credits roll" moment.
- **Both games complete:** The ultimate payoff. HIPAA Guardian certification.

### The Progress Bar Principle

If anything fills up over time (score, completion percentage, codex), make the filling visible and satisfying:
- Animate the fill (don't just set the width)
- Add a subtle pulse or glow at the new level
- Number counters should roll/tick up, not jump

---

## 7. Emotional Design

### Stakes That Feel Personal

Abstract: "HIPAA violations can result in fines up to $1.5 million."
Personal: "Elena has HIV. She came to this hospital because she trusted us. If her status leaks, she could lose her job, her housing, her community. She trusted YOU."

The patient stories in PrivacyQuest already do this brilliantly. Every design decision should reinforce: this isn't about rules — it's about real people.

### Failure as Teaching

When the player makes a mistake, the response should be:
1. **Clear** — they know what went wrong
2. **Empathetic** — "That's a common mistake" not "WRONG"
3. **Educational** — they understand WHY it's wrong
4. **Recoverable** — they can try again, they haven't lost everything

**Never:** Red screen + buzzer + "INCORRECT — The answer was B."
**Always:** Brief visual/audio signal + explanation from a character who understands why someone might make that choice + clear path forward.

The goal is: "Oh, I see why that's wrong. Let me try differently." Not: "I feel stupid and want to stop playing."

### The Emotional Arc

Both games should follow an emotional trajectory:

**PrivacyQuest:** Curiosity → Competence → Empathy → Pride
- Start: "What is this place? What do I do?"
- Middle: "Oh, I understand these rules now. I'm getting good at this."
- Late: "These patient stories... this really matters."
- End: "I'm a Privacy Guardian. I protect real people."

**BreachDefense:** Urgency → Strategy → Mastery → Responsibility
- Start: "190 million records breached. This is serious."
- Middle: "If I use these towers against those threats... yes, that works!"
- Late: "I can handle anything they throw at me."
- End: "I AM the security. These policies protect real patients."

---

## 8. Specific Gameplay Moments to Design For

These are the key moments where design quality matters most. Get these right and the game feels polished. Get them wrong and nothing else compensates.

### PrivacyQuest Key Moments

**The First NPC Interaction (the "Professor Oak" moment)**
- This sets the tone for the entire game
- Should feel welcoming, slightly humorous, and immediately interactive
- The player should think "oh, this is going to be fun" not "oh, this is going to be a quiz"
- Teach one thing, teach it through a situation, celebrate when they get it

**The Wrong Answer**
- Must sting just enough to matter, not enough to frustrate
- Think Pokémon fainting: it's a setback, not a game over
- Empathetic feedback: "That's what most people think, actually. Here's the thing though..."
- Visual/audio: brief, warm, not harsh. Red is okay. Buzzer sound is not.

**The Patient Story Reveal**
- The emotional peak of each room. This is the "why" behind all the rules.
- Full immersion: dim surroundings, focus on text, typewriter pacing
- No rushing. Let the player sit with it.
- The "This is who you protected" line is perfect — keep that energy.

**The Discovery Moment**
- Finding an observation gate (whiteboard with names, unattended computer, open chart)
- Should feel like finding a secret in Zelda — "I noticed something others would miss"
- Brief audio cue (discovery chime), visual highlight, character thought bubble
- Reward the player's attention

**The Boss Encounter**
- Tension spike: visual/audio shift, harder questions, higher stakes
- Should feel like a gym leader battle, not just another NPC
- Victory here should be the biggest celebration in the room

### BreachDefense Key Moments

**First Tower Placement**
- The "I can fight back" moment
- Should feel empowering: satisfying thunk, visual pop-in, immediate readiness
- The grid should feel like YOUR territory that you're fortifying

**First Enemy Kill**
- "It works!" — the game loop clicks
- Particle burst + sound + implicit understanding: "towers kill enemies"
- This teaches the entire game in one moment

**The Close Call (low health survival)**
- Security at 10-20%, last enemy of the wave barely gets stopped
- This is the most memorable moment in any tower defense game
- Sell it: health bar pulsing red, maybe alarm sound, then wave-clear relief

**New Tower Unlock**
- "New item acquired!" energy
- Don't just silently add it to the panel
- Brief notification + highlight + the player immediately wants to try it

**Wave 10 Victory**
- The culmination. 10 waves of escalating threats, all survived.
- Big celebration: screen effects, stats, message, sense of mastery
- "You ARE the security" — land this line with full weight

### Cross-Game Moments

**Hub World as Home Base**
- Should feel safe and calm, like a Pokémon town between routes
- Visible progress: doors marked complete, new areas accessible
- The hub acknowledges what you've done

**Game Completion**
- Finishing one game should feel great. Finishing both should feel legendary.
- If both games are complete, the hub world could reflect this
- The combined "HIPAA Guardian" moment ties both games' themes together

---

## 9. Sound Design Principles

Sound is the single highest-leverage improvement for game feel. A game with good sound design feels 10x more polished than the same game silent.

### Sound Categories (Priority Order)

1. **Core action feedback** — tower fire, enemy hit, enemy death, answer correct, answer wrong
2. **UI feedback** — button click, menu open/close, dialogue advance
3. **State changes** — wave start, wave end, health warning, new unlock
4. **Ambient/mood** — exploration ambience, combat intensity, hub calm
5. **Music** — last priority, but eventually: calm exploration, tense defense, emotional story

### Sound Design Rules

- **Short and punchy.** Most SFX should be under 0.5 seconds. Tower fire: 0.1-0.2s. Chime: 0.3s. Fanfare: 1-2s max.
- **Distinct silhouettes.** Each sound should be identifiable with eyes closed. Tower fire ≠ enemy hit ≠ UI click.
- **No harsh frequencies.** Educational game, possibly played with headphones. No piercing high-pitched sounds, no jarring buzzers.
- **Silence is a sound.** The moment between the last enemy dying and the recap modal is silence — and that silence is powerful. Don't fill every second.
- **Pitch variation.** Repeated sounds (like tower firing) should have slight random pitch variation (±5-10%) to avoid fatigue.

### Dialogue Sound

RPG dialogue blips (the "talking sound" from Undertale/EarthBound/Animal Crossing) are more effective than silence during text:
- Creates rhythm and pace to reading
- Each character could have a different pitch/tone (low for the doctor, bright for the nurse)
- Stops when text finishes (signals "your turn to act")

---

## 10. Anti-Pattern Field Guide

Detailed examples of what NOT to do, with before/after rewrites.

### Text Dump

**Before (bad):**
> "Welcome to Memorial Hospital's Privacy Training Program. The Health Insurance Portability and Accountability Act of 1996 (HIPAA) establishes national standards for the protection of individually identifiable health information. As a new employee, you are required to understand and comply with these standards. The Privacy Rule addresses the use and disclosure of individuals' health information by covered entities. It also establishes standards for individuals' rights to understand and control how their health information is used."

**After (good):**
> "Hey, new hire! Welcome to Memorial. I'm Nina — I'll be showing you around. Quick thing before we start: everything you see and hear about patients? Stays here. No exceptions. I know that sounds dramatic, but trust me — I'll show you why it matters. Ready?"

### Feature Without Feel

**Before (bad):**
```
// Tower placed
this.towers.push(newTower);
this.budget -= tower.cost;
EventBridge.emit('budget-changed', this.budget);
```

**After (good):**
```
// Tower placed — juice it
this.towers.push(newTower);
tower.sprite.setScale(0);
this.tweens.add({ targets: tower.sprite, scale: 1, duration: 200, ease: 'Back.easeOut' });
this.sound.play('tower-place');
this.budget -= tower.cost;
EventBridge.emit('budget-changed', this.budget);
EventBridge.emit('budget-flash');  // React HUD animates the number
```

### Modal Addiction

**Before (bad):**
A full-screen modal appears: "Wave 3 Complete! You defended against Unpatched Software threats. The PATCH MANAGEMENT tower is effective against these threats because..."

**After (good):**
In-canvas banner slides down: "Wave 3 — Cleared!" (1.5 seconds, auto-dismiss). Then a compact recap card slides in from the side with one key takeaway and a "Got it" button. Total screen takeover: zero.

### Corporate Tone in Dialogue

**Before (bad):**
> "The Minimum Necessary Rule requires that covered entities limit the use, disclosure, and request of protected health information to the minimum amount necessary to accomplish the intended purpose."

**After (good):**
> "So here's the thing about patient charts — you only look at what you need. Dr. Lee needs the lab results? She gets the lab results. Not the family history, not the billing address, not what medications they're on for something unrelated. Just. What. She. Needs. We call it Minimum Necessary, but really it's just... minding your own business, professionally."

---

## Summary Checklist

When implementing any feature, run through this:

- [ ] Does the interaction have audio feedback?
- [ ] Does the interaction have visual feedback (tween, particle, color change)?
- [ ] Is there a beat of anticipation before rewards/reveals?
- [ ] Does any text pass the "would a player read this?" test?
- [ ] Could any text be cut in half?
- [ ] Does the NPC sound like a person or a manual?
- [ ] Is the pacing varied (not everything at the same intensity)?
- [ ] Is the player learning through a situation, or being lectured?
- [ ] Is progress visible and celebrated?
- [ ] Would this moment feel at home in a Nintendo RPG?
