# Content Manifest

Index of all educational content in PrivacyQuest + BreachDefense. Use this to find, audit, and update HIPAA training content without digging through game code.

**How to use this file:**
- To find content for a HIPAA topic: Check the "HIPAA Topic" column
- To edit content: Go to the file path and search for the ID
- To check coverage: Cross-reference with `HIPAA_TRAINING_FRAMEWORK.md`
- When adding content: Add an entry here FIRST, then create the content

---

## PrivacyQuest — Dialogue Scenes

All scenes live in: **`client/src/data/gameData.json`** → `scenes[]` array

Each scene has: `id`, `character`, `dialogue`, `choices[]` (with `text`, `score`, `feedback`), optional `nextSceneId`, optional `isEnd`

### Tutorial Scenes (Nurse Nina)

| ID | Character | HIPAA Topic | Room | Summary |
|----|-----------|-------------|------|---------|
| `scene1` | Nurse Nina | Minimum Necessary Rule | Tutorial | EHR access — scope of access for treatment |
| `scene2` | Nurse Nina | Authorization / Family Disclosure | Tutorial | Family member calling about patient condition |
| `scene3` | Nurse Nina | Healthcare Operations / Min Necessary | Tutorial | Quality improvement data sharing |
| `scene4` | Nurse Nina | Patient Right to Access | Tutorial | Patient requesting medical records (30-day rule) |
| `scene5` | Nurse Nina | Research Use / De-identification | Tutorial | Researcher wants patient data for study |

### Reception Room Scenes

| ID | Character | HIPAA Topic | Room | Summary |
|----|-----------|-------------|------|---------|
| `riley_scene1` | Receptionist Riley | Employer PHI Requests / Appt as PHI | Reception | Employer asking to verify appointment time |
| `signin_violation` | Observation | Sign-in Sheet Privacy | Reception | Visible sign-in sheet with names and visit reasons |
| `phone_privacy` | Observation | Incidental Disclosure / Min Necessary | Reception | Staff discussing results audibly in waiting room |
| `concerned_husband` | Concerned Husband | Authorization Verification / DV Awareness | Reception | Spouse requesting patient info — verify authorized contacts |
| `celebrity_crisis` | Hospital Admin | VIP/Celebrity Privacy / Patient Choice | Reception | Celebrity in ER — PR pressure vs. patient rights |

### ER Room Scenes

| ID | Character | HIPAA Topic | Room | Summary |
|----|-----------|-------------|------|---------|
| `dr_martinez_scene1` | Dr. Martinez | Incidental Disclosure / Hallway Conversations | ER | Discussing patient case in hallway |
| `whiteboard_phi` | Observation | PHI on Status Boards | ER | Patient names + conditions on visible ER board |
| `unlocked_workstation` | Observation | Workstation Security / Auto-logoff | ER | Computer left logged in with patient record displayed |
| `police_records` | Police Officer | Law Enforcement Requests / Warrants | ER | Officer demands records for active investigation |
| `family_pressure` | Frantic Family Member | Family Authorization / Emergency Disclosure | ER | Daughter demanding information about mother |

### Lab Room Scenes

| ID | Character | HIPAA Topic | Room | Summary |
|----|-----------|-------------|------|---------|
| `lab_tech_scene` | Lab Technician | PHI Definition (health info + identifiers) | Lab | Quiz: what makes something PHI? |
| `research_request` | Curious Researcher | Research Access / IRB Requirements | Lab | Faculty researcher assuming access rights |
| `third_party_access` | Sample Courier | Third-Party Access / Minimum Necessary | Lab | Courier requesting additional patient printouts |
| `sample_phi` | Observation | Physical Safeguards / Sample Labels | Lab | Labeled samples visible in open hallway area |
| `exposed_results` | Observation | Unattended PHI / Physical Safeguards | Lab | Test results left visible on counter |

### Records Room Scenes

