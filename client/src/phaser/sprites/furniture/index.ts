import Phaser from 'phaser';

import { generateCoreFurniture } from './coreFurniture';
import { generateMedicalLabFurniture } from './medicalLabFurniture';
import { generateCommonAreasFurniture } from './commonAreasFurniture';
import { generateOfficeFurniture } from './officeFurniture';

// ── Furniture textures ───────────────────────────────────────────────
export function generateFurnitureTextures(scene: Phaser.Scene) {
  generateCoreFurniture(scene);
  generateMedicalLabFurniture(scene);
  generateCommonAreasFurniture(scene);
  generateOfficeFurniture(scene);
}

/**
 * Map a room obstacle type string to its texture key.
 */
export function furnitureTextureKey(obstacleType?: string): string {
  const map: Record<string, string> = {
    // Original
    desk: 'furn_desk',
    bed: 'furn_bed',
    cabinet: 'furn_cabinet',
    table: 'furn_table',
    counter: 'furn_counter',
    rack: 'furn_rack',
    shelf: 'furn_shelf',
    chair: 'furn_chair',
    chairs: 'furn_chair',
    plant: 'furn_plant',
    clock: 'furn_clock',
    water_cooler: 'furn_water_cooler',
    nurse_station: 'furn_nurse_station',
    microscope: 'furn_microscope',
    patient_bay: 'furn_bed',
    filing_cabinet: 'furn_filing_cabinet',
    trash: 'furn_trash',
    trash_can: 'furn_trash',
    exam_table: 'furn_exam_table',
    bookshelf: 'furn_bookshelf',
    // ER Room
    gurney: 'furn_gurney',
    curtain_partition: 'furn_curtain_partition',
    iv_stand: 'furn_iv_stand',
    crash_cart: 'furn_crash_cart',
    vital_monitor: 'furn_vital_monitor',
    triage_desk: 'furn_triage_desk',
    equipment: 'furn_equipment',
    // Lab Room
    lab_bench: 'furn_lab_bench',
    centrifuge: 'furn_centrifuge',
    specimen_fridge: 'furn_specimen_fridge',
    bio_cabinet: 'furn_bio_cabinet',
    fume_hood: 'furn_fume_hood',
    chemical_shelf: 'furn_chemical_shelf',
    sink_station: 'furn_sink_station',
    eyewash_station: 'furn_eyewash_station',
    sample_rack: 'furn_sample_rack',
    autoclave: 'furn_autoclave',
    results_board: 'furn_results_board',
    microscope_station: 'furn_microscope',
    // Shared / Common
    vending_machine: 'furn_vending_machine',
    couch: 'furn_couch',
    coffee_station: 'furn_coffee_station',
    server_rack: 'furn_server_rack',
    monitor_bank: 'furn_monitor_bank',
    workstation_cluster: 'furn_workstation_cluster',
    whiteboard_wall: 'furn_whiteboard_wall',
    // Reception
    privacy_screen: 'furn_privacy_screen',
    notice_board: 'furn_notice_board',
    magazine_rack: 'furn_magazine_rack',
    water_dispenser: 'furn_water_dispenser',
    tissue_box: 'furn_tissue_box',
    // Hospital Entrance
    info_kiosk: 'furn_info_kiosk',
    welcome_mat: 'furn_welcome_mat',
    bulletin_board: 'furn_bulletin_board',
    flower_arrangement: 'furn_flower_arrangement',
    hand_sanitizer: 'furn_hand_sanitizer',
    umbrella_stand: 'furn_umbrella_stand',
    // Break Room
    microwave: 'furn_microwave',
    open_fridge: 'furn_open_fridge',
    tv_stand: 'furn_tv_stand',
    lost_and_found_box: 'furn_lost_and_found_box',
    coat_rack: 'furn_coat_rack',
    lunch_table: 'furn_lunch_table',
    trash_bin: 'furn_trash',
    // Records Room
    records_counter: 'furn_records_counter',
    clerk_desk: 'furn_clerk_desk',
    inbox_tray: 'furn_inbox_tray',
    outbox_tray: 'furn_outbox_tray',
    document_cart: 'furn_document_cart',
    shredder_station: 'furn_shredder_station',
    scanner_station: 'furn_scanner_station',
    archive_box: 'furn_archive_box',
    // IT Office
    monitoring_desk: 'furn_monitoring_desk',
    defense_console: 'furn_defense_console',
    printer_station: 'furn_printer_station',
    cable_tray: 'furn_cable_tray',
    locked_cabinet: 'furn_locked_cabinet',
    coffee_mug: 'furn_coffee_mug',
    headphones: 'furn_headphones',
    // Hallway — sconce and bench get real textures; no more desk fallback
    wall_clock: 'furn_clock',
    wall_sconce: 'furn_wall_sconce',
    bench: 'furn_bench',
    emergency_light: 'furn_wall_sconce',   // wall-mounted light fixture
    // One-off obstacles — nearest-credible remaps
    biohazard_sign: 'furn_notice_board',
    glove_dispenser: 'furn_hand_sanitizer',
    filing_cart: 'furn_document_cart',
    defibrillator_mount: 'furn_crash_cart',
    wheelchair: 'furn_chair',
  };
  return map[obstacleType || ''] || 'furn_desk';
}
