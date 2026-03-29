/**
 * QA Test Helpers — Shared utilities for Playwright progression tests.
 *
 * These helpers abstract canvas interaction via the QA bridge (window.__QA__),
 * letting tests drive the game without pixel-coordinate math.
 */

import type { Page } from '@playwright/test';

// ── Constants ──────────────────────────────────────────────────

export const SETTLE_MS = 2000;   // Default settling time after navigation
export const SCENE_TIMEOUT = 30_000;
export const EVENT_TIMEOUT = 15_000;

// ── Error Tracking ─────────────────────────────────────────────

export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  return errors;
}

export function filterBenignErrors(errors: string[]): string[] {
  return errors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('404') &&
    !e.includes('net::ERR') &&
    !e.includes('ResizeObserver') &&
    !e.includes('WebAudio')
  );
}

// ── QA Bridge Utilities ────────────────────────────────────────

/** Wait for window.__QA__ to exist */
export async function waitForQA(page: Page): Promise<void> {
  await page.waitForFunction(() => !!window.__QA__, { timeout: SCENE_TIMEOUT });
}

/** Wait for the Exploration scene to be ready */
export async function waitForExploration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => window.__QA__?.scenesVisited?.includes('Exploration'),
    { timeout: SCENE_TIMEOUT },
  );
  // Allow state broadcast cycle to populate currentRoomId
  await page.waitForTimeout(500);
}

/** Wait for a specific room to appear in the QA bridge state */
export async function waitForRoom(page: Page, roomId: string, timeoutMs = SCENE_TIMEOUT): Promise<void> {
  await page.waitForFunction(
    (id) => window.__QA__?.currentRoomId === id,
    roomId,
    { timeout: timeoutMs },
  );
  // Allow scene to fully render
  await page.waitForTimeout(500);
}

/** Read the current QA bridge state snapshot */
export async function qaState(page: Page) {
  return page.evaluate(() => {
    const q = window.__QA__;
    if (!q) throw new Error('QA bridge not initialized');
    return {
      sceneReady: q.sceneReady,
      currentRoomId: q.currentRoomId,
      completedRooms: q.completedRooms,
      completedNPCs: q.completedNPCs,
      completedZones: q.completedZones,
      collectedItems: q.collectedItems,
      playerPosition: q.playerPosition,
      nearbyInteractable: q.nearbyInteractable,
      nearDoor: q.nearDoor,
      paused: q.paused,
      breachState: q.breachState,
      roomNPCs: q.roomNPCs,
      roomZones: q.roomZones,
      roomItems: q.roomItems,
      roomDoors: q.roomDoors,
      eventLog: q.eventLog,
    };
  });
}

// ── Game Commands ──────────────────────────────────────────────

/** Move the player to a tile position using BFS pathfinding */
export async function movePlayerTo(page: Page, tileX: number, tileY: number): Promise<void> {
  await page.evaluate(([tx, ty]) => {
    window.__QA__!.commands.movePlayerTo(tx, ty);
  }, [tileX, tileY] as const);
  // Wait briefly for player to arrive (path may be blocked — don't wait too long)
  await page.waitForFunction(
    ([tx, ty]) => {
      const pos = window.__QA__?.playerPosition;
      if (!pos) return false;
      // Accept within 2 tiles (path may stop short due to obstacles)
      return Math.abs(pos.tileX - tx) + Math.abs(pos.tileY - ty) <= 2;
    },
    [tileX, tileY] as const,
    { timeout: 3_000 },
  ).catch(() => {});
  await page.waitForTimeout(200);
}

/** Press SPACE to interact with nearby NPC/zone/item/door */
export async function pressSpace(page: Page): Promise<void> {
  await page.evaluate(() => window.__QA__!.commands.pressSpace());
  await page.waitForTimeout(300);
}

/** Navigate to a specific door and enter it */
export async function navigateToDoor(page: Page, doorId: string): Promise<void> {
  await page.evaluate((id) => window.__QA__!.commands.navigateToDoor(id), doorId);
}

/** Move to an interactable and press SPACE.
 * Uses QA teleport for reliable instant positioning. */
