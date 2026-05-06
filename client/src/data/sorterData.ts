/**
 * PHI Sorter Encounter — Document Sets
 *
 * Source authority: 45 CFR §164.514(b)(2) — Safe Harbor de-identification standard (18 identifiers)
 * Design reference: ENHANCEMENT_BRIEF.md §4.1 — PHI Sorter mini-game encounter
 *
 * These constants are the single source of truth for all PHI Sorter encounter content.
 * Three document sets scale in difficulty: Act 1 (obvious), Act 2 (subtle), Act 3 (edge cases).
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

/** A single sortable item presented to the player. */
export type SorterItem = {
  id: string;
  label: string;               // What the player sees on the card
  category: 'phi' | 'not_phi';
  identifierType?: SorterIdentifierType; // Required when category === 'phi'
  explanation: string;         // Shown on incorrect drop — explains the rule
};

/** A full document set for one PHI Sorter encounter instance. */
export type SorterDocumentSet = {
  id: string;                  // 'phi-sorter-set-1', 'phi-sorter-set-2', 'phi-sorter-set-3'
  act: 1 | 2 | 3;
  triggerLocation: 'reception' | 'lab' | 'medical_records';
  npcId: string;               // For NPC-attributed framing in context card
  contextCard: { title: string; body: string }; // SorterContextCard props
  items: SorterItem[];
  passingAccuracy: number;     // 0.0–1.0; 0.7 default
  takeaways: [string, string]; // EncounterDebrief takeaways (1-2 short HIPAA learnings)
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
  items: [
    {
      id: 's1-patient-name',
      label: 'Patient Name: Maria Gonzalez',
      category: 'phi',
      identifierType: 'name',
      explanation: 'A patient\'s name is identifier #1 under 45 CFR §164.514(b)(2). ' +
        'On a hospital intake form the health-care connection is implied — this is PHI.',
    },
    {
      id: 's1-ssn',
      label: 'SSN: 447-23-0891',
      category: 'phi',
      identifierType: 'ssn',
      explanation: 'Social Security Numbers are identifier #7 under the Safe Harbor rule. ' +
        'They directly and uniquely identify an individual — always PHI in a health-care context.',
    },
    {
      id: 's1-dob',
      label: 'Date of Birth: 03/14/1968',
      category: 'phi',
      identifierType: 'date',
      explanation: 'Specific dates — birth, admission, discharge — are identifier #3 ' +
        'under §164.514(b)(2). Year alone is acceptable; a full date is not.',
    },
    {
      id: 's1-home-address',
      label: 'Home Address: 147 Birchwood Dr',
      category: 'phi',
      identifierType: 'geographic',
      explanation: 'Street-level geographic data is identifier #2 under the Safe Harbor rule. ' +
        'A patient\'s home address paired with health information is PHI.',
    },
    {
      id: 's1-hospital-address',
      label: 'Hospital Address: 800 Valley Blvd',
      category: 'not_phi',
      explanation: 'This is an organizational address — it identifies the hospital, not a patient. ' +
        'Institutional details without a patient identifier are not PHI under §164.514(b)(2).',
    },
    {
      id: 's1-room-temp',
      label: 'Room Temperature: 68°F',
      category: 'not_phi',
      explanation: 'Environmental measurements have no connection to a specific patient\'s ' +
        'health, condition, or payment. No identifier + no health link = not PHI.',
    },
  ],
  passingAccuracy: 0.7,
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
  items: [
    {
      id: 's2-device-serial',
      label: 'Device Serial: MRI-3847-2291',
      category: 'phi',
      identifierType: 'device_serial',
      explanation: 'Device identifiers and serial numbers are identifier #13 under §164.514(b)(2). ' +
        'A device serial linked to a patient\'s scan record is PHI — even without a name on the label.',
    },
    {
      id: 's2-ip-address',
      label: 'IP Address: 192.168.4.107 (patient portal session)',
      category: 'phi',
      identifierType: 'ip_address',
      explanation: 'IP addresses are identifier #15 under the Safe Harbor rule. ' +
        'When an IP is associated with a patient\'s portal session, it connects an identifier to health care — PHI.',
    },
    {
      id: 's2-biometric',
      label: 'Biometric: Left index fingerprint scan',
      category: 'phi',
      identifierType: 'biometric',
      explanation: 'Biometric identifiers — fingerprints, voice prints — are identifier #16 ' +
        'under §164.514(b)(2). A fingerprint uniquely identifies an individual; in a health context, it\'s PHI.',
    },
    {
      id: 's2-diagnosis-with-mrn',
      label: 'ICD-10: F33.1 (Major Depressive Disorder) — Patient #4821',
      category: 'phi',
      identifierType: 'mrn',
      explanation: 'PHI = identifier + health connection. F33.1 alone is just a code. ' +
        'F33.1 + patient record #4821 links a diagnosis to a specific person — that combination is PHI. ' +
        'Medical record numbers are identifier #8 under §164.514(b)(2).',
    },
    {
      id: 's2-license-plate',
      label: 'License Plate: 7TBZ-483 (vehicle used in transport)',
      category: 'phi',
      identifierType: 'vehicle',
      explanation: 'Vehicle identifiers and serial numbers — including license plates — are identifier #12 ' +
        'under the Safe Harbor rule. A plate tied to a patient transport record is PHI.',
    },
    {
      id: 's2-diagnosis-only',
      label: 'ICD-10 Code: F33.1',
      category: 'not_phi',
      explanation: 'A diagnosis code by itself is not PHI. PHI requires an identifier PLUS a health connection. ' +
        'F33.1 alone identifies a condition, not a person. Pair it with a patient record number and it becomes PHI.',
    },
    {
      id: 's2-lab-test-type',
      label: 'Lab Test Type: Complete Blood Count',
      category: 'not_phi',
      explanation: 'A procedure category describes what kind of test was run — it doesn\'t identify any specific patient. ' +
        'Without an attached identifier, "complete blood count" is not PHI under §164.514(b)(2).',
    },
    {
      id: 's2-sample-volume',
      label: 'Sample Volume: 5mL',
      category: 'not_phi',
      explanation: 'A measurement without any patient identifier is not PHI. ' +
        '"5mL" doesn\'t connect to any individual\'s health care or payment information.',
    },
  ],
  passingAccuracy: 0.7,
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
  items: [
    {
      id: 's3-zip5',
      label: 'ZIP Code: 90210',
      category: 'phi',
      identifierType: 'geographic',
      explanation: 'A 5-digit ZIP code is a geographic identifier under §164.514(b)(2). ' +
        'Safe Harbor allows only 3-digit ZIP prefixes — and only in geographic units with more than 20,000 people. ' +
        'A full ZIP code must be removed to de-identify.',
    },
    {
      id: 's3-admission-month-year',
      label: 'Admission Date: March 2024',
      category: 'phi',
      identifierType: 'date',
      explanation: 'All elements of dates more specific than year are PHI for individuals under §164.514(b)(2). ' +
        '"March 2024" includes a month — that\'s more specific than year alone. Year alone is acceptable; month + year is not.',
    },
    {
      id: 's3-age-90-plus',
      label: 'Age: 91 years',
      category: 'phi',
      identifierType: 'other',
      explanation: 'Ages 90 and above are explicitly listed as PHI under §164.514(b)(2) because ' +
        'the small population of nonagenarians and centenarians makes individuals re-identifiable. ' +
        'Ages below 90 may be retained; ages 90+ must be grouped as "90 or older."',
    },
    {
      id: 's3-zip3',
      label: 'ZIP Prefix: 902',
      category: 'not_phi',
      explanation: 'Safe Harbor allows 3-digit ZIP prefixes when the geographic unit they represent ' +
        'contains more than 20,000 people. "902" covers a large area of Los Angeles — it passes Safe Harbor. ' +
        'A full 5-digit ZIP does not.',
    },
    {
      id: 's3-year-only',
      label: 'Year Only: 2024',
      category: 'not_phi',
      explanation: 'Under §164.514(b)(2), year alone is acceptable in de-identified data. ' +
        'The rule removes all elements of dates MORE SPECIFIC than year — but year by itself is not an identifier. ' +
        'Limited data sets (different from Safe Harbor) may retain full dates.',
    },
  ],
  passingAccuracy: 0.7,
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
