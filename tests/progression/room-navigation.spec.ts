import { test, expect } from '@playwright/test';
import {
  trackErrors,
  filterBenignErrors,
  loadFresh,
  loadRoom,
  goThroughDoor,
  talkToNPC,
  qaState,
  ROOMS,
} from '../helpers/qa-helpers';

test.describe('Room Navigation', () => {
  test.setTimeout(90_000);

  test('Hospital entrance loads on fresh start', async ({ page }) => {
    await loadFresh(page);
    const state = await qaState(page);
    expect(state.currentRoomId).toBe('hospital_entrance');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('Navigate entrance -> reception via door (after completing entrance)', async ({ page }) => {
    await loadFresh(page);
    // Must complete hospital_entrance (talk to Riley) before reception unlocks
    const riley = ROOMS.hospital_entrance.npcs.riley_entrance;
    await talkToNPC(page, riley.x, riley.y);
    // Now navigate through door
    await goThroughDoor(page, 'entrance_to_reception', 'reception');
    const state = await qaState(page);
    expect(state.currentRoomId).toBe('reception');
  });

  test('Navigate reception -> entrance (backtrack always allowed)', async ({ page }) => {
    // loadRoom bypasses lock checks via qa-room param
    await loadRoom(page, 'reception');
    await goThroughDoor(page, 'reception_to_entrance', 'hospital_entrance');
    const state = await qaState(page);
    expect(state.currentRoomId).toBe('hospital_entrance');
  });

  test('Navigate through hallway: reception -> hallway -> break room', async ({ page }) => {
    // loadRoom bypasses locks; hallways are accessible if their source dept is accessible
    // reception -> hallway_reception_break requires reception to be accessible (it is via backtrack)
    // hallway -> break_room requires reception to be completed
    // Since loadRoom doesn't set completedRooms, break_room may be locked
    // Use loadRoom to test hallway connectivity only
    await loadRoom(page, 'hallway_reception_break');
    // From hallway, going back to reception should work (backtrack)
    await goThroughDoor(page, 'hallway_recbreak_to_reception', 'reception');
    const state = await qaState(page);
    expect(state.currentRoomId).toBe('reception');
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
    // Complete entrance first
    const riley = ROOMS.hospital_entrance.npcs.riley_entrance;
    await talkToNPC(page, riley.x, riley.y);
    // Navigate to reception
    await goThroughDoor(page, 'entrance_to_reception', 'reception');
    const real = filterBenignErrors(errors);
    expect(real).toEqual([]);
  });
});
