import { test, expect } from '@playwright/test';
import {
  trackErrors,
  filterBenignErrors,
  loadRoom,
  talkToNPC,
  examineZone,
  collectItem,
  goThroughDoor,
  qaState,
  ROOMS,
} from '../helpers/qa-helpers';

test.describe('Room Completion', () => {
  test.describe.configure({ timeout: 120_000 });

  let errors: Error[];

  test.beforeEach(async ({ page }) => {
    errors = trackErrors(page);
  });

  test.afterEach(() => {
    const real = filterBenignErrors(errors);
    expect(real, 'No console errors').toHaveLength(0);
  });

  test('Hospital entrance completes after talking to Riley', async ({ page }) => {
    await loadRoom(page, 'hospital_entrance');
    await talkToNPC(page, 7, 4); // riley_entrance
    await goThroughDoor(page, 'entrance_to_reception', 'reception');

    const state = await qaState(page);
    expect(state.completedRooms).toContain('hospital_entrance');
  });

  test('Reception completes after all requirements met', async ({ page }) => {
    await loadRoom(page, 'reception');

    // Talk to both NPCs
    await talkToNPC(page, 10, 4); // riley
    await talkToNPC(page, 5, 8);  // nervous_patient

    // Examine zone
    await examineZone(page, 8, 4); // sign_in_sheet

    // Collect item
    await collectItem(page, 2, 4); // patient_rights_poster

    // Exit room to trigger completion check
    await goThroughDoor(page, 'reception_to_entrance', 'hospital_entrance');

    const state = await qaState(page);
    expect(state.completedRooms).toContain('reception');
  });

  test('Incomplete room does NOT mark as complete', async ({ page }) => {
    await loadRoom(page, 'reception');

    // Only talk to riley — skip nervous_patient, sign_in_sheet, patient_rights_poster
    await talkToNPC(page, 10, 4); // riley

    // Exit room
    await goThroughDoor(page, 'reception_to_entrance', 'hospital_entrance');

    const state = await qaState(page);
    expect(state.completedRooms).not.toContain('reception');
  });

  test('Gated NPCs are not immediately interactable', async ({ page }) => {
    await loadRoom(page, 'break_room');

    // gossiping_coworker has a social gate — interaction should not complete
    await talkToNPC(page, 7, 7);   // gossiping_coworker (gated)

    const state = await qaState(page);
    // Gated NPC should NOT appear in completedNPCs
    expect(state.completedNPCs).not.toContain('gossiping_coworker');

    // But non-gated NPC should work
    await talkToNPC(page, 16, 5);  // friend_fishing (not gated)
    const state2 = await qaState(page);
    expect(state2.completedNPCs).toContain('friend_fishing');
  });
});
