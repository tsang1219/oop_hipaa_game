import Phaser from 'phaser';

/**
 * Run 12 — second-pass audio loader.
 *
 * BootScene preloads what the first minute of play needs (music, footsteps,
 * the interact cue, stingers, UI ticks). Everything else — tower-defense
 * impacts, sorter/triage/corkboard one-shots, the rarer world sounds — is
 * loaded here, in a throwaway scene launched right after boot so it runs in
 * parallel with the lobby instead of holding the LOADING bar hostage on a
 * slow machine. playSfx() checks the cache, so a key that hasn't landed yet
 * is simply silent for that first second rather than an error.
 */
export class DeferredAudioScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DeferredAudio' });
  }

  preload() {
    const base = import.meta.env.BASE_URL;
    const IMPACT = `${base}attached_assets/audio/kenney_impact-sounds/Audio`;
    const UI = `${base}attached_assets/audio/kenney_interface-sounds/Audio`;

    // World extras
    this.load.audio('sfx_door_creak',   `${UI}/open_004.ogg`);
    this.load.audio('sfx_door_locked',  `${UI}/error_004.ogg`);
    for (let i = 0; i < 3; i++) this.load.audio(`sfx_wall_bump_${i}`, `${IMPACT}/impactSoft_medium_00${i}.ogg`);
    this.load.audio('sfx_zone_examine', `${UI}/glass_001.ogg`);
    this.load.audio('sfx_pin',          `${IMPACT}/impactWood_light_000.ogg`);
    this.load.audio('sfx_tray_drop_0',  `${UI}/drop_001.ogg`);
    this.load.audio('sfx_tray_drop_1',  `${UI}/drop_002.ogg`);
    this.load.audio('sfx_card_flip',    `${UI}/scroll_001.ogg`);
    this.load.audio('sfx_glass_0',      `${UI}/glass_002.ogg`);
    this.load.audio('sfx_glass_1',      `${UI}/glass_003.ogg`);
    this.load.audio('sfx_scratch',      `${UI}/scratch_001.ogg`);
    this.load.audio('sfx_switch',       `${UI}/switch_001.ogg`);
    this.load.audio('sfx_bell',         `${IMPACT}/impactBell_heavy_000.ogg`);

    // UI — the less frequent voices
    this.load.audio('sfx_ui_confirm',   `${UI}/confirmation_004.ogg`);
    this.load.audio('sfx_ui_back',      `${UI}/back_001.ogg`);
    this.load.audio('sfx_ui_error',     `${UI}/error_005.ogg`);
    this.load.audio('sfx_ui_toggle',    `${UI}/toggle_001.ogg`);
    this.load.audio('sfx_score_up',     `${UI}/select_006.ogg`);
    this.load.audio('sfx_score_down',   `${UI}/error_003.ogg`);

    // Ambient one-shots (roomAmbience timers fire seconds after entry anyway)
    this.load.audio('sfx_ambient_er_beep',       `${UI}/tick_002.ogg`);
    this.load.audio('sfx_ambient_breakroom_hum', `${UI}/switch_006.ogg`);
    this.load.audio('sfx_ambient_records_paper', `${UI}/scroll_004.ogg`);
    this.load.audio('sfx_ambient_it_whine',      `${UI}/glitch_003.ogg`);
    this.load.audio('sfx_ambient_lobby_chatter', `${UI}/click_004.ogg`);
    this.load.audio('sfx_vending_hum',           `${UI}/switch_003.ogg`);
    this.load.audio('sfx_fidget_paper',          `${UI}/scroll_003.ogg`);
    this.load.audio('sfx_fidget_mug',            `${IMPACT}/impactSoft_medium_002.ogg`);

    // BreachDefense
    this.load.audio('sfx_tower_select',  `${UI}/select_005.ogg`);
    this.load.audio('sfx_tower_invalid', `${UI}/error_006.ogg`);
    for (let i = 0; i < 3; i++) this.load.audio(`sfx_tower_fire_${i}`, `${IMPACT}/impactGeneric_light_00${i}.ogg`);
    for (let i = 0; i < 3; i++) this.load.audio(`sfx_enemy_hit_${i}`, `${IMPACT}/impactPunch_medium_00${i}.ogg`);
    this.load.audio('sfx_base_damage',   `${IMPACT}/impactMetal_heavy_000.ogg`);
    this.load.audio('sfx_wave_clear',    `${UI}/confirmation_003.ogg`);
    this.load.audio('sfx_defeat',        `${UI}/error_008.ogg`);
    this.load.audio('sfx_glitch_0',      `${UI}/glitch_001.ogg`);
    this.load.audio('sfx_glitch_1',      `${UI}/glitch_002.ogg`);

    // Voice blips (sample mode only — synth mode needs no files)
    this.load.audio('sfx_voice_blip_0', `${UI}/pluck_001.ogg`);
    this.load.audio('sfx_voice_blip_1', `${UI}/pluck_002.ogg`);
  }

  create() {
    try { (window as unknown as { __QA__?: { deferredAudioLoaded?: boolean } }).__QA__!.deferredAudioLoaded = true; } catch (_) { /* no bridge */ }
    this.scene.stop();
  }
}
