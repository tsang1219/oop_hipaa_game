import { describe, it, expect, beforeEach } from 'vitest';

// Will import from saveData.ts once created
import { migrateV1toV2, loadSave, writeSave, SAVE_KEY_V2, defaultSave, type SaveDataV2 } from './saveData';

describe('saveData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Test 1: migrateV1toV2 with no localStorage returns defaultSave
  it('returns defaultSave when no localStorage data exists', () => {
    const result = migrateV1toV2([]);
    expect(result.version).toBe(2);
    expect(result.privacyScore).toBe(100);
    expect(result.completedRooms).toEqual([]);
    expect(result.collectedStories).toEqual([]);
    expect(result.completedNPCs).toEqual([]);
    expect(result.completedZones).toEqual([]);
    expect(result.collectedItems).toEqual([]);
    expect(result.sfxMuted).toBe(false);
    expect(result.onboardingSeen).toBe(false);
  });

  // Test 2: migrateV1toV2 with v1 keys reads them into v2 and removes v1 keys
  it('migrates v1 keys into v2 structure and removes v1 keys', () => {
    localStorage.setItem('completedRooms', JSON.stringify(['reception', 'break_room']));
    localStorage.setItem('collectedStories', JSON.stringify(['reception']));
    localStorage.setItem('completedNPCs', JSON.stringify(['nurse_nina', 'dr_patel']));
    localStorage.setItem('completedZones', JSON.stringify(['zone_1']));
    localStorage.setItem('collectedEducationalItems', JSON.stringify(['poster_1']));
    localStorage.setItem('current-privacy-score', '85');
    localStorage.setItem('final-privacy-score', '90');
    localStorage.setItem('gameStartTime', '1700000000000');
    localStorage.setItem('pq:onboarding:seen', '1');

    const result = migrateV1toV2(['reception']);

    expect(result.completedRooms).toEqual(['reception', 'break_room']);
    expect(result.collectedStories).toEqual(['reception']);
    expect(result.completedNPCs).toEqual(['nurse_nina', 'dr_patel']);
    expect(result.completedZones).toEqual(['zone_1']);
    expect(result.collectedItems).toEqual(['poster_1']);
    expect(result.privacyScore).toBe(85);
    expect(result.finalPrivacyScore).toBe(90);
    expect(result.gameStartTime).toBe(1700000000000);
    expect(result.onboardingSeen).toBe(true);

    // v1 keys should be removed
    expect(localStorage.getItem('completedRooms')).toBeNull();
    expect(localStorage.getItem('collectedStories')).toBeNull();
    expect(localStorage.getItem('completedNPCs')).toBeNull();
    expect(localStorage.getItem('completedZones')).toBeNull();
    expect(localStorage.getItem('collectedEducationalItems')).toBeNull();
    expect(localStorage.getItem('current-privacy-score')).toBeNull();
    expect(localStorage.getItem('final-privacy-score')).toBeNull();
    expect(localStorage.getItem('gameStartTime')).toBeNull();
    expect(localStorage.getItem('pq:onboarding:seen')).toBeNull();

    // v2 key should exist
    expect(localStorage.getItem(SAVE_KEY_V2)).not.toBeNull();
  });

  // Test 3: migrateV1toV2 called twice returns v2 without re-migrating (idempotent)
  it('is idempotent - returns existing v2 without re-migrating', () => {
    localStorage.setItem('completedRooms', JSON.stringify(['reception']));
    localStorage.setItem('current-privacy-score', '75');

    const first = migrateV1toV2([]);
    expect(first.privacyScore).toBe(75);

    // Simulate leftover v1 keys (shouldn't happen, but tests idempotency)
    localStorage.setItem('current-privacy-score', '50');

    const second = migrateV1toV2([]);
    // Should return the same v2 save, not re-migrate from the new v1 key
    expect(second.privacyScore).toBe(75);
  });

  // Test 4: migrateV1toV2 with corrupted pq:save:v2 falls through and migrates fresh
  it('handles corrupted v2 JSON by falling through to fresh migration', () => {
    localStorage.setItem(SAVE_KEY_V2, '{corrupted json!!!');
    localStorage.setItem('current-privacy-score', '60');

    const result = migrateV1toV2([]);
    expect(result.privacyScore).toBe(60);
    expect(result.version).toBe(2);
  });

  // Test 5: loadSave returns defaultSave when absent; returns parsed when present
  it('loadSave returns defaultSave when no v2 key exists', () => {
    const result = loadSave();
    expect(result.version).toBe(2);
    expect(result.privacyScore).toBe(100);
    expect(result.completedRooms).toEqual([]);
  });

  it('loadSave returns parsed v2 save when present', () => {
    const save: SaveDataV2 = {
      ...defaultSave,
      privacyScore: 42,
      completedRooms: ['lab'],
    };
    localStorage.setItem(SAVE_KEY_V2, JSON.stringify(save));

    const result = loadSave();
    expect(result.privacyScore).toBe(42);
    expect(result.completedRooms).toEqual(['lab']);
  });

  // Test 6: writeSave stores JSON; loadSave round-trips it
  it('writeSave + loadSave round-trips correctly', () => {
    const save: SaveDataV2 = {
      ...defaultSave,
      privacyScore: 55,
      completedRooms: ['reception', 'lab'],
      completedNPCs: ['nurse_nina'],
    };

    writeSave(save);
    const loaded = loadSave();

    expect(loaded.privacyScore).toBe(55);
    expect(loaded.completedRooms).toEqual(['reception', 'lab']);
    expect(loaded.completedNPCs).toEqual(['nurse_nina']);
  });

  // Test 7: per-room keys are migrated and removed
  it('migrates per-room keys (resolvedGates, unlockedNpcs, npcPulsed)', () => {
    localStorage.setItem('resolvedGates_reception', JSON.stringify(['gate_1', 'gate_2']));
    localStorage.setItem('unlockedNpcs_reception', JSON.stringify(['npc_a']));
    localStorage.setItem('pq:room:reception:npcPulsed', '1');

    const result = migrateV1toV2(['reception']);

    expect(result.resolvedGates).toEqual({ reception: ['gate_1', 'gate_2'] });
    expect(result.unlockedNpcs).toEqual({ reception: ['npc_a'] });
    expect(result.npcPulsedRooms).toContain('reception');

    // Per-room v1 keys should be removed
    expect(localStorage.getItem('resolvedGates_reception')).toBeNull();
    expect(localStorage.getItem('unlockedNpcs_reception')).toBeNull();
    expect(localStorage.getItem('pq:room:reception:npcPulsed')).toBeNull();
  });

  // Test 8: sfxMuted and musicVolume migration
  it('maps sfx_muted and music_volume to v2 schema', () => {
    localStorage.setItem('sfx_muted', 'true');
    localStorage.setItem('music_volume', '0.8');

    const result = migrateV1toV2([]);

    expect(result.sfxMuted).toBe(true);
    expect(result.musicVolume).toBe(0.8);

    // v1 audio keys should be removed
    expect(localStorage.getItem('sfx_muted')).toBeNull();
    expect(localStorage.getItem('music_volume')).toBeNull();
  });
});