| ID | Character | HIPAA Topic | Room | Summary |
|----|-----------|-------------|------|---------|
| `records_access` | Records Clerk | Patient Access Timeline (30 days) | Records | Quiz: how long to fulfill access request? |
| `patient_access_rights` | Patient Requesting File | Right to Access Own Records | Records | Patient requesting 2 years of records |
| `legal_request` | Nate the Lawyer | Subpoena Handling / Legal Disclosure | Records | Aggressive attorney demanding same-day records |
| `unlocked_files` | Observation | Physical Safeguards / File Security | Records | Unlocked cabinet with medical records, door propped open |
| `proper_disposal` | Observation | PHI Disposal / Shredding | Records | Patient documents in regular trash |
| `access_audit` | Observation | Audit Logs / Suspicious Access | Records | Coworker accessed chart 15 times without reason |

### IT Office Scenes

| ID | Character | HIPAA Topic | Room | Summary |
|----|-----------|-------------|------|---------|
| `security_training` | Security Analyst | Password Hygiene / Employee Security | IT Office | #1 thing staff can do to prevent breaches |
| `vendor_access` | Vendor | Vendor Credentials / Never Share Logins | IT Office | Vendor asks to use your login for diagnostics |
| `convenience_vs_security` | Employee | Password Policy / Security vs Convenience | IT Office | Employee frustrated with password requirements |
| `password_sharing` | Observation | Written Passwords / Credential Security | IT Office | Sticky note with login credentials on desk |
| `breach_response` | Observation | Breach Response Procedures | IT Office | Reading the Breach Response Playbook |

### Break Room Scenes

| ID | Character | HIPAA Topic | Room | Summary |
|----|-----------|-------------|------|---------|
| `gary_gossip` | Gossipy Gary | Curiosity-Driven Access / Celebrity Snooping | Break Room | Coworker offering to share celebrity patient info |
| `chatty_cathy` | Chatty Cathy | Public PHI Discussion / Duty to Intervene | Break Room | Coworker starting to gossip about patient by room number |
| `fatigue_lapse` | Exhausted Employee | Wrong-Patient Documentation / Patient Safety | Break Room | Tired employee may have charted in wrong file |
| `intervene_gossip` | Observation | Bystander Duty / Verbal Disclosure | Break Room | Two coworkers discussing patient by name in public |
| `phone_security` | Observation | Mobile Device Security | Break Room | Unlocked phone with patient scheduling app visible |

### IT Office Scenes (continued)

| ID | Character | HIPAA Topic | Room | Summary |
|----|-----------|-------------|------|---------|
| `fax_machine_freddy` | You (Internal) | Breach Notification / Misdirected PHI | IT Office (zone) | Faxed records to wrong number |
| `vendor_baa` | Observation | Business Associate Agreements | IT Office (zone) | Unsigned BAA for vendor handling PHI |

### Break Room Scenes (continued)

| ID | Character | HIPAA Topic | Room | Summary |
|----|-----------|-------------|------|---------|
| `boss_man_brad` | HR Director | Employer Access to Employee Health Info | Break Room (NPC) | HR director demanding employee medical details |
| `social_media_slip` | Coworker with Phone | Social Media / Photography in Clinical Areas | Break Room (NPC) | Coworker wants to post selfie from code blue |

### Records Room Scenes (continued)

| ID | Character | HIPAA Topic | Room | Summary |
|----|-----------|-------------|------|---------|
| `final_boss_1` | Chief Compliance Officer | Reporting Violations / Colleague Snooping | Records (NPC) | Colleague accessing ex-spouse's records |
| `final_boss_2` | Chief Compliance Officer | Legal Requests / Don't Be Bullied | Records (chained) | Aggressive attorney threatening subpoena |
| `final_boss_3` | Chief Compliance Officer | Reporting Regardless of Hierarchy | Records (chained) | CEO snooping in patient records |

### Reception Scenes (continued)

| ID | Character | HIPAA Topic | Room | Summary |
|----|-----------|-------------|------|---------|
| `npp_notice` | Observation | Notice of Privacy Practices | Reception (zone) | NPP requirements, patient right to receive notice |

---

## PrivacyQuest — Educational Items

All items live in: **`client/src/data/roomData.json`** → `rooms[].educationalItems[]`

Each item has: `id`, `title`, `type` (poster/manual/computer/whiteboard), `x`, `y`, `fact`

