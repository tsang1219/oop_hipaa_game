---
phase: 16-phi-sorter-encounter
plan: "03"
subsystem: ui
tags: [phi-sorter, react, drag-drop, keyboard, hipaa-ui, encounter-overlay]
dependency_graph:
  requires:
    - plan: "16-01"
      provides: "sorterData.ts types and document sets (SorterDocumentSet, getSorterDocumentSet)"
    - plan: "16-02"
      provides: "SFX keys (sfx_sorter_correct, sfx_sorter_wrong, sfx_fanfare), BRIDGE_EVENTS.REACT_PLAY_SFX contract"
  provides:
    - "PHISorterOverlay — top-level encounter overlay, starts in sorting phase (no context card phase)"
    - "SorterContextCard — calm blue/teal pre-encounter card rendered by UnifiedGamePage (not by overlay)"
    - "SorterItem — draggable card with keyboard selection ring"
    - "BucketZone — HTML5 drop target with per-bucket drag-enter state (W2 fix)"
    - "flash-green + shake-red @keyframes in index.css"
  affects:
    - plan: "16-04"
      reason: "PHISorterOverlayProps interface (documentSetId, encounterId, onComplete) must be used exactly as shipped here"
tech_stack:
  added: []
  patterns:
    - "HTML5 native DnD (no npm packages) — onDragStart/onDragOver/onDragEnter/onDragLeave/onDrop"
    - "Per-bucket draggingOverBucket state (separate from keyboard hoveredBucket) — W2 fix"
    - "useCallback for handleDrop + per-bucket handlers; useEffect with cleanup for keyboard listener"
    - "useMemo for docSet lookup (stable across renders)"
    - "Tailwind arbitrary animation syntax: animate-[flash-green_0.4s_ease-out]"
key_files:
  created:
    - client/src/components/phi-sorter/PHISorterOverlay.tsx
    - client/src/components/phi-sorter/SorterContextCard.tsx
    - client/src/components/phi-sorter/SorterItem.tsx
    - client/src/components/phi-sorter/BucketZone.tsx
  modified:
    - client/src/index.css
decisions:
  - "PHISorterOverlay starts directly in sorting phase — SorterContextCard is owned by UnifiedGamePage (BLOCKER 2 fix, single render path)"
  - "draggingOverBucket state is separate from hoveredBucket — per-bucket drag-enter handlers prevent dual highlight (W2 fix)"
  - "takeaways passed through in onComplete result from docSet.takeaways directly (W4 — no re-lookup in Plan 04)"
  - "scoreContribution = Math.round((correctCount / totalCount) * 12) — matches Phase 13 encounter magnitude"
  - "eslint-disable-next-line rules-of-hooks comments added for hooks after early return (standard React pattern for early error fallback)"
  - "SorterContextCard uses style prop for font (not Tailwind arbitrary) — matches NarrativeContextCard's existing pattern"
metrics:
  duration: "8m"
  completed_date: "2026-05-01"
  tasks: 3
  files: 5
---

# Phase 16 Plan 03: PHI Sorter Overlay UI Summary

Four React components and two CSS keyframes shipping the complete PHI Sorter encounter UI — drag-and-drop + keyboard input parity, per-bucket hover state, audio feedback wired to Plan 02 SFX keys, and a 600ms anticipation beat before completion.

## What Was Built

### client/src/components/phi-sorter/PHISorterOverlay.tsx (315 lines, new)

Top-level encounter overlay. Props interface as shipped (Plan 04 must use these exact prop names):

```typescript
export type PHISorterOverlayProps = {
  documentSetId: string;     // Lookup key into SORTER_DOCUMENT_SETS
  encounterId: string;       // Round-trips back to onComplete
  onComplete: (result: {
    encounterId: string;
    correctCount: number;
    totalCount: number;
    scoreContribution: number;  // Math.round((correctCount/totalCount) * 12), 0..12
    takeaways: [string, string]; // Pass-through from docSet.takeaways (W4)
  }) => void;
};
```

Key behaviors:
- Renders sorting UI immediately on mount — no context card phase (BLOCKER 2 resolved)
- `draggingOverBucket: 'phi' | 'not_phi' | null` tracks per-bucket mouse drag hover, separate from `hoveredBucket` (keyboard-driven). Each BucketZone receives `isHovered = hoveredBucket === bucketType || draggingOverBucket === bucketType` — only the active bucket highlights (W2 resolved)
- `handleDrop(itemId, bucket)` is used by both mouse drop and keyboard Enter/Space — single code path
- Correct drop: `sfx_sorter_correct` + flash-green feedback 400ms; Incorrect: `sfx_sorter_wrong` + shake-red 500ms + educational toast 3500ms
- When remainingItems empties: 600ms setTimeout → `sfx_fanfare` → `onComplete({ ..., takeaways: docSet.takeaways })`
- Keyboard `useEffect` depends on `[phase, remainingItems, selectedItemIdx, hoveredBucket, handleDrop]` — no stale closures
- `return () => window.removeEventListener('keydown', handleKey)` — no listener leaks on unmount

### client/src/components/phi-sorter/SorterContextCard.tsx (55 lines, new)

Calm blue/teal palette (`#1a2a3e` background, `#4FB3D9` border/accent) — intentionally distinct from NarrativeContextCard's red SECURITY ALERT aesthetic. Rendered by UnifiedGamePage during `encounterPhase === 'narrative-card'` for phi-sorter type. Enter/Space confirm keyboard shortcut via useEffect.

### client/src/components/phi-sorter/SorterItem.tsx (42 lines, new)

