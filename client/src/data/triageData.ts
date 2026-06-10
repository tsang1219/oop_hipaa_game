/**
 * Breach Triage Encounter — Incident Sets
 *
 * Source authority: 45 CFR §164.400-414 — Breach Notification Rule
 *   §164.402 — Breach definition, encryption safe harbor, ransomware presumption
 *   §164.404 — Individual notification (without unreasonable delay, ≤60 days from discovery)
 *   §164.406 — Media notification (breaches affecting >500 residents of a state/jurisdiction)
 *   §164.408 — HHS/OCR notification (concurrent for 500+; annual log within 60 days of year-end for <500)
 *   §164.410 — Business associate notification to covered entity (≤60 days from discovery)
 *
 * OCR guidance note: Ransomware encryption of unsecured PHI is presumed a breach unless a documented
 * risk assessment demonstrates low probability of compromise (OCR Ransomware Guidance, 2016).
 *
 * Design reference: CLAUDE.md Commandment 5 (boring is a bug), Commandment 4 (NPCs are people).
 * Priya is the Privacy Officer. She is precise because she has to be — and exhausted because
 * this is her third triage queue today.
 *
 * Per CLAUDE.md: All game data lives in TypeScript constants files — not hardcoded in scenes.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type TriageOption = {
  id: string;
  label: string;          // short, punchy — fits a button
  correct: boolean;
  explanation: string;    // shown when this option is picked; teaches the rule plainly, cites CFR
};

export type TriageFollowUp = {
  notifyPrompt: string;         // e.g. "Who has to hear about this?"
  notifyOptions: TriageOption[];   // exactly 3, one correct
  timelinePrompt: string;       // e.g. "And by when?"
  timelineOptions: TriageOption[]; // exactly 3, one correct
};

export type TriageIncident = {
  id: string;
  headline: string;       // terse incident-ticket title, e.g. "LAPTOP MISSING — ONCOLOGY"
  detail: string;         // 1-2 sentences, incident-report deadpan with personality
  reportable: boolean;
  classificationExplanation: string; // shown on wrong classification; ends with CFR cite
  followUp?: TriageFollowUp;         // REQUIRED iff reportable === true
  difficulty: 1 | 2 | 3;             // drives per-incident timer (1=14s, 2=12s, 3=10s)
};

export type TriageIncidentSet = {
  id: string;                          // 'breach-triage-set-1'
  npcId: string;                       // 'priya_privacy_officer'
  npcName: string;                     // 'Priya'
  npcRole: string;                     // 'Privacy Officer'
  contextCard: { title: string; body: string };
  incidents: TriageIncident[];
  passingAccuracy: number;             // 0.7
  takeaways: [string, string];
};

// ── The 9 Incidents ──────────────────────────────────────────────────────────

const INCIDENTS: TriageIncident[] = [
  // #1 — Misdirected Fax (Difficulty 1, REPORTABLE)
  {
    id: 'misdirected-fax',
    headline: 'MISDIRECTED FAX — DISCHARGE SUMMARY',
    detail: 'A patient discharge summary was faxed to Gino\'s Pizzeria instead of the patient\'s PCP. ' +
      'Gino called the front desk, confused and mildly concerned.',
    reportable: true,
    classificationExplanation: 'This is an impermissible disclosure of unsecured PHI. ' +
      'It\'s presumed a breach unless a documented risk assessment shows low probability of compromise — ' +
      'and a pizzeria fax doesn\'t qualify. (45 CFR §164.402)',
    followUp: {
      notifyPrompt: 'Who needs to hear about this?',
      notifyOptions: [
        {
          id: 'patient-only',
          label: 'Notify the patient',
          correct: true,
          explanation: 'Correct. This breach affects fewer than 500 individuals, so individual notification is required. ' +
            'Media notice is only triggered when a breach affects more than 500 residents of a state or jurisdiction. (45 CFR §164.404, §164.406)',
        },
        {
          id: 'patient-and-media',
          label: 'Notify the patient + local media',
          correct: false,
          explanation: 'Media notification is only required when a breach affects MORE THAN 500 residents of a state or jurisdiction. ' +
            'One misdirected fax doesn\'t clear that bar. (45 CFR §164.406)',
        },
        {
          id: 'nobody',
          label: 'Nobody — it was an accident',
          correct: false,
          explanation: 'Accidental doesn\'t mean exempt. An impermissible disclosure of unsecured PHI is a breach regardless of intent, ' +
            'and affected individuals must be notified. (45 CFR §164.402, §164.404)',
        },
      ],
      timelinePrompt: 'And by when?',
      timelineOptions: [
        {
          id: 'sixty-days-annual-log',
          label: 'Within 60 days; OCR via annual log (< 500)',
          correct: true,
          explanation: 'Correct. Individual notification is required without unreasonable delay and no later than 60 days from discovery. ' +
            'For breaches affecting fewer than 500 individuals, OCR is notified via the annual log within 60 days of the calendar year end. (45 CFR §164.404, §164.408)',
        },
        {
          id: 'seventy-two-hours',
          label: 'Within 72 hours',
          correct: false,
          explanation: '72 hours is GDPR\'s timeline — not HIPAA\'s. HIPAA gives covered entities up to 60 days from discovery, ' +
            'without unreasonable delay. Don\'t let the GDPR timeline sneak into your breach response. (45 CFR §164.404)',
        },
        {
          id: 'patient-asks',
          label: 'Only if the patient asks',
          correct: false,
          explanation: 'Breach notification is not optional or conditional — affected individuals must be notified ' +
            'proactively, regardless of whether they ask. (45 CFR §164.404)',
        },
      ],
    },
    difficulty: 1,
  },

  // #2 — Unencrypted Laptop (Difficulty 1, REPORTABLE)
  {
    id: 'unencrypted-laptop',
    headline: 'LAPTOP STOLEN — STAFF PARKING LOT',
    detail: 'An unencrypted laptop containing 1,200 patient records was stolen from a staff member\'s car. ' +
      'The car was locked. The laptop was not.',
    reportable: true,
    classificationExplanation: 'Unsecured PHI (unencrypted) that was impermissibly disclosed is a reportable breach. ' +
      'The lack of encryption means the safe harbor does not apply. ' +
      'At 1,200 patients, this crosses the 500-record threshold. (45 CFR §164.402, §164.406)',
    followUp: {
      notifyPrompt: 'Who needs to hear about this?',
      notifyOptions: [
        {
          id: 'patients-ocr-media',
          label: 'Patients + OCR + prominent state media outlet',
          correct: true,
          explanation: 'Correct. 1,200 records exceeds the 500-individual threshold, triggering all three: ' +
            'individual notification (§164.404), OCR notice concurrent with patient notice (§164.408), ' +
            'and media notification for the affected state (§164.406).',
        },
        {
          id: 'patients-only',
          label: 'Patients only',
          correct: false,
          explanation: 'Breaches affecting 500 or more individuals in a state or jurisdiction also require ' +
            'media notification to a prominent outlet serving that area, AND concurrent OCR notification. ' +
            'Patients-only isn\'t enough here. (45 CFR §164.406, §164.408)',
        },
        {
          id: 'ocr-quietly',
          label: 'OCR only — quietly',
          correct: false,
          explanation: 'OCR notification alone doesn\'t fulfill the obligation. Affected individuals must be notified directly, ' +
            'and at 500+ records, media notification is also required. There is no "quiet" option for a breach this size. ' +
            '(45 CFR §164.404, §164.406, §164.408)',
        },
      ],
      timelinePrompt: 'And by when?',
      timelineOptions: [
        {
          id: 'all-three-sixty-days',
          label: 'All three: without unreasonable delay, ≤ 60 days',
          correct: true,
          explanation: 'Correct. For 500+ breaches, individual notification, media notice, AND OCR notice are all due ' +
            'without unreasonable delay and no later than 60 days from discovery. ' +
            'OCR notification is contemporaneous with — not after — patient notice. (45 CFR §164.404, §164.406, §164.408)',
        },
        {
          id: 'media-now-patients-later',
          label: 'Media immediately; patients within 6 months',
          correct: false,
          explanation: 'HIPAA does not sequence media before patients — all three notifications are due ' +
            'without unreasonable delay and no later than 60 days. Six months is not a valid timeline. (45 CFR §164.404)',
        },
        {
          id: 'annual-log-enough',
          label: 'Annual log entry is enough',
          correct: false,
          explanation: 'Annual log reporting is only for breaches affecting FEWER THAN 500 individuals. ' +
            'A 1,200-record breach requires contemporaneous OCR notification, not a year-end entry. (45 CFR §164.408)',
        },
      ],
    },
    difficulty: 1,
  },

  // #3 — Encrypted Laptop (Difficulty 2, NOT REPORTABLE)
  {
    id: 'encrypted-laptop',
    headline: 'LAPTOP LEFT IN RIDESHARE — ENCRYPTED',
    detail: 'A laptop was left in a rideshare. Full-disk AES-256 encryption, encryption key not compromised, ' +
      'device wiped remotely within two hours.',
    reportable: false,
    classificationExplanation: 'The encryption safe harbor applies. Encrypted PHI is not "unsecured PHI" under §164.402, ' +
      'so no breach notification is required — provided the encryption key was not compromised. ' +
      'This is the deliberate contrast to the unencrypted-laptop scenario. (45 CFR §164.402)',
    difficulty: 2,
  },

  // #4 — HR Snooping (Difficulty 2, REPORTABLE)
  {
    id: 'hr-snooping',
    headline: 'UNAUTHORIZED ACCESS — HR REP, BEHAVIORAL HEALTH RECORDS',
    detail: 'An HR rep accessed a coworker\'s behavioral-health visit notes the week before a promotion decision. ' +
      'No treatment, payment, or operations justification. The HR rep says they were "just curious."',
    reportable: true,
    classificationExplanation: 'Intentional unauthorized access with no job-related purpose is a breach, not an exception. ' +
      '"Staying in-house" doesn\'t protect it — the affected employee-patient must be notified. ' +
      'This affects fewer than 500, so annual OCR log applies. (45 CFR §164.402)',
    followUp: {
      notifyPrompt: 'Who needs to hear about this?',
      notifyOptions: [
        {
          id: 'affected-employee',
          label: 'The affected employee-patient',
          correct: true,
          explanation: 'Correct. The employee whose records were accessed is the affected individual. ' +
            'Internal location of the breach doesn\'t change the notification obligation. ' +
            'Fewer than 500 affected, so no media notice required. (45 CFR §164.404)',
        },
        {
          id: 'nobody-internal',
          label: 'Nobody — it stayed in-house',
          correct: false,
          explanation: '"It stayed in-house" is not a HIPAA exception. Unauthorized access to unsecured PHI — ' +
            'regardless of where the viewer works — is a breach requiring individual notification. (45 CFR §164.402, §164.404)',
        },
        {
          id: 'patient-and-media',
          label: 'Patient + local media',
          correct: false,
          explanation: 'Media notification is only required for breaches affecting more than 500 residents of a state or jurisdiction. ' +
            'One employee\'s records doesn\'t reach that threshold. (45 CFR §164.406)',
        },
      ],
      timelinePrompt: 'And by when?',
      timelineOptions: [
        {
          id: 'sixty-days-annual-ocr',
          label: 'Within 60 days; OCR annual log (< 500)',
          correct: true,
          explanation: 'Correct. Individual notification is required without unreasonable delay and no later than 60 days from discovery. ' +
            'OCR is notified via annual log for breaches affecting fewer than 500 individuals. (45 CFR §164.404, §164.408)',
        },
        {
          id: 'after-investigation',
          label: 'After the internal investigation closes',
          correct: false,
          explanation: 'The 60-day clock runs from the date of discovery — not from the end of an investigation. ' +
            'Investigation doesn\'t pause the notification obligation. (45 CFR §164.404)',
        },
        {
          id: 'not-required',
          label: 'Not required — internal matter',
          correct: false,
          explanation: 'HIPAA breach notification applies to any impermissible use or disclosure of unsecured PHI, ' +
            'including internal breaches. "Internal matter" is not an exemption. (45 CFR §164.402, §164.404)',
        },
      ],
    },
    difficulty: 2,
  },

  // #5 — Good-Faith Glance (Difficulty 2, NOT REPORTABLE)
  {
    id: 'good-faith-glance',
    headline: 'WRONG CHART OPENED — FLOAT NURSE, SELF-REPORTED',
    detail: 'A float nurse opened the wrong J. Ramirez chart, realized within seconds, closed it, and self-reported immediately. ' +
      'No further use or disclosure. No job-related need for the record was violated — it was a genuine mix-up.',
    reportable: false,
    classificationExplanation: 'This falls under the good-faith exception at §164.402(1)(i): unintentional acquisition ' +
      'by a workforce member acting within authority, with no further use or disclosure. ' +
      'Self-reporting and immediate correction are exactly why this exception exists. (45 CFR §164.402(1)(i))',
    difficulty: 2,
  },

  // #6 — Vendor Breach (Difficulty 2, REPORTABLE)
  {
    id: 'vendor-breach',
    headline: 'BUSINESS ASSOCIATE BREACH — 3,400 RECORDS EXFILTRATED',
    detail: 'The billing vendor (a business associate) reports that attackers exfiltrated 3,400 patient records ' +
      'three weeks ago. The vendor "sat on it" while investigating. Now they\'re telling us.',
    reportable: true,
    classificationExplanation: 'The BA must notify the covered entity without unreasonable delay and no later than 60 days from the BA\'s discovery (§164.410). ' +
      'The covered entity then owns individual, OCR, and media notification — 3,400 records crosses the 500 threshold. (45 CFR §164.404, §164.406, §164.408, §164.410)',
    followUp: {
      notifyPrompt: 'Who needs to hear about this — and who is responsible?',
      notifyOptions: [
        {
          id: 'ce-notifies-all-three',
          label: 'Covered entity notifies patients + OCR + media (> 500)',
          correct: true,
          explanation: 'Correct. Once the BA notifies the CE, the CE owns all downstream obligations: ' +
            'individual notification (§164.404), OCR contemporaneous notice (§164.408), and media notice since 3,400 > 500 (§164.406). ' +
            'The BA\'s obligation was to notify the CE; the CE notifies everyone else.',
        },
        {
          id: 'ba-notifies-patients',
          label: 'The vendor notifies patients directly',
          correct: false,
          explanation: 'Business associates do not notify patients directly under the Breach Notification Rule. ' +
            'The BA notifies the covered entity; the CE then notifies affected individuals. (45 CFR §164.410, §164.404)',
        },
        {
          id: 'wait-for-ba',
          label: 'Wait for the vendor to handle it',
          correct: false,
          explanation: 'The covered entity cannot delegate its breach notification obligations to the business associate. ' +
            'The CE is responsible for notifying patients and OCR once the BA reports the breach. (45 CFR §164.404, §164.410)',
        },
      ],
      timelinePrompt: 'The BA disclosed three weeks after discovery. What now?',
      timelineOptions: [
        {
          id: 'ce-sixty-days-from-ba-discovery',
          label: 'CE notifies within 60 days of BA\'s discovery date',
          correct: true,
          explanation: 'Correct. The BA had 60 days from its discovery to notify the CE (§164.410). ' +
            'The CE\'s 60-day notification clock runs from the date the BA discovered the breach — not from when the CE heard about it. ' +
            'Three weeks of BA delay counts against the clock. (45 CFR §164.404, §164.410)',
        },
        {
          id: 'sixty-days-from-ce-notification',
          label: 'CE has 60 days from when the BA told them',
          correct: false,
          explanation: 'The CE\'s timeline runs from the BA\'s discovery date — not from when the BA reported it to the CE. ' +
            'BA delay doesn\'t reset the clock; it eats into the CE\'s available time. (45 CFR §164.404, §164.410)',
        },
        {
          id: 'ba-missed-deadline',
          label: 'BA already missed the window — CE is off the hook',
          correct: false,
          explanation: 'The BA\'s potential timeline violation is a separate issue. The covered entity is never "off the hook" — ' +
            'its own breach notification obligations remain regardless of the BA\'s timeliness. (45 CFR §164.404)',
        },
      ],
    },
    difficulty: 2,
  },

  // #7 — Internal Misuse (Difficulty 2, REPORTABLE)
  {
    id: 'internal-misuse',
    headline: 'UNAUTHORIZED EXPORT — REGISTRATION CLERK, PATIENT CONTACT LIST',
    detail: 'A registration clerk exported a patient contact list and used it to advertise her personal wellness business. ' +
      'She says the email was "very tasteful." The affected patients disagree.',
    reportable: true,
    classificationExplanation: 'An impermissible use of PHI for personal financial gain is a breach. ' +
      '"Tasteful" marketing is still unauthorized disclosure. Affected patients must be notified; ' +
      'fewer than 500, so annual OCR log applies. (45 CFR §164.402)',
    followUp: {
      notifyPrompt: 'Who gets notified?',
      notifyOptions: [
        {
          id: 'affected-patients',
          label: 'The affected patients on the exported list',
          correct: true,
          explanation: 'Correct. Each individual whose PHI was used without authorization must be notified. ' +
            'Under 500 total, so no media notice required — but individual notification is mandatory. (45 CFR §164.404)',
        },
        {
          id: 'nobody-no-harm',
          label: 'Nobody — the email was harmless',
          correct: false,
          explanation: 'Harm is not a prerequisite for breach notification. An impermissible use of PHI triggers notification obligations ' +
            'regardless of the perceived impact on the individuals affected. (45 CFR §164.402, §164.404)',
        },
        {
          id: 'hr-only',
          label: 'HR only — handle it as an employment matter',
          correct: false,
          explanation: 'HR discipline and HIPAA breach notification are separate obligations. ' +
            'Treating it as only an employment matter doesn\'t satisfy the individual notification requirement. (45 CFR §164.404)',
        },
      ],
      timelinePrompt: 'When?',
      timelineOptions: [
        {
          id: 'sixty-days-annual-ocr',
          label: 'Without unreasonable delay, ≤ 60 days; OCR annual log',
          correct: true,
          explanation: 'Correct. Fewer than 500 individuals affected: individual notification within 60 days, ' +
            'OCR notification via the annual log submitted within 60 days of calendar year end. (45 CFR §164.404, §164.408)',
        },
        {
          id: 'after-termination',
          label: 'After the employee is terminated',
          correct: false,
          explanation: 'Employment actions don\'t set the breach notification timeline. ' +
            'The 60-day clock runs from discovery of the breach — not from resolution of internal HR processes. (45 CFR §164.404)',
        },
        {
          id: 'only-if-complained',
          label: 'Only if patients complain',
          correct: false,
          explanation: 'HIPAA breach notification is proactive — covered entities must notify individuals without waiting for complaints. ' +
            'Waiting for a patient to raise the issue is not compliant. (45 CFR §164.404)',
        },
      ],
    },
    difficulty: 2,
  },

  // #8 — Deceased Records (Difficulty 3, NOT REPORTABLE)
  {
    id: 'deceased-records',
    headline: 'HISTORICAL RECORDS RELEASED — PATIENT DECEASED 1962',
    detail: 'A historical society requested and received medical records for a patient who died in 1962. ' +
      'The records were released without a valid authorization form on file.',
    reportable: false,
    classificationExplanation: 'HIPAA PHI protections apply for 50 years after an individual\'s death (§164.502(f)). ' +
      'A patient who died in 1962 is more than 60 years deceased — these records are no longer PHI under HIPAA, ' +
      'so no breach notification applies. This is the hardest call in the set. (45 CFR §164.502(f))',
    difficulty: 3,
  },

  // #9 — Ransomware (Difficulty 3, REPORTABLE)
  {
    id: 'ransomware',
    headline: 'RANSOMWARE — FILE SERVER ENCRYPTED, 2,800 RECORDS AT RISK',
    detail: 'Ransomware encrypted the file server holding unsecured PHI for 2,800 patients. ' +
      'No exfiltration proof either way — attackers left no calling card.',
    reportable: true,
    classificationExplanation: 'Per OCR guidance, ransomware encryption of unsecured PHI is PRESUMED a breach ' +
      'unless a documented risk assessment demonstrates low probability of compromise. ' +
      'No exfiltration proof doesn\'t mean no breach — the presumption flips the burden of proof. ' +
      '2,800 records crosses the 500 threshold. (45 CFR §164.402; OCR Ransomware Guidance 2016)',
    followUp: {
      notifyPrompt: 'Ransomware, 2,800 patients, no confirmed exfil. Who gets notified?',
      notifyOptions: [
        {
          id: 'patients-ocr-media',
          label: 'Patients + OCR + prominent state media outlet',
          correct: true,
          explanation: 'Correct. The breach presumption applies: ransomware on unsecured PHI is a breach unless ' +
            'a documented risk assessment shows otherwise. 2,800 records exceeds the 500 threshold — ' +
            'all three notifications are required. (45 CFR §164.402, §164.404, §164.406, §164.408)',
        },
        {
          id: 'wait-for-forensics',
          label: 'Wait for forensics to confirm exfiltration',
          correct: false,
          explanation: 'The presumption of breach doesn\'t require confirmed exfiltration. ' +
            'Waiting for a forensic report before notifying is not compliant unless you can affirmatively disprove ' +
            'the probability of compromise through a documented risk assessment. (45 CFR §164.402; OCR Ransomware Guidance)',
        },
        {
          id: 'no-exfil-no-breach',
          label: 'No confirmed exfil = no breach',
          correct: false,
          explanation: 'This is the most common ransomware misconception. OCR guidance explicitly reverses this logic: ' +
            'ransomware on unsecured PHI IS a breach unless you can prove low probability of compromise — ' +
            'not the other way around. (45 CFR §164.402; OCR Ransomware Guidance 2016)',
        },
      ],
      timelinePrompt: 'Timeline?',
      timelineOptions: [
        {
          id: 'all-sixty-days-concurrent-ocr',
          label: 'Without unreasonable delay, ≤ 60 days; OCR concurrent (500+)',
          correct: true,
          explanation: 'Correct. All three notifications are due without unreasonable delay and no later than 60 days from discovery. ' +
            'At 2,800 records (> 500), OCR notification is concurrent with — not after — individual notice. (45 CFR §164.404, §164.406, §164.408)',
        },
        {
          id: 'after-remediation',
          label: 'After the systems are restored',
          correct: false,
          explanation: 'Remediation does not pause the notification clock. The 60-day deadline runs from discovery of the incident, ' +
            'not from the resolution of the technical response. (45 CFR §164.404)',
        },
        {
          id: 'annual-log-ok',
          label: 'Annual log to OCR is sufficient',
          correct: false,
          explanation: 'Annual log reporting is for breaches affecting fewer than 500 individuals. ' +
            'At 2,800 records, OCR notification must be contemporaneous with patient notification — not year-end. (45 CFR §164.408)',
        },
      ],
    },
    difficulty: 3,
  },
];

// ── Incident Set ─────────────────────────────────────────────────────────────

const BREACH_TRIAGE_SET_1: TriageIncidentSet = {
  id: 'breach-triage-set-1',
  npcId: 'priya_privacy_officer',
  npcName: 'Priya',
  npcRole: 'Privacy Officer',
  contextCard: {
    title: 'Priya\'s Triage Queue',
    body: 'Priya slides a tablet across the counter without looking up. ' +
      '"Third queue today. I need someone to classify these as reportable breaches or not — ' +
      'and for the reportable ones, who we notify and when. HIPAA is very specific. Be more specific." ' +
      'She goes back to typing. Fast.',
  },
  incidents: INCIDENTS,
  passingAccuracy: 0.7,
  takeaways: [
    'Breach presumption + encryption safe harbor: ransomware on unsecured PHI is presumed a breach unless you can disprove it. ' +
      'Encrypted PHI that stays encrypted is never unsecured PHI — no notification required.',
    '60-day clock, 500-record threshold: individual notification is always due within 60 days of discovery. ' +
      'Cross 500 residents in a state or jurisdiction and media + concurrent OCR notice kick in automatically.',
  ],
};

// ── Exported map and lookup ──────────────────────────────────────────────────

export const BREACH_TRIAGE_SETS: Record<string, TriageIncidentSet> = {
  [BREACH_TRIAGE_SET_1.id]: BREACH_TRIAGE_SET_1,
};

/**
 * Look up a triage incident set by ID.
 * Returns undefined for unknown IDs — does NOT throw.
 */
export function getTriageIncidentSet(id: string): TriageIncidentSet | undefined {
  return BREACH_TRIAGE_SETS[id];
}
