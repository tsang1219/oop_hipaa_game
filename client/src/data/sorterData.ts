/**
 * PHI Sorter Encounter — Document Sets
 *
 * Source authority: 45 CFR §164.514(b)(2) — Safe Harbor de-identification standard (18 identifiers)
 * Design reference: ENHANCEMENT_BRIEF.md §4.1 — PHI Sorter mini-game encounter
 *
 * These constants are the single source of truth for all PHI Sorter encounter content.
 * Three document sets scale in difficulty: Act 1 (obvious), Act 2 (subtle), Act 3 (edge cases).
 *
 * Phase 22 additions: SorterChart and SorterHoldIt types added. Every item now carries a
 * `chart` object (humorous fake patient record). Exactly one item per set has a `holdIt`
 * Phoenix-Wright-style reveal. Humor tone: deadpan Daria/Veep, never surreal, never punching down.
 *
 * Recurring patients (documented for content consistency):
 *   - Mrs. Henderson: s1-patient-name (intake form, Reception) + s3-zip5/s3-fax-number (Records)
 *   - Mr. Okonkwo: s2-biometric + s2-diagnosis-with-mrn + s2-portal-url (MRN #4821 token) + s3-account-number
 *
 * The Eighteen codex (HIPAA-is-the-game pass): identifierType is the grant channel for
 * the collection mechanic (phi18.ts). Sorter sets cover 17 of 18; #17 (full-face photos)
 * is granted by the break-room corkboard. Coverage: S1 → 1,2,3,4,6,7 · S2 → 8,9,12,13,14,15,16
 * · S3 → 2,3,5,10,11,18.
 *
 * Per CLAUDE.md: All game data lives in TypeScript constants files — not hardcoded in scenes.
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** The 18 Safe Harbor identifier types per 45 CFR §164.514(b)(2). */
export type SorterIdentifierType =
  | 'name'
  | 'geographic'
  | 'date'
  | 'phone'
  | 'fax'
  | 'email'
  | 'ssn'
  | 'mrn'
  | 'plan_id'
  | 'account'
  | 'license'
  | 'vehicle'
  | 'device_serial'
  | 'url'
  | 'ip_address'
  | 'biometric'
  | 'photo'
  | 'other';

/** Patient chart fields rendered in the sortable card. Humor lives in optional free-text fields. */
export type SorterChart = {
  patientName?: string;         // "Henderson, Margaret" — deadpan, recurring-when-intentional.
                                // Rendered as INITIALS only (DeskDocument.toInitials): a full
                                // name is Safe Harbor identifier #1, so it must never sit legibly
                                // on a card whose correct answer is KEEP. Clearly-institutional
                                // docs (supply orders, menus, aggregate reports) carry NO name.
  age?: number;                 // numeric; for Set 3 age-90+ edge case, store as 91/92
  role?: string;                // "Retired postal inspector" — humor surface
  emergencyContact?: string;    // "Mr. Whiskers (cat) — no phone, lives in same house" — humor surface
  reasonForVisit?: string;      // "Says her son keeps forwarding chain emails about her hip" — humor surface
  doctorNote?: string;          // "Patient brought their own thermometer 'for accuracy comparison'" — humor surface
  miscField?: { label: string; value: string };  // catch-all (e.g., {label: "Insurance", value: "Medicare + the supplemental her son set up, allegedly"})
};

/** Dramatic Phoenix-Wright-style reveal for the one designated tricky item per set. */
export type SorterHoldIt = {
  npcLine: string;              // 1-2 sentences — "HOLD IT! That visit date is the giveaway..."
  educationalBeat: string;      // ≤2 sentences — plain language, no statute citation in the line itself
};

/** A single sortable item presented to the player. */
export type SorterItem = {
  id: string;
  label: string;               // BACKWARD-COMPAT — preserved for grep/search; UI reads from `chart` now
  category: 'phi' | 'not_phi';
  identifierType?: SorterIdentifierType; // Set when a phi item maps to one of the 18 Safe Harbor
                               // identifiers — this is The Eighteen codex grant channel (phi18.ts).
                               // OMIT for PHI that's identifiable without being on the 18 list
                               // (e.g., employer details) — those teach that PHI > the checklist.
  explanation: string;         // Shown on incorrect drop — explains the rule
  // PHASE 22 ADDITIONS:
  chart: SorterChart;          // REQUIRED on every item
  holdIt?: SorterHoldIt;       // PRESENT on exactly one item per set
  // FEEL PASS: at-a-glance recognition so the player reads an ICON, not a wall
  // of text, under the shift clock.
  icon?: string;               // Emoji glyph. Falls back to identifier-type default.
  docKind?: string;            // "Intake Form", "Supply Order" — card sub-header.
                               // When set AND chart.patientName is absent, the card
                               // renders as a non-patient document (a clear KEEP).
};

