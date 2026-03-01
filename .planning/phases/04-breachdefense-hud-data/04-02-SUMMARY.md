---
phase: 04-breachdefense-hud-data
plan: 02
subsystem: ui
tags: [react, phaser, tailwind, radix-ui, eventbridge, typescript]

# Dependency graph
requires:
  - phase: 04-01
    provides: BREACH_WAVE_START event, enhanced BREACH_WAVE_COMPLETE with endMessage+stats, per-wave kill tracking

provides:
  - WaveIntroBanner component: auto-dismissing wave intro overlay showing name, intro, threats, suggested towers
  - ThreatStrip component: persistent incoming threat row with colored dots between canvas and HUD
  - Radix UI tooltips on tower buttons: desc + strongAgainst + weakAgainst on hover
  - Suggested tower pulsing yellow border + HINT badge via currentWaveSuggestedTowers state
  - Enhanced RecapModal: endMessage callout box + per-wave performance stats for every wave
  - Full EventBridge wiring: BREACH_WAVE_START listener updates banner + strip + suggested badges

affects: [phase-05-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "colorToHex helper converts Phaser 0xRRGGBB numbers to CSS #rrggbb strings for React components"
    - "Radix Tooltip.Provider wraps tower panel; Tooltip.Portal renders outside canvas stacking context"
    - "BREACH_WAVE_START populates three independent state slices (banner, threat strip, suggested towers) atomically"

key-files:
  created:
    - client/src/components/breach-defense/WaveIntroBanner.tsx
    - client/src/components/breach-defense/ThreatStrip.tsx
  modified:
    - client/src/components/breach-defense/RecapModal.tsx
    - client/src/pages/BreachDefensePage.tsx

key-decisions:
  - "WaveIntroBanner positioned absolute inside canvas relative wrapper so it overlays the Phaser canvas without shifting layout"
  - "ThreatStrip renders between canvas and HUD bar as a sibling div — returns null when threats array is empty"
  - "RecapModal concept type relaxed from strict keyof to string, gracefully handles LAYERS/PASSWORDS/ALLDEFENSE without null render"
  - "Tooltip.Portal used for tower tooltips to escape canvas z-stacking context and avoid clipping"

patterns-established:
  - "colorToHex(c: number): '#' + c.toString(16).padStart(6, '0') for THREAT_COLORS conversion"
  - "Auto-dismiss via useEffect setTimeout with cleanup clearTimeout prevents onDismiss from firing after unmount"

requirements-completed: [HUD-01, HUD-02, HUD-03, HUD-04, HUD-05]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 4 Plan 02: BreachDefense HUD Data UI Summary

**Wave intro banner, threat strip, tower tooltips with counter info, suggested tower badges, and enhanced RecapModal with educational endMessage + stats — all surfacing existing constants.ts data during gameplay**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T17:07:47Z
- **Completed:** 2026-03-01T17:09:50Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created WaveIntroBanner (auto-dismiss overlay) and ThreatStrip (persistent threat row) as standalone retro-styled components importing from constants.ts
- Wired BREACH_WAVE_START listener in BreachDefensePage to populate banner data, threat strip, and suggested tower badges atomically
- Added Radix UI tooltips to all tower buttons showing description and counter relationships (strongAgainst/weakAgainst)
- Enhanced RecapModal to accept endMessage + stats props, handle unknown concepts gracefully (LAYERS, PASSWORDS, ALLDEFENSE), and display a KEY FACT callout box + wave performance stats

## Task Commits

Each task was committed atomically:

1. **Task 1: Create WaveIntroBanner and ThreatStrip components** - `815f03a` (feat)
2. **Task 2: Enhance RecapModal, add tooltips/badges, wire BreachDefensePage** - `2df7842` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `client/src/components/breach-defense/WaveIntroBanner.tsx` - Auto-dismissing overlay displaying wave number, name, intro narrative, colored threat dots + counts, suggested tower names
- `client/src/components/breach-defense/ThreatStrip.tsx` - Persistent incoming threat row between canvas and HUD, renders null when empty
- `client/src/components/breach-defense/RecapModal.tsx` - Enhanced with endMessage callout + stats display, relaxed concept typing for full wave coverage
- `client/src/pages/BreachDefensePage.tsx` - New state slices (waveBannerData, currentWaveThreats, currentWaveSuggestedTowers, waveEndMessage, waveEndStats), BREACH_WAVE_START listener, Radix Tooltip on tower panel, updated RecapModal render, full reset on restart

## Decisions Made
- WaveIntroBanner absolute-positioned inside canvas relative wrapper to overlay Phaser canvas without layout shift
- ThreatStrip returns null when threats array is empty — clean gap between waves with no dead UI rows
- RecapModal concept type relaxed to `string` with safe cast, handles any concept name the scene emits without null render
- Tooltip.Portal used for Radix tooltips to escape Phaser canvas z-stacking context

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 complete: all HUD data events wired and surfaced in React UI
- Phase 5 (polish) can build on the existing banner/strip/tooltip/recap infrastructure
- WaveIntroBanner timing (3000ms auto-dismiss) may need tuning based on playtest feedback

## Self-Check: PASSED

- FOUND: client/src/components/breach-defense/WaveIntroBanner.tsx
- FOUND: client/src/components/breach-defense/ThreatStrip.tsx
- FOUND: client/src/components/breach-defense/RecapModal.tsx
- FOUND: client/src/pages/BreachDefensePage.tsx
- FOUND: .planning/phases/04-breachdefense-hud-data/04-02-SUMMARY.md
- FOUND: commit 815f03a (Task 1)
- FOUND: commit 2df7842 (Task 2)
- TypeScript compiles without errors

---
*Phase: 04-breachdefense-hud-data*
*Completed: 2026-03-01*