| ID | Title | Type | Room | HIPAA Topic | Key Teaching |
|----|-------|------|------|-------------|-------------|
| `patient_rights_poster` | Patient Rights 101 | computer | Reception | Patient Rights | The Big 5: Access, Amendment, Accounting, Restrictions, Confidential Communications |
| `emergency_exceptions` | When You CAN Share PHI | whiteboard | ER | TPO / Permitted Disclosures | TPO "Holy Trinity" + other exceptions; even when permitted, use Minimum Necessary |
| `phi_identifiers` | The 18 PHI Identifiers | manual | Lab | PHI Definition | PHI = Big 18 Identifiers + Health Info; if you can connect health data to a person, it's PHI |
| `minimum_necessary_manual` | Minimum Necessary Rule | poster | Records | Minimum Necessary | Only access the LEAST amount needed; "need vs. want" test |
| `hipaa_penalties` | HIPAA Enforcement & Penalties | poster | Records | Enforcement / Penalties | Four civil penalty tiers ($100 to $2.13M/year), criminal penalties up to $250K + 10 years, personal prosecution |
| `security_safeguards` | Technical Safeguards | whiteboard | IT Office | Security Rule Safeguards | Three types (Admin/Physical/Technical) + Three A's (Authentication/Authorization/Audit); encryption is "addressable" |
| `verbal_disclosure` | The Art of the HIPAA Shutdown | poster | Break Room | Denying Inappropriate Requests | Automatic NO situations + "The Script" for refusing PHI requests |

---

## PrivacyQuest — Patient Stories

All stories live in: **`client/src/data/roomData.json`** → `rooms[].patientStory`

Each story has: `title`, `text`, `icon`

| Room | Title | Icon | HIPAA Topic | Narrative |
|------|-------|------|-------------|-----------|
| Reception | Elena's Story | heart | Sign-in Sheet Privacy | Private sign-in enabled addiction treatment without employer knowing |
| ER | Marcus's Story | shield | Law Enforcement / Mental Health | Refusing warrantless records request protected mental health privacy |
| Lab | David's Story | lock | Research / Genetic Privacy | Questioning researcher access kept genetic results confidential |
| Records | Mrs. Chen's Story | file | Right to Amendment | Correcting a record error prevented lifelong insurance problems |
| IT Office | 50,000 Patients Protected | server | Phishing Prevention | Catching phishing attempt protected 50,000 records |
| Break Room | James's Story | users | Workplace Gossip | Changing subject prevented coworker from learning about cancer diagnosis |

---

## PrivacyQuest — Interaction Zones

All zones live in: **`client/src/data/roomData.json`** → `rooms[].interactionZones[]`

Each zone has: `id`, `name`, `x`, `y`, `sceneId` (links to gameData.json scene), `spriteType`

| ID | Name | Room | Links To Scene | HIPAA Topic |
|----|------|------|---------------|-------------|
| `sign_in_sheet` | Sign-in Sheet | Reception | `signin_violation` | PHI on sign-in sheets |
| `privacy_notice` | Notice of Privacy Practices | Reception | `npp_notice` | NPP requirements, patient right to receive notice |
| `whiteboard` | Patient Status Board | ER | `whiteboard_phi` | PHI on status boards |
| `unlocked_computer` | Computer Left Logged In | ER | `unlocked_workstation` | Workstation security |
| `sample_labels` | Sample Labels | Lab | `sample_phi` | PHI on sample containers |
| `results_printout` | Results Left on Counter | Lab | `exposed_results` | Unattended PHI |
| `unlocked_cabinet` | Unlocked File Cabinet | Records | `unlocked_files` | Physical safeguards |
| `audit_log` | Audit Log Screen | Records | `access_audit` | Audit controls |
| `shredder` | Document Shredder | Records | `proper_disposal` | PHI disposal |
| `password_note` | Password Sticky Note | IT Office | `password_sharing` | Credential security |
| `breach_playbook` | Breach Response Playbook | IT Office | `breach_response` | Breach procedures |
| `fax_machine` | Fax Machine | IT Office | `fax_machine_freddy` | Misdirected fax breach scenario |
| `vendor_agreement` | Unsigned Vendor Agreements | IT Office | `vendor_baa` | BAA requirements |
| `overheard_conversation` | Overheard Conversation | Break Room | `intervene_gossip` | Verbal disclosure |
| `unlocked_phone` | Phone Left Unlocked | Break Room | `phone_security` | Mobile device security |

