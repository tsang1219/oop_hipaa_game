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

  test('Lab unlocks after completing break room', async ({ page }) => {
    // Load directly into break_room
    await loadRoom(page, 'break_room');

    // Complete all break_room requirements:
    // gossiping_coworker (social gate — first call resolves gate, second opens dialogue)
    await talkToNPC(page, ROOMS.break_room.npcs.gossiping_coworker.x, ROOMS.break_room.npcs.gossiping_coworker.y);
    // friend_fishing
    await talkToNPC(page, ROOMS.break_room.npcs.friend_fishing.x, ROOMS.break_room.npcs.friend_fishing.y);
    // overheard_conversation zone
    await examineZone(page, ROOMS.break_room.zones.overheard_conversation.x, ROOMS.break_room.zones.overheard_conversation.y);
    // verbal_disclosure item
    await collectItem(page, ROOMS.break_room.items.verbal_disclosure.x, ROOMS.break_room.items.verbal_disclosure.y);

    // Exit break_room → hallway_break_lab (triggers completion check)
    await goThroughDoor(page, 'break_to_hallway_lab', 'hallway_break_lab');

    // Verify break_room is complete
    const mid_state = await qaState(page);
    expect(mid_state.completedRooms).toContain('break_room');

    // Now lab should be accessible
    await goThroughDoor(page, 'hallway_breaklab_to_lab', 'lab');

    const state = await qaState(page);
    expect(state.currentRoomId).toBe('lab');
  });

  test('Records room unlocks after completing lab', async ({ page }) => {
    await loadRoom(page, 'lab');

    // Observation gate: must examine results_printout BEFORE talking to lab_tech
    await examineZone(page, ROOMS.lab.zones.results_printout.x, ROOMS.lab.zones.results_printout.y);
    await talkToNPC(page, ROOMS.lab.npcs.lab_tech.x, ROOMS.lab.npcs.lab_tech.y);
    await talkToNPC(page, ROOMS.lab.npcs.researcher.x, ROOMS.lab.npcs.researcher.y);
    await collectItem(page, ROOMS.lab.items.phi_identifiers.x, ROOMS.lab.items.phi_identifiers.y);

    // Exit lab → hallway → records_room
    await goThroughDoor(page, 'lab_to_hallway_records', 'hallway_lab_records');
    const mid_state = await qaState(page);
    expect(mid_state.completedRooms).toContain('lab');

    await goThroughDoor(page, 'hallway_labrecords_to_records', 'records_room');
    const state = await qaState(page);
    expect(state.currentRoomId).toBe('records_room');
  });

  test('IT office unlocks after completing records room', async ({ page }) => {
    await loadRoom(page, 'records_room');

    // Choice gate auto-shows on room entry — dismiss it to unlock patient_request NPC
    // Options have a 500ms render delay, so wait for the button to appear
    await page.waitForSelector('[data-testid="button-choice-0"]', { timeout: 5000 }).catch(() => {});
    const choiceBtn = page.locator('[data-testid="button-choice-0"]');
    if (await choiceBtn.isVisible().catch(() => false)) {
      await choiceBtn.click();
      await page.waitForTimeout(500);
    }
    await page.waitForFunction(() => !window.__QA__?.paused, { timeout: 5000 }).catch(() => {});

    // Complete records_room requirements
    await talkToNPC(page, ROOMS.records_room.npcs.records_clerk.x, ROOMS.records_room.npcs.records_clerk.y);
    await examineZone(page, ROOMS.records_room.zones.unlocked_cabinet.x, ROOMS.records_room.zones.unlocked_cabinet.y);
    await collectItem(page, ROOMS.records_room.items.minimum_necessary_manual.x, ROOMS.records_room.items.minimum_necessary_manual.y);

    // Exit records → hallway → it_office
    await goThroughDoor(page, 'records_to_hallway_it', 'hallway_records_it');
    const mid_state = await qaState(page);
    expect(mid_state.completedRooms).toContain('records_room');

    await goThroughDoor(page, 'hallway_recordsit_to_it', 'it_office');
    const state = await qaState(page);
    expect(state.currentRoomId).toBe('it_office');
  });

  test('ER unlocks after completing IT office', async ({ page }) => {
    await loadRoom(page, 'it_office');

    // Gate: must examine password_note BEFORE talking to security_analyst (observation gate)
    await examineZone(page, ROOMS.it_office.zones.password_note.x, ROOMS.it_office.zones.password_note.y);
    await talkToNPC(page, ROOMS.it_office.npcs.security_analyst.x, ROOMS.it_office.npcs.security_analyst.y);
    await talkToNPC(page, ROOMS.it_office.npcs.vendor.x, ROOMS.it_office.npcs.vendor.y);
    await collectItem(page, ROOMS.it_office.items.security_safeguards.x, ROOMS.it_office.items.security_safeguards.y);

    // Exit it_office → hallway → er
    await goThroughDoor(page, 'it_to_hallway_er', 'hallway_it_er');
    const mid_state = await qaState(page);
    expect(mid_state.completedRooms).toContain('it_office');

    await goThroughDoor(page, 'hallway_iter_to_er', 'er');
    const state = await qaState(page);
    expect(state.currentRoomId).toBe('er');
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
