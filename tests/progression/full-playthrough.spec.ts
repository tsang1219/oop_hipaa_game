import { test, expect } from '@playwright/test';
import {
  trackErrors,
  filterBenignErrors,
  loadFresh,
  qaState,
  talkToNPC,
  examineZone,
  collectItem,
  goThroughDoor,
  ROOMS,
  SETTLE_MS,
} from '../helpers/qa-helpers';

test.describe('Full Playthrough', () => {
  test.describe.configure({ timeout: 180_000 }); // 3 minutes for long integration test

  test('Complete hospital entrance and reception', async ({ page }) => {
    const errors = trackErrors(page);

    await loadFresh(page);

    // === Hospital Entrance ===
    const state1 = await qaState(page);
    expect(state1.currentRoomId).toBe('hospital_entrance');

    // Talk to Riley (required NPC in hospital entrance)
    const riley = ROOMS.hospital_entrance.npcs.riley_entrance;
    await talkToNPC(page, riley.x, riley.y);

    // Verify Riley conversation completed
    const stateAfterRiley = await qaState(page);
    expect(stateAfterRiley.completedNPCs).toContain('riley_entrance');

    // Navigate to reception via door
    await goThroughDoor(page, 'entrance_to_reception', 'reception');

    // Verify hospital_entrance marked complete and we are in reception
    const stateInReception = await qaState(page);
    expect(stateInReception.completedRooms).toContain('hospital_entrance');
    expect(stateInReception.currentRoomId).toBe('reception');

    // === Reception ===
    // Talk to required NPCs
    const rileyReception = ROOMS.reception.npcs.riley;
    await talkToNPC(page, rileyReception.x, rileyReception.y);

    const nervousPatient = ROOMS.reception.npcs.nervous_patient;
    await talkToNPC(page, nervousPatient.x, nervousPatient.y);

    // Examine required zone
    const signInSheet = ROOMS.reception.zones.sign_in_sheet;
    await examineZone(page, signInSheet.x, signInSheet.y);

    // Collect required item
    const patientRightsPoster = ROOMS.reception.items.patient_rights_poster;
    await collectItem(page, patientRightsPoster.x, patientRightsPoster.y);

    // Navigate out to trigger completion check
    await goThroughDoor(
      page,
      'reception_to_hallway_break',
      'hallway_reception_break'
    );

    // Verify reception marked complete
    const finalState = await qaState(page);
    expect(finalState.completedRooms).toContain('reception');

    // Verify no console errors throughout the playthrough
    expect(filterBenignErrors(errors)).toEqual([]);
  });

  test('Screenshot at each milestone', async ({ page }) => {
    const errors = trackErrors(page);

    await loadFresh(page);
    await page.waitForTimeout(SETTLE_MS);

    // Screenshot: Hospital Entrance initial state
    await page.screenshot({ path: 'test-results/progression-entrance.png' });

    // Complete hospital entrance
    const riley = ROOMS.hospital_entrance.npcs.riley_entrance;
    await talkToNPC(page, riley.x, riley.y);

    // Navigate to reception
    await goThroughDoor(page, 'entrance_to_reception', 'reception');
    await page.waitForTimeout(SETTLE_MS);

    // Screenshot: Arrived in reception
    await page.screenshot({ path: 'test-results/progression-reception.png' });

    // Complete reception requirements
    const rileyReception = ROOMS.reception.npcs.riley;
    await talkToNPC(page, rileyReception.x, rileyReception.y);

    const nervousPatient = ROOMS.reception.npcs.nervous_patient;
    await talkToNPC(page, nervousPatient.x, nervousPatient.y);

    const signInSheet = ROOMS.reception.zones.sign_in_sheet;
    await examineZone(page, signInSheet.x, signInSheet.y);

    const patientRightsPoster = ROOMS.reception.items.patient_rights_poster;
    await collectItem(page, patientRightsPoster.x, patientRightsPoster.y);

    // Screenshot: Reception completed
    await page.screenshot({
      path: 'test-results/progression-reception-complete.png',
    });

    // Verify no console errors
    expect(filterBenignErrors(errors)).toEqual([]);
  });
});