---

## BreachDefense — Tutorial Lessons

All content lives in: **`client/src/game/breach-defense/tutorialContent.ts`** → `TUTORIAL_CONTENT.waves`

| Wave | Title | HIPAA Topic | Key Teaching |
|------|-------|-------------|-------------|
| Welcome | Welcome to Breach Defense | Security Overview | Hospital network defense; Change Healthcare 2024 reference |
| First Tower | Build Your Defenses | Game Mechanics | Tower placement; counter system introduction |
| Wave 1 | Lesson 1: The Phishing Problem | Phishing | 91% of attacks start with phishing; urgency/authority/credential tricks |
| Wave 3 | Lesson 2: Patch Your Systems | Ransomware / Patching | Change Healthcare case; "remind me later" risk; unpatched vulnerabilities |
| Wave 5 | Lesson 3: Insider Threats | Insider Threats | 70% of healthcare breaches involve insiders; curiosity is not authorization |
| Wave 7 | Lesson 4: Physical Security | Physical Security | Lost device = $650K fine; lock screen, encrypt, never leave unattended |
| Wave 9 | Lesson 5: Defense in Depth | Layered Security | No single defense catches everything; combined controls |

---

## BreachDefense — Threat Codex

All content lives in: **`client/src/game/breach-defense/tutorialContent.ts`** → `TUTORIAL_CONTENT.codex.threats`

| Key | Name | HIPAA Topic | Real-World Example |
|-----|------|-------------|-------------------|
| `PHISHING` | Phishing Payload | Phishing | Twitter 2020 spear-phishing attack |
| `CREDENTIAL` | Credential Harvester | Credential Theft | Dark web credential sales |
| `RANSOMWARE` | Ransomware Crawler | Ransomware | Change Healthcare 2024 ($22M ransom, 190M records) |
| `INSIDER` | Insider Threat | Insider Threats | UCLA Health 2015 celebrity record snooping |
| `ZERODAY` | Zero-Day Exploit | Zero-Day Vulnerabilities | Log4j 2021 |
| `BRUTEFORCE` | Brute Force Bot | Password Attacks | Simple password cracking speeds |
| `DEVICETHIEF` | Device Thief | Physical Security / Device Theft | 2016 lost iPhone ($650K fine) |
| `SOCIAL` | Social Engineer | Social Engineering | MGM Resorts 2023 help desk impersonation |

---

## BreachDefense — Tower Codex

All content lives in: **`client/src/game/breach-defense/tutorialContent.ts`** → `TUTORIAL_CONTENT.codex.towers`

| Key | Name | HIPAA Topic | Key Stat |
|-----|------|-------------|---------|
| `MFA` | MFA Shield | Multi-Factor Authentication | Blocks 99.9% of automated credential attacks (Microsoft) |
| `PATCH` | Patch Cannon | Vulnerability Management / Patching | WannaCry 2017 exploited vulnerability patched 2 months prior |
| `FIREWALL` | Firewall Barrier | Network Security | First line of defense; can't stop legitimate-channel attacks |
| `ENCRYPTION` | Encryption Vault | Data Encryption | HIPAA requires encryption at rest and in transit |
| `TRAINING` | Training Beacon | Security Awareness Training | 70% fewer incidents with training programs |
| `ACCESS` | Access Control | Least Privilege / Access Management | Breach containment through limited access |

---

## BreachDefense — Wave Recaps

All content lives in: **`client/src/game/breach-defense/tutorialContent.ts`** → `TUTORIAL_CONTENT.recaps`

| Key | Title | HIPAA Topic | Action Item |
|-----|-------|-------------|-------------|
| `PHISHING` | Phishing: Key Takeaway | Phishing | Verify suspicious requests through separate channel |
| `PATCHING` | Patching: Key Takeaway | Vulnerability Management | Install updates promptly; Change Healthcare reference |
| `INSIDER` | Insider Threats: Key Takeaway | Insider Threats | Only access what you need; never share passwords |
| `PHYSICAL` | Physical Security: Key Takeaway | Physical Safeguards | Lock screen, encrypt devices, never leave unattended |
| `LAYERS` | Defense in Depth: Key Takeaway | Layered Security | Multiple overlapping controls cover different vectors |
| `PASSWORDS` | Strong Passwords: Key Takeaway | Password Security | Password manager + MFA everywhere |
| `ALLDEFENSE` | Defense in Depth: Key Takeaway | All Security | YOU are the security; IT policies protect real patients |

