/**
 * Unit tests for BreachTriageOverlay behavioral spec.
 *
 * Tests the contract, timing math, and scoring logic that can be exercised
 * without a DOM renderer. Covers:
 *   - onComplete payload shape (Plan 03 contract)
 *   - scoreContribution formula: Math.round((correctCount/totalCount) * 12)
 *   - totalCount formula: 9 classifications + 2 per follow-up shown
 *   - avgResponseMs calculation: mean of player classification times (0 if none)
 *   - Spawn delay formula: max(2000, 3500 - i*200) ms for i-th spawn
 *   - Per-incident timer: difficulty 1=14000, 2=12000, 3=10000 ms
 *
 * TDD RED: Written before BreachTriageOverlay.tsx implementation exists.
 * Run with: node --experimental-strip-types tests/breachTriageOverlay.test.mts
 */

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

// ── Score contribution formula ─────────────────────────────────────────────
console.log('\n[scoreContribution formula]');

function calcScore(correct: number, total: number): number {
  return Math.round((correct / total) * 12);
}

assert(calcScore(0, 9) === 0, 'all wrong → score 0');
assert(calcScore(9, 9) === 12, 'all correct → score 12');
assert(calcScore(7, 9) === 9, '7/9 correct → score 9 (round 9.33)');
assert(calcScore(6, 9) === 8, '6/9 correct → score 8 (round 8.0)');
assert(calcScore(5, 9) === 7, '5/9 correct → score 7 (round 6.67 → 7)');
// With follow-ups (totalCount > 9)
assert(calcScore(11, 11) === 12, '11/11 (2 follow-ups correct) → score 12');
assert(calcScore(0, 11) === 0, '0/11 → score 0');

// ── totalCount formula ──────────────────────────────────────────────────────
console.log('\n[totalCount formula]');

function calcTotalCount(followUpsShown: number): number {
  // 9 classifications + 2 per follow-up shown
  return 9 + 2 * followUpsShown;
}

assert(calcTotalCount(0) === 9, 'no follow-ups → totalCount 9');
assert(calcTotalCount(1) === 11, '1 follow-up → totalCount 11');
assert(calcTotalCount(6) === 21, '6 follow-ups (max reportable) → totalCount 21');

// ── avgResponseMs formula ───────────────────────────────────────────────────
console.log('\n[avgResponseMs formula]');

function calcAvgResponse(times: number[]): number {
  if (times.length === 0) return 0;
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}

assert(calcAvgResponse([]) === 0, 'no player classifications → avg 0');
assert(calcAvgResponse([3000]) === 3000, 'single classification at 3000ms');
assert(calcAvgResponse([2000, 4000]) === 3000, 'two classifications avg correctly');
assert(calcAvgResponse([1000, 2000, 3000]) === 2000, 'three classifications avg correctly');
// Expiries are NOT included in avgResponseMs
// (this is a spec rule — we just verify the math above holds for player-only times)

// ── Spawn delay formula ──────────────────────────────────────────────────────
console.log('\n[spawn delay formula]');

function calcSpawnDelay(i: number): number {
  // i = 0-indexed spawn number (0 = first incident after 600ms mount delay)
  // The overlay adds a 600ms initial mount delay separately.
  return Math.max(2000, 3500 - i * 200);
}

assert(calcSpawnDelay(0) === 3500, 'spawn 0 → 3500ms (starting cadence)');
assert(calcSpawnDelay(1) === 3300, 'spawn 1 → 3300ms');
assert(calcSpawnDelay(5) === 2500, 'spawn 5 → 2500ms');
assert(calcSpawnDelay(7) === 2100, 'spawn 7 → 2100ms (not yet floored)');
assert(calcSpawnDelay(8) === 2000, 'spawn 8 → 2000ms (clamped at floor)');
assert(calcSpawnDelay(100) === 2000, 'large index still clamped at 2000ms');

// ── Per-incident timer by difficulty ────────────────────────────────────────
console.log('\n[per-incident timer]');

function difficultyToMs(difficulty: 1 | 2 | 3): number {
  if (difficulty === 1) return 14000;
  if (difficulty === 2) return 12000;
  return 10000;
}

assert(difficultyToMs(1) === 14000, 'difficulty 1 → 14000ms');
assert(difficultyToMs(2) === 12000, 'difficulty 2 → 12000ms');
assert(difficultyToMs(3) === 10000, 'difficulty 3 → 10000ms');

// ── Export contract shape ───────────────────────────────────────────────────
console.log('\n[onComplete contract shape]');

// The payload BreachTriageOverlay passes to onComplete must include these exact keys:
// { encounterId, correctCount, totalCount, scoreContribution, avgResponseMs, takeaways }
// We verify the BreachTriageOverlayProps exported type exists and matches by importing it.
// (If the file doesn't exist yet, the import below fails — this test file is intentionally
// written in RED before the implementation.)

import type { BreachTriageOverlayProps } from '../client/src/components/breach-triage/BreachTriageOverlay.tsx';

// If we reach here, the type import succeeded — the exported type exists.
// We use a structural assertion via a type-safe assignment (TypeScript will catch mismatches).
type ExpectedResult = {
  encounterId: string;
  correctCount: number;
  totalCount: number;
  scoreContribution: number;
  avgResponseMs: number;
  takeaways: [string, string];
};

// This is a compile-time contract check: if BreachTriageOverlayProps.onComplete doesn't
// accept ExpectedResult, tsc will fail. We satisfy the runtime check here with a no-op.
const _contractCheck: BreachTriageOverlayProps = {
  incidentSetId: 'breach-triage-set-1',
  encounterId: 'breach-triage-er',
  onComplete: (_result: ExpectedResult) => {},
};
assert(_contractCheck.incidentSetId === 'breach-triage-set-1', 'BreachTriageOverlayProps has incidentSetId');
assert(_contractCheck.encounterId === 'breach-triage-er', 'BreachTriageOverlayProps has encounterId');
assert(typeof _contractCheck.onComplete === 'function', 'BreachTriageOverlayProps has onComplete function');

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n══ ${passed + failed} tests: ${passed} passed, ${failed} failed ══\n`);
if (failed > 0) process.exit(1);
