import { test, expect } from '@playwright/test';
import {
  trackErrors,
  filterBenignErrors,
  loadRoom,
  movePlayerTo,
  pressSpace,
  talkToNPC,
  waitForDialogue,
  dismissDialogue,
  qaState,
  ROOMS,
} from '../helpers/qa-helpers';

test.describe('NPC Interaction', () => {
  test.setTimeout(60_000);

  test('Can talk to Riley in hospital entrance', async ({ page }) => {
    await loadRoom(page, 'hospital_entrance');
    const riley = ROOMS.hospital_entrance.npcs.riley_entrance;
    await talkToNPC(page, riley.x, riley.y);
    const state = await qaState(page);
    expect(state.completedNPCs).toContain('riley_entrance');
  });

  test('Dialogue overlay appears when talking to NPC', async ({ page }) => {
    await loadRoom(page, 'hospital_entrance');
    await movePlayerTo(page, 7, 5);
    await page.waitForTimeout(300);
    await pressSpace(page);
    await waitForDialogue(page);
    await expect(page.locator('[data-testid="dialogue-overlay"]')).toBeVisible();
    await dismissDialogue(page);
    const state = await qaState(page);
    expect(state.paused).toBe(false);
  });

  test('Can talk to multiple NPCs in reception', async ({ page }) => {
    await loadRoom(page, 'reception');
    const riley = ROOMS.reception.npcs.riley;
    const nervousPatient = ROOMS.reception.npcs.nervous_patient;
    await talkToNPC(page, riley.x, riley.y);
    await talkToNPC(page, nervousPatient.x, nervousPatient.y);
    const state = await qaState(page);
    expect(state.completedNPCs).toContain('riley');
    expect(state.completedNPCs).toContain('nervous_patient');
  });

  test('Scene unpauses after dialogue dismissal', async ({ page }) => {
    await loadRoom(page, 'hospital_entrance');
    const riley = ROOMS.hospital_entrance.npcs.riley_entrance;
    await talkToNPC(page, riley.x, riley.y);
    const state = await qaState(page);
    expect(state.paused).toBe(false);
  });

  test('No console errors during NPC interactions', async ({ page }) => {
    const errors = trackErrors(page);
    await loadRoom(page, 'hospital_entrance');
    const riley = ROOMS.hospital_entrance.npcs.riley_entrance;
    await talkToNPC(page, riley.x, riley.y);
    await loadRoom(page, 'reception');
    const receptionRiley = ROOMS.reception.npcs.riley;
    await talkToNPC(page, receptionRiley.x, receptionRiley.y);
    const real = filterBenignErrors(errors);
    expect(real).toEqual([]);
  });
});
