---
phase: 16-phi-sorter-encounter
plan: "01"
subsystem: data-layer
tags: [hipaa-content, sorter-data, requirements, content-manifest, type-definitions]
dependency_graph:
  requires: []
  provides:
    - SorterItem type and SorterDocumentSet type (client/src/data/sorterData.ts)
    - SORTER_DOCUMENT_SETS constant with 3 document set instances
    - getSorterDocumentSet(id) lookup API
    - SORT-01..SORT-06 requirement IDs in REQUIREMENTS.md
    - phi-sorter-set-1..3 indexed in CONTENT_MANIFEST.md
  affects:
    - Plans 02, 03, 04 (all import from sorterData.ts)
    - REQUIREMENTS.md traceability table
    - CONTENT_MANIFEST.md
tech_stack:
  added: []
  patterns:
    - TypeScript constants file for game data (per CLAUDE.md)
    - 45 CFR §164.514(b)(2) Safe Harbor as data authority
    - TDD with node --experimental-strip-types test runner
key_files:
  created:
    - client/src/data/sorterData.ts
    - tests/sorterData.test.mts
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/CONTENT_MANIFEST.md
decisions:
  - Set 1 uses npcId 'receptionist_riley' (matches existing reception NPC from roomData.json)
  - Set 2 uses npcId 'lab_tech' (verified as 'lab_tech' at tile (10,7) in roomData.json)
  - Set 3 uses npcId 'records_clerk' (medical_records narrative fit for de-id edge cases)
  - Set 3 act === 3 and triggerLocation === 'medical_records' (better narrative fit than lab for de-identification research context)
  - identifierType 'date' for DOB (Set 1) and admission month+year (Set 3) per 45 CFR §164.514(b)(2) identifier #3
  - identifierType 'other' for age 90+ (Set 3) per the explicit 45 CFR §164.514(b)(2) ages-90-plus clause
  - identifierType 'geographic' for home address (Set 1), ZIP5 (Set 3) per identifier #2
  - Content Manifest coverage rating ADEQUATE for all 3 sets (can be promoted to STRONG post-Phase 17 when encounter library is broader)
metrics:
  duration: "4m"
  completed_date: "2026-05-01"
  tasks: 3
  files: 4
---

# Phase 16 Plan 01: PHI Sorter Data Foundation Summary

TypeScript content data for the PHI Sorter encounter — three document sets covering 45 CFR §164.514(b)(2) Safe Harbor identifiers at three difficulty levels, with formal SORT-01..06 requirement IDs wired into REQUIREMENTS.md and Content Manifest indexing for HIPAA accuracy reviews.

## What Was Built

### client/src/data/sorterData.ts (new)

Exports stable types and 3 document set constants consumed by Plans 02–04:

- `SorterIdentifierType` — union of all 18 Safe Harbor identifier type strings
- `SorterItem` — `{ id, label, category, identifierType?, explanation }`
- `SorterDocumentSet` — `{ id, act, triggerLocation, npcId, contextCard, items[], passingAccuracy, takeaways[2] }`
- `SORTER_DOCUMENT_SETS: Record<string, SorterDocumentSet>` — keyed map of all 3 sets
- `getSorterDocumentSet(id: string): SorterDocumentSet | undefined` — canonical lookup API

### .planning/REQUIREMENTS.md (updated)

- SORT-01..SORT-06 added under v2.1 Requirements → New Encounter Types
- PHI-01 placeholder annotated as superseded by SORT-01..06
- 6 traceability rows added (Phase 16, Pending)
- Coverage summary updated: `v2.1 requirements (Phase 16 portion): 6 total, mapped: 6, unmapped: 0`

### .planning/CONTENT_MANIFEST.md (updated)

- New "PHI Sorter Encounter — Document Sets" section
- 3 table entries: phi-sorter-set-1..3 with file path, act, trigger location, NPC, item counts, HIPAA topic tags, coverage rating, and summary
- Revision history updated with 2026-05-01 entry

## Item Lists by Set

### Set 1: phi-sorter-set-1 (Reception, Act 1 — obvious)
| Item ID | Label | Category | Identifier Type |
|---------|-------|----------|----------------|
| s1-patient-name | Patient Name: Maria Gonzalez | phi | name |
| s1-ssn | SSN: 447-23-0891 | phi | ssn |
| s1-dob | Date of Birth: 03/14/1968 | phi | date |
| s1-home-address | Home Address: 147 Birchwood Dr | phi | geographic |
| s1-hospital-address | Hospital Address: 800 Valley Blvd | not_phi | — |
| s1-room-temp | Room Temperature: 68°F | not_phi | — |

### Set 2: phi-sorter-set-2 (Lab, Act 2 — subtle)
| Item ID | Label | Category | Identifier Type |
|---------|-------|----------|----------------|
| s2-device-serial | Device Serial: MRI-3847-2291 | phi | device_serial |
| s2-ip-address | IP Address: 192.168.4.107 (patient portal session) | phi | ip_address |
| s2-biometric | Biometric: Left index fingerprint scan | phi | biometric |
| s2-diagnosis-with-mrn | ICD-10: F33.1 — Patient #4821 | phi | mrn |
| s2-license-plate | License Plate: 7TBZ-483 | phi | vehicle |
| s2-diagnosis-only | ICD-10 Code: F33.1 | not_phi | — |
| s2-lab-test-type | Lab Test Type: Complete Blood Count | not_phi | — |
| s2-sample-volume | Sample Volume: 5mL | not_phi | — |

### Set 3: phi-sorter-set-3 (Medical Records, Act 3 — edge cases)
| Item ID | Label | Category | Identifier Type |
|---------|-------|----------|----------------|
| s3-zip5 | ZIP Code: 90210 | phi | geographic |
| s3-admission-month-year | Admission Date: March 2024 | phi | date |
| s3-age-90-plus | Age: 91 years | phi | other |
| s3-zip3 | ZIP Prefix: 902 | not_phi | — |
| s3-year-only | Year Only: 2024 | not_phi | — |

## Lab Tech NPC ID (for Plan 04 trigger framing)

**`lab_tech`** — verified from `client/src/data/roomData.json` at tile (10, 7) in the `lab` room. This is the exact NPC ID Set 2's `npcId` field uses.

## REQUIREMENTS.md Status

- SORT-01..SORT-06: all 6 entries present in both requirements list and traceability table (14 total SORT-0 occurrences)
- Coverage summary block refreshed with `v2.1 requirements (Phase 16 portion): 6 total, mapped: 6, unmapped: 0`
- Traceability table: 6 rows for Phase 16, all Pending (to be marked Complete as plans ship)

## Deviations from Plan

None — plan executed exactly as written. The items, NPC IDs, identifier types, and file structure match the plan spec verbatim.

## Self-Check

Checking created files exist and commits are present:

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `client/src/data/sorterData.ts` | FOUND |
| `.planning/REQUIREMENTS.md` | FOUND |
| `.planning/CONTENT_MANIFEST.md` | FOUND |
| `tests/sorterData.test.mts` | FOUND |
| `16-01-SUMMARY.md` | FOUND |
| Commit 914ce80 (REQUIREMENTS.md SORT-01..06) | FOUND |
| Commit 0fab5b6 (TDD RED test) | FOUND |
| Commit f3f7272 (sorterData.ts GREEN) | FOUND |
| Commit 301bfbe (CONTENT_MANIFEST.md) | FOUND |
