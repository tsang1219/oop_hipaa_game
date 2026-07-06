/**
 * Unit tests for client/src/data/sorterData.ts
 * Tests the SorterDocumentSet data shape and HIPAA accuracy.
 * Run with: node --experimental-strip-types tests/sorterData.test.mts
 *
 * TDD RED: Written before the implementation exists.
 */

import { SORTER_DOCUMENT_SETS, getSorterDocumentSet } from '../client/src/data/sorterData.ts';

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

// ── Set existence ──────────────────────────────────────────────────────
console.log('\n[Set existence]');
const s1 = getSorterDocumentSet('phi-sorter-set-1');
const s2 = getSorterDocumentSet('phi-sorter-set-2');
const s3 = getSorterDocumentSet('phi-sorter-set-3');
assert(s1 !== undefined, 'phi-sorter-set-1 exists');
assert(s2 !== undefined, 'phi-sorter-set-2 exists');
assert(s3 !== undefined, 'phi-sorter-set-3 exists');
assert(getSorterDocumentSet('non-existent') === undefined, 'unknown id returns undefined');
assert(Object.keys(SORTER_DOCUMENT_SETS).length === 3, 'SORTER_DOCUMENT_SETS has exactly 3 entries');

// ── Set 1 structure ───────────────────────────────────────────────────
console.log('\n[Set 1 structure]');
if (s1) {
  assert(s1.act === 1, 'set-1 act === 1');
  assert(s1.triggerLocation === 'reception', 'set-1 triggerLocation === reception');
  assert(typeof s1.npcId === 'string' && s1.npcId.length > 0, 'set-1 npcId is non-empty');
  assert(s1.items.length >= 6, `set-1 has >= 6 items (got ${s1.items.length})`);
  assert(typeof s1.contextCard.title === 'string' && s1.contextCard.title.length > 0, 'set-1 contextCard.title non-empty');
  assert(typeof s1.contextCard.body === 'string' && s1.contextCard.body.length > 0, 'set-1 contextCard.body non-empty');
  assert(s1.passingAccuracy >= 0.5 && s1.passingAccuracy <= 1.0, `set-1 passingAccuracy in [0.5, 1.0] (got ${s1.passingAccuracy})`);
  assert(Array.isArray(s1.takeaways) && s1.takeaways.length === 2, 'set-1 takeaways is 2-tuple');
  assert(s1.takeaways[0].length > 20, `set-1 takeaways[0] length > 20 (got ${s1.takeaways[0].length})`);
  assert(s1.takeaways[1].length > 20, `set-1 takeaways[1] length > 20 (got ${s1.takeaways[1].length})`);
}

// ── Set 2 structure ───────────────────────────────────────────────────
console.log('\n[Set 2 structure]');
if (s2) {
  assert(s2.act === 2, 'set-2 act === 2');
  assert(s2.triggerLocation === 'lab', 'set-2 triggerLocation === lab');
  assert(s2.items.length >= 6, `set-2 has >= 6 items (got ${s2.items.length})`);
  assert(s2.passingAccuracy >= 0.5 && s2.passingAccuracy <= 1.0, `set-2 passingAccuracy in [0.5, 1.0]`);
  assert(Array.isArray(s2.takeaways) && s2.takeaways.length === 2, 'set-2 takeaways is 2-tuple');
  assert(s2.takeaways[0].length > 20, `set-2 takeaways[0] length > 20`);
  assert(s2.takeaways[1].length > 20, `set-2 takeaways[1] length > 20`);
}

// ── Set 3 structure ───────────────────────────────────────────────────
console.log('\n[Set 3 structure]');
if (s3) {
  assert(s3.act === 3 || s3.act === 2, `set-3 act is 2 or 3 (got ${s3.act})`);
  assert(s3.items.length >= 4, `set-3 has >= 4 items (got ${s3.items.length})`);
  assert(s3.passingAccuracy >= 0.5 && s3.passingAccuracy <= 1.0, `set-3 passingAccuracy in [0.5, 1.0]`);
  assert(Array.isArray(s3.takeaways) && s3.takeaways.length === 2, 'set-3 takeaways is 2-tuple');
}

// ── Per-item invariants ───────────────────────────────────────────────
console.log('\n[Per-item invariants]');
const allSets = [s1, s2, s3].filter(Boolean) as NonNullable<typeof s1>[];
for (const set of allSets) {
  for (const item of set.items) {
    assert(typeof item.id === 'string' && item.id.length > 0, `${set.id} item ${item.id}: id non-empty`);
    assert(typeof item.label === 'string' && item.label.length > 0, `${set.id} item ${item.id}: label non-empty`);
    assert(item.category === 'phi' || item.category === 'not_phi', `${set.id} item ${item.id}: category valid`);
    assert(typeof item.explanation === 'string' && item.explanation.length > 20, `${set.id} item ${item.id}: explanation > 20 chars`);
    // identifierType is OPTIONAL for PHI: some PHI (e.g. employer, #11) is
    // identifiable without being one of the 18 Safe Harbor types — those items
    // intentionally omit it (teaches PHI is broader than the checklist). When
    // present, it must be a non-empty string.
    if (item.category === 'phi' && item.identifierType !== undefined) {
      assert(typeof item.identifierType === 'string' && item.identifierType.length > 0, `${set.id} item ${item.id}: PHI identifierType (when set) is non-empty`);
    }
  }
}

// ── PHI / non-PHI mix per set ─────────────────────────────────────────
console.log('\n[PHI / non-PHI mix]');
for (const set of allSets) {
  const phiItems = set.items.filter(i => i.category === 'phi');
  const notPhiItems = set.items.filter(i => i.category === 'not_phi');
  assert(phiItems.length >= 2, `${set.id}: >= 2 PHI items (got ${phiItems.length})`);
  assert(notPhiItems.length >= 1, `${set.id}: >= 1 non-PHI items (got ${notPhiItems.length})`);
}

// ── HIPAA accuracy spot-check: known identifier types ────────────────
console.log('\n[HIPAA accuracy spot-check]');
const validIdentifierTypes = new Set([
  'name', 'geographic', 'date', 'phone', 'fax', 'email',
  'ssn', 'mrn', 'plan_id', 'account', 'license', 'vehicle',
  'device_serial', 'url', 'ip_address', 'biometric', 'photo', 'other',
]);
for (const set of allSets) {
  // Only PHI items that declare an identifierType are checked — omitting it is a
  // valid, intentional state (identifiable-but-not-on-the-18-list PHI).
  for (const item of set.items.filter(i => i.category === 'phi' && i.identifierType !== undefined)) {
    assert(
      validIdentifierTypes.has(item.identifierType as string),
      `${set.id} item ${item.id}: identifierType '${item.identifierType}' is a valid Safe Harbor type`,
    );
  }
}

// ── Summary ────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Tests: ${passed + failed} total, ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
