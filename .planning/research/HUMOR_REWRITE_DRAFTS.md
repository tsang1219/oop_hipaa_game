# Humor Rewrite Drafts (archived, not a backlog)

_Companion to `DRY_MOMENTS_INVENTORY.md`, `OOP_HUMOR_CATALOG.md`, and `OOP_HUMOR_PLAYBOOK.md`.
This is the archived content of the "Chart Corrections" review artifact (2026-08-22/23) — 63
drafted before/after rewrites for the driest lines the inventory found, reviewed line-by-line by
the user._

**Status, per the user (2026-08-23): the diagnosis was worth doing — knowing which spots read as
cringe-y or weak is useful and stands. Systematically rewriting and shipping all of them was NOT
the right approach.** Treat everything below as a menu to pull individual ideas from later, not a
todo list to execute wholesale. A ~23-item "headline batch" (Pattern A's worst offenders, all of
Pattern B, Pattern C, and the 5 unconstrained hallway poster facts) was implemented directly into
`gameData.json` / `roomData.json` before this call was made — see **Implemented** below. Patterns
E, F/G, the "more individual fixes" grab-bag, and the structural NPC-naming note were drafted but
never landed in code and should be treated as pure reference.

## What the review actually validated

- **The diagnosis (`DRY_MOMENTS_INVENTORY.md`) is sound** — the driest spots really are dry, and
  the 8 systemic patterns are real. Keep using that file.
- **Wholesale rewrite-and-ship was the wrong unit of work.** Line-by-line review of ~60 drafted
  rewrites at once was, in the user's words, "awful format to go through" and "a big list to
  analyze" — even though most individual verdicts were positive. Future passes should be much
  smaller batches, or skip the review-document step and land a small set of changes directly for
  in-game playtesting instead. (See memory: `feedback_review_format_preference`.)
- **Voice note that should generalize to any future rewrite pass:** avoid the "that's not the
  trap — X is the trap" / "it's not this, it's that" antithesis construction and over-clipped
  fragments that "announce" their own cleverness. The user called this out as reading like AI
  slop even on rewrites they otherwise liked, and asked for plainer, more natural sentences
  instead. This does **not** mean characters must be unwitty, fragmentary, or barred from
  delivering funny lines. The governing test is now comic premise versus joke announcement:
  humor should arise from recognizable healthcare behavior, human motives, contradiction,
  status, and the real absurdity of applying HIPAA at work. See the revised
  `OOP_HUMOR_PLAYBOOK.md`. (See memory: `feedback_humor_rewrite_no_ai_slop`.)
- **The Playbook's blanket ban on puns is a default, not an absolute, for this user** — reacting
  to the cut "HIPAA-potamus" pun, they said jokey/punny can work "depending on the thing." Worth
  asking case-by-case rather than auto-cutting every pun.
- Specific verdicts from the review: Gary's rewrite = "hilarious." Pattern B (found-artifact
  scenes) = approved almost across the board, except the `unlocked_workstation` "vacation days"
  joke, which read as a non-sequitur with no clear tie to the scene (fixed to a shift-swap
  spreadsheet joke instead — see Implemented). Pattern C and Pattern D = approved. BreachDefense
  section = liked, subject to the same anti-slop note.

## Implemented (already landed, before this archive was written)

`gameData.json`: `scene1` (dialogue + one feedback line reverted, one rewritten), `gary_gossip`
(both feedback lines), `final_boss_2` + `final_boss_3` (checklist → prose), `records_access` +
`security_training` (openers), and all 12 Pattern-B scenes — `whiteboard_phi`,
`unlocked_workstation`, `sample_phi`, `exposed_results`, `unlocked_files`, `proper_disposal`,
`password_sharing`, `vendor_baa`, `intervene_gossip`, `phone_security`, `signin_violation`,
`phone_privacy`.

`roomData.json`: the 5 hallway poster `fact` fields (`hallway1_phi_tip` through
`hallway5_emergency_tip`) each got a diegetic addition.

**Explicitly held back and not implemented:** the 15 `hallwayContent.ts` Act 1/2/3 bulletin
boards (hard-capped at 28 chars/line × 3 lines — the drafted jokes below don't fit as written and
need a dedicated compression pass), the structural NPC-naming note, and everything in Patterns
E/F/G and the grab-bag section. Given the user's "not the right approach" verdict, none of these
should be auto-implemented from this doc without a fresh, smaller conversation about scope.

---

## Pattern A — the quiz-engine feedback template

Every `"Correct! [rule]."` / `"Incorrect. [rule]."` pair rewritten as a one-word in-character
reaction, with the rule content reflowed into natural prose instead of a stapled-on paragraph.