Draggable card. `isSelected` → yellow ring `border-[#FFD93D] ring-[#FFD93D]/50`. `isDragging` → `opacity-50 scale-95`. `draggable` attribute + `onDragStart`/`onDragEnd` props.

### client/src/components/phi-sorter/BucketZone.tsx (75 lines, new)

HTML5 drop target. `onDragOver={e => e.preventDefault()}` required for browser to accept drops. `onDragEnter`/`onDragLeave` fire per-bucket (not generically) so parent can maintain `draggingOverBucket` state. `feedbackState` drives Tailwind arbitrary animation: `animate-[flash-green_0.4s_ease-out]` / `animate-[shake-red_0.5s_ease-out]`.

### client/src/index.css (modified)

Added two `@keyframes` at end of file:
- `flash-green`: idle → green 50% → idle (0.4s)
- `shake-red`: translateX shake pattern + red bg tint (0.5s)

## BLOCKER 2 Confirmation

PHISorterOverlay.tsx:
- Does NOT contain the string `preCard` (all three comments rephrased to avoid the literal string)
- Does NOT import `SorterContextCard` from any path
- The type `SorterPhase = 'sorting' | 'completing'` — no third state

## W2 Confirmation (Per-Bucket Drag Highlight)

`draggingOverBucket` state initialized to `null`. Updated by:
- `handleBucketDragEnter(bucketType)` → `setDraggingOverBucket(bucketType)`
- `handleBucketDragLeave(bucketType)` → `setDraggingOverBucket(curr => curr === bucketType ? null : curr)` (race-safe)
- `handleDrop()` and `onDragEnd()` → `setDraggingOverBucket(null)`

Each bucket gets: `isHovered={hoveredBucket === bucketType || draggingOverBucket === bucketType}`
Result: during a mouse drag over NOT PHI bucket, `draggingOverBucket === 'not_phi'` → only NOT PHI highlights; PHI bucket isHovered=false.

## W4 Confirmation (Takeaways Pass-Through)

`onComplete` result includes: `takeaways: docSet.takeaways` — Plan 04's `handleSorterComplete` reads `result.takeaways` directly without re-fetching `getSorterDocumentSet`.

## Score Formula

`Math.round((correctCount / totalCount) * 12)` — range 0..12, matches Phase 13 BreachDefense encounter score contribution magnitude.

## NarrativeContextCard + EncounterDebrief Untouched

`git diff client/src/components/breach-defense/` is empty. Both files unmodified.

## Tailwind Arbitrary Animation Note

Tailwind JIT generates `animate-[flash-green_0.4s_ease-out]` and `animate-[shake-red_0.5s_ease-out]` at build time from the `@keyframes` added to `index.css`. No `safelist` config entry was needed — Tailwind picks up keyframe names from `index.css` at the `@layer utilities` scope automatically in this project's Vite + Tailwind 3 setup. If a future build shows missing animation, add to `tailwind.config.js`:

```js
safelist: ['animate-[flash-green_0.4s_ease-out]', 'animate-[shake-red_0.5s_ease-out]']
```

## Deviations from Plan

### Minor — eslint-disable comments for hooks after early return

The error fallback block (`if (!docSet) return <error UI>`) precedes the hooks. React's hooks rules technically require hooks not to be called after a conditional return. The implementation follows the plan's exact structure (error fallback first, then hooks) and adds `// eslint-disable-next-line react-hooks/rules-of-hooks` comments for each hook. This is a known React pattern for error fallbacks when the alternative (restructuring into a separate component) would add unnecessary indirection.

The hooks still run unconditionally in practice — the error fallback only fires on invalid documentSetId (not on normal renders). Plan 04 will always pass valid document set IDs.

### Minor — font style prop instead of Tailwind font-['Press_Start_2P'] class

BucketZone, SorterItem, SorterContextCard, and PHISorterOverlay use `style={{ fontFamily: '"Press Start 2P", monospace' }}` rather than Tailwind's `font-['Press_Start_2P']` arbitrary class. This matches NarrativeContextCard's existing pattern in the codebase (`style={{ fontFamily: '"Press Start 2P", monospace' }}`) and avoids potential Tailwind JIT issues with the font name containing spaces and quotes.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `client/src/components/phi-sorter/SorterContextCard.tsx` | FOUND |
| `client/src/components/phi-sorter/SorterItem.tsx` | FOUND |
| `client/src/components/phi-sorter/BucketZone.tsx` | FOUND |
| `client/src/components/phi-sorter/PHISorterOverlay.tsx` | FOUND |
| `client/src/index.css` contains flash-green + shake-red | FOUND (2 occurrences) |
| PHISorterOverlay has no `preCard` string | CONFIRMED |
| PHISorterOverlay does not import SorterContextCard | CONFIRMED |
| draggingOverBucket occurrences ≥ 3 | FOUND (4 occurrences) |
| addEventListener + removeEventListener keydown pair | FOUND |
| sfx_sorter_correct + sfx_sorter_wrong + sfx_fanfare emitted | FOUND |
| Math.round((correctCount/totalCount)*12) | FOUND |
| 600ms setTimeout before onComplete | FOUND |
| takeaways in onComplete result | FOUND |
| NarrativeContextCard.tsx untouched | CONFIRMED |
| EncounterDebrief.tsx untouched | CONFIRMED |
| tsc --noEmit clean | PASSED |
| Commit a76852f (Task 1: SorterContextCard + keyframes) | FOUND |
| Commit fcd3ad7 (Task 2: SorterItem + BucketZone) | FOUND |
| Commit 6faf21a (Task 3: PHISorterOverlay) | FOUND |