---

## BreachDefense — Wave Data (Educational)

Game mechanics + educational text live in: **`client/src/game/breach-defense/constants.ts`** → `WAVES[]`

| Wave | Name | Concept | Intro Scenario | End Message Teaching |
|------|------|---------|---------------|---------------------|
| 1 | The Friendly Email | PHISHING | Email from "IT Support" asking for password | 91% of attacks start with phishing |
| 2 | Credential Storm | PHISHING | Phishing succeeded elsewhere, credentials flooding | MFA stops 99.9% of credential attacks |
| 3 | Remind Me Later | PATCHING | Software nagging about updates | "Remind me later" leaves windows open |
| 4 | Patch Tuesday | PATCHING | Critical vulnerability announced | Zero-days can't be patched; defense-in-depth |
| 5 | The Trusted Colleague | INSIDER | Someone with access behaving suspiciously | 70% of healthcare breaches involve insiders |
| 6 | Social Engineering | INSIDER | "Hi, this is IT—I need your password" | Real IT never asks for your password |
| 7 | The Lost Laptop | PHYSICAL | Laptop left unlocked, now missing | Lost devices + encryption as defense |
| 8 | Defense in Depth | LAYERS | Coordinated multi-vector attack | Layered security, no single point of failure |
| 9 | The Persistent Attacker | PASSWORDS | Brute force trying millions of passwords | Strong passwords + MFA defeat brute force |
| 10 | The Final Breach | ALLDEFENSE | Full-scale attack, all vulnerabilities | YOU are the security |

---

## Content Notes

### Previously Unassigned Scenes — Now Wired In (2026-03-11)
All previously unassigned scenes have been connected to rooms:
- `fax_machine_freddy` — Now an interaction zone in IT Office (fax machine near printer station)
- `boss_man_brad` — Now an NPC in Break Room (HR director at coffee station)
- `final_boss_1` → `final_boss_2` → `final_boss_3` — Now a chained NPC encounter in Records Room (Chief Compliance Officer)

### Previously Known Issues — Resolved (2026-03-11)
1. **`privacy_notice` zone** — Now correctly links to `npp_notice` scene (dedicated NPP teaching) instead of `phone_privacy`
2. **All scenes reachable** — Every scene in `gameData.json` is now accessible through room exploration

---

---

## PHI Sorter Encounter — Document Sets

All document sets live in: **`client/src/data/sorterData.ts`** → `SORTER_DOCUMENT_SETS` constant

Each set has: `id`, `act`, `triggerLocation`, `npcId`, `contextCard`, `items[]`, `passingAccuracy`, `takeaways[2]`

Format: PHI Sorter document set
HIPAA topic tags: "PHI Definition", "18 Identifiers (45 CFR §164.514(b)(2))", "Safe Harbor De-identification"
Item counts (HIPAA-is-the-game pass, 2026-07-06): 12 / 13 / 14 (Set 1 / Set 2 / Set 3)

