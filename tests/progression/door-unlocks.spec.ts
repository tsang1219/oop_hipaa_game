import { test, expect } from '@playwright/test';
import {
  trackErrors,
  filterBenignErrors,
  loadFresh,
  loadRoom,
  talkToNPC,
  examineZone,
  collectItem,
  goThroughDoor,
  qaState,
  movePlayerTo,
  pressSpace,
  ROOMS,
} from '../helpers/qa-helpers';

test.describe('Door Unlocks', () => {
  test.describe.configure({ timeout: 120_000 });

  let errors: Error[];

  test.beforeEach(async ({ page }) => {
    errors = trackErrors(page);
  });

  test.afterEach(() => {
    const real = filterBenignErrors(errors);
    expect(real, 'No console errors').toHaveLength(0);
  });

  test('Hospital entrance to reception after completing entrance', async ({ page }) => {
    await loadFresh(page);

    // Complete hospital_entrance by talking to Riley
    const riley = ROOMS.hospital_entrance.npcs.riley_entrance;
    await talkToNPC(page, riley.x, riley.y);

    // Now door to reception should be accessible
    await goThroughDoor(page, 'entrance_to_reception', 'reception');

    const state = await qaState(page);
    expect(state.currentRoomId).toBe('reception');
  });

  test('Break room is locked when reception is not completed', async ({ page }) => {
    // Load directly into the hallway to test lock — skip the entrance→reception navigation
    await loadRoom(page, 'hallway_reception_break');

    // Try to enter break room — should be locked since reception is not complete
    // goThroughDoor expects the room to change, so we do this manually
    // Move to the door and press space; the room should NOT change
    const state_before = await qaState(page);
    expect(state_before.currentRoomId).toBe('hallway_reception_break');

    // Attempt door interaction — use movePlayerTo + pressSpace instead of goThroughDoor
    // since goThroughDoor would fail waiting for a room that never loads
    // We listen for REACT_DOOR_LOCKED event via qaState checking room doesn't change
    await page.evaluate(() => {
      const bridge = (window as any).__EVENTBRIDGE__;
      if (bridge) bridge.emit('QA_GO_THROUGH_DOOR', { doorId: 'hallway_recbreak_to_break' });
    });

    // Wait a beat for any transition that might happen
    await page.waitForTimeout(2000);

    const state_after = await qaState(page);
    expect(state_after.currentRoomId).toBe('hallway_reception_break');
    expect(state_after.completedRooms).not.toContain('reception');
  });

  test('Break room unlocks after completing reception', async ({ page }) => {
    // Load directly into reception (bypasses entrance lock)
    await loadRoom(page, 'reception');

    // Complete all reception requirements
    await talkToNPC(page, 10, 4); // riley
    await talkToNPC(page, 5, 8);  // nervous_patient
    await examineZone(page, 8, 4); // sign_in_sheet
    await collectItem(page, 2, 4); // patient_rights_poster

    // Exit reception → hallway (triggers completion check)
    await goThroughDoor(page, 'reception_to_hallway_break', 'hallway_reception_break');

    // Verify reception is now complete
    const mid_state = await qaState(page);
    expect(mid_state.completedRooms).toContain('reception');

    // Now break room should be accessible
    await goThroughDoor(page, 'hallway_recbreak_to_break', 'break_room');

    const state = await qaState(page);
    expect(state.currentRoomId).toBe('break_room');
  });

  test('Entrance door is always accessible from hospital_entrance', async ({ page }) => {
    // hospital_entrance is the starting room — the door to reception requires
    // completing hospital_entrance first, but going back is fine
    await loadRoom(page, 'hospital_entrance');

    // Complete entrance by talking to Riley
    const riley = ROOMS.hospital_entrance.npcs.riley_entrance;
    await talkToNPC(page, riley.x, riley.y);

    // Now the door to reception should work
    await goThroughDoor(page, 'entrance_to_reception', 'reception');

    // And going back to entrance should always work (backtrack)
    await goThroughDoor(page, 'reception_to_entrance', 'hospital_entrance');

    const state = await qaState(page);
    expect(state.currentRoomId).toBe('hospital_entrance');
  });
});
