---
phase: 22-phi-sorter-content-connection
plan: 01
subsystem: ui
tags: [phaser, react, typescript, hipaa, phi-sorter, educational-content, data-constants]

# Dependency graph
requires:
  - phase: 16-phi-sorter-encounter
    provides: "SorterItem type, SORTER_DOCUMENT_SETS, getSorterDocumentSet — Phase 22 extends these"
provides:
  - "SorterChart type (patientName + humor free-text fields)"
  - "SorterHoldIt type (npcLine + educationalBeat for Phoenix-Wright reveals)"
  - "30 fake patient chart items across 3 sets (10/10/10)"
  - "SORTV2-01..06 requirements in REQUIREMENTS.md"
  - "Updated CONTENT_MANIFEST.md PHI Sorter section"
affects:
  - 22-02-PLAN (NPC reaction bubbles consume SorterHoldIt.npcLine)
  - 22-03-PLAN (HOLD IT visual treatment consumes SorterHoldIt)
  - 22-04-PLAN (PHISorterOverlay renders chart fields from SorterChart)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Patient chart as sortable card: SorterChart object on every SorterItem, humor in optional free-text fields only"
    - "HOLD IT reveal pattern: exactly one holdIt per set, consumed by Wave 2 visual components"
    - "Recurring patient pattern: same patient name in multiple sets, documented in inline comments"

key-files:
  created: []
  modified:
    - client/src/data/sorterData.ts
    - .planning/REQUIREMENTS.md
    - .planning/CONTENT_MANIFEST.md

key-decisions:
  - "HOLD IT item for Set 1 = s1-dob: full birth date vs year-only is a common point of confusion and high instructional value"
  - "HOLD IT item for Set 2 = s2-diagnosis-with-mrn: MRN-as-identifier is the canonical two-part PHI rule demonstration"
  - "HOLD IT item for Set 3 = s3-zip3: not-PHI as HOLD IT — reveals the population-size condition, subverts expectation"
  - "s1-employer-name classified as phi/other per §164.514(b)(2) identifier #11 (employer name is one of the 18)"
  - "s3-partial-vehicle-id classified as not_phi: 3-char VIN fragment cannot re-identify; Safe Harbor removes identifiers, not fragments"
  - "s3-email-domain-only classified as not_phi: domain without username has no identifier component"
  - "Recurring patients: Henderson (s1+s3), Okonkwo (s2+s3) — documented in inline comments for future content authors"

patterns-established:
  - "chart field humour: deadpan Daria/Veep tone; never surreal (no 'patient is a cat'), never punching down at demographics"
  - "holdIt as subversion: the HOLD IT on s3-zip3 (a not_phi item) tests whether players trust their reasoning, not just identify PHI"

requirements-completed: [SORTV2-01, SORTV2-02, SORTV2-04]

# Metrics
duration: 6min
completed: 2026-06-09
---

# Phase 22 Plan 01: PHI Sorter Content Foundation Summary

**30 fake patient charts (10/10/10 per set) with deadpan humor, SorterChart + SorterHoldIt types added, all 19 Phase-16 HIPAA accuracy gates preserved, SORTV2-01..06 requirements filed**

## Performance

- **Duration:** 6 min
- **Started:** 2026-06-10T03:39:19Z
- **Completed:** 2026-06-10T03:45:12Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Extended `SorterItem` with `chart: SorterChart` (required) and `holdIt?: SorterHoldIt` (optional) — additive, no breaking changes
- Rewrote all 30 items (6/8/5 → 10/10/10) as fake patient charts with deadpan humor; 45 humor-bearing fields across 30 items (>>30% coverage)
- Preserved all 19 Phase-16 item IDs with original `category` field (HIPAA accuracy gate)
- Added SORTV2-01..06 requirements to REQUIREMENTS.md with traceability rows
- Updated CONTENT_MANIFEST.md with new counts, humor note, HOLD IT note, and revision history

## Item Counts Per Set

| Set | ID | PHI Items | Not PHI | Total | HOLD IT Item |
|-----|----|-----------|---------|-------|-------------|
| Set 1 — Reception | phi-sorter-set-1 | 7 | 3 | 10 | s1-dob |
| Set 2 — Lab | phi-sorter-set-2 | 6 | 4 | 10 | s2-diagnosis-with-mrn |
| Set 3 — Medical Records | phi-sorter-set-3 | 5 | 5 | 10 | s3-zip3 |

## HOLD IT Item Rationale