export async function interactWith(
  page: Page,
  tileX: number,
  tileY: number,
): Promise<void> {
  // Teleport to adjacent tiles (NPC sprite blocks the target tile)
  for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
    await page.evaluate(([x, y]) => {
      window.__QA__!.commands.teleportTo(x, y);
    }, [tileX + dx, tileY + dy] as const);

    // Wait for proximity check in update loop (1-2 frames)
    await page.waitForFunction(
      () => window.__QA__?.nearbyInteractable !== null,
      { timeout: 1500 },
    ).catch(() => {});

    const nearby = await page.evaluate(() => window.__QA__?.nearbyInteractable);
    if (nearby) {
      await pressSpace(page);
      return;
    }
  }

  // Fallback: use BFS movePlayerTo
  await movePlayerTo(page, tileX, tileY + 1);
  await page.waitForFunction(
    () => window.__QA__?.nearbyInteractable !== null,
    { timeout: 2000 },
  ).catch(() => {});
  await pressSpace(page);
}

// ── Dialogue Helpers ───────────────────────────────────────────

/** Wait for dialogue overlay to appear */
export async function waitForDialogue(page: Page, timeoutMs = EVENT_TIMEOUT): Promise<void> {
  await page.waitForSelector('[data-testid="dialogue-overlay"], [data-testid="educational-item-modal"], [data-testid="observation-hint-overlay"]', {
    timeout: timeoutMs,
  });
}

/** Dismiss the currently visible dialogue overlay by clicking through it */
export async function dismissDialogue(page: Page): Promise<void> {
  // Check which overlay type is visible
  const overlayType = await page.evaluate(() => {
    if (document.querySelector('[data-testid="educational-item-modal"]')) return 'item';
    if (document.querySelector('[data-testid="observation-hint-overlay"]')) return 'observation';
    if (document.querySelector('[data-testid="choice-prompt-overlay"]')) return 'choice';
    if (document.querySelector('[data-testid="dialogue-overlay"]')) return 'dialogue';
    return null;
  });

  if (overlayType === 'item') {
    // Click close button on educational item modal
    const closeBtn = page.locator('[data-testid="button-close-modal"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(300);
      return;
    }
  }

  if (overlayType === 'observation') {
    // Click acknowledge button
    const ackBtn = page.locator('[data-testid="observation-hint-overlay"] button');
    if (await ackBtn.isVisible()) {
      await ackBtn.click();
      await page.waitForTimeout(300);
      return;
    }
  }

  if (overlayType === 'dialogue') {
    // Click through dialogue phases: dialogue → choices → feedback → complete
    for (let i = 0; i < 20; i++) {
      const dialogueVisible = await page.locator('[data-testid="dialogue-overlay"]').isVisible().catch(() => false);
      if (!dialogueVisible) break;

      // Check what's currently actionable
      const nextBtn = page.locator('[data-testid="button-next-scene"]');
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
        continue;
      }

      // Wait briefly for choices to render, then check
      const choiceBtn = page.locator('[data-testid="choice-button-1"]');
      if (await choiceBtn.isVisible().catch(() => false)) {
        await choiceBtn.click();
        await page.waitForTimeout(500);
        continue;
      }

      // Click dialogue container to skip typewriter / advance dialogue
      const dialogueContainer = page.locator('[data-testid="container-battle-dialogue"]');
      if (await dialogueContainer.isVisible().catch(() => false)) {
        await dialogueContainer.click();
        // Wait for React to process the phase transition
        await page.waitForTimeout(600);
        continue;
      }

      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(300);
  }
}

/** Complete a full NPC interaction: move to NPC, press space, dismiss dialogue */
export async function talkToNPC(
  page: Page,
  npcX: number,
  npcY: number,
): Promise<void> {
  // Try the standard approach first: teleport near + press space
  await interactWith(page, npcX, npcY);

  // Check if dialogue appeared
  const hasDialogue = await page.evaluate(() =>
    !!(document.querySelector('[data-testid="dialogue-overlay"]') ||
       document.querySelector('[data-testid="educational-item-modal"]') ||
       document.querySelector('[data-testid="observation-hint-overlay"]'))
  );

  if (!hasDialogue) {
    // Fallback: teleport directly below NPC and press space
    await page.evaluate(([x, y]) => {
      window.__QA__!.commands.teleportTo(x, y + 1);
    }, [npcX, npcY] as const);
    await page.waitForTimeout(300);
    await pressSpace(page);
  }

  // Wait for dialogue with longer timeout
  await waitForDialogue(page).catch(() => {});
  await dismissDialogue(page);
  // Wait for dialogue overlay to fully disappear (confirms onComplete fired)
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="dialogue-overlay"]') &&
          !document.querySelector('[data-testid="educational-item-modal"]'),
    { timeout: 5000 },
  ).catch(() => {});
  // Wait for scene to unpause and React state to sync to QA bridge
  await page.waitForFunction(() => !window.__QA__?.paused, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
}