**scene1 — Tutorial, Nurse Nina, EHR access request** *(implemented, in modified form — see
above; correct-feedback rewrite below was rejected as slop and reverted to the original shipped
line)*
- Current: `NINA: "Hi there! I need access to patient data to prepare for rounds tomorrow morning. Can you help me get into the EHR system?"` · Correct feedback: "Correct! Fun fact: HIPAA's Minimum Necessary rule actually has a treatment exception — providers treating a patient can access what they need without the usual restrictions. But your facility's role-based access controls still determine what any individual user can see." · Wrong feedback (full access): "Incorrect. Even though HIPAA's Minimum Necessary rule doesn't apply to treatment disclosures, your facility's access controls should still limit EHR access to what's appropriate for a nurse's role."
- Drafted rewrite: `NINA (already walking, doesn't stop): "Third time this rotation I've had to ask. Rounds in ten — EHR access?"` · Correct: `NINA: "Good. Treatment doesn't wait on Minimum Necessary — that's not the trap. Role-based access is the trap."` **← flagged as slop, reverted** · Wrong (full access): `NINA: "'Everything'? Nobody gets everything."` **← approved**

**gary_gossip — Break Room, celebrity chart snooping** *(implemented; "hilarious")*
- Current: `GARY: "Hey, did you hear about the celebrity who came into the ER last night? I saw their chart. Want to know what they were here for?"` · Feedback: "Correct!" / "Incorrect." / "Insufficient."
- Drafted rewrite, correct (report Gary): `GARY (deflating): "...Report it? Really?" [beat] "Yeah. There's a form. There's always a form."` · Wrong (ask for details): "You just became part of the problem. Gary's smiling. That's never a good sign."

**final_boss_2 + final_boss_3 — Records finale** *(implemented)*
- final_boss_2 correct feedback current: "You need: (1) Written authorization from the patient, OR (2) A valid court order/subpoena..., (3) Follow minimum necessary standards, (4) Document everything." → drafted: `CCO: "Don't let them rush you."` (checklist moved off her mouth, kept as straight rule content elsewhere)
- final_boss_3 correct feedback current: "Absolutely correct! HIPAA doesn't care about org charts. The CEO has no special rights to snoop in patient records..." → drafted: `CCO (long pause): "No org chart outranks this. Ever."`

---

## Pattern B — show the artifact, stop narrating it

