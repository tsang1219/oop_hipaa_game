# Dry Moments Inventory — where the writing needs joy

_Companion to `OOP_HUMOR_CATALOG.md` and `OOP_HUMOR_PLAYBOOK.md`. Those files answer "how do we
make PrivacyQuest funny in Nikhil's register without breaking voice rules." This file answers
"where, specifically." A 6-way parallel content audit read every dialogue scene, educational
item, patient story, ambient line, minigame string, and BreachDefense UI copy in the shipped
game and rated each one DRY / FLAT / OK / GOOD against Commandment 5 ("boring is a bug") and the
Playbook's 7 sanctioned devices. Doc-only — nothing in this file has been changed in-game._

**How to use this:** Section 1 is the 20-minute version — eight systemic patterns that, fixed
once each, resolve dozens of individual dry spots. Section 2 is the ranked top-15 if you only
fix individual lines. Section 3 is the full room-by-room inventory (current text → encounter →
rating → direction) for when you sit down to actually rewrite. Section 4 is the "don't touch
this" list — what's already funny, so a rewrite pass doesn't accidentally flatten it.

The 7 devices referenced throughout (full detail in `OOP_HUMOR_PLAYBOOK.md`):
**1** found-artifact-as-punchline · **2** weird-rule deadpan recitation · **3** absurd
literalization · **4** self-implicating cautionary tale · **5** botched analogy · **6**
data-as-indictment · **7** verdict compression. Directions below cite these by number, or cite
a Commandment (4 = give the NPC a person, 8 = feedback should scale with the moment).

---

## 1. Eight systemic patterns (fix once, clear dozens of spots)

