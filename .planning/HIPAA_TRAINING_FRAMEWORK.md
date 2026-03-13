# HIPAA Training Framework

This document defines what a corporate HIPAA training program must cover and maps those requirements to game content. It serves as the **authority reference** for evaluating whether PrivacyQuest + BreachDefense provide adequate HIPAA education.

## Regulatory Basis

HIPAA training requirements stem from:
- **Privacy Rule** (45 CFR 164.530(b)): Covered entities must train all workforce members on policies and procedures regarding PHI
- **Security Rule** (45 CFR 164.308(a)(5)): Security awareness and training program required for all workforce members
- **HHS Office for Civil Rights guidance**: Annual training recommended, with additional training when material changes occur
- **State-level requirements**: Many states require specific training intervals and topics (not covered here — this framework targets federal baseline)

## Training Topic Requirements

Each topic below has a coverage status indicating how well the games currently address it.

**Legend:**
- `STRONG` — Multiple scenarios, reinforced through gameplay, with feedback
- `ADEQUATE` — At least one clear teaching moment with correct/incorrect feedback
- `THIN` — Mentioned in feedback text or educational items but not scenario-tested
- `GAP` — Not currently addressed in either game

---

### PART 1: Privacy Rule Topics (PrivacyQuest)

These are the core Privacy Rule concepts that corporate HIPAA training must cover.

#### 1.1 What is PHI? (Protected Health Information)
- **Requirement:** Workforce must understand what constitutes PHI and how to identify it
- **Coverage:** `STRONG`
- **Game content:**
  - `lab_tech_scene` — Directly teaches PHI = health info + identifiers
  - `phi_identifiers` educational item — The 18 identifiers explained
  - `sample_phi` — Identifying PHI on sample labels
  - Multiple observation scenes reinforce PHI recognition throughout

#### 1.2 The 18 PHI Identifiers
- **Requirement:** Workforce should know the categories of information that make health data identifiable
- **Coverage:** `ADEQUATE`
- **Game content:**
  - `phi_identifiers` educational item — Lists the 18 identifiers
  - Reinforced implicitly through scenes involving names, DOBs, SSNs, room numbers

#### 1.3 Minimum Necessary Rule
- **Requirement:** Only access, use, or disclose the least amount of PHI needed for the task
- **Coverage:** `STRONG`
- **Game content:**
  - `scene1` — EHR access scope (tutorial). Note: feedback now correctly teaches that Min Necessary has a **treatment exception** (45 CFR 164.502(b)(2)(i))
  - `scene3` — Quality improvement data sharing. Note: feedback now correctly teaches QI is a healthcare operation (TPO) — no patient authorization needed, but Min Necessary applies
  - `minimum_necessary_manual` educational item — Dedicated explanation
  - `third_party_access` — Courier oversharing
  - `phone_privacy` — Overheard disclosures
  - `chatty_cathy` — Zero-necessary in public spaces
  - Reinforced in feedback across many scenes

#### 1.4 Patient Rights
- **Requirement:** Workforce must know the rights HIPAA grants to patients
- **Coverage:** `STRONG`
- **Game content:**
  - `patient_rights_poster` educational item — The Big 5 rights
  - `scene4` — Right to access records (30-day rule)
  - `records_access` — Access timeline quiz
  - `patient_access_rights` — Fulfilling access requests
  - `legal_request` / `final_boss_2` — Records in legal contexts
  - Mrs. Chen's patient story — Right to amendment