Ten "Observation" scenes described a violation in the abstract instead of showing the object.
**All implemented**, adapted to plain narration (no speaker tags/brackets — the feedback panel
reuses the scene's existing UI, so stage directions would just print as literal text).

| Scene | Current | Drafted fix |
|---|---|---|
| `whiteboard_phi` (ER) | "The ER status board shows patient names, room numbers, and chief complaints... visible to anyone walking through the ER." | "ROOM 4 — covered by a Post-it. The Post-it is on the floor." |
| `unlocked_workstation` (ER) | "...patient's full medical record displayed on screen. The staff member stepped away 10 minutes ago..." | "Second tab, still loading: 'how many vacation days do I have left.'" — **flagged: doesn't tie to HIPAA/the scene, replaced with a shift-swap spreadsheet joke in the implemented version** |
| `password_sharing` (IT) | "You find a sticky note on a desk with a login username and password written on it." | Sticky note, taped to the monitor: "jsmith / Passw0rd1! (don't tell IT)" |
| `proper_disposal` (Records) | "You find patient documents in the regular trash can instead of the designated shredder bin." | Sticky note taped to the shredder: "OUT OF TONER — USE OTHER BIN (JUST THIS ONCE)" |
| `phone_security` (Break Room) | "Someone left their work phone unlocked on the table with the patient scheduling app open." | Notification banner over the open app: "Mom Squad (12): are we still doing Sunday" |
| `intervene_gossip` (Break Room) | "You overhear two coworkers... discussing a patient by name, including their diagnosis and family drama." | "...and then she said the biopsy came back and I was like NO WAY because Gary's already planning the retirement party—" |
| `vendor_baa` (IT) | "...The agreement section labeled 'Business Associate Agreement' is blank." | Sticky note clipped to the page: "Legal — still waiting. This is reminder #4." |
| `sample_phi` (Lab) | "Sample containers with patient labels sitting on an open counter... full patient names, dates of birth, and test type." | "Someone's coffee cup is sitting on top of the rack. The ring stain lines up exactly with a name." |
| `exposed_results` (Lab) | "Test results are sitting on the counter, clearly visible... The lab tech stepped away about 5 minutes ago." | "Sticky note on top, in pen: 'back in 5 :)' The smiley face is doing a lot of work." |
| `unlocked_files` (Records) | "The file cabinet... is unlocked and unattended... The room door is also propped open." | "The door's propped open with a fire extinguisher. A binder stamped 'PHI — DO NOT REMOVE FROM ROOM' is wedged under a drawer that won't quite close." |
| `signin_violation` (Reception) | "...sign-in sheet at reception shows the names of all patients who checked in today, plus their appointment times and reasons for visit." | Reason-for-visit column, in full view: "follow-up on the knee — no, the other one — no, THAT one." |
| `phone_privacy` (Reception) | "You hear Riley discussing a patient's test results over the phone... loudly enough that others in the waiting room can hear specific medical details." | "—and NO, the cholesterol wasn't that bad, Frank, calm down—" (trails off as you approach) |

---

## Pattern C — stop announcing the quiz *(implemented)*

- `records_access`: current "Welcome to Medical Records! ...Quick quiz: how long does HIPAA give us to respond..." → drafted a Joanna-voiced line stamping folders, ending "Thirty days, technically." **Note: the shipped version could not literally use this line — it pre-reveals the quiz answer before the player picks a choice, which breaks the mechanic. Rewritten again at implementation time to a scenario that doesn't leak the answer, and the invented name "Joanna" was dropped since NPC naming is the deferred structural fix, not part of this pass.**
- `security_training`: current "Welcome to IT Security. Fun fact: most breaches aren't from hackers—they're from employees. What's the #1 thing staff can do to prevent breaches?" → drafted an analyst mid-phone-call, with the "68% of breaches start inside the building" stat moved to an (unbuilt) wall-poster aside instead of spoken.

---

## Pattern D — the five dead hallways

The 5 unconstrained `roomData.json` poster **facts were implemented** (each got a one-sentence
diegetic addition, unchanged from the drafts below). **The 15 `hallwayContent.ts` Act 1/2/3
bulletin boards below were NOT implemented** — that file caps entries at 28 characters/line × 3
lines, and none of these fit at that length without being gutted. Needs its own compression pass.

- `hallway1_phi_tip`: + "Someone has taped a handwritten addendum to the bottom: 'this includes the group chat.'" *(as implemented, worded slightly differently than the draft below)*
- Act 1 "WELCOME!": "Orientation today at 2pm / Badges required after lobby (yes, still you, Kevin) / Have a great first day!" — over the char limit as drafted.
- Act 2 "COMPLIANCE NOTICE": "~~Three~~ Four audit flags this week [handwritten correction] / Minimum Necessary applies / even here — every time" — over the char limit as drafted.
- Act 3 "LOCKDOWN PROTOCOL": same bulletin + taped scrap "(this means you too, Kevin)" — over the char limit as drafted.
- `hallway2_verbal_tip`: + pen note "The closet works too. —M" *(implemented, sets up Supply Closet B)*
- Act 2 "PRIVACY OFFICER NOTICE": "Second time this month. You know who you are. (You don't. That's the problem.)" — needs re-fitting to 28 chars/line.
- `hallway3_deidentify_tip`: + a folder stapled to the poster, "SAFE HARBOR ✓ — 18/18" *(implemented)*
- Act 2 "FAX VERIFICATION": pinned confirmation slip, "CONFIRMATION — TRANSMISSION OK — 14 PAGES / RECIPIENT: SUNSHINE NAIL SALON" + "NO" in pen — needs re-fitting.
- `hallway4_breach_tip`: + laminated "60-DAY CLOCK" tracker, "60" crossed out, "59, WE'RE ALREADY BEHIND" *(implemented)*
- Act 2 "SECURITY ALERT": found ticket stub, "SUSPICIOUS LOGIN — 3:14am — assigned: nobody yet" — needs re-fitting.
- `hallway5_emergency_tip`: + a half-erased ER whiteboard visible through the doors *(implemented)*
- Act 1 "ER PROTOCOLS": "Emergency exception. Treat first. Paperwork's not going anywhere." (cut the "know your HIPAA exceptions!" exclamation point) — needs re-fitting.

---

## Pattern E — the manual-flavored onboarding *(drafted only, not implemented)*

- **TutorialModal** (game-load intro, WASD/SPACE key-bind list): drafted framing the controls as
  a Facilities sticky note ("Controls, because nobody reads the handbook...") with keybinds kept
  verbatim; CTA changed to "Clock in →".
- **OnboardingOverlay WELCOME step** (BreachDefense, "Defend the hospital network. Pick a tower...")
  — Option A: "Somebody's poking at the network again. Pick a defense, drop it on the grid, make
  them regret it." Option B (extends the analyst voice from `NarrativeContextCard`): "IT's out of
  coffee and out of patience. Pick a tower. Place it. Buy them both back."
- **scene5** (Nina's tutorial send-off, "Thanks for helping me understand HIPAA better!"): drafted
  `NINA: "One more. Then I really do have rounds."` and correct feedback `NINA: "IRB or the
  patient signs off. Either. Not vibes."`

## Pattern F/G — BreachDefense's generic-TD problem *(drafted only, not implemented)*

- **Wave 8 "Defense in Depth"** ("A coordinated attack is hitting from all angles...") → "Records,
  Lab, and the vending machine WiFi nobody secured — all at once. No single defense covers all
  three."
- **Wave 10 "The Final Breach"**, the game's climax ("This is it. A full-scale attack... Everything
  you've learned matters now.") — Option A: "Every system, every ward, all at once. Records.
  Pharmacy. The vending machine that somehow takes Apple Pay. Hold the line." Option B: "This
  one's hitting everything you've defended all game, at the same time. Hold the line."
- **Wave 6 "Social Engineering"** ("'Hi, this is IT—I need your password to fix an issue.' Sounds
  legitimate, right?") → cut the trailing question, let the quote stand alone.
- **EncounterDebrief `HIPAA_TAKEAWAYS`** (static, shown after every encounter): "91% of
  cyberattacks start with a phishing email. Training your staff is your first line of defense." →
  "91% of cyberattacks start with a phishing email." (cut the editorializing tail). "Defense in
  depth: layer Firewall, MFA, and Training — no single tool stops every attack." → "Firewall. MFA.
  Training. Layered, not ranked — no single one stops everything." Longer-term idea: rotate which
  stat shows based on which encounter just happened.
- **TOWERS/THREATS panel copy** (e.g. "Multi-factor auth checkpoint. Blocks credential-based
  attacks.") → "A second lock on the door. Stops a stolen password from being enough on its own."
  ("Disguised as legitimate email...") → "Looks like it's from the front desk. It is not from the
  front desk."

## More individual fixes *(drafted only, not implemented)*

- `hipaa_brochure` (Lobby, first educational item): add a coffee ring + pen note "this means you
  too, Gary" — nobody explains who Gary is.
- `research_request` (Lab): entitled researcher's line → "It's basically like — my badge already
  gets me into the building, so—" (trails off, doesn't finish).
- `dr_martinez_scene1` (ER): → "Lower the voice. Watch who's near. Not a soundproof booth — just
  don't be an idiot about it."
- `police_records` (ER): → "Yeah, yeah — court order, or consent, or I wait. I know the list. Was
  worth a shot."
- `family_pressure` (ER): → "She takes her blood pressure pill at nine. Nobody even asked me that."
- `fatigue_lapse` (Break Room): → "I typed for ten minutes before I noticed. It said 'his' knee.
  She doesn't have a knee. She has — never mind."
- `access_audit` (Records): → show an actual log excerpt ("J.MARTINEZ — CHART #4471 — 11:58 PM,
  12:14 AM, 12:31 AM... Patient: MARTINEZ, D.") instead of narrating the pattern.
- `breach_response` (IT): add a margin note, "learned this one the hard way — M." Keep the
  existing correct-answer line ("The cover-up is always worse than the breach") as-is.
- `security_safeguards` whiteboard (IT): "Fun detail: encryption is technically 'addressable'..."
  → "Addressable just means you have to explain, in writing, why you didn't encrypt something.
  Everyone encrypts."
- `compliance_officer` idle line: "The week's not over. The week is never over." → "Minimum
  Necessary. Technically covers the vending machine. Nobody's tested that in court."
- `gossiping_coworker` idle line 1: "I'm not saying anything. I'm just saying." → "I heard it from
  three different people, so it's basically peer-reviewed."
- PHI Sorter Set 3 title: "De-Identification Edge Cases" → "The Ones That Argue Back."
- PHI Sorter `s1-hospital-address` chart note: "Facility address — printed on all forms" →
  "Facility address. Also on the pizza menu taped to the break room fridge."
- PHI Sorter Marcus reaction: "Dude. You're a sorting machine. A HIPAA-potamus." → "Dude. You're a
  sorting machine." **← the one cut the user pushed back on ("could be funny depending on the
  thing"); don't treat the pun ban as settled for this line.**
- PHI Sorter Set 1 takeaway: → `RILEY: "Identifier. Plus a health connection. That's it. That's
  the whole test."`
- Breach Triage takeaway: → `PRIYA: "Ransomware. Presumed breach. Prove otherwise, or notify."
  [beat] "Encrypted, key's clean? Not unsecured. Not our problem."`

## Structural note *(not implemented, not a line-level fix)*

Every title-only NPC ("Records Clerk," "Security Analyst," "Chief Compliance Officer," "Vendor
Requesting Access," "Frantic Family Member," "Exhausted Employee") is a personality gap that a
name alone mostly closes — every scene rated GOOD in `DRY_MOMENTS_INVENTORY.md` belongs to a
named character (Nate the Lawyer, Fax Machine Freddy, Chatty Cathy, Boss Man Brad, Priya). Cheap,
high-leverage, but deliberately held out of this pass as its own decision.