/** Default glyph per Safe Harbor identifier — used when an item omits `icon`. */
const ICON_BY_IDENTIFIER: Record<SorterIdentifierType, string> = {
  name: '🧑', geographic: '🏠', date: '📅', phone: '📞', fax: '📠',
  email: '✉️', ssn: '🔢', mrn: '🏷️', plan_id: '🪪', account: '💳',
  license: '📜', vehicle: '🚗', device_serial: '🔧', url: '🔗',
  ip_address: '🌐', biometric: '👁️', photo: '📷', other: '📄',
};

/** At-a-glance icon for a sortable item. Explicit `icon` wins; then identifier
 *  default (PHI); then a neutral document glyph for non-PHI paperwork. */
export function getSorterItemIcon(item: SorterItem): string {
  if (item.icon) return item.icon;
  if (item.category === 'phi' && item.identifierType) {
    return ICON_BY_IDENTIFIER[item.identifierType];
  }
  return '📋';
}

/** Station identity — what makes THIS sorter instance different (HIPAA-is-the-game
 *  pass). The label + tagline sit on the desk as a placard; the desk colors
 *  re-skin the surface so three visits read as three places, not one repeated. */
export type SorterStation = {
  label: string;      // "LAB MANIFEST STATION"
  tagline: string;    // the set's one-line lesson — its reason to exist
  deskBase: string;   // CSS color — desk surface
  deskEdge: string;   // CSS color — desk border
};

/** A full document set for one PHI Sorter encounter instance. */
export type SorterDocumentSet = {
  id: string;                  // 'phi-sorter-set-1', 'phi-sorter-set-2', 'phi-sorter-set-3'
  act: 1 | 2 | 3;
  triggerLocation: 'reception' | 'lab' | 'medical_records';
  npcId: string;               // For NPC-attributed framing in context card
  contextCard: { title: string; body: string }; // SorterContextCard props
  station: SorterStation;
  items: SorterItem[];
  passingAccuracy: number;     // 0.0–1.0; 0.7 default
  takeaways: [string, string]; // EncounterDebrief takeaways (1-2 short HIPAA learnings)
  shiftSeconds: number;        // Phase 24: per-set soft countdown — encounter wraps at 0:00, unstamped items don't score
};

// ── Set 1: Reception (Act 1, obvious) ───────────────────────────────────────

