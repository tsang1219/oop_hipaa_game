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

  test('Hospital entrance to reception is always accessible', async ({ page }) => {
    await loadFresh(page);

    await goThroughDoor(page, 'entrance_to_reception', 'reception');

    const state = await qaState(page);
    expect(state.currentRoomId).toBe('reception');
  });

  test('Break room is locked when reception is not completed', async ({ page }) => {
    await loadFresh(page);

    // Navigate entrance → reception → hallway without completing reception
    await goThroughDoor(page, 'entrance_to_reception', 'reception');
    await goThroughDoor(page, 'reception_to_hallway_break', 'hallway_reception_break');

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
    await loadFresh(page);

    // Navigate to reception
    await goThroughDoor(page, 'entrance_to_reception', 'reception');

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

  test('Lab unlocks after completing break_room', async ({ page }) => {
    // Use loadRoom to bypass lock checks and directly enter break_room
    await loadRoom(page, 'break_room');

    // Complete all break_room requirements
    await talkToNPC(page, 7, 7);   // gossiping_coworker
    await talkToNPC(page, 16, 5);  // friend_fishing
    await examineZone(page, 10, 9); // overheard_conversation
    await collectItem(page, 17, 4); // verbal_disclosure

    // Exit break_room → hallway (triggers completion check)
    await goThroughDoor(page, 'break_to_hallway_lab', 'hallway_break_lab');

    // Verify break_room is now complete
    const mid_state = await qaState(page);
    expect(mid_state.completedRooms).toContain('break_room');

    // Lab should now be accessible
    await goThroughDoor(page, 'hallway_breaklab_to_lab', 'lab');

    const state = await qaState(page);
    expect(state.currentRoomId).toBe('lab');
  });
});
