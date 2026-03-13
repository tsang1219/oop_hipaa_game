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
| `legal_request` | Attorney with Subpoena | Subpoena Handling / Legal Disclosure | Records | Aggressive attorney demanding same-day records |
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

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-03-01 | Initial manifest created from full content audit | Claude |
| 2026-03-11 | Wired all unassigned scenes into rooms. Added new scenes: npp_notice, social_media_slip, vendor_baa. Added hipaa_penalties educational item. Fixed privacy_notice zone link. Updated all tables. | Claude |