| ID | File | Act | Trigger Location | NPC | Items | PHI Items | Not PHI | Coverage | Summary |
|----|------|-----|-----------------|-----|-------|-----------|---------|----------|---------|
| `phi-sorter-set-1` | `client/src/data/sorterData.ts` | 1 | reception | `receptionist_riley` | 12 | 7 | 5 | GOOD | Obvious identifiers: name, SSN, DOB, home address, phone, email + employer (deliberately NOT one of the 18 — teaches PHI > the checklist, §160.103) vs. hospital address, room temp, marital status, supply order, cafeteria menu. Station: INTAKE DESK. |
| `phi-sorter-set-2` | `client/src/data/sorterData.ts` | 2 | lab | `lab_tech` | 13 | 7 | 6 | GOOD | Subtle identifiers: device serial, IP address, biometric, MRN+diagnosis pair, license plate, health plan ID, portal URL w/ record token (#14) vs. bare ICD-10 code, test type, sample volume, specimen type, equipment log, biohazard notice. Station: LAB MANIFEST STATION. |
| `phi-sorter-set-3` | `client/src/data/sorterData.ts` | 3 | medical_records | `records_clerk` | 14 | 7 | 7 | GOOD | Edge cases: ZIP5, admission month+year, age 90+ (dates element), fax, account number, CDL on DOT physical (#11), study code w/ live roster crosswalk (#18, §164.514(c)) vs. ZIP3, year-only, email domain, public URL, VIN fragment, ops memos. Station: DE-ID REVIEW DESK. |

> **Humor coverage (Phase 22):** ≥30% of items contain a humor beat in a free-text chart field (`doctorNote`, `emergencyContact`, `reasonForVisit`, or `miscField`) that does NOT affect HIPAA classification. Tone calibration: deadpan (Daria/Veep), grounded in admin-system absurdity, never punching down at patient demographics. See `.planning/phases/22-phi-sorter-content-connection/22-CONTEXT.md` for examples.

> **HOLD IT reveals (Phase 22):** Each set has exactly one item flagged with `holdIt: { npcLine, educationalBeat }` for the Phoenix-Wright-style dramatic reveal on correct classification. Set 1 = `s1-dob` (full birth date vs. year-only Safe Harbor rule); Set 2 = `s2-diagnosis-with-mrn` (MRN as the identifier that turns a code into PHI); Set 3 = `s3-zip3` (ZIP3 passes Safe Harbor — but only because 902 covers >20,000 people). NPC delivers the line with distinct visual treatment (scaled bubble, gold flash) — stays in flow.

---

## The Eighteen — Identifier Codex (HIPAA-is-the-game pass, 2026-07-06)

Canonical list: **`client/src/data/phi18.ts`** → `PHI18_ENTRIES` (18 entries, §164.514(b)(2)(i)(A)-(R) order)

Collection mechanic: first correct redaction of each `identifierType` in the PHI Sorter (17 of 18)
+ the break-room corkboard baby wall (#17 full-face photos) fills a persistent codex
(`identifiersFound` in the save blob). UI: `Phi18Codex.tsx` (open with [I] / HUD chip),
`IdentifierGetBanner.tsx` (item-get moment). Completion: +10 compliance, SAFE HARBOR CERTIFIED state.
Coverage per set: S1 → #1,2,3,4,6,7 · S2 → #8,9,12,13,14,15,16 · S3 → #2,3,5,10,11,18 · corkboard → #17.

## Staff Corkboard Minigame (break_room)

Content: **`client/src/data/corkboardData.ts`** → `CORKBOARD_NOTES` (6 notes, 3 violations).
HIPAA topic tags: "Reasonable Safeguards (§164.530(c))", "PHI in staff spaces", "Full-face photos (#17)", "MRN (#8)", "Secure disposal".

| ID | Kind | Teaches |
|----|------|---------|
| `baby-wall` | VIOLATION | Full-face photos = identifier #17; display requires authorization. Grants codex #17. |
| `shredder-parking` | VIOLATION | Secure disposal chain — PHI can't park on a shared-space board |
| `mystery-labs` | VIOLATION | Posting an MRN to find its owner broadcasts PHI |
| `potluck` / `plant-roster` / `cpr-class` | FINE | Not everything pinned is PHI — no identifier + no health link |

---

## Breach Triage Encounter (Phase 17)

All incident sets live in: **`client/src/data/triageData.ts`** → `BREACH_TRIAGE_SETS` constant

HIPAA topic tags: "Breach Notification Rule (45 CFR §164.400-414)"

Each incident set has: `id`, `npcId`, `npcName`, `npcRole`, `contextCard`, `incidents[]`, `passingAccuracy`, `takeaways[2]`

### Incident Set: breach-triage-set-1

NPC: Priya (Privacy Officer) — `priya_privacy_officer`

Context card: Priya's Triage Queue — she's on her third queue today, precise and exhausted, needs help classifying incidents and determining notification obligations.

| ID | Headline | Reportable? | HIPAA Topic / CFR Section | Difficulty |
|----|----------|-------------|--------------------------|------------|
| `misdirected-fax` | MISDIRECTED FAX — DISCHARGE SUMMARY | YES | Impermissible disclosure; individual notify; <500 = annual OCR log (§164.402, §164.404, §164.408) | 1 |
| `unencrypted-laptop` | LAPTOP STOLEN — STAFF PARKING LOT | YES | Unsecured PHI; 1,200 records >500 threshold → patient + OCR concurrent + media notice (§164.402, §164.404, §164.406, §164.408) | 1 |
| `encrypted-laptop` | LAPTOP LEFT IN RIDESHARE — ENCRYPTED | NO | Encryption safe harbor; encrypted PHI is not "unsecured PHI" (§164.402) | 2 |
| `hr-snooping` | UNAUTHORIZED ACCESS — HR REP, BEHAVIORAL HEALTH RECORDS | YES | Intentional unauthorized access; individual notify; internal location is not an exception (§164.402, §164.404) | 2 |
| `good-faith-glance` | WRONG CHART OPENED — FLOAT NURSE, SELF-REPORTED | NO | Good-faith exception; unintentional acquisition, immediate self-report, no further use (§164.402(1)(i)) | 2 |
| `vendor-breach` | BUSINESS ASSOCIATE BREACH — 3,400 RECORDS EXFILTRATED | YES | BA notifies CE ≤60 days; CE owns patient+OCR+media (>500); BA delay eats CE's clock (§164.404, §164.406, §164.408, §164.410) | 2 |
| `internal-misuse` | UNAUTHORIZED EXPORT — REGISTRATION CLERK, PATIENT CONTACT LIST | YES | Impermissible use for personal gain; individual notify; <500 annual OCR log (§164.402, §164.404, §164.408) | 2 |
| `deceased-records` | HISTORICAL RECORDS RELEASED — PATIENT DECEASED 1962 | NO | 50-year post-death PHI rule; 60+ years deceased = no longer PHI (§164.502(f)) | 3 |
| `ransomware` | RANSOMWARE — FILE SERVER ENCRYPTED, 2,800 RECORDS AT RISK | YES | Breach presumption for ransomware on unsecured PHI; no-exfil not a defense; >500 → full notification (§164.402; OCR 2016) | 3 |

**Takeaways (shown in TriageDebrief):**
1. Breach presumption + encryption safe harbor: ransomware on unsecured PHI is presumed a breach unless disproved; encrypted PHI = not unsecured PHI.
2. 60-day clock, 500-record threshold: individual notification within 60 days of discovery; >500 residents in a state/jurisdiction adds media + concurrent OCR notice.

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-03-01 | Initial manifest created from full content audit | Claude |
| 2026-03-11 | Wired all unassigned scenes into rooms. Added new scenes: npp_notice, social_media_slip, vendor_baa. Added hipaa_penalties educational item. Fixed privacy_notice zone link. Updated all tables. | Claude |
| 2026-05-01 | Added 3 PHI Sorter document sets (Phase 16) — phi-sorter-set-1..3 covering PHI Definition, 18 Identifiers, and Safe Harbor De-identification. | Claude |
| 2026-06-09 | Phase 22: Rewrote 30 PHI Sorter items as fake patient charts with deadpan humor. Extended SorterItem schema with `chart` + `holdIt` fields. Set counts: 6/8/5 → 10/10/10 (30 total). All 19 Phase-16 item IDs preserved with original category (HIPAA accuracy gate). 45 humor-bearing chart fields. Recurring patients: Mrs. Henderson (s1+s3), Mr. Okonkwo (s2+s3). | Claude |
| 2026-07-06 | HIPAA-is-the-game pass: (1) Triage incidents gained named rules (`rule.tag/short`) + 3 fact chips each; set gained `ruleStrip` cheat sheet — §164.402 presumption/exceptions structure now pinned on screen. (2) The Eighteen codex (phi18.ts) + corkboard minigame (corkboardData.ts). (3) Sorter: +3 items closing identifier coverage gaps (s2-portal-url #14, s3-cdl-number #11, s3-study-code #18); ACCURACY FIX: employer item no longer claims to be "identifier #11" (it's not on the 18 — now teaches §160.103 definition vs. de-ID checklist); age-90+ retyped into dates element. Set counts 12/13/14. Lab `phi_identifiers` manual rewritten to point at the codex. Per-set station placards. | Claude |
