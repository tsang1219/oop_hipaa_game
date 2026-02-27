// Tower sprites
import firewallTower from '@assets/generated_images/firewall_tower_pixel_sprite.png';
import mfaTower from '@assets/generated_images/mfa_tower_pixel_sprite.png';
import encryptionTower from '@assets/generated_images/encryption_tower_pixel_sprite.png';
import patchTower from '@assets/generated_images/patch_cannon_pixel_sprite.png';
import trainingTower from '@assets/generated_images/training_beacon_tower_sprite.png';
import accessTower from '@assets/generated_images/access_control_gate_sprite.png';

// Threat sprites
import phishingThreat from '@assets/generated_images/phishing_threat_pixel_sprite.png';
import credentialThreat from '@assets/generated_images/credential_harvester_enemy_sprite.png';
import ransomwareThreat from '@assets/generated_images/ransomware_threat_pixel_sprite.png';
import insiderThreat from '@assets/generated_images/insider_threat_pixel_sprite.png';
import zerodayThreat from '@assets/generated_images/zero-day_exploit_enemy_sprite.png';
import bruteforceThreat from '@assets/generated_images/brute_force_bot_enemy_sprite.png';
import devicethiefThreat from '@assets/generated_images/device_thief_enemy_sprite.png';
import socialThreat from '@assets/generated_images/social_engineer_enemy_sprite.png';

export const ASSETS = {
  towers: {
    FIREWALL: firewallTower,
    MFA: mfaTower,
    ENCRYPTION: encryptionTower,
    PATCH: patchTower,
    TRAINING: trainingTower,
    ACCESS: accessTower
  },
  threats: {
    PHISHING: phishingThreat,
    CREDENTIAL: credentialThreat,
    RANSOMWARE: ransomwareThreat,
    INSIDER: insiderThreat,
    ZERODAY: zerodayThreat,
    BRUTEFORCE: bruteforceThreat,
    DEVICETHIEF: devicethiefThreat,
    SOCIAL: socialThreat
  }
};