const SET_1: SorterDocumentSet = {
  id: 'phi-sorter-set-1',
  act: 1,
  triggerLocation: 'reception',
  npcId: 'receptionist_riley',
  contextCard: {
    title: 'Riley Needs a Hand',
    body: 'Riley slides a stack of patient intake forms across the desk. ' +
      '"Before these go to the auditor, I need to mark which fields count as PHI — ' +
      'Protected Health Information. Can you help me sort out what stays and what\'s fine to share?"',
  },
  station: {
    label: 'INTAKE DESK',
    tagline: 'The obvious ones — identifiers live where people write them.',
    deskBase: '#6B4A2F',
    deskEdge: '#3d2817',
  },
  items: [
    {
      id: 's1-patient-name',
      // Recurring patient: Henderson, Margaret also appears in s3-fax-number (Records release form)
      label: 'Patient Name: Margaret Henderson',
      category: 'phi',
      identifierType: 'name',
      explanation: 'A patient\'s name is identifier #1 under 45 CFR §164.514(b)(2). ' +
        'On a hospital intake form the health-care connection is implied — this is PHI.',
      chart: {
        patientName: 'Henderson, Margaret',
        age: 67,
        role: 'Retired postal inspector',
        emergencyContact: 'Henderson, Gerald (husband) — "He knows where everything is."',
        reasonForVisit: 'Annual check-up. Mentioned her son keeps forwarding her chain emails about her hip.',
      },
    },
    {
      id: 's1-ssn',
      label: 'SSN: 447-23-0891',
      category: 'phi',
      identifierType: 'ssn',
      explanation: 'Social Security Numbers are identifier #7 under the Safe Harbor rule. ' +
        'They directly and uniquely identify an individual — always PHI in a health-care context.',
      chart: {
        patientName: 'Rivera, Carlos',
        age: 44,
        role: 'High school band director',
        doctorNote: 'Patient arrived 20 minutes early and has been very patient about waiting. Concerning.',
      },
    },
    {
      id: 's1-dob',
      label: 'Date of Birth: 03/14/1968',
      category: 'phi',
      identifierType: 'date',
      explanation: 'Specific dates — birth, admission, discharge — are identifier #3 ' +
        'under §164.514(b)(2). Year alone is acceptable; a full date is not.',
      chart: {
        patientName: 'Patel, Sunita',
        age: 56,
        role: 'Veterinarian (retired, technically)',
        emergencyContact: 'Mr. Whiskers (cat) — no phone, lives in same house',
        reasonForVisit: 'Routine follow-up.',
      },
      holdIt: {
        npcLine: 'HOLD IT! A full birth date — month, day, and year — is identifier #3. ' +
          'The year by itself would be fine. The full date is not.',
        educationalBeat: 'Safe Harbor requires removing all elements of dates more specific than year. ' +
          'Full dates of birth, admission, and discharge must be redacted to just the year.',
      },
    },
    {
      id: 's1-home-address',
      label: 'Home Address: 147 Birchwood Dr',
      category: 'phi',
      identifierType: 'geographic',
      explanation: 'Street-level geographic data is identifier #2 under the Safe Harbor rule. ' +
        'A patient\'s home address paired with health information is PHI.',
      chart: {
        patientName: 'Goldberg, Miriam',
        age: 72,
        miscField: {
          label: 'Insurance',
          value: 'Medicare + the supplemental her son set up, allegedly',
        },
      },
    },
    {
      id: 's1-phone',
      label: 'Phone: (555) 204-8833',
      category: 'phi',
      identifierType: 'phone',
      explanation: 'Telephone numbers are identifier #4 under 45 CFR §164.514(b)(2). ' +
        'A patient\'s phone number on an intake form is linked to their health-care relationship — PHI.',
      chart: {
        patientName: 'Larsson, Erik',
        age: 38,
        role: 'Software developer, reportedly',
        doctorNote: 'Patient asked if we have a standing desk option in the waiting room.',
        reasonForVisit: 'Wrist pain. Refused to elaborate on how it started.',
      },
    },
    {
      id: 's1-email',
      label: 'Email: m.nguyen.patient@webmail.com',
      category: 'phi',
      identifierType: 'email',
      explanation: 'Email addresses are identifier #6 under the Safe Harbor rule. ' +
        'An email address on a patient intake form connects that address to their health-care record — PHI.',
      chart: {
        patientName: 'Nguyen, Minh',
        age: 29,
        emergencyContact: 'Nguyen, Linh (mother) — "She will absolutely come in person."',
        reasonForVisit: 'First visit. Prefers email contact; confirmed twice.',
      },
    },
    {
      // Deliberately NO identifierType: employer is NOT one of the 18 — this item
      // teaches that the Safe Harbor list is the de-ID checklist, not the PHI definition.
      id: 's1-employer-name',
      label: 'Employer: Riverside Unified School District',
      category: 'phi',
      icon: '🏢',
      explanation: 'Sneaky one: employer isn\'t on the Safe Harbor 18 at all. But PHI is broader than the checklist — ' +
        'any individually identifiable information on a patient record counts, and an employer narrows one patient down fast. ' +
        'Redact it. (45 CFR §160.103 — the definition, not the de-ID list)',
      chart: {
        patientName: 'Park, Ji-Woo',
        age: 33,
        role: 'Third-grade teacher',
        doctorNote: 'Patient is visibly exhausted. Mentioned "standardized testing week" three times.',
      },
    },
    {
      id: 's1-hospital-address',
      label: 'Hospital Address: 800 Valley Blvd',
      category: 'not_phi',
      icon: '🏥',
      docKind: 'Facility Form',
      explanation: 'This is an organizational address — it identifies the hospital, not a patient. ' +
        'Institutional details without a patient identifier are not PHI under §164.514(b)(2).',
      chart: {
        miscField: {
          label: 'Document field',
          value: 'Facility address — printed on all forms',
        },
      },
    },
    {
      id: 's1-room-temp',
      label: 'Room Temperature: 68°F',
      category: 'not_phi',
      icon: '🌡️',
      docKind: 'Facilities Log',
      explanation: 'Environmental measurements have no connection to a specific patient\'s ' +
        'health, condition, or payment. No identifier + no health link = not PHI.',
      chart: {
        miscField: {
          label: 'Logged by',
          value: 'Facilities. Thermostat has been "broken" since 2019 per facilities dept.',
        },
      },
    },
    {
      id: 's1-marital-status',
      label: 'Marital Status: Married',
      category: 'not_phi',
      explanation: 'Marital status is not one of the 18 Safe Harbor identifiers under §164.514(b)(2). ' +
        'Without a patient identifier attached, this demographic detail alone does not constitute PHI.',
      chart: {
        patientName: 'Mendez, Roberto',
        doctorNote: 'Patient asked if this field was legally required. Reasonable question, honestly.',
      },
    },
    {
      // Clearly-safe, NO patient name — breaks the "everything has a name, always redact" reflex.
      id: 's1-supply-order',
      label: 'Supply Order: Exam gloves, size M ×4 boxes',
      category: 'not_phi',
      icon: '📦',
      docKind: 'Supply Order',
      explanation: 'A stockroom reorder for gloves. No patient, no identifier, no health information — ' +
        'this is inventory paperwork, not PHI.',
      chart: {
        miscField: { label: 'Requested by', value: 'Front desk. "We are ALWAYS out of mediums."' },
      },
    },
    {
      id: 's1-cafeteria-menu',
      label: 'Cafeteria Menu: Thursday',
      category: 'not_phi',
      icon: '🍽️',
      docKind: 'Cafeteria Menu',
      explanation: 'Thursday\'s lunch special is not Protected Health Information. ' +
        'No individual, no identifier — nothing to redact.',
      chart: {
        miscField: { label: 'Special', value: 'Meatloaf. Again. Pudding cups while supplies last.' },
      },
    },
  ],
  passingAccuracy: 0.7,
  shiftSeconds: 96,
  takeaways: [
    'PHI = an identifier PLUS a connection to health care or payment. ' +
      'In a hospital intake form, that health link is always implied for patient-specific fields.',
    'Organizational details — hospital address, room temperature — identify the facility, ' +
      'not the patient. They\'re not PHI under the Safe Harbor rule.',
  ],
};