- **Sub-rights covered:**
  - Right to Access: `STRONG` (scene4, records_access, patient_access_rights)
  - Right to Amendment: `ADEQUATE` (Mrs. Chen's story, implied in records room)
  - Right to Accounting of Disclosures: `THIN` (listed in educational item only)
  - Right to Request Restrictions: `THIN` (listed in educational item only)
  - Right to Confidential Communications: `THIN` (listed in educational item only)

#### 1.5 Authorization Requirements
- **Requirement:** When patient authorization is needed vs. when disclosure is permitted without it
- **Coverage:** `STRONG`
- **Game content:**
  - `scene2` — Family member authorization
  - `riley_scene1` — Employer requesting info
  - `concerned_husband` — Verifying authorized contacts
  - `family_pressure` — Family authorization in emergencies
  - `celebrity_crisis` — VIP privacy decisions
  - `boss_man_brad` — Employer access to employee records
  - `verbal_disclosure` educational item — The "automatic NO" situations

#### 1.6 Treatment, Payment, Operations (TPO)
- **Requirement:** Workforce must understand when PHI can be shared without authorization
- **Coverage:** `ADEQUATE`
- **Game content:**
  - `emergency_exceptions` educational item — TPO explained as "The Holy Trinity"
  - `scene1` — Treatment access verification
  - `scene3` — Healthcare operations (quality improvement)
  - Reinforced in feedback text across multiple scenes

#### 1.7 Permitted Disclosures Without Authorization
- **Requirement:** Know the circumstances when PHI can be disclosed without patient consent
- **Coverage:** `ADEQUATE`
- **Game content:**
  - `emergency_exceptions` educational item — Lists: TPO, required by law, public health, law enforcement, emergencies, etc.
  - `police_records` — Law enforcement with/without warrant
  - `scene5` — Research exceptions
  - `legal_request` / `final_boss_2` — Legal process (subpoena)
- **Notable sub-categories:**
  - Law enforcement: `STRONG` (police_records, final_boss_2)
  - Public health reporting: `THIN` (mentioned in educational item only)
  - Abuse/neglect reporting: `GAP`
  - Workers' compensation: `GAP`
  - Judicial proceedings: `ADEQUATE` (legal_request, final_boss_2)

#### 1.8 Family & Personal Representative Disclosures
- **Requirement:** When and how to share PHI with family, friends, or personal representatives
- **Coverage:** `STRONG`
- **Game content:**
  - `scene2` — Family member phone call. Note: feedback now uses correct 45 CFR 164.510(b) language (patient agreement/non-objection/best interest) instead of formal "authorization"
  - `concerned_husband` — Spousal verification (includes DV awareness). Note: "cannot confirm or deny" response now properly valued
  - `family_pressure` — Emergency family requests. Note: feedback now includes incapacitated patient professional judgment standard
  - `celebrity_crisis` — Patient-directed privacy decisions

#### 1.9 De-identification
- **Requirement:** Understand that properly de-identified data is not PHI
- **Coverage:** `ADEQUATE`
- **Game content:**
  - `scene5` — De-identified data for research
  - `lab_tech_scene` — PHI definition (implies de-identification boundary)
  - `research_request` — IRB and de-identification options

#### 1.10 Research Use of PHI
- **Requirement:** Know the rules for using PHI in research (IRB, authorization, de-identification)
- **Coverage:** `STRONG`
- **Game content:**
  - `scene5` — IRB waiver and patient authorization
  - `research_request` — Faculty access doesn't bypass HIPAA
  - David's patient story — Genetic testing confidentiality

#### 1.11 Notice of Privacy Practices (NPP)
- **Requirement:** Patients must receive notice of how their PHI will be used
- **Coverage:** `ADEQUATE` (upgraded from THIN)
- **Game content:**
  - `privacy_notice` interaction zone in Reception → now links to dedicated `npp_notice` scene
  - `npp_notice` teaches: NPP must be provided at first service encounter, explains PHI usage, patient rights, complaint procedures, and must be posted in facility

#### 1.12 Business Associate Agreements (BAAs)
- **Requirement:** Workforce should understand that third parties handling PHI need BAAs
- **Coverage:** `ADEQUATE` (upgraded from THIN)
- **Game content:**
  - `vendor_baa` — Unsigned vendor agreement scenario. Teaches: what a BAA is, when it's required (any vendor creating/receiving/maintaining/transmitting PHI), what it must contain (safeguarding, breach notification, restrictions, return/destruction), and that the covered entity is liable for BA violations
  - `vendor_access` — Vendor requesting system access (credential management)
  - `third_party_access` — Courier scenario (Minimum Necessary)

#### 1.13 Marketing and Fundraising Restrictions
- **Requirement:** PHI cannot be used for marketing without authorization; fundraising has opt-out rights
- **Coverage:** `GAP`
- **Game content:**
  - `verbal_disclosure` educational item mentions "Marketing Without Authorization" as an automatic NO
  - No scenario tests this knowledge

#### 1.14 Psychotherapy Notes
- **Requirement:** Psychotherapy notes receive extra protection beyond standard PHI
- **Coverage:** `GAP`
- **Game content:** None

#### 1.15 Incidental Disclosures & Reasonable Safeguards
- **Requirement:** Understand what constitutes incidental vs. intentional disclosure, and reasonable safeguards
- **Coverage:** `STRONG`
- **Game content:**
  - `dr_martinez_scene1` — Hallway conversations. Note: corrected to match HHS guidance — hallway conversations are permitted with reasonable precautions, not prohibited outright
  - `phone_privacy` — Loud phone conversations
  - `whiteboard_phi` — Public status boards
  - `signin_violation` — Visible sign-in sheets
  - `intervene_gossip` — Overheard conversations
  - Multiple observation scenes throughout

---

### PART 2: Security Rule Topics (BreachDefense + PrivacyQuest IT Office)

#### 2.1 Administrative Safeguards
- **Requirement:** Security management, workforce security, access management, training
- **Coverage:** `ADEQUATE`
- **Game content:**
  - `security_safeguards` educational item — Three types of safeguards + Three A's
  - `security_training` — Password hygiene as #1 prevention
  - BreachDefense Training Beacon tower — Teaches security awareness value
  - BreachDefense Access Control tower — Least privilege principle

#### 2.2 Physical Safeguards
- **Requirement:** Facility access, workstation security, device controls
- **Coverage:** `STRONG`
- **Game content:**
  - `unlocked_workstation` — Workstation left logged in
  - `unlocked_files` — Unsecured file cabinets
  - `exposed_results` — Unattended PHI
  - `sample_phi` — Exposed sample labels
  - `phone_security` — Mobile device left unlocked
  - BreachDefense wave 7 — "The Lost Laptop" (device theft)
  - BreachDefense Encryption Vault codex — Device theft protection

#### 2.3 Technical Safeguards
- **Requirement:** Access controls, audit controls, encryption, authentication
- **Coverage:** `STRONG`
- **Game content:**
  - `security_safeguards` educational item — Authentication, Authorization, Audit
  - `password_sharing` — Written credentials
  - `vendor_access` — Shared credentials risk
  - `convenience_vs_security` — Password requirements and managers
  - `access_audit` — Audit log review
  - BreachDefense MFA Shield — Multi-factor authentication
  - BreachDefense Encryption Vault — Data encryption (HIPAA requirement noted)
  - BreachDefense Firewall — Network filtering
  - BreachDefense Patch Cannon — Vulnerability management

#### 2.4 Phishing & Social Engineering
- **Requirement:** Recognize and respond to phishing attempts and social manipulation
- **Coverage:** `STRONG`
- **Game content:**
  - BreachDefense waves 1-2 — Phishing mechanics + teaching moments
  - BreachDefense wave 6 — Social engineering
  - BreachDefense codex — Phishing, Social Engineer, Credential Harvester entries
  - BreachDefense recaps — Phishing key takeaway
  - `vendor_access` — Social engineering via vendor impersonation

#### 2.5 Password Security & Authentication
- **Requirement:** Strong passwords, no sharing, MFA awareness
- **Coverage:** `STRONG`
- **Game content:**
  - `password_sharing` — Written passwords on sticky notes
  - `security_training` — Password hygiene as #1 defense
  - `convenience_vs_security` — Password managers
  - `vendor_access` — Never share credentials
  - BreachDefense MFA Shield — MFA blocks 99.9% of automated attacks
  - BreachDefense wave 9 — Brute force password attacks
  - BreachDefense recaps — Strong passwords key takeaway

#### 2.6 Encryption
- **Requirement:** Data encryption at rest and in transit
- **Coverage:** `ADEQUATE`
- **Game content:**
  - BreachDefense Encryption Vault — Tower + codex entry
  - BreachDefense wave 7 — Device theft + encryption as defense
  - `security_safeguards` educational item — Mentions encryption

#### 2.7 Ransomware & Malware
- **Requirement:** Recognize ransomware threats, understand patching importance
- **Coverage:** `STRONG`
- **Game content:**
  - BreachDefense waves 3-4 — Ransomware mechanics + Change Healthcare case study
  - BreachDefense Patch Cannon — Patching closes vulnerabilities
  - BreachDefense codex — Ransomware entry with real-world example ($22M ransom)
  - BreachDefense recaps — Patching key takeaway

#### 2.8 Defense in Depth
- **Requirement:** Layered security approach, no single point of failure
- **Coverage:** `STRONG`
- **Game content:**
  - BreachDefense waves 8, 10 — Multi-vector attacks requiring combined defenses
  - BreachDefense lesson 5 — Explicit "defense in depth" teaching
  - BreachDefense recaps — Layered defense key takeaway
  - Core tower defense mechanic reinforces layered strategy through gameplay

---

### PART 3: Breach Notification Rule

#### 3.1 What Constitutes a Breach
- **Requirement:** Unauthorized access, use, or disclosure of unsecured PHI
- **Coverage:** `ADEQUATE`
- **Game content:**
  - `breach_response` — Breach Response Playbook
  - `fax_machine_freddy` — Misdirected fax as breach example
  - BreachDefense overall concept — Breaches as tangible harm

#### 3.2 Breach Response Procedures
- **Requirement:** Documentation, risk assessment, notification procedures
- **Coverage:** `ADEQUATE`
- **Game content:**
  - `breach_response` — Document, notify Privacy Officer, risk assessment
  - `fax_machine_freddy` — Full breach response sequence (document, notify, retrieve, assess, possibly notify patient)

#### 3.3 Notification Requirements
- **Requirement:** Patient notification within 60 days, HHS reporting, state AG notification
- **Coverage:** `ADEQUATE` (upgraded from THIN after corrections)
- **Game content:**
  - `breach_response` — Now explicitly teaches 60-day patient notification and HHS reporting rules (corrected from erroneous 72-hour reference, which is GDPR not HIPAA)
  - `fax_machine_freddy` — Full breach response sequence with notification steps
- **Remaining gap:** 500+ threshold for immediate HHS notification and state AG requirements not explicitly taught

---

### PART 4: Workplace Behavioral Topics

These aren't strictly HIPAA regulation sections but are critical for corporate training effectiveness.

#### 4.1 Reporting Violations (Duty to Report)
- **Requirement:** Employees must know how and when to report HIPAA violations
- **Coverage:** `STRONG`
- **Game content:**
  - `gary_gossip` — Report curiosity-driven access
  - `access_audit` — Report suspicious access patterns
  - `intervene_gossip` — Active intervention duty
  - `final_boss_1` — Report colleague accessing ex-spouse's records
  - `final_boss_3` — Report regardless of hierarchy (CEO)
  - `chatty_cathy` — Intervene in public PHI discussions

#### 4.2 Curiosity-Driven Access (Snooping)
- **Requirement:** Accessing PHI without job-related need is a violation, even if you don't share it
- **Coverage:** `STRONG`
- **Game content:**
  - `gary_gossip` — Celebrity chart snooping
  - `sam_access` — IT staff browsing "technical data"
  - `access_audit` — Audit log showing suspicious access
  - `final_boss_1` — Ex-spouse record snooping

#### 4.3 Verbal Disclosures & Gossip
- **Requirement:** PHI violations through spoken word, including casual conversation
- **Coverage:** `STRONG`
- **Game content:**
  - `chatty_cathy` — Break room gossip (high-stakes scenario)
  - `gary_gossip` — Celebrity gossip temptation
  - `intervene_gossip` — Overheard patient discussion
  - `dr_martinez_scene1` — Hallway conversations
  - `phone_privacy` — Loud phone calls
  - James's patient story — Workplace gossip consequences

#### 4.4 PHI Disposal
- **Requirement:** Proper destruction of PHI (shredding, secure deletion)
- **Coverage:** `ADEQUATE`
- **Game content:**
  - `proper_disposal` — Documents in regular trash
  - Records room has shredder interaction zone

#### 4.5 Wrong-Patient Errors
- **Requirement:** Documentation accuracy and correction procedures
- **Coverage:** `ADEQUATE`
- **Game content:**
  - `fatigue_lapse` — Wrong-patient charting due to fatigue
  - Mrs. Chen's patient story — Record amendment importance

#### 4.6 Social Media & Electronic Communications
- **Requirement:** PHI risks in texting, email, social media
- **Coverage:** `ADEQUATE` (upgraded from THIN)
- **Game content:**
  - `social_media_slip` — Coworker wants to post code blue selfie with patient visible. Teaches: no photos in clinical areas, partial visibility still identifies patients, metadata risks, facility policy
  - `verbal_disclosure` educational item mentions "no texting lab results"
  - `phone_security` — Unlocked phone with scheduling app

#### 4.7 Remote Work & Telehealth
- **Requirement:** PHI protection in home/remote environments
- **Coverage:** `GAP`
- **Game content:** None

---

## Coverage Summary

### By Coverage Level

| Level | Count | Topics |
|-------|-------|--------|
| STRONG | 16 | PHI definition, Minimum Necessary, Patient Rights (access), Authorization, Family disclosures, Research, Incidental disclosures, Physical safeguards, Technical safeguards, Phishing, Password security, Ransomware, Defense in depth, Reporting violations, Snooping, Verbal disclosures |
| ADEQUATE | 14 | 18 Identifiers, TPO, De-identification, Permitted disclosures, Administrative safeguards, Encryption, Breach definition, Breach response, PHI disposal, Wrong-patient errors, Breach notification timelines, NPP, BAAs, Social media / electronic communications |
| THIN | 2 | Patient Rights (accounting, restrictions, confidential comm), HIPAA penalties & enforcement |
| GAP | 4 | Marketing/fundraising restrictions, Psychotherapy notes, Remote work/telehealth, State-level notifications |

### Priority Gaps to Address

**Resolved** (addressed 2026-03-11):
- ~~Business Associate Agreements~~ → `vendor_baa` scene added in IT Office
- ~~Social media / electronic communications~~ → `social_media_slip` scene added in Break Room
- ~~Breach notification timelines~~ → `breach_response` now teaches 60-day rule and HHS reporting
- ~~Notice of Privacy Practices~~ → `npp_notice` scene created, `privacy_notice` zone fixed
- ~~Unassigned scenes~~ → All wired into rooms (fax_machine_freddy, boss_man_brad, final_boss_1-3)

**Remaining high priority:**
1. **Patient Rights depth** — Accounting of disclosures, request restrictions, and confidential communications only listed in educational item, not scenario-tested.
2. **HIPAA penalties (scenario-tested)** — Educational item added, but no scenario tests knowledge of penalty tiers.

**Remaining medium priority:**
3. **Remote work/telehealth** — Increasingly relevant post-COVID but game is set in a physical hospital. Could add IT Office scene about remote access policy.
4. **Abuse/neglect mandatory reporting** — Sub-gap under permitted disclosures. Healthcare workers are mandatory reporters.

**Remaining low priority:**
5. **Marketing/fundraising restrictions** — Relevant to specific roles, not all workforce.
6. **Psychotherapy notes** — Specialized protection, relevant to behavioral health settings.
7. **State-level breach notifications** — Varies by state, hard to generalize.

---

## Content Quality Standards

When creating or reviewing HIPAA educational content for these games, apply these standards:

### Accuracy
- All HIPAA rules cited must be factually correct per current 45 CFR Part 164
- Real-world examples (breach cases, statistics) must be verifiable and current
- Penalty amounts and timelines must reflect current enforcement
- When simplifying for gameplay, never simplify to the point of being wrong

### Tone (per CLAUDE.md "Nintendo Test")
- Content must feel like game dialogue, not a compliance manual
- Correct answers get celebration; wrong answers get consequences + explanation
- NPCs teach through personality and situation, not lecture
- Feedback explains the *why*, not just the *what*

### Scenario Design
- Each scenario should test ONE primary HIPAA concept
- Choices should include: clearly correct, clearly wrong, and "sounds right but isn't" options
- Feedback must explain the rule AND the real-world consequence
- Score weights should reflect violation severity (curiosity snoop < breach coverup)

### Completeness Check
Before shipping new content:
1. Does it map to a topic in this framework?
2. Is the HIPAA rule cited accurately?
3. Does the scenario feel like a real hospital situation?
4. Are there at least 3 choice options with varied feedback?
5. Does the feedback teach, not just judge?
6. Is it listed in the Content Manifest?

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-03-01 | Initial framework created from full content audit | Claude |
| 2026-03-11 | Accuracy review: fixed 72-hour GDPR→HIPAA error, hallway conversation prohibition, law enforcement warrant oversimplification, authorization vs agreement terminology, QI/TPO authorization error, encryption addressable clarification, Min Necessary treatment exception, scoring rebalances, real-world case reference corrections. Upgraded Breach Notification Timelines from THIN→ADEQUATE. | Claude |
| 2026-03-11 | Coverage expansion: added npp_notice, social_media_slip, vendor_baa scenes. Added hipaa_penalties educational item. Wired all unassigned scenes into rooms. Fixed privacy_notice zone. Upgraded NPP, BAAs, Social Media from THIN→ADEQUATE. Coverage now: 16 STRONG, 14 ADEQUATE, 2 THIN, 4 GAP. | Claude |
