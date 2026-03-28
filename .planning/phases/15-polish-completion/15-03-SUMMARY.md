---
phase: 15-polish-completion
plan: 03
subsystem: ui
tags: [react, hud, breadcrumb, department-progress, act-display]

requires:
  - phase: 14-narrative-arc
    provides: Act state (actProgress in pq:save:v2)
  - phase: 12-unified-navigation
    provides: completedRooms state, department unlock order
provides:
  - DepartmentBreadcrumb React component with 6 department tiles + act label
  - DEPARTMENT_ORDER canonical constant
  - currentAct state + unlockedRooms derivation in PrivacyQuestPage
affects: [privacy-quest-page, department-ui]

tech-stack:
  added: []
  patterns: [breadcrumb-hud-overlay, department-order-constant, act-derived-state]

key-files:
  created: [client/src/components/DepartmentBreadcrumb.tsx]
  modified: [client/src/pages/PrivacyQuestPage.tsx]

key-decisions:
  - "Breadcrumb positioned bottom-center (not top-left) to avoid overlap with RoomProgressHUD"
  - "pointer-events-none to prevent click interception"
  - "z-10 below dialogue overlays (z-50+) and GameBanner (z-150)"
  - "DEPARTMENT_ORDER exported for reuse; records shortName is MR (not REC duplicate)"

patterns-established:
  - "DepartmentBreadcrumb: cross-room HUD separate from per-room RoomProgressHUD"
  - "unlockedRooms derivation: try pq:save:v2 unlockedDepartments, fall back to completion chain"

requirements-completed: [NARR-08]

duration: 8min
completed: 2026-03-28
---

# Phase 15 Plan 03: Department Breadcrumb HUD Summary

**Compact always-visible HUD strip with 6 color-coded department tiles and ACT label during exploration**

## Performance

- **Duration:** ~8 min (part of combined Wave 1)
- **Started:** 2026-03-28T02:03:24Z
- **Completed:** 2026-03-28T02:12:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created DepartmentBreadcrumb component with completed/current/locked/available color states
- Current department tile pulses gold via animate-pulse
- Completed departments show green checkmark tiles
- Mounted in PrivacyQuestPage during exploration mode only
- Exported DEPARTMENT_ORDER constant for canonical department ordering

## Task Commits

1. **Task 1 + 2: DepartmentBreadcrumb + PrivacyQuestPage mount** - `eed4a2c` (feat)

## Files Created/Modified
- `client/src/components/DepartmentBreadcrumb.tsx` - New component with DepartmentBreadcrumbProps, DEPARTMENT_ORDER
- `client/src/pages/PrivacyQuestPage.tsx` - Import, currentAct state, unlockedRooms memo, breadcrumb mount

## Decisions Made
- Added useMemo import for unlockedRooms derivation
- currentAct re-reads from localStorage when completedRooms changes (catches act advances)
- unlockedRooms uses completion chain fallback when pq:save:v2 doesn't have unlockedDepartments

## Deviations from Plan
None - plan executed as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Breadcrumb visible during all exploration sessions
- Act label updates automatically when act advances
- Department tiles reflect real-time completion state

---
*Phase: 15-polish-completion*
*Completed: 2026-03-28*