### A. The `"Correct!" / "Incorrect."` feedback template — the single biggest fix in the game
Every quiz-style choice across **all six content rooms** (Tutorial, Reception, ER, Lab, Records,
IT Office, Break Room) opens wrong/right feedback with the same three interchangeable strings —
`Correct!`, `Incorrect.`, `Wrong!`, `Insufficient.`, `Partial credit.` — then restates the rule
in expository prose. It reads as one quiz-engine string wearing fifty different scenarios. The
proof it's fixable cheaply: scenes in the *same file* that skip the template
(`concerned_husband`'s "Don't put the cart before the horse.", `boss_man_brad`'s "This is a
trap.", `fax_machine_freddy`'s "Career suicide move.") are rated GOOD below. **Fix once, applies
everywhere:** replace the opener with a one-word in-character reaction (Device 7, verdict
compression) and move any multi-clause rule text to a separate citation-card element instead of
folding it into the "spoken" feedback. Worst offenders: `gary_gossip` (Break Room), `scene1`–`scene5`
(Tutorial), `final_boss_2` (a numbered checklist recited by the Chief Compliance Officer at the
game's emotional climax).

### B. "Observation" scenes tell, don't show — the found-artifact device sits unused on top of it
Every ambient "Observation"-type interaction zone narrates a violation from outside instead of
presenting the artifact's actual diegetic content: `signin_violation`, `phone_privacy`
(Reception) · `whiteboard_phi`, `unlocked_workstation`, `sample_phi`, `exposed_results` (ER/Lab)
· `unlocked_files`, `proper_disposal`, `password_sharing`, `vendor_baa` (Records/IT) ·
`intervene_gossip`, `phone_security` (Break Room). Ten scenes, one fix pattern: each is a
physical object already sitting in the room (a whiteboard, a sticky note, a phone, a trash can)
— Device 1 wants the object's actual defaced/annotated content shown, not a sentence describing
that a violation exists. `whiteboard_phi` is literally the Playbook's own worked example for
this device and the shipped text still doesn't use it.

### C. Hub-NPC intros announce the quiz mechanic out loud
`records_access` ("Quick quiz: how long does HIPAA give us...") and `security_training` ("Fun
fact... What's the #1 thing staff can do...") both open their room with the teaching mechanism
spoken aloud — a direct Commandment 3 violation ("teach through situations, not text") sitting in
the very first line of two different rooms.

### D. Connector hallways are dead comedic real estate — and the fix already exists in the same file
Two parallel content systems cover the 5 hallway connectors, and both are dry: the
`hallwayContent.ts` bulletin-board copy (15 entries, 5 hallways × 3 story acts) and the
`roomData.json` `hallway*_tip` educational-item posters (5 entries, one per hallway). All 20 read
as straight compliance-bulletin or textbook-fact prose with zero diegetic texture, despite every
hallway having an unused prop sitting next to the poster (water cooler, filing cart, cable
trays). The proof the fix is cheap: **`supply_closet`**, the sixth connector room, is rated GOOD
below and is arguably the best-written room in the game — mystery, fragments, an unexplained cat
— using zero jokes. Apply that texture to the other five.

### E. Tutorial/onboarding copy reads like a manual, in both games
`TutorialModal`'s intro (a literal WASD/SPACE key-binding list — the single most-seen string in
the game, since it's every player's first modal), `OnboardingOverlay`'s WELCOME step ("Pick a
tower, place it on the grid, and stop the cyber threats" — indistinguishable from any unbranded
TD tutorial), and the Tutorial room's own send-off line (`scene5`: "Thanks for helping me
understand HIPAA better!" — the mentor NPC announcing that a tutorial just happened) are the
three driest onboarding beats in the project, confirming Commandment 8's prediction that
onboarding copy is where "reads like a manual" hides by default.

### F. BreachDefense's flavor text is generic tower-defense, not HIPAA Security Rule
`TOWERS`/`THREATS` descriptions ("Filters network traffic. Slows and damages external attacks.")
and several `WAVES` intros (esp. wave 8 "Defense in Depth," wave 10 "The Final Breach") could
ship in any unbranded cyber-TD game. Contrast with the RPG-side minigames (`sorterData.ts`,
`triageData.ts`, `phi18.ts`), which are tightly targeted to real HIPAA mechanics and mostly rated
GOOD — the disconnect is specific to the tower-defense layer, and it's the one place the two
games' writing quality visibly diverges.

### G. Emotional peaks don't scale up — Commandment 8 inverted at every "boss" moment
`final_boss_2` recites a 4-point legal checklist through the Chief Compliance Officer's mouth;
`final_boss_3` (closing scenario of the entire Records arc) reads the same paragraph-length as a
routine wrong-trash-can scene; BreachDefense's Wave 10 "The Final Breach" gets the single most
generic line in the whole wave set ("Everything you've learned matters now."); `EncounterDebrief`
shows the same two static takeaway sentences after every encounter regardless of how close the
fight was. Four separate climaxes, one shared bug: the writing doesn't get *bigger* when the
moment does.

### H. Named, quirky characters land; title-only characters don't — the fix is already proven in-house
Every scene rated GOOD with a human NPC has a name and one specific trait (Nate the Lawyer, Fax
Machine Freddy, Chatty Cathy, Boss Man Brad, Priya the privacy officer). Every DRY/FLAT NPC scene
is a title standing in for a person ("Records Clerk," "Security Analyst," "Chief Compliance
Officer," "Vendor Requesting Access," "Frantic Family Member," "Exhausted Employee"). This isn't
a joke-writing gap, it's a naming gap — Commandment 4 personhood correlates almost perfectly with
whether the character has a name at all.

---

## 2. Top 15 — priority order if you're fixing lines one at a time

1. **The `"Correct!"/"Incorrect."` feedback template, game-wide** (Pattern A) — highest-leverage single fix in the project.
2. **The 10 "Observation" scenes across all 6 rooms** (Pattern B) — one fix pattern (show the artifact, don't narrate it) resolves all ten.
3. **`hallwayContent.ts`'s 15 bulletin entries + the 5 `hallway*_tip` posters** (Pattern D) — `supply_closet` in the same content layer proves this is cheap.
4. **`TutorialModal` intro modal** — the first thing every player reads is a key-binding manual.
5. **`hipaa_brochure` (Hospital Lobby)** — the very first educational content in the entire game, currently pure narration with no artifact texture.
6. **`OnboardingOverlay` WELCOME step (BreachDefense)** — generic TD tutorial copy on the first screen of the second game.
7. **Nurse Nina, `scene1`–`scene5`** — the player's first and most-repeated NPC has zero personality across five consecutive scenes.
8. **`final_boss_2` + `final_boss_3`** — the Records arc's climax reads the same size as its routine scenes; the checklist is spoken dialogue when it should be a citation card.
9. **BreachDefense Wave 10 "The Final Breach"** — the TD game's climactic wave gets its most generic, least hospital-specific line.
10. **`EncounterDebrief`'s static `HIPAA_TAKEAWAYS`** — identical two sentences after every encounter, win or lose, with an editorializing tail-clause the house style bans.
11. **`security_safeguards` whiteboard (IT Office)** — the one educational item in its room with zero punchline, sitting beside two posters (`minimum_necessary_manual`, `hipaa_penalties`) that already nail the tone.
12. **`records_access` / `security_training` openers** (Pattern C) — both hub-room intros announce the quiz mechanic out loud.
13. **`whiteboard_phi` (ER)** — the Playbook's own worked Device-3 example object, still unused in the shipped scene.
14. **`gary_gossip` feedback (Break Room)** — the most sterile quiz-template text in a room that otherwise proves better is achievable (`chatty_cathy`, `boss_man_brad`).
15. **`compliance_officer`'s only idle line** — the one NPC whose job makes Device 2 (weird-rule deadpan) free, currently spending it on generic burnout ("The week is never over.").

---

## 3. Full inventory by room / surface

### Hospital Lobby & Tutorial (Nurse Nina)

#### `hospital_entrance` — room framing
- Encounter: room banner on entering the very first room of the game.
- Current: description "The welcoming lobby of Valley General Hospital. Sunlight spills through the glass doors. Your first day starts here." · `config.introText` "Deep breath. First day. You've got this."
- Dryness: **GOOD** — concrete image, terse encouraging cadence. No action needed.

#### `hipaa_brochure` — lobby educational item
- Encounter: the first piece of educational content in the entire game, an item icon in the lobby.
- Current: "HIPAA — the Health Insurance Portability and Accountability Act of 1996 — isn't just about privacy. It has five titles, but Title II is the one that matters to you... Two key rules: the Privacy Rule... and the Security Rule... Every person in this hospital — from the CEO to the janitor — has a role in keeping patient data safe."
- Dryness: **DRY**
- Direction: [Device 1] It's already framed as a physical brochure — give it a diegetic mark, keep every fact intact. *A coffee ring on the corner; in pen at the bottom, "this means you too, Gary." Nobody explains who Gary is.* Highest-leverage single item in the game given its position (see Top 15 #5).

#### `scene1` — Nurse Nina, EHR access request
- Encounter: first scripted dialogue of the game.
- Current: "Hi there! I need access to patient data to prepare for rounds tomorrow morning. Can you help me get into the EHR system?" · correct feedback: "Correct! Fun fact: HIPAA's Minimum Necessary rule actually has a treatment exception..." · wrong feedback: "Incorrect. Even though HIPAA's Minimum Necessary rule doesn't apply to treatment disclosures, your facility's access controls should still limit EHR access..."
- Dryness: **DRY**
- Direction: [Commandment 4] Nina has zero texture for the player's first NPC. Give her a specific circumstance: "Third time this rotation I've had to ask for this. Rounds are in ten minutes, so — EHR access?" [Device 2] Drop the "Fun fact:" narrator-wink on the correct feedback: "Treatment access doesn't wait on Minimum Necessary. Role-based access still does the limiting, though."

#### `scene2` — Nurse Nina, family member phone call
- Encounter: worried family member calls about a patient's condition.
- Current correct feedback: "Under HIPAA, you can share PHI with family members involved in care if: (1) the patient agrees, (2) the patient had the chance to object and didn't, or (3) you use professional judgment that it's in their best interest."
- Dryness: **DRY**
- Direction: [Device 2] Same facts, fragments instead of a numbered clause: "Said she's family. Doesn't mean I hand it over. Patient agreed, or didn't object, or it's obviously the right call. That's the whole test."

#### `scene3` — Nurse Nina, quality-improvement chart request
- Encounter: a colleague wants charts for a QI study.
- Current correct feedback: "Quality improvement falls under 'healthcare operations' — one of HIPAA's TPO exceptions, so patient authorization isn't needed. But you MUST apply the Minimum Necessary Rule..."
- Dryness: **DRY**
- Direction: [Device 2] "Quality improvement's an operations thing. No sign-off needed. Doesn't mean the whole chart, though." Facts unchanged, register changed; drop the acronym-drop and the all-caps "MUST."

#### `scene4` — Nurse Nina, patient wants their own records
- Encounter: a patient asks to see their medical record.
- Current wrong feedback: "Incorrect. Patients have a fundamental right under HIPAA to access their own medical records. This is one of the core individual rights protected by the Privacy Rule."
- Dryness: **DRY**
- Direction: [Device 7] "No — it's their record. Thirty days, one extension, that's the whole clock." (Longer-term note: this scenario — a patient blocked from their own chart — is actually the game's best setup for Device 3 absurd-literalization if it's ever rebuilt as something the player *sees* rather than is told about.)

#### `scene5` — Nurse Nina, researcher requests patient data (tutorial close)
- Encounter: closes Nina's arc.
- Current: "Thanks for helping me understand HIPAA better! One last scenario..." · correct feedback: "Correct! Research use of PHI requires either patient authorization or an Institutional Review Board (IRB) waiver under the Privacy Rule. Well done!"
- Dryness: **FLAT**
- Direction: [Commandment 4 / Pattern E] "Thanks for helping me understand HIPAA better!" is the NPC announcing the lesson's theme — cut it for a blunt, human sign-off: "IRB or the patient signs off. Either. Not vibes."

---

### Reception Room

#### `reception` — room description / patientStory
- Current description: "Where privacy begins. The first touch. The moment someone decides to trust you." · introText "Your first day. Take your time. Watch. Listen. Learn."
- Dryness: **GOOD** — no action needed.
- `patientStory` (Elena's Story): "Because you ensured that sign-in sheet was private, Elena felt safe seeking treatment for addiction. Her employer in the waiting room never knew why she was there. She got help. She's recovering."
- Dryness: **FLAT** — the close ("She got help. She's recovering.") is generic uplift-poster language after a specific setup. Direction: swap for one concrete detail, e.g. "Her employer in the waiting room never found out. She's back at her desk job now, on her own schedule." No regulatory content involved.

#### `riley_scene1` — Receptionist Riley, employer calls about appointment
- Current: "I'm on the phone with a patient's employer who's asking about their appointment time. They need to verify the employee was here. Should I confirm?"
- Dryness: **OK** — already mid-scene, first-person. Minor tune-up only (a physical beat, e.g. hand over the receiver).

#### `signin_violation` — Observation, sign-in sheet [Pattern B]
- Current: "You notice the sign-in sheet at reception shows the names of all patients who checked in today, plus their appointment times and reasons for visit. This is visible to anyone walking by."
- Dryness: **DRY**
- Direction: [Device 1/3] Put an absurd-but-true entry on the sheet itself instead of narrating the concept: *Reason-for-visit column, in full view: "follow-up on the knee — no, the other one — no, THAT one."*

#### `phone_privacy` — Observation, Riley's loud phone call [Pattern B]
- Current: "You hear Riley discussing a patient's test results over the phone at the front desk, speaking loudly enough that others in the waiting room can hear specific medical details."
- Dryness: **DRY**
- Direction: [Device 3] Replace the gloss with one concrete overheard fragment: *"—and NO, the cholesterol wasn't that bad, Frank, calm down—"* trailing off as the player approaches.

#### `concerned_husband` — Concerned Husband
- Current: "Two minutes of checking could prevent a lifetime of trauma." / "Don't put the cart before the horse." / "You just violated privacy by assuming authorization."
- Dryness: **GOOD** — genuine edge, real stakes (DV framing). Skip.

#### `celebrity_crisis` — Hospital Administrator
- Current: "Code VIP! ... This is huge for the hospital's reputation. Handle it." / "WRONG. ... Sharing medical details with PR is a fireable offense and a lawsuit waiting to happen."
- Dryness: **GOOD** — distinct hustling voice, real verdict. Skip.

#### `npp_notice` — Observation, Notice of Privacy Practices poster
- Current: "It's dense, but it's one of the most important documents in the building..." · feedback: "The Notice of Privacy Practices must explain: how PHI may be used and disclosed, patient rights (access, amendment, complaints), the facility's duties to protect PHI, and who to contact with questions."
- Dryness: **DRY**
- Direction: [Device 1] Best home for this device in the room — it's already a poster. *Taped below it, different handwriting: "Yes, someone read this. It's me. I'm someone."* Reflow the feedback's clause-list into two short sentences; keep all content.

#### `patient_rights_poster` — educational item ("Patient Rights 101")
- Current: "Under HIPAA, patients aren't just bodies in beds—they have actual power. The Big 5 Patient Rights: (1)...(5)... Bottom line: Patients own their health data. We're just the janitors managing it."
- Dryness: **OK** — the "janitors" line already lands; a numbered fact-list is a legitimate format for this authored surface.
- Direction: [Device 7] Cut "they have actual power" (steals its own thunder) and let the janitors line close cold: "Patients own their health data. We just manage it."

---

### ER Room

#### `er` — room description / patientStory
- Current: subtitle "The Edge Cases"; description "Where rules meet urgency. The hardest judgment calls happen here."; introText "Chaos. Everyone needs something. Now."
- Dryness: **GOOD** — no action needed.
- `patientStory` (Marcus's Story): "...Marcus's mental health crisis stayed between him and his care team. He got help. He's still here." — **GOOD**, understatement already working.

#### `dr_martinez_scene1` — Rushed ER Doctor
- Current: "I'm discussing a patient's case with a colleague in the hallway. We're keeping our voices down, so it should be okay, right?" · correct feedback: "HHS says healthcare providers CAN have conversations in hallways and at nurse stations — but you must take reasonable precautions: lower your voice, avoid full patient names when possible, and move away from bystanders."
- Dryness: **DRY** — roomData labels her "Rushed" but nothing in the line is rushed; the feedback paraphrases an HHS bulletin.
- Direction: [Device 2 + Commandment 4] Fragments, delivered mid-motion: "Lower the voice. Watch who's near. Not a soundproof booth — just don't be an idiot about it." *[stamps a chart, doesn't look up]*

#### `whiteboard_phi` — Patient Status Board [Pattern B, Top-15 #13]
- Current: "The ER status board shows patient names, room numbers, and chief complaints ('chest pain,' 'broken arm'). It's visible to anyone walking through the ER." · wrong feedback: "HIPAA doesn't provide an exception for convenience."
- Dryness: **DRY** — pure narrator description; this is the Playbook's own worked Device-3 example and still unused.
- Direction: [Device 3] Show a half-attempted fix instead of describing the problem: *"Room 4 — covered by a Post-it. The Post-it is on the floor."*

#### `unlocked_workstation` — Computer Left Logged In [Pattern B]
- Current: "A computer workstation is left unlocked with a patient's full medical record displayed on screen. The staff member stepped away 10 minutes ago and hasn't returned." · wrong feedback: "Even in restricted areas, unattended workstations displaying PHI violate HIPAA."
- Dryness: **DRY**
- Direction: [Device 1] *"Second tab, still loading: 'how many vacation days do I have left.' Nobody's touched the mouse in ten minutes."*

#### `police_records` — Police Officer
- Current: "I'm investigating a domestic assault. The victim is in your ER right now. I need to see their medical records immediately—this is an active investigation and time is critical." · feedback: "'Active investigation' isn't a magic phrase."
- Dryness: **FLAT** — real tension, no personality beyond urgency.
- Direction: [Commandment 4] Tired-procedural tic instead of pure urgency — he's asked this before: "Yeah, yeah — court order, or consent, or I wait. I know the list. Was worth a shot."

#### `family_pressure` — Frantic Family Member
- Current: "Please, my mother was just brought in by ambulance. Nobody will tell me anything! Is she okay? What happened? I'm her daughter—I have a right to know!" · feedback: "Even for worried family members, verify the patient's wishes first."
- Dryness: **FLAT** — real emotion, no specific human detail.
- Direction: [Commandment 4] One concrete detail instead of generic panic: "She takes her blood pressure pill at nine. Nobody even asked me that."

#### `emergency_exceptions` — educational item ("When You CAN Share PHI")
- Current: "HIPAA isn't trying to STOP healthcare—it just wants you to be thoughtful. You can share PHI without patient authorization for: Treatment, Payment, Operations (TPO - The Holy Trinity)... The Catch: Even when permitted, still use MINIMUM NECESSARY."
- Dryness: **OK** — already has voice ("The Holy Trinity," "The Catch"). Minor tune-up: the identifier enumeration is flat mid-prose; one dry aside after "Deceased Persons" ("you'd think this one would need less paperwork. It doesn't.") would round it out.

---

### Lab Room

#### `lab` — room description / patientStory
- Current: subtitle "The Source"; description "Where data is born. Test results, diagnoses, the raw material of PHI."; introText "Quiet here. But look closer. Not everything is where it should be."
- Dryness: description **FLAT** (functional metaphor, no texture) / introText **GOOD** (real atmosphere). Minor tune-up only on the description.
- `patientStory` (David's Story): "...His story. His timing." — **GOOD**.

#### `lab_tech_scene` — Lab Technician
- Current: "Hey, new person! Welcome to the lab. Quick question—do you know what makes something PHI versus just regular health information?" · correct feedback: "PHI = Health Information + Identifiers. The magic formula."
- Dryness: **OK** — best-voiced NPC opener in the file; casual warmth already present. Direction: carry that same casual energy into the wrong-answer feedbacks, which currently drop into textbook phrasing at the end.

#### `research_request` — Curious Researcher
- Current: "I'm conducting a study on treatment outcomes. I just need to pull some patient data from the last year. I'm faculty here, so I should have access, right?" · feedback: "Research use of PHI requires either: (1) Patient authorization, (2) IRB waiver, or (3) Use of properly de-identified data."
- Dryness: **DRY** — decent entitlement hook, underplayed; feedback is a numbered-list memo.
- Direction: [Device 5, botched analogy] Let her reach for a shortcut and lose the thread: "It's basically like — my badge already gets me into the building, so—" *[trails off]*. Correct-answer feedback stays a straight citation.

#### `third_party_access` — Sample Courier
- Current: "I'm here to pick up samples for the reference lab. Can you also give me a printout of the patient info so they know whose samples these are?" · feedback: "Third-party couriers and labs need only the minimum necessary information to do their job."
- Dryness: **DRY** — functional, feedback nearly duplicates `sample_phi`'s language.
- Direction: [Commandment 4] Make the ask mundane rather than sinister — funnier and more honest: "No worries, most places just print the whole sheet, saves me asking twice."

#### `sample_phi` — Sample Labels [Pattern B]
- Current: "You notice sample containers with patient labels sitting on an open counter near the hallway. The labels show full patient names, dates of birth, and the type of test being run (HIV screening, pregnancy test, etc.)."
- Dryness: **DRY**
- Direction: [Device 3] One physical detail instead of the enumerated list: *"Someone's coffee cup is sitting on top of the rack. The ring stain lines up exactly with a name."*

#### `exposed_results` — Results Left on Counter [Pattern B]
- Current: "Test results are sitting on the counter, clearly visible. You can see patient names, diagnoses, and lab values. The lab tech stepped away about 5 minutes ago."
- Dryness: **DRY** — near-duplicate structure of `sample_phi`.
- Direction: [Device 1] *"Sticky note on top, in pen: 'back in 5 :)' The smiley face is doing a lot of work."*

#### `phi_identifiers` — educational item ("The 18 PHI Identifiers")
- Current: "Welcome to healthcare, where Protected Health Information (PHI) is more valuable than Bitcoin and twice as regulated... Treat it like your own embarrassing medical history."
- Dryness: **GOOD** — skip.

---

### Records Room

#### `records_room` — room description / patientStory / posters
- Current: description "The long memory. Everything lives here. Access, amendments, the right to your own story." · subtitle "The Archive" · introText "The archive. Stories upon stories. Someone here needs you to listen."
- Dryness: **GOOD**.
- `patientStory` (Mrs. Chen's Story) — **GOOD**.
- `minimum_necessary_manual` poster: "Healthcare is gossipy, but HIPAA has opinions about your oversharing habits... If it's want? Close the chart. Walk away. Get a hobby." — **GOOD**, model this tone elsewhere.
- `hipaa_penalties` poster: "Think HIPAA violations are just a slap on the wrist? Think again... individuals can be personally prosecuted—your employer's insurance won't save you." — **GOOD**, Device 6 already well-executed.

#### `records_access` — Records Clerk [Pattern C]
- Current: "Welcome to Medical Records! This is where patient stories live. Quick quiz: how long does HIPAA give us to respond when a patient requests their own records?"
- Dryness: **DRY** — quiz mechanism spoken aloud; clerk is a title, not a person.
- Direction: [Commandment 4 + Device 2] Name her, have her state the rule mid-task instead of posing a question: "JOANNA *(stamping a folder, not looking up)*: Thirty days. Extendable once. There's a form for the extension."

#### `patient_access_rights` — Patient Requesting File
- Current: "Hi, I need copies of all my medical records from the past two years. My new doctor wants them, and I'd also like to review everything myself."
- Dryness: **FLAT** — the ask itself is specific and fine; the feedback ("Correct! Patients have a fundamental right...") is the dry part.
- Direction: One added human detail (why the new doctor) rather than tightening the rule-recitation further.

#### `legal_request` — Nate the Lawyer
- Current: "I have a subpoena for patient records in a malpractice case. I need these records TODAY... Don't make me get a judge involved."
- Dryness: **GOOD** — named, real pressure tactic, distinct voice. Skip.

#### `unlocked_files` — Unlocked File Cabinet [Pattern B]
- Current: "The file cabinet containing patient medical records is unlocked and unattended... The room door is also propped open."
- Dryness: **DRY**
- Direction: [Device 3] *"The door's propped open with a fire extinguisher. A binder stamped 'PHI — DO NOT REMOVE FROM ROOM' is wedged under a drawer that won't quite close."*

#### `proper_disposal` — Document Shredder [Pattern B]
- Current: "You find patient documents in the regular trash can instead of the designated shredder bin. The documents contain names, diagnoses, and Social Security numbers."
- Dryness: **DRY**
- Direction: [Device 1] *Sticky note taped to the shredder: "OUT OF TONER — USE OTHER BIN (JUST THIS ONCE)."* Nobody comments.

#### `access_audit` — Audit Log Screen
- Current: "You notice your coworker accessed a patient's chart 15 times yesterday, but that patient isn't on their assigned floor or care team."
- Dryness: **FLAT** — good premise, narrated instead of shown.
- Direction: [Device 6] Show the actual log lines: *"J.MARTINEZ — CHART #4471 — 11:58 PM, 12:14 AM, 12:31 AM... Patient: MARTINEZ, D."* Same last name, never spoken aloud.

#### `final_boss_1` — Chief Compliance Officer (colleague snooping ex-spouse's chart)
- Current: "I've been watching your performance. Now for the REAL test... They beg you not to report it because they'll lose their job. What's your move?"
- Dryness: **FLAT** — strong scenario, title-only CCO, paragraph-length feedback.
- Direction: [Commandment 4 + Device 7] Give the CCO one specific trait; compress the reaction. **CCO:** "Good." *(beat; citation card slides in separately with the reporting-duty details.)*

#### `final_boss_2` — Chief Compliance Officer (aggressive attorney) [Top-15 #8]
- Current correct feedback: "You need: (1) Written authorization from the patient, OR (2) A valid court order/subpoena..., (3) Follow minimum necessary standards, (4) Document everything."
- Dryness: **DRY** — a numbered checklist spoken as dialogue at the finale, exactly where Commandment 8 says feedback should scale up.
- Direction: Move the checklist off the CCO's mouth onto a citation card (legal per the Playbook's channel table); compress her spoken line. **CCO:** "Don't let them rush you." *(citation card: the 4-point checklist, straight.)*

#### `final_boss_3` — Chief Compliance Officer (CEO snooping, arc finale) [Top-15 #8]
- Current correct feedback: "Absolutely correct! HIPAA doesn't care about org charts. The CEO has no special rights to snoop in patient records..."
- Dryness: **FLAT** — this is the emotional peak of the entire Records arc and reads the same size as a routine wrong-trash-can scene.
- Direction: [Commandment 8 + Device 7] Shorter, harder-hitting: **CCO:** *(long pause)* "No org chart outranks this. Ever." Cut the trailing restatement.

---

### IT Office

#### `it_office` — room description / patientStory / whiteboard
- Current: description "The invisible infrastructure. Encryption, access controls, breach detection." · subtitle "The Vault" · introText "The vault. Quiet. But threats don't always announce themselves."
- Dryness: description **FLAT** (feature list, not atmosphere — the Records room's description does this better) / subtitle+introText **OK**.
- Direction: one clause of texture, e.g. "The invisible infrastructure. Nobody notices it until it fails."
- `patientStory` (50,000 Patients Protected) — **GOOD**.

#### `security_training` — Security Analyst [Pattern C]
- Current: "Welcome to IT Security. Fun fact: most breaches aren't from hackers—they're from employees. What's the #1 thing staff can do to prevent breaches?"
- Dryness: **DRY** — quiz framing spoken aloud; analyst is a title.
- Direction: [Commandment 4 + Device 6] Put the real stat on a wall poster behind a distracted analyst instead of a spoken hook: *Poster: "68% of breaches start inside the building."* Analyst, mid-phone-call, doesn't gesture at it.

#### `vendor_access` — Vendor Requesting Access
- Current: "Hi, I'm from MedTech Solutions... Can you log me in with your credentials real quick?"
- Dryness: **OK** — "real quick" already carries social-engineering texture.
- Direction: One specific reason for urgency: "I've got three more sites today, can you just—yeah, just log me in, I'll be two minutes."

#### `convenience_vs_security` — Employee Needs Workaround
- Current: "I have to change it every 90 days and remember 47 different systems. Can't you just give me a master password that works everywhere?"
- Dryness: **OK** — the "47 different systems" detail already feels like a real complaint. No fix needed.

#### `password_sharing` — Password Sticky Note [Pattern B]
- Current: "You find a sticky note on a desk with a login username and password written on it."
- Dryness: **DRY** — literally a sticky note and the text never shows what's written on it.
- Direction: [Device 1] *Sticky note, taped to the monitor: "jsmith / Passw0rd1! (don't tell IT)."*

#### `breach_response` — Breach Response Playbook
- Current: "You're reading the Breach Response Playbook. It outlines what happens when PHI is improperly accessed or disclosed. Speed matters—but so does process."
- Dryness: **FLAT** — generic setup, but the correct-choice feedback already lands well: "The cover-up is always worse than the breach."
- Direction: [Device 4] One margin annotation implying a self-implicating tale without a spoken confession: *"learned this one the hard way — M."* Keep the existing punch line.

#### `fax_machine_freddy` — Fax Machine (internal monologue)
- Current: "Oh no. Oh no no no. You just faxed discharge paperwork... to 555-0123 instead of 555-0132. That's... that's Dr. Peterson's rival practice. They're going to see EVERYTHING."
- Dryness: **GOOD** — best-voiced scene in the Records/IT slice. Skip.

#### `vendor_baa` — Unsigned Vendor Agreements [Pattern B]
- Current: "You notice a stack of unsigned vendor agreements on the IT manager's desk. The top one is from CloudMed Analytics... The agreement section labeled 'Business Associate Agreement' is blank."
- Dryness: **DRY** — reads like a legal brief.
- Direction: [Device 1] *Sticky note clipped to the blank BAA page: "Legal — still waiting. This is reminder #4."*

#### `security_safeguards` — whiteboard ("Technical Safeguards") [Top-15 #11]
- Current: "HIPAA's Security Rule demands three types of safeguards... The Three A's: Authentication, Authorization, and Audit... Fun detail: encryption is technically 'addressable'... Strong passwords, automatic logoffs, and encryption are the walls that keep the vault secure."
- Dryness: **DRY** — the only educational item in this room with zero payoff; "Fun detail" is asserted but nothing that follows is fun. Stands out precisely because `minimum_necessary_manual` and `hipaa_penalties` (Records room) already prove the format works.
- Direction: [Device 2/6] Close on a specific consequence instead of a dictionary clarification: "Addressable just means you have to explain, in writing, why you didn't encrypt something. Everyone encrypts."

---

### Break Room

#### `break_room` — room description / patientStory / poster
- Current: description "Where people are just people. Gossip, venting, casual lapses. The hardest place to stay vigilant." · subtitle "The Human Factor" · `stanceDescription` "You are the Resister. The threat is your own comfort."
- Dryness: **GOOD**.
- `patientStory` (James's Story): "...James's coworker... never learned about his cancer diagnosis. He told people when he was ready. His news. His way." — **GOOD**; correctly keeps the patient dignified, never the joke.
- `verbal_disclosure` poster ("The Art of the HIPAA Shutdown"): "...Sometimes your job is to be the bouncer at Club Medical Records... The Script: 'I'm unable to confirm or deny any patient information without proper authorization.'" — **GOOD**, best-written educational item in the game; model for the hallway posters.

#### `gary_gossip` — Gossipy Gary [Top-15 #14]
- Current: "Hey, did you hear about the celebrity who came into the ER last night? I saw their chart. Want to know what they were here for?" · feedback: "Correct!" / "Incorrect." / "Insufficient."
- Dryness: **DRY** — driest feedback template in the game, in the same room as scenes that prove better is achievable.
- Direction: [Commandment 4 + Device 2] "Report it. HR has a form. There is, tragically, a form for the form."

#### `chatty_cathy` — Chatty Cathy
- Current: includes "The cafeteria has ears, and one of them might be that patient's lawyer" and "your sad desk salad."
- Dryness: **GOOD** — skip.

#### `fatigue_lapse` — Exhausted Employee
- Current: "*yawning* I've been here 14 hours. I was charting in patient records and I think I might have entered notes in the wrong patient's file. But I'm too tired to check..." · feedback: "Correct! Wrong-patient documentation isn't just a HIPAA issue—it's a patient safety issue... Then go home and sleep!"
- Dryness: **FLAT** — close but the character is unnamed and never confesses a specific.
- Direction: [Device 4] Name them; let the confession trail into a fragment: "I typed for ten minutes before I noticed. It said 'his' knee. She doesn't have a knee. She has — never mind."

#### `intervene_gossip` — Observation, overheard conversation [Pattern B]
- Current: "You overhear two coworkers at the next table discussing a patient by name, including their diagnosis and family drama. They're speaking at normal volume."
- Dryness: **DRY** — tells the violation instead of showing an actual overheard line.
- Direction: [Device 3] *"...and then she said the biopsy came back and I was like NO WAY because Gary's already planning the retirement party—"*

#### `phone_security` — Observation, unlocked phone [Pattern B]
- Current: "Someone left their work phone unlocked on the table with the patient scheduling app open. You can see today's appointments including patient names and reasons for visit."
- Dryness: **DRY**
- Direction: [Device 1] A flat, deadpan notification banner on the same unlocked screen: *"Mom Squad (12): are we still doing Sunday"* — right next to the open PHI, nobody comments.

#### `boss_man_brad` — HR Director
- Current: "Third time this month. Can you pull her records and tell me what's actually going on? I need to know if this is legit or if she's just hungover." · feedback: "Now Jessica can sue both you AND Brad. Congrats!" / "This is a trap."
- Dryness: **GOOD** — specific, real edge, verdict compression already present. Minor note: choice-4 feedback reverts to lecture tone but low priority.

#### `social_media_slip` — Coworker with Phone
- Current: "Check out this selfie I took during the code blue!... my followers love hospital drama. It's fine, right?"
- Dryness: **OK** — oblivious-influencer voice already present; "Save the selfies for the parking lot" lands. Minor note: choice-2 feedback is a list-narration text dump, low priority to trim.

---

### Hub & Connector Hallways [Pattern D]

#### `hallway_reception_break`
- Description: "A quiet corridor connecting Reception to the Break Room. A water cooler hums softly near the wall." — **OK**.
- Educational item `hallway1_phi_tip`: "PHI includes 18 types of identifiers... If it can identify a patient AND relates to their health, treatment, or payment — it's PHI." — **DRY**. Direction: [Device 1/6] "DAYS SINCE LAST HALLWAY HIPAA VIOLATION: 12" — the 12 crossed out, "0" written under it, dated today.
- `hallwayContent.ts` Act 1 "WELCOME!": "Orientation today at 2pm / Badges required after lobby / Have a great first day!" — **DRY** (Top-15 #3, first bulletin board most players see). Direction: [Device 1] "Badges required after lobby (yes, still you, Kevin)."
- Act 2 "COMPLIANCE NOTICE": "Three audit flags this week / Minimum Necessary applies / even here — every time" — **DRY**. Direction: keep the stat, add a pen edit showing escalation ("Three" crossed out, "Four" written above).
- Act 3 "LOCKDOWN PROTOCOL": "Escort ALL visitors now / No unattended devices / IT is monitoring access" — **DRY**. Direction: [Device 1] taped note, "(this means you too, Kevin)."

#### `hallway_break_lab`
- Description: "A corridor connecting the Break Room to the Laboratory. A biohazard sign marks the approach to the lab wing." — **OK**.
- `hallway2_verbal_tip`: "Most HIPAA breaches aren't hackers — they're conversations... Rule of thumb: if you can be overheard by someone without a need to know, find a private space." — **DRY**. Direction: [Device 1] this hallway hides the door to Supply Closet B — pen annotation under the poster: "...find a private space." / handwriting: "The closet works too. —M".
- Act 1 "STAFF ONLY": "Patient info stays in / patient areas. Public / hallways are public." — **DRY**.
- Act 2 "PRIVACY OFFICER NOTICE": "Patient names overheard / in the break room again / Reminder: walls are thin" — **FLAT**, the "again" hints at recurrence but doesn't cash it in. Direction: "Second time this month. You know who you are. (You don't. That's the problem.)"
- Act 3 "URGENT — CMO ORDER": "All patient records to / secure locations NOW / — Dr. Kim, CMO" — **DRY**.

#### `supply_closet` — hidden room off `hallway_break_lab`
- Current: "A supply closet that is not on the floor map. Somebody sweeps in here, and it is not Facilities." · introText "Mops. Gauze. One chair that shouldn't be here. It is very quiet, except for the purring."
- Dryness: **GOOD** — the model. Best-written room in the audit. Mystery, fragments, unexplained cat, zero jokes told.

#### `hallway_lab_records`
- Description: "A corridor connecting the Laboratory to Medical Records. A filing cart sits against the wall, half-loaded with folders." — **OK**.
- `hallway3_deidentify_tip`: "HIPAA allows sharing health data freely if it's properly de-identified. The Safe Harbor method requires removing all 18 identifiers... De-identified data isn't PHI." — **DRY**. Direction: [Device 3] a folder on the cart with the name blacked out and a sticky note stapled on top: "SAFE HARBOR ✓ — 18/18."
- Act 1 "SPECIMEN SAFETY": "Double-check patient IDs / Wrong patient = wrong tx / Safety starts with you" — **DRY**, generic OSHA-poster boilerplate.
- Act 2 "FAX VERIFICATION": "Lab results: 3rd wrong-number fax this month / Verify every recipient" — **FLAT**, has a real number but no artifact around it, despite the game elsewhere building a whole fax bit (Priya's idle line, the Playbook's Antonio's Pizzeria example). Direction: [Device 1] pin an actual misdirected fax confirmation slip to the board.
- Act 3 "BREACH CONFIRMED": "All outbound comms suspended pending review / IT investigating NOW" — **DRY**.

#### `hallway_records_it`
- Description: "A corridor connecting Medical Records to the IT Office. Bundled cables run along the ceiling toward IT." — **OK**.
- `hallway4_breach_tip`: "When a breach of unsecured PHI affects 500+ individuals, the covered entity must notify HHS, affected individuals, AND prominent media outlets — all within 60 days of discovery..." — **DRY**. Direction: [Device 1/6, the exact crossover the Playbook names as the single most OOP-shaped move] a laminated "60-DAY CLOCK" tracker; "60" crossed out, "59, WE'RE ALREADY BEHIND" written under it.
- Act 1 "ePHI REMINDER": "Passwords: 90-day cycle / Never share credentials / Questions? See IT x4433" — **DRY**.
- Act 2 "SECURITY ALERT": "Suspicious logins found / If you see something — / say something. IT x4433" — **DRY**, borrows the real-world slogan wholesale. Direction: [Device 1] replace with a found ticket stub: "SUSPICIOUS LOGIN — 3:14am — assigned: nobody yet."
- Act 3 "ACTIVE INCIDENT": "Disconnect from network / if instructed by IT / Do NOT call — they know" — **OK**, "Do NOT call — they know" already flickers Device 2.

#### `hallway_it_er`
- Description: "A corridor connecting the IT Office to the Emergency Room. Red emergency lighting glows near the ER entrance." — **OK**, best atmosphere of the plain hallways.
- `hallway5_emergency_tip`: "HIPAA doesn't disappear in emergencies — but it flexes... The key word is 'necessary.'" — **DRY**. Direction: [Device 3] a whiteboard visible through the ER doors, patient names hastily half-erased, one still legible — nobody narrates it.
- Act 1 "ER PROTOCOLS": "Treatment > paperwork / in emergencies — know / your HIPAA exceptions!" — **DRY**, the exclamation point is the exact "PowerPoint slide trying to be upbeat" anti-pattern. Direction: [Device 2] "Emergency exception. Treat first. Paperwork's not going anywhere."
- Act 2 "ER REMINDER": "Cover whiteboards when / family is present / Patient dignity matters" — **DRY**.
- Act 3 "ALL HANDS": "Hospital under attack / Oral orders only until / systems are restored" — **DRY** (appropriately urgent register, no texture).

---

### Ambient & flavor content

#### `characters.ts` — player-select blurbs
Note: this is the 3-entry player-skin selector (You / Alex / Nikhil), not an NPC-bio file — there
is no centralized NPC-bio file in the codebase; NPC personality lives in `idleLines.ts` and
dialogue scenes above.
- "A fresh hire on day one." (You) — **OK**.
- "Lead Gardener, tending to the seeds in our minds." (Alex) — **OK**.
- "Thinkboi aka Brown Brad Pitt." (Nikhil) — **GOOD**.

#### `idleLines.ts` — 26 NPCs' idle lines
- Overall: **GOOD** — the strongest ambient file in the game; verdict compression, found-artifact, and self-implicating asides all land cleanly (e.g. `priya_privacy_officer`'s fax-machine idle line, `selfie_coworker`'s "No faces, no badges, just the latte art. I've learned.").
- `gossiping_coworker` line 1: "I'm not saying anything. I'm just saying." — **FLAT**, generic stock phrase next to its sharper sibling line 2 ("Third floor swears there's a cat..."). Direction: anchor to a specific in-world detail, e.g. "I heard it from three different people, so it's basically peer-reviewed."
- `compliance_officer` (only line) [Top-15 #15]: "The week's not over. The week is never over." — **FLAT**, generic burnout phrasing on the one NPC whose title makes Device 2 free. Direction: "Minimum Necessary. Technically covers the vending machine. Nobody's tested that in court."
- All other entries (riley, aiyana_intake, nervous_patient, chatty_visitor, friend_fishing, tired_employee, hr_director, selfie_coworker, lab_tech, marcus_lab_aide, researcher, courier, records_clerk, security_analyst, dr_martinez, priya_privacy_officer, patient_request, attorney, dr_tovar, vendor, workaround_employee, officer, frantic_family) — **GOOD** or **OK**, no action needed. Minor coverage note: 8 NPCs have only a single idle line vs. 2-3 for others — not a dryness problem, just worth knowing if more coverage is wanted later.

#### `whimsyData.ts` — printer bit, cat gag, Zz Test lines
- **GOOD** across all content (PRINTER_BEATS ×8, PRINTER_AFTER_LINES ×2, CAT_PET_LINES ×5, milestone/ambient/bowl/rota lines, ZZ_LINES ×6). The clearest in-codebase proof the Playbook works as designed — the printer bit executes Device 1+3 almost exactly per the Playbook's own worked example. No notes.

#### `corkboardData.ts` — 6 bulletin notes
- **GOOD** across all six (baby-wall, potluck, shredder-parking, plant-roster, mystery-labs, cpr-class). Violation teach-lines correctly stay in the straight citation-card register; the "fine" lines carry real personality (Roberto's beans, the ficus's grudge). No punch-up needed.

#### `sponsorConfig.ts` — sponsor-demo dialogue
- Both lines and the redemption code ("MINIMUM-NECESSARY") — **GOOD**, stays in Riley's voice rather than ad copy.

---

### Minigames — PHI Sorter, Breach Triage, PHI-18 Codex

#### `sorterData.ts`
- Context cards, station labels, chart flavor fields — mostly **GOOD** (e.g. "Bin 2 is for SHRED, bin 3 is recycling. This matters, Kevin," "The ficus remembers who forgot last time.").
- Set 3 title ("De-Identification Edge Cases") — **FLAT**, reads like a compliance-binder section header against its own livelier body copy. Direction: [Commandment 4] give it the clerk's voice, e.g. "The Ones That Argue Back."
- Item `explanation` fields (the citation-card layer, ~26 instances) — **OK by design**; per house style these are supposed to stay straight. No change.
- `s1-hospital-address` chart note ("Facility address — printed on all forms") — **FLAT**, inert filler even for a non-PHI item. Direction: [Device 1] a stamped note, "ALSO ON THE MENU, APPARENTLY."
- Per-set `takeaways` (6 total) — **DRY**, textbook-paragraph structure repeated across all 3 sets. Direction: [Device 2] deliver as a tired fragment: **RILEY:** "Identifier. Plus a health connection. That's it. That's the whole test."

#### `sorterReactions.ts`
- ~50 reaction lines across 3 NPCs — mostly **GOOD**, voice-differentiated and funny.
- One flagged line — Marcus's strong-band reaction: "Dude. You're a sorting machine. A HIPAA-potamus." — **FLAT/risk**, a groan-pun that crosses into the banned joke-writer-one-liner territory despite the file's internal "slightly punny" convention. Direction: [Device 7] cut the pun, keep the compression: "Dude. You're a sorting machine."
- `SORTER_OPENER_LINES` (3) — **OK**, functional with a little voice.

#### `triageData.ts`
- Context card, rule strip, incident detail/rule fields — mostly **GOOD**, the strongest writing in the audited scope (Priya's "Fast and right — in that order. No wait. Reverse that."; "The car was locked. The laptop was not.").
- `encrypted-laptop` incident detail (pure spec-sheet prose) — **OK**, acceptable given the 2-boring-lines-per-witty-one budget; neighbors carry the humor load.
- Per-set `takeaways` (2 lines) — **DRY**, same textbook-paragraph pattern as `sorterData.ts`. Direction: [Device 2] Priya in fragments: "Ransomware. Presumed breach. Prove otherwise or notify." *[beat]* "Encrypted and the key's clean? Not unsecured. Not our problem."

#### `phi18.ts` — the 18 codex blurbs
- **GOOD** across nearly all 18 — best writing in the audited scope ("A license plate is a name that parks." / "The hospital's own name for you is still a name."). The `other` catch-all entry is plain restatement, which is appropriate for a catch-all — **OK**.

---

### BreachDefense

#### `TutorialModal.tsx` — game-load intro modal [Top-15 #4]
- Current: title "Welcome to HIPAA General"; body: "You're a new employee at HIPAA General Hospital. Explore rooms, talk to staff, and learn how patient privacy really works. \n\n WASD or Arrow Keys — Move / Hold SHIFT — Run / SPACE — Talk to people and interact / SPACE at a door — Go to the next area"; cta "Start exploring →"
- Dryness: **DRY** — the single most-seen string in the game is a key-binding list.
- Direction: [Commandment 4/8] Route the controls through an in-world voice or found artifact — keep every keybind verbatim, change only the frame: *sticky note on a laminated orientation card: "Controls, because apparently nobody reads the handbook: [bindings]. — Facilities"*

#### `OnboardingOverlay.tsx` — first BreachDefense encounter [Top-15 #6]
- WELCOME step: "Defend the hospital network. Pick a tower, place it on the grid, and stop the cyber threats." — **DRY**, generic TD boilerplate, zero HIPAA/hospital connection. Direction: [Commandment 4] extend `NarrativeContextCard`'s established analyst voice (see below) into this step instead of switching to neutral instructional copy.
- SELECT_TOWER / PLACE_TOWER hints ("Pick a defense below" / "Click a glowing cell on the grid") — **OK**, correctly brief UI nudges under time pressure.
- TOWER_PLACED step ("Different towers counter different threats. Check the HINT badges for suggestions each wave.") — **FLAT**, low priority. Direction: one clause anchoring it to the hospital: "same logic as picking the right safeguard for the right risk."

#### `NarrativeContextCard.tsx`
- First-time / replay narrative text — **GOOD**, the best-written moment in the BreachDefense scope; the replay line's self-aware payoff ("makes the real thing more boring, which is the goal") lands without breaking any voice rule.
- Static chrome (header/buttons/citation footnote) — **OK**, correctly plain.

#### `ThreatStrip.tsx`
- HUD chrome — **OK**, pure UI, not a teaching moment.

#### `WaveIntroBanner.tsx` (driven by `WAVES` in `client/src/game/breach-defense/constants.ts`)
- Waves 1, 3, 7, 9 — **GOOD/OK**, concrete and situational.
- Wave 6 "Social Engineering": "'Hi, this is IT—I need your password to fix an issue.' Sounds legitimate, right?" — **FLAT**, the trailing rhetorical question explains the joke instead of letting the quote sit. Direction: [Device 1] cut the question, let the quote stand alone.
- Wave 8 "Defense in Depth": "A coordinated attack is hitting from all angles. No single defense will be enough." — **DRY**, generic TD boilerplate, no hospital specificity — the clearest single example of Pattern F.
- Wave 10 "The Final Breach" [Top-15 #9]: "This is it. A full-scale attack targeting every vulnerability. Everything you've learned matters now." — **DRY** — the climax gets the single most generic line in the set (Pattern G). Direction: [Commandment 8] one concrete, hospital-specific image (a named ward's records, a specific system going dark) instead of "everything you've learned."

#### `constants.ts` — `TOWERS`/`THREATS` descriptions (14 entries)
- e.g. "Multi-factor auth checkpoint. Blocks credential-based attacks." / "Disguised as legitimate email. Spawns more threats if not stopped." — **DRY**, uniformly — read as a security-vendor spec sheet, seen dozens of times per session. Direction: [Commandment 4/5] no jokes needed, but reframe from generic infosec-vendor language toward each safeguard's real HIPAA Security Rule role in this specific hospital.

#### `EncounterDebrief.tsx` [Top-15 #10]
- Header/body copy ("NETWORK SECURED" / "SYSTEMS BREACHED" / defeat body) — **OK**.
- `HIPAA_TAKEAWAYS` (2 lines, static regardless of outcome, every encounter): "91% of cyberattacks start with a phishing email. Training your staff is your first line of defense." / "Defense in depth: layer Firewall, MFA, and Training — no single tool stops every attack." — **DRY** — the stat is good raw material (Device 6) undercut by an editorializing tail-clause the house style bans, and it's identical after every encounter regardless of how close the fight was. Direction: [Device 6] cut the advisory clause, let the number stand alone: "91% of cyberattacks start with a phishing email." Vary which stat surfaces by which wave/encounter just finished.

#### `Phi18Codex.tsx`
- "Safe Harbor's checklist: remove all 18 identifier types and health data stops being PHI. Log each one you catch in the wild." / "★ SAFE HARBOR CERTIFIED..." / "Not logged yet. It's out there, on some form, waiting." — **GOOD**, "in the wild" and the certificate banner's institutional-parody tone both work as intended.

#### `FeedbackModal.tsx`
- Dev-feedback tool copy (not player-facing game content) — **OK/GOOD**, reasonably exempt from the Nintendo Test; already a little warmer than pure utility.

---

## 4. Already good — don't flatten these in a rewrite pass

A rewrite pass chasing "make it funnier" risks over-correcting content that already clears the
bar. Protect these as reference examples of the house style actually working:

- **`concerned_husband`, `celebrity_crisis`, `legal_request` (Nate), `fax_machine_freddy`, `chatty_cathy`, `boss_man_brad`** — the six best-voiced dialogue scenes in the RPG; all have a name and one specific trait.
- **`supply_closet`** — best-written room in the game, zero jokes told.
- **`minimum_necessary_manual`, `hipaa_penalties`, `verbal_disclosure`, `phi_identifiers`** posters — the four educational items that already nail Device 6/1 tone; use as the bar for `security_safeguards` and the hallway posters.
- **`whimsyData.ts` and `corkboardData.ts`** in full — the clearest in-codebase demonstration of the Playbook's devices executed correctly.
- **`idleLines.ts`** in full except the two flagged lines — the strongest ambient-content file in the project.
- **`NarrativeContextCard.tsx`'s replay line** — the single best-written moment in BreachDefense.
- **`triageData.ts`'s incident details and Priya's context card** — the strongest writing in the minigame layer.
- **`phi18.ts`'s 18 codex blurbs** — best writing in the audited scope, full stop.

---

_Produced by a 6-agent parallel audit (2026-08-22) covering `gameData.json` (50 scenes),
`roomData.json` (13 rooms), `hallwayContent.ts`, `idleLines.ts`, `whimsyData.ts`,
`corkboardData.ts`, `sponsorConfig.ts`, `characters.ts`, `sorterData.ts`, `sorterReactions.ts`,
`triageData.ts`, `phi18.ts`, and the BreachDefense/Phi18Codex/FeedbackModal React components.
Nothing in this file has been shipped — it's the map for Run 05's humor pass (or a fresh run) to
work from. Verbatim OOP lines are never shippable per `OOP_HUMOR_PLAYBOOK.md`; the same applies
to any illustrative line above — generate in-device, don't paste._