**Set 1 — s1-dob (PHI/date):**
Aiyana's line: "HOLD IT! A full birth date — month, day, and year — is identifier #3. The year by itself would be fine. The full date is not."
Why chosen: Full date vs. year-only is the most commonly misunderstood Safe Harbor rule. High instructional value for an Act 1 reveal.

**Set 2 — s2-diagnosis-with-mrn (PHI/mrn):**
Marcus's line: "HOLD IT! See that? F33.1 alone is just a code. Pair it with patient #4821 and you've got PHI — even with no name on the chart."
Why chosen: The two-part PHI rule (identifier + health connection) is Act 2's central teaching. This is the canonical demonstration.

**Set 3 — s3-zip3 (not_phi):**
Dr. Tovar's line: "HOLD IT! That's the right call — ZIP prefix 902 passes Safe Harbor because it covers more than 20,000 people. But a rural ZIP3 serving a tiny population? That would fail."
Why chosen: A not_phi item as the HOLD IT subverts expectation and tests whether players trust their own correct reasoning, not just pattern-match on "weird = PHI."

## Recurring Named Patients

| Patient | Appears In | Context |
|---------|-----------|---------|
| Henderson, Margaret | s1-patient-name (Set 1) + s3-zip5, s3-fax-number (Set 3) | Reception intake form → Medical Records release form. Same retired postal inspector, same emergency contact (her husband Gerald). |
| Okonkwo, Chidi | s2-biometric, s2-diagnosis-with-mrn (Set 2) + s3-account-number (Set 3) | Lab biometric check-in → diagnosis coded in lab manifest → billing account in Records. |

## HIPAA-Accuracy Judgment Calls on New Items

| Item ID | Category | Rationale |
|---------|----------|-----------|
| s1-employer-name | phi/other | Employer name is identifier #11 under §164.514(b)(2). Assigned `other` type as no dedicated `employer` enum exists. |
| s1-marital-status | not_phi | Not one of the 18 Safe Harbor identifiers. Demographic detail without health-care connection. |
| s2-plan-id | phi/plan_id | Health plan beneficiary numbers are identifier #9. BCX-style plan ID on a lab manifest ties to a specific insured individual. |
| s2-specimen-type | not_phi | Procedure category without patient identifier. "Venous blood" as a manifest header shared across multiple samples. |
| s3-fax-number | phi/fax | Fax numbers are identifier #5. Patient-linked contact point on a records release form. |
| s3-account-number | phi/account | Account numbers are identifier #10. Hospital account number ties billing directly to the patient. |
| s3-email-domain-only | not_phi | Domain without username cannot identify an individual. No identifier component. |
| s3-url-no-identifiers | not_phi | Public health resource URL with no patient parameters or session tokens. URLs are PHI only when linkable to a specific individual. |
| s3-partial-vehicle-id | not_phi | 3-char VIN fragment cannot re-identify any vehicle/owner. Safe Harbor removes identifiers; a non-identifying fragment is not an identifier. |

## Task Commits

Each task was committed atomically:

1. **Task 1: Add SORTV2-01..06 to REQUIREMENTS.md** - `2b480be` (feat)
2. **Task 2: Extend sorterData.ts schema + rewrite 30 items** - `e8e8af3` (feat)
3. **Task 3: Update CONTENT_MANIFEST.md** - `b078157` (feat)

## Files Created/Modified

- `client/src/data/sorterData.ts` — Extended schema (SorterChart, SorterHoldIt, extended SorterItem) + 30 chart items; was ~295 lines, now ~450 lines
- `.planning/REQUIREMENTS.md` — Added SORTV2-01..06 definitions + traceability rows; coverage summary updated to 12 total v2.1 requirements
- `.planning/CONTENT_MANIFEST.md` — PHI Sorter table updated (counts, PHI tallies, coverage ratings); humor note, HOLD IT note, revision history row added

## Decisions Made

- HOLD IT for Set 3 is a not_phi item (s3-zip3) to subvert player expectation and reward correct reasoning
- s1-employer-name classified as phi/other since employer is identifier #11 but no enum exists for it
- Recurring patients (Henderson, Okonkwo) documented in inline comments per plan spec

## Deviations from Plan

None — plan executed exactly as written. All HIPAA accuracy judgment calls align with 45 CFR §164.514(b)(2).

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Wave 2 components can now build without asking "what's the SorterChart shape?" — types are exported and stable
- `SorterHoldIt.npcLine` is ready for Plan 22-02 NPC reaction bubble implementation
- `SorterHoldIt.educationalBeat` is ready for Plan 22-03 HOLD IT visual treatment
- `SorterChart` fields are ready for Plan 22-04 card rendering

---
*Phase: 22-phi-sorter-content-connection*
*Completed: 2026-06-09*