/** Interact with a zone: move, press space, dismiss */
export async function examineZone(
  page: Page,
  zoneX: number,
  zoneY: number,
): Promise<void> {
  await interactWith(page, zoneX, zoneY);
  // Zones may trigger dialogue, observation hint, or choice prompt
  await page.waitForTimeout(500);
  const hasOverlay = await page.evaluate(() =>
    !!(document.querySelector('[data-testid="dialogue-overlay"]') ||
       document.querySelector('[data-testid="observation-hint-overlay"]') ||
       document.querySelector('[data-testid="choice-prompt-overlay"]'))
  );
  if (hasOverlay) {
    await dismissDialogue(page);
  }
  await page.waitForFunction(() => !window.__QA__?.paused, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}

/** Collect an educational item: move, press space, dismiss modal */
export async function collectItem(
  page: Page,
  itemX: number,
  itemY: number,
): Promise<void> {
  await interactWith(page, itemX, itemY);
  await page.waitForSelector('[data-testid="educational-item-modal"]', { timeout: 5000 }).catch(() => {});
  await dismissDialogue(page);
  await page.waitForFunction(() => !window.__QA__?.paused, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}

// ── Navigation Helpers ─────────────────────────────────────────

/** Navigate to a specific room via its door and wait for arrival */
export async function goThroughDoor(
  page: Page,
  doorId: string,
  expectedRoomId: string,
): Promise<void> {
  await navigateToDoor(page, doorId);
  await waitForRoom(page, expectedRoomId);
}

/** Load the game with clean state directly into a room */
export async function loadRoom(page: Page, roomId: string): Promise<void> {
  await page.goto(`/?qa-room=${roomId}&qa-no-save`);
  await page.waitForSelector('canvas', { timeout: 15_000 });
  await waitForExploration(page);
  await waitForRoom(page, roomId);
}

/** Load the game from scratch with clean state */
export async function loadFresh(page: Page): Promise<void> {
  await page.goto('/?qa-no-save&qa-skip-onboarding');
  await page.waitForSelector('canvas', { timeout: 15_000 });
  await waitForExploration(page);
  await waitForRoom(page, 'hospital_entrance');
}

// ── Room Data Reference ────────────────────────────────────────

/** All department rooms with their completion requirements and interactable positions */
export const ROOMS = {
  hospital_entrance: {
    npcs: { riley_entrance: { x: 7, y: 4 } },
    zones: {},
    items: {},
    requirements: { npcs: ['riley_entrance'], zones: [], items: [] },
    doors: { entrance_to_reception: 'reception' },
  },
  reception: {
    npcs: { riley: { x: 10, y: 4 }, nervous_patient: { x: 5, y: 8 }, chatty_visitor: { x: 15, y: 8 } },
    zones: { sign_in_sheet: { x: 8, y: 4 }, privacy_notice: { x: 12, y: 4 } },
    items: { patient_rights_poster: { x: 2, y: 4 } },
    requirements: { npcs: ['riley', 'nervous_patient'], zones: ['sign_in_sheet'], items: ['patient_rights_poster'] },
    doors: { reception_to_entrance: 'hospital_entrance', reception_to_hallway_break: 'hallway_reception_break' },
  },
  break_room: {
    npcs: {
      gossiping_coworker: { x: 7, y: 7 }, friend_fishing: { x: 16, y: 5 },
      tired_employee: { x: 4, y: 12 }, hr_director: { x: 14, y: 4 }, selfie_coworker: { x: 14, y: 10 },
    },
    zones: { overheard_conversation: { x: 10, y: 9 }, unlocked_phone: { x: 6, y: 7 } },
    items: { verbal_disclosure: { x: 17, y: 4 } },
    requirements: { npcs: ['gossiping_coworker', 'friend_fishing'], zones: ['overheard_conversation'], items: ['verbal_disclosure'] },
    doors: { break_to_hallway_reception: 'hallway_reception_break', break_to_hallway_lab: 'hallway_break_lab' },
  },
  lab: {
    npcs: { lab_tech: { x: 10, y: 7 }, researcher: { x: 3, y: 5 }, courier: { x: 16, y: 5 } },
    zones: { sample_labels: { x: 7, y: 7 }, results_printout: { x: 13, y: 7 } },
    items: { phi_identifiers: { x: 2, y: 8 } },
    requirements: { npcs: ['lab_tech', 'researcher'], zones: ['results_printout'], items: ['phi_identifiers'] },
    doors: { lab_to_hallway_break: 'hallway_break_lab', lab_to_hallway_records: 'hallway_lab_records' },
  },
  records_room: {
    npcs: {
      records_clerk: { x: 10, y: 10 }, patient_request: { x: 4, y: 8 },
      attorney: { x: 15, y: 8 }, compliance_officer: { x: 8, y: 12 },
    },
    zones: { unlocked_cabinet: { x: 4, y: 4 }, audit_log: { x: 7, y: 9 }, shredder: { x: 4, y: 12 } },
    items: { minimum_necessary_manual: { x: 17, y: 8 }, hipaa_penalties: { x: 10, y: 4 } },
    requirements: { npcs: ['records_clerk'], zones: ['unlocked_cabinet'], items: ['minimum_necessary_manual'] },
    doors: { records_to_hallway_lab: 'hallway_lab_records', records_to_hallway_it: 'hallway_records_it' },
  },
  it_office: {
    npcs: { security_analyst: { x: 10, y: 7 }, vendor: { x: 3, y: 8 }, workaround_employee: { x: 16, y: 8 } },
    zones: { password_note: { x: 9, y: 7 }, breach_playbook: { x: 5, y: 10 }, fax_machine: { x: 12, y: 10 }, vendor_agreement: { x: 14, y: 8 } },
    items: { security_safeguards: { x: 10, y: 2 } },
    requirements: { npcs: ['security_analyst', 'vendor'], zones: ['password_note'], items: ['security_safeguards'] },
    doors: { it_to_hallway_records: 'hallway_records_it', it_to_hallway_er: 'hallway_it_er' },
  },
  er: {
    npcs: { dr_martinez: { x: 10, y: 8 }, officer: { x: 2, y: 7 }, frantic_family: { x: 17, y: 7 } },
    zones: { whiteboard: { x: 10, y: 2 }, unlocked_computer: { x: 7, y: 6 } },
    items: { emergency_exceptions: { x: 17, y: 12 } },
    requirements: { npcs: ['dr_martinez', 'officer'], zones: ['whiteboard'], items: ['emergency_exceptions'] },
    doors: { er_to_hallway_it: 'hallway_it_er' },
  },
} as const;

/** Hallway rooms and their door connections */
export const HALLWAYS = {
  hallway_reception_break: {
    doors: {
      hallway_recbreak_to_reception: 'reception',
      hallway_recbreak_to_break: 'break_room',
    },
  },
  hallway_break_lab: {
    doors: {
      hallway_breaklab_to_break: 'break_room',
      hallway_breaklab_to_lab: 'lab',
    },
  },
  hallway_lab_records: {
    doors: {
      hallway_labrecords_to_lab: 'lab',
      hallway_labrecords_to_records: 'records_room',
    },
  },
  hallway_records_it: {
    doors: {
      hallway_recordsit_to_records: 'records_room',
      hallway_recordsit_to_it: 'it_office',
    },
  },
  hallway_it_er: {
    doors: {
      hallway_iter_to_it: 'it_office',
      hallway_iter_to_er: 'er',
    },
  },
} as const;

/** The unlock chain — each room requires the previous one to be completed */
export const UNLOCK_ORDER = [
  'hospital_entrance',
  'reception',
  'break_room',
  'lab',
  'records_room',
  'it_office',
  'er',
] as const;
