/**
 * Save/resume safety: corrupt-save backups, storage failures, the CONTINUE
 * summary, honest savedAt stamps, and NEW GAME keeping device prefs.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadSave, writeSave, migrateV1toV2, getSaveSummary, clearProgress, formatSaveAge,
  subscribeSaveStatus, SAVE_KEY_V2, SAVE_BACKUP_KEY, defaultSave, type SaveDataV2,
} from './saveData';

const progress = (over: Partial<SaveDataV2> & Record<string, unknown> = {}) =>
  ({ ...defaultSave, gameStartTime: 1, ...over }) as SaveDataV2;

describe('save backups for unreadable saves', () => {
  beforeEach(() => localStorage.clear());

  it('parks corrupt JSON under the backup key before starting fresh', () => {
    localStorage.setItem(SAVE_KEY_V2, '{"version":2,"completedRooms":["recep');
    const result = loadSave();
    expect(result.completedRooms).toEqual([]);
    expect(localStorage.getItem(SAVE_BACKUP_KEY)).toBe('{"version":2,"completedRooms":["recep');
  });

  it('parks a newer-version save instead of letting the next write erase it', () => {
    const future = JSON.stringify({ version: 3, rooms: { reception: 'done' } });
    localStorage.setItem(SAVE_KEY_V2, future);
    writeSave(loadSave()); // what the game does on boot
    expect(localStorage.getItem(SAVE_BACKUP_KEY)).toBe(future);
    expect(JSON.parse(localStorage.getItem(SAVE_KEY_V2)!).version).toBe(2);
  });

  it('migrateV1toV2 backs up a wrong-shape v2 blob before migrating over it', () => {
    localStorage.setItem(SAVE_KEY_V2, '[1,2,3]');
    migrateV1toV2([]);
    expect(localStorage.getItem(SAVE_BACKUP_KEY)).toBe('[1,2,3]');
  });

  it('keeps the first unreadable save — a later fresh save cannot clobber the backup', () => {
    localStorage.setItem(SAVE_KEY_V2, 'garbage-1');
    writeSave(loadSave());
    loadSave(); // now valid — no new backup
    expect(localStorage.getItem(SAVE_BACKUP_KEY)).toBe('garbage-1');
  });

  it('leaves no backup behind for a healthy save', () => {
    writeSave(progress({ completedRooms: ['reception'] }));
    loadSave();
    expect(localStorage.getItem(SAVE_BACKUP_KEY)).toBeNull();
  });
});

describe('storage failures never crash the game', () => {
  afterEach(() => vi.restoreAllMocks());

  it('writeSave returns false and reports "failed" when storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const heard: string[] = [];
    const off = subscribeSaveStatus(s => heard.push(s));
    expect(() => writeSave(progress())).not.toThrow();
    expect(writeSave(progress())).toBe(false);
    off();
    expect(heard).toContain('failed');
  });

  it('loadSave and migrateV1toV2 fall back to a fresh save when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(loadSave().completedRooms).toEqual([]);
    expect(migrateV1toV2(['reception']).version).toBe(2);
  });
});

describe('savedAt + status channel', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.useRealTimers());

  it('stamps savedAt on a real change and keeps it on a no-op rewrite', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    writeSave(progress({ completedRooms: ['reception'] }));
    vi.setSystemTime(9_000_000);
    writeSave(loadSave()); // same progress
    expect(getSaveSummary().savedAt).toBe(1_000_000);
    writeSave({ ...loadSave(), completedRooms: ['reception', 'break_room'] });
    expect(getSaveSummary().savedAt).toBe(9_000_000);
  });

  it('only announces "saved" when progress changed', () => {
    const heard: string[] = [];
    const off = subscribeSaveStatus(s => heard.push(s));
    writeSave(progress({ completedNPCs: ['riley'] }));
    writeSave(loadSave());
    writeSave(loadSave());
    off();
    expect(heard).toEqual(['saved']);
  });
});

describe('CONTINUE summary', () => {
  beforeEach(() => localStorage.clear());

  it('describes where the player left off, preserving extended fields', () => {
    writeSave(progress({
      completedRooms: ['reception', 'break_room'],
      completedNPCs: ['riley', 'aiyana', 'nina'],
      currentRoomId: 'lab',
      currentAct: 2,
    }));
    const s = getSaveSummary();
    expect(s).toMatchObject({ currentRoomId: 'lab', roomsCleared: 2, peopleHelped: 3, act: 2 });
    expect(typeof s.savedAt).toBe('number');
  });

  it('tolerates junk extended fields from a hand-edited save', () => {
    localStorage.setItem(SAVE_KEY_V2, JSON.stringify({ ...defaultSave, currentRoomId: 7, currentAct: 'three', savedAt: 'soon' }));
    expect(getSaveSummary()).toMatchObject({ currentRoomId: null, act: 1, savedAt: null });
  });

  it('formats save age in start-menu voice', () => {
    const now = 10 * 24 * 3_600_000;
    expect(formatSaveAge(now - 10_000, now)).toBe('JUST NOW');
    expect(formatSaveAge(now - 5 * 60_000, now)).toBe('5 MIN AGO');
    expect(formatSaveAge(now - 3 * 3_600_000, now)).toBe('3 HR AGO');
    expect(formatSaveAge(now - 30 * 3_600_000, now)).toBe('YESTERDAY');
    expect(formatSaveAge(now - 4 * 24 * 3_600_000, now)).toBe('4 DAYS AGO');
    expect(formatSaveAge(now + 60_000, now)).toBe('JUST NOW'); // clock skew
  });
});

describe('clearProgress (NEW GAME)', () => {
  beforeEach(() => localStorage.clear());

  it('wipes progress but keeps audio preferences', () => {
    writeSave(progress({ completedRooms: ['reception'] }));
    localStorage.setItem('pq:room:reception:npcPulsed', '1');
    localStorage.setItem(SAVE_BACKUP_KEY, 'old');
    localStorage.setItem('music_volume', '0.2');
    localStorage.setItem('sfx_muted', 'true');
    localStorage.setItem('pq:audio:mix:v1', '{"sfx":0.5}');
    clearProgress();
    expect(localStorage.getItem(SAVE_KEY_V2)).toBeNull();
    expect(localStorage.getItem(SAVE_BACKUP_KEY)).toBeNull();
    expect(localStorage.getItem('pq:room:reception:npcPulsed')).toBeNull();
    expect(localStorage.getItem('music_volume')).toBe('0.2');
    expect(localStorage.getItem('sfx_muted')).toBe('true');
    expect(localStorage.getItem('pq:audio:mix:v1')).toBe('{"sfx":0.5}');
  });
});
