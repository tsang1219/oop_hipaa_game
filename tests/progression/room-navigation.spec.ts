import { test, expect } from '@playwright/test';
import {
  trackErrors,
  filterBenignErrors,
  loadFresh,
  loadRoom,
  goThroughDoor,
  qaState,
  ROOMS,
  HALLWAYS,
} from '../helpers/qa-helpers';

test.describe('Room Navigation', () => {
  test.setTimeout(60_000);

  test('Hospital entrance loads on fresh start', async ({ page }) => {
    await loadFresh(page);
    const state = await qaState(page);
    expect(state.currentRoomId).toBe('hospital_entrance');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('Navigate entrance -> reception via door', async ({ page }) => {
    await loadFresh(page);
    await goThroughDoor(page, 'entrance_to_reception', 'reception');
    const state = await qaState(page);
    expect(state.currentRoomId).toBe('reception');
  });

  test('Navigate reception -> entrance (backtrack)', async ({ page }) => {
    await loadRoom(page, 'reception');
    await goThroughDoor(page, 'reception_to_entrance', 'hospital_entrance');
    const state = await qaState(page);
    expect(state.currentRoomId).toBe('hospital_entrance');
  });

  test('Navigate through hallway: reception -> hallway -> break room', async ({ page }) => {
    await loadRoom(page, 'reception');
    await goThroughDoor(page, 'reception_to_hallway_break', 'hallway_reception_break');
    await goThroughDoor(page, 'hallway_recbreak_to_break', 'break_room');
    const state = await qaState(page);
    expect(state.currentRoomId).toBe('break_room');
  });

  test.describe('Direct room load via qa-room param', () => {
    for (const roomId of Object.keys(ROOMS)) {
      test(`loads ${roomId} directly`, async ({ page }) => {
        await loadRoom(page, roomId);
        const state = await qaState(page);
        expect(state.currentRoomId).toBe(roomId);
      });
    }
  });

  test('No console errors during navigation', async ({ page }) => {
    const errors = trackErrors(page);
    await loadFresh(page);
    await goThroughDoor(page, 'entrance_to_reception', 'reception');
    await goThroughDoor(page, 'reception_to_hallway_break', 'hallway_reception_break');
    await goThroughDoor(page, 'hallway_recbreak_to_break', 'break_room');
    const real = filterBenignErrors(errors);
    expect(real).toEqual([]);
  });
});