// ── Set 2: Lab (Act 2, subtle) ───────────────────────────────────────────────

const SET_2: SorterDocumentSet = {
  id: 'phi-sorter-set-2',
  act: 2,
  triggerLocation: 'lab',
  npcId: 'lab_tech',
  contextCard: {
    title: 'Sample Manifest Review',
    body: 'The lab tech looks up from the centrifuge. ' +
      '"I need a second pair of eyes on these sample labels before they go on the external manifest. ' +
      'Some of these details I\'m not sure about — PHI or not PHI? The less-obvious ones trip me up."',
  },
  station: {
    label: 'LAB MANIFEST STATION',
    tagline: 'No names here — the identifiers hide in serials, IPs, and codes.',
    deskBase: '#3A4A5C',
    deskEdge: '#1e2a38',
  },
  items: [
    {
      id: 's2-device-serial',
      label: 'Device Serial: MRI-3847-2291',
      category: 'phi',
      identifierType: 'device_serial',
      explanation: 'Device identifiers and serial numbers are identifier #13 under §164.514(b)(2). ' +
        'A device serial linked to a patient\'s scan record is PHI — even without a name on the label.',
      chart: {
        patientName: 'Tovar, Elena',
        age: 48,
        role: 'Architect',
        doctorNote: 'Patient reviewed the MRI equipment specs before the scan. Took about twelve minutes.',
        miscField: {
          label: 'MRI unit',
          value: 'Unit 4, 3rd floor — serial logged to patient record per protocol',
        },
      },
    },
    {
      id: 's2-ip-address',
      label: 'IP Address: 192.168.4.107 (patient portal session)',
      category: 'phi',
      identifierType: 'ip_address',
      explanation: 'IP addresses are identifier #15 under the Safe Harbor rule. ' +
        'When an IP is associated with a patient\'s portal session, it connects an identifier to health care — PHI.',
      chart: {
        patientName: 'Larsson, Ingrid',
        age: 34,
        emergencyContact: 'Larsson, Per (brother) — "He lives in Sweden, call anyway."',
        miscField: {
          label: 'Portal session log',
          value: 'Patient accessed lab results at 11:42 PM. No notes on why.',
        },
      },
    },
    {
      id: 's2-biometric',
      label: 'Biometric: Left index fingerprint scan',
      category: 'phi',
      identifierType: 'biometric',
      explanation: 'Biometric identifiers — fingerprints, voice prints — are identifier #16 ' +
        'under §164.514(b)(2). A fingerprint uniquely identifies an individual; in a health context, it\'s PHI.',
      chart: {
        patientName: 'Okonkwo, Chidi',
        // Recurring patient: Okonkwo, Chidi also appears in s3-account-number (Records billing)
        age: 41,
        role: 'Financial analyst',
        doctorNote: 'Patient used hospital check-in kiosk biometric scan. Went smoothly, surprisingly.',
      },
    },
    {
      id: 's2-diagnosis-with-mrn',
      label: 'ICD-10: F33.1 (Major Depressive Disorder) — Patient #4821',
      category: 'phi',
      identifierType: 'mrn',
      explanation: 'PHI = identifier + health connection. F33.1 alone is just a code. ' +
        'F33.1 + patient record #4821 links a diagnosis to a specific person — that combination is PHI. ' +
        'Medical record numbers are identifier #8 under §164.514(b)(2).',
      chart: {
        patientName: 'Okonkwo, Chidi',
        // Recurring patient: same Okonkwo as s2-biometric and s3-account-number
        miscField: {
          label: 'Chart note',
          value: 'MRN #4821 — diagnosis code linked directly to patient record',
        },
      },
      holdIt: {
        npcLine: 'HOLD IT! See that? F33.1 alone is just a code. ' +
          'Pair it with patient #4821 and you\'ve got PHI — even with no name on the chart.',
        educationalBeat: 'Medical record numbers count as identifiers under Safe Harbor. ' +
          'A diagnosis code becomes PHI the moment you can connect it to a specific person.',
      },
    },
    {
      id: 's2-license-plate',
      label: 'License Plate: 7TBZ-483 (vehicle used in transport)',
      category: 'phi',
      identifierType: 'vehicle',
      explanation: 'Vehicle identifiers and serial numbers — including license plates — are identifier #12 ' +
        'under the Safe Harbor rule. A plate tied to a patient transport record is PHI.',
      chart: {
        patientName: 'Reyes-Smith, Marcus',
        age: 27,
        role: 'Grad student',
        reasonForVisit: 'Non-emergency transport from off-site clinic. Plate logged per transport protocol.',
        doctorNote: 'Patient asked if the transport counts as a co-pay visit. Asked three times.',
      },
    },
    {
      id: 's2-plan-id',
      label: 'Health Plan ID: BCX-7712-P-00234',
      category: 'phi',
      identifierType: 'plan_id',
      explanation: 'Health plan beneficiary numbers are identifier #9 under 45 CFR §164.514(b)(2). ' +
        'A health plan ID on a lab manifest ties the sample to a specific insured individual — PHI.',
      chart: {
        patientName: 'Patel, Anand',
        age: 52,
        emergencyContact: 'Patel, Priya (wife) — already knows everything, per patient.',
        miscField: {
          label: 'Insurance',
          value: 'BlueCross plan ID on file — beneficiary number BCX-7712-P-00234',
        },
      },
    },
    {
      id: 's2-diagnosis-only',
      label: 'ICD-10 Code: F33.1',
      category: 'not_phi',
      icon: '📊',
      docKind: 'Aggregate Report',
      explanation: 'A diagnosis code by itself is not PHI. PHI requires an identifier PLUS a health connection. ' +
        'F33.1 alone identifies a condition, not a person. Pair it with a patient record number and it becomes PHI.',
      chart: {
        miscField: {
          label: 'Code only',
          value: 'F33.1 — appears on aggregate stats report, no patient ID attached',
        },
      },
    },
    {
      // Recurring patient: Okonkwo's MRN #4821 (s2-diagnosis-with-mrn) is the token in this URL
      id: 's2-portal-url',
      label: 'Portal URL: results.mercygeneral.org/r/4821-OKO',
      category: 'phi',
      identifierType: 'url',
      explanation: 'Web URLs are identifier #14 under §164.514(b)(2) when they can be linked to an individual. ' +
        'A results link carrying a patient record token (4821 — that\'s Mr. Okonkwo\'s MRN) opens one person\'s chart. ' +
        'The hospital homepage is fine; this link is PHI.',
      chart: {
        patientName: 'Okonkwo, Chidi',
        age: 41,
        miscField: {
          label: 'Manifest note',
          value: 'Results link pasted in "for convenience." Convenience noted. Redact it anyway.',
        },
      },
    },
    {
      id: 's2-lab-test-type',
      label: 'Lab Test Type: Complete Blood Count',
      category: 'not_phi',
      icon: '🧪',
      docKind: 'Lab Reference',
      explanation: 'A procedure category describes what kind of test was run — it doesn\'t identify any specific patient. ' +
        'Without an attached identifier, "complete blood count" is not PHI under §164.514(b)(2).',
      chart: {
        miscField: {
          label: 'Test category',
          value: 'CBC — listed on supply order form, no patient identifier in this field',
        },
      },
    },
    {
      id: 's2-sample-volume',
      label: 'Sample Volume: 5mL',
      category: 'not_phi',
      icon: '🧪',
      docKind: 'Lab Protocol',
      explanation: 'A measurement without any patient identifier is not PHI. ' +
        '"5mL" doesn\'t connect to any individual\'s health care or payment information.',
      chart: {
        miscField: {
          label: 'Volume logged',
          value: '5mL — lab protocol field, no patient ID in this column',
        },
        doctorNote: 'Sample collection went fine. Patient was impressed it only took "like two seconds."',
      },
    },
    {
      id: 's2-specimen-type',
      label: 'Specimen Type: Venous Blood',
      category: 'not_phi',
      icon: '🧫',
      docKind: 'Manifest Header',
      explanation: 'A specimen type categorizes the kind of biological sample collected. ' +
        'Without a patient identifier, "venous blood" describes a category, not a person — not PHI under §164.514(b)(2).',
      chart: {
        miscField: {
          label: 'Specimen category',
          value: 'Venous blood — appears in manifest header, shared across multiple samples',
        },
      },
    },
    {
      // Clearly-safe, NO patient name — equipment paperwork, obvious KEEP.
      id: 's2-centrifuge-log',
      label: 'Equipment Log: Centrifuge #3 calibration',
      category: 'not_phi',
      icon: '⚙️',
      docKind: 'Equipment Log',
      explanation: 'Calibration records for lab equipment contain no patient and no identifier. ' +
        'Machine maintenance is not Protected Health Information.',
      chart: {
        miscField: { label: 'Note', value: 'Calibrated. Still makes that noise. Tech says it\'s "fine."' },
      },
    },
    {
      id: 's2-biohazard-notice',
      label: 'Biohazard Disposal Schedule',
      category: 'not_phi',
      icon: '☣️',
      docKind: 'Facility Notice',
      explanation: 'A posted disposal schedule is facility signage — no individual is identified. ' +
        'Not PHI under §164.514(b)(2).',
      chart: {
        miscField: { label: 'Pickup', value: 'Tuesdays & Fridays. Do NOT prop the red door open again.' },
      },
    },
  ],
  passingAccuracy: 0.7,
  shiftSeconds: 88, // 13 items post-Eighteen additions — was 82 at 12 items
  takeaways: [
    'Device serials, IP addresses, and biometric identifiers are all PHI under §164.514(b)(2) — ' +
      'even when a patient\'s name doesn\'t appear on the document.',
    'A diagnosis code alone is not PHI. Add a patient identifier — a record number, a name, a device serial — ' +
      'and it becomes PHI. The two-part rule: identifier + health/payment connection.',
  ],
};

// ── Set 3: Medical Records (Act 3, edge cases) ───────────────────────────────

const SET_3: SorterDocumentSet = {
  id: 'phi-sorter-set-3',
  act: 3,
  triggerLocation: 'medical_records',
  npcId: 'records_clerk',
  contextCard: {
    title: 'De-Identification Edge Cases',
    body: 'The records clerk pulls up a research data set awaiting approval. ' +
      '"These are trickier than they look. Some of these date and location fields — ' +
      'Safe Harbor says some are fine and some aren\'t. Help me flag anything that blocks de-identification."',
  },
  station: {
    label: 'DE-ID REVIEW DESK',
    tagline: 'Safe Harbor edge cases — the year survives, the month doesn\'t.',
    deskBase: '#3E5244',
    deskEdge: '#22301f',
  },
  items: [
    {
      id: 's3-zip5',
      label: 'ZIP Code: 90210',
      category: 'phi',
      identifierType: 'geographic',
      explanation: 'A 5-digit ZIP code is a geographic identifier under §164.514(b)(2). ' +
        'Safe Harbor allows only 3-digit ZIP prefixes — and only in geographic units with more than 20,000 people. ' +
        'A full ZIP code must be removed to de-identify.',
      chart: {
        patientName: 'Henderson, Margaret',
        // Recurring patient: same Mrs. Henderson from s1-patient-name (Reception intake form)
        age: 67,
        role: 'Retired postal inspector',
        miscField: {
          label: 'ZIP field',
          value: '90210 — five digits, pulled from original intake form on file',
        },
        reasonForVisit: 'Records release form. Patient confirmed address has not changed since 1997.',
      },
    },
    {
      id: 's3-admission-month-year',
      label: 'Admission Date: March 2024',
      category: 'phi',
      identifierType: 'date',
      explanation: 'All elements of dates more specific than year are PHI for individuals under §164.514(b)(2). ' +
        '"March 2024" includes a month — that\'s more specific than year alone. Year alone is acceptable; month + year is not.',
      chart: {
        patientName: 'Park, Ji-Ho',
        age: 58,
        doctorNote: 'Admission note includes month — flagged for de-id review prior to research export.',
        miscField: {
          label: 'Admission field',
          value: 'March 2024 — month + year, not truncated to year-only',
        },
      },
    },
    {
      id: 's3-age-90-plus',
      label: 'Age: 91 years',
      category: 'phi',
      identifierType: 'date',
      explanation: 'Ages 90 and above are explicitly PHI under §164.514(b)(2) — they live inside the dates element (#3) ' +
        'because so few people reach 90+ that age alone re-identifies them. ' +
        'Ages below 90 may be retained; ages 90+ must be grouped as "90 or older."',
      chart: {
        patientName: 'Goldberg, Bernard',
        age: 91,
        emergencyContact: 'Goldberg, Ruth (daughter) — "She has already called twice today."',
        reasonForVisit: 'Routine follow-up. Patient arrived 45 minutes early and beat the staff in.',
        doctorNote: 'Alert and oriented x4. Brought his own reading glasses AND a backup pair.',
      },
    },
    {
      id: 's3-fax-number',
      label: 'Fax Number: (555) 312-0099',
      category: 'phi',
      identifierType: 'fax',
      explanation: 'Fax numbers are identifier #5 under 45 CFR §164.514(b)(2). ' +
        'A fax number on a records release form is a patient-linked contact point — PHI.',
      chart: {
        patientName: 'Henderson, Margaret',
        // Recurring patient: same Mrs. Henderson from s1-patient-name (Reception intake form)
        age: 67,
        miscField: {
          label: 'Release destination fax',
          value: '(555) 312-0099 — patient\'s doctor\'s office, per release authorization form',
        },
        doctorNote: 'Patient confirmed fax number by reading it aloud, twice, to make sure.',
      },
    },
    {
      id: 's3-account-number',
      label: 'Account Number: ACCT-88291-HN',
      category: 'phi',
      identifierType: 'account',
      explanation: 'Account numbers are identifier #10 under 45 CFR §164.514(b)(2). ' +
        'A hospital account number ties billing records directly to a patient\'s health-care services — PHI.',
      chart: {
        patientName: 'Okonkwo, Chidi',
        // Recurring patient: same Okonkwo as s2-biometric and s2-diagnosis-with-mrn (Lab)
        age: 41,
        miscField: {
          label: 'Billing account',
          value: 'ACCT-88291-HN — linked to Lab visit from earlier this quarter',
        },
      },
    },
    {
      id: 's3-zip3',
      label: 'ZIP Prefix: 902',
      category: 'not_phi',
      explanation: 'Safe Harbor allows 3-digit ZIP prefixes when the geographic unit they represent ' +
        'contains more than 20,000 people. "902" covers a large area of Los Angeles — it passes Safe Harbor. ' +
        'A full 5-digit ZIP does not.',
      chart: {
        patientName: 'Rivera, Tomás',
        miscField: {
          label: 'Geographic field',
          value: '902 — truncated from full ZIP per de-identification protocol',
        },
      },
      holdIt: {
        npcLine: 'HOLD IT! That\'s the right call — ZIP prefix 902 passes Safe Harbor because it covers more than 20,000 people. ' +
          'But a rural ZIP3 serving a tiny population? That would fail.',
        educationalBeat: 'Safe Harbor permits 3-digit ZIP codes only when the geographic area they cover exceeds 20,000 residents. ' +
          'The same prefix in a low-population rural county would still need to be redacted.',
      },
    },
    {
      id: 's3-cdl-number',
      label: 'CDL #: D8802-44519 (DOT physical on file)',
      category: 'phi',
      identifierType: 'license',
      explanation: 'Certificate and license numbers are identifier #11 under §164.514(b)(2). ' +
        'A commercial driver\'s license number on a DOT physical ties the exam record to exactly one driver — PHI.',
      chart: {
        patientName: 'Delgado, Ruben',
        age: 54,
        role: 'Long-haul driver',
        doctorNote: 'DOT physical: passed. Asked for a note saying he passed "with distinction." There is no such note.',
        miscField: {
          label: 'License field',
          value: 'CDL D8802-44519 — copied from the card, per DOT exam protocol',
        },
      },
    },
    {
      id: 's3-year-only',
      label: 'Year Only: 2024',
      category: 'not_phi',
      explanation: 'Under §164.514(b)(2), year alone is acceptable in de-identified data. ' +
        'The rule removes all elements of dates MORE SPECIFIC than year — but year by itself is not an identifier. ' +
        'Limited data sets (different from Safe Harbor) may retain full dates.',
      chart: {
        patientName: 'Nguyen, Bao',
        miscField: {
          label: 'Date field',
          value: '2024 — year retained after full date was redacted per Safe Harbor protocol',
        },
      },
    },
    {
      id: 's3-email-domain-only',
      label: 'Email Domain: @webmail.com',
      category: 'not_phi',
      explanation: 'An email domain without a username cannot identify a specific individual. ' +
        '"@webmail.com" is a generic shared domain — it has no identifier component and is not PHI under §164.514(b)(2).',
      chart: {
        patientName: 'Larsson, Astrid',
        miscField: {
          label: 'Email field (partial)',
          value: '@webmail.com — domain-only fragment from anonymization process; username removed',
        },
        doctorNote: 'The anonymization script stripped usernames but left domains. Legal confirmed: domains alone are fine.',
      },
    },
    {
      id: 's3-study-code',
      label: 'Study Code: PX-077 (roster crosswalk exists)',
      category: 'phi',
      identifierType: 'other',
      explanation: 'Identifier #18 is the catch-all: any other unique identifying number, characteristic, or code. ' +
        'A study code is only safe once it can\'t be mapped back to a person — PX-077 still crosswalks to the ' +
        'participant roster on the shared drive, so it re-identifies. (45 CFR §164.514(b)(2), §164.514(c))',
      chart: {
        patientName: 'Vasquez, Lena',
        age: 36,
        role: 'Study participant #077',
        miscField: {
          label: 'Research file',
          value: 'PX-077 — the de-ID plan says "destroy crosswalk." The crosswalk has not been destroyed.',
        },
      },
    },
    {
      id: 's3-url-no-identifiers',
      label: 'URL: https://healthinfo.gov/article/472',
      category: 'not_phi',
      icon: '🔗',
      docKind: 'Reference',
      explanation: 'URLs are identifier #14 under §164.514(b)(2) only when they can be linked to a specific individual. ' +
        'A public health information article URL with no patient parameters or session tokens is not PHI.',
      chart: {
        miscField: {
          label: 'Reference URL',
          value: 'https://healthinfo.gov/article/472 — public resource, no patient-specific parameters',
        },
      },
    },
    {
      id: 's3-partial-vehicle-id',
      label: 'Vehicle ID Fragment: ••••••••••••••XR2',
      category: 'not_phi',
      explanation: 'A 3-character VIN fragment cannot uniquely identify any vehicle or its owner. ' +
        'Safe Harbor removes vehicle identifiers — but a fragment deliberately truncated to prevent re-identification ' +
        'no longer functions as an identifier under §164.514(b)(2).',
      chart: {
        patientName: 'Mendez, Isabel',
        miscField: {
          label: 'Transport record (redacted)',
          value: 'Last 3 VIN characters retained per research protocol — insufficient for re-identification',
        },
      },
    },
    {
      // Clearly-safe, NO patient name — internal ops memo, obvious KEEP even at Act 3.
      id: 's3-shredder-schedule',
      label: 'Records Room: Shredder pickup schedule',
      category: 'not_phi',
      icon: '🗑️',
      docKind: 'Ops Memo',
      explanation: 'The schedule for when the shred bins get collected names no patient and no identifier. ' +
        'It\'s an operations memo — keep it.',
      chart: {
        miscField: { label: 'Reminder', value: 'Bin 2 is for SHRED, bin 3 is recycling. This matters, Kevin.' },
      },
    },
    {
      id: 's3-office-plant-roster',
      label: 'Break Room: Plant watering roster',
      category: 'not_phi',
      icon: '🪴',
      docKind: 'Break Room Notice',
      explanation: 'Whose turn it is to water the ficus is not Protected Health Information. ' +
        'No individual is identified in a health context — nothing to redact.',
      chart: {
        miscField: { label: 'This week', value: 'Marcus. The ficus remembers who forgot last time.' },
      },
    },
  ],
  passingAccuracy: 0.7,
  shiftSeconds: 80, // 14 items post-Eighteen additions — was 68 at 12 items
  takeaways: [
    'Safe Harbor lets you keep the year and 3-digit ZIP prefixes (in populous areas). ' +
      'Full dates, full ZIP codes, and ages 90 and above must be removed.',
    'De-identification under Safe Harbor means removing all 18 identifiers. ' +
      'Limited data sets are a different standard — they can keep some dates and ZIPs, but require a data use agreement.',
  ],
};

// ── Exported map and lookup ──────────────────────────────────────────────────

export const SORTER_DOCUMENT_SETS: Record<string, SorterDocumentSet> = {
  [SET_1.id]: SET_1,
  [SET_2.id]: SET_2,
  [SET_3.id]: SET_3,
};

/**
 * Look up a sorter document set by ID.
 * Returns undefined for unknown IDs — does NOT throw.
 * Plan 04's handleSorterComplete relies on the undefined sentinel.
 */
export function getSorterDocumentSet(id: string): SorterDocumentSet | undefined {
  return SORTER_DOCUMENT_SETS[id];
}
