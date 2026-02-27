export const GRID_COLS = 10;
export const GRID_ROWS = 6;
export const CELL_SIZE = 64;

// Single serpentine path that zigzags across the grid
export const PATHS = [
  [
    { x: 0, y: 3 },
    { x: 1, y: 3 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
    { x: 3, y: 4 },
    { x: 3, y: 5 },
    { x: 4, y: 5 },
    { x: 5, y: 5 },
    { x: 6, y: 5 },
    { x: 6, y: 4 },
    { x: 6, y: 3 },
    { x: 6, y: 2 },
    { x: 6, y: 1 },
    { x: 7, y: 1 },
    { x: 8, y: 1 },
    { x: 9, y: 1 }
  ]
];

// Tower types with counter relationships
// BALANCE: Normalized DPS around ~13 damage/sec so counters are the differentiator
export const TOWERS = {
  MFA: {
    id: 'MFA',
    name: 'MFA Shield',
    cost: 80,
    damage: 22,
    range: 2,
    cooldown: 1700,
    color: '#FF6B9D',
    iconIdx: 0,
    desc: "Multi-factor auth checkpoint. Blocks credential-based attacks.",
    unlockWave: 1,
    strongAgainst: ['CREDENTIAL', 'BRUTEFORCE'],
    weakAgainst: ['PHYSICAL', 'ZERODAY']
  },
  PATCH: {
    id: 'PATCH',
    name: 'Patch Cannon',
    cost: 120,
    damage: 32,
    range: 2,
    cooldown: 2200,
    color: '#2ECC71',
    iconIdx: 1,
    desc: "Fires security updates. Devastating against known exploits.",
    unlockWave: 2,
    strongAgainst: ['RANSOMWARE', 'ENCRYPTED'],
    weakAgainst: ['ZERODAY', 'UNKNOWN']
  },
  FIREWALL: {
    id: 'FIREWALL',
    name: 'Firewall Barrier',
    cost: 60,
    damage: 14,
    range: 1.5,
    cooldown: 1100,
    color: '#E67E22',
    iconIdx: 2,
    desc: "Filters network traffic. Slows and damages external attacks.",
    unlockWave: 1,
    strongAgainst: ['BRUTEFORCE', 'FAST'],
    weakAgainst: ['INSIDER', 'INTERNAL', 'ENCRYPTED']
  },
  ENCRYPTION: {
    id: 'ENCRYPTION',
    name: 'Encryption Vault',
    cost: 150,
    damage: 20,
    range: 3,
    cooldown: 1800,
    color: '#9B59B6',
    iconIdx: 3,
    desc: "Protects data. Stops device theft and data exfiltration.",
    unlockWave: 3,
    strongAgainst: ['DEVICETHIEF', 'PHYSICAL'],
    weakAgainst: ['RANSOMWARE', 'ENCRYPTED']
  },
  TRAINING: {
    id: 'TRAINING',
    name: 'Training Beacon',
    cost: 100,
    damage: 5,
    range: 3,
    cooldown: 1000,
    color: '#3498DB',
    iconIdx: 4,
    desc: "Security awareness. Buffs nearby towers, catches social attacks.",
    unlockWave: 2,
    strongAgainst: ['PHISHING', 'SOCIAL', 'MANIPULATION', 'EMAIL'],
    weakAgainst: ['ZERODAY', 'UNKNOWN'],
    buffRadius: 2,
    buffAmount: 1.25
  },
  ACCESS: {
    id: 'ACCESS',
    name: 'Access Control',
    cost: 90,
    damage: 18,
    range: 1.5,
    cooldown: 1400,
    color: '#1ABC9C',
    iconIdx: 5,
    desc: "Limits who can pass. Stops insider threats and privilege abuse.",
    unlockWave: 3,
    strongAgainst: ['INSIDER', 'INTERNAL'],
    weakAgainst: ['ZERODAY', 'BRUTEFORCE']
  }
};

// Per-wave budget stipends (cumulative - player starts with wave 1 budget)
export const WAVE_BUDGETS = [
  150,  // Wave 1: Firewall + MFA
  100,  // Wave 2: +Training beacon
  120,  // Wave 3: +Patch Cannon
  150,  // Wave 4: +Encryption or second Patch
  90,   // Wave 5: +Access Control
  120,  // Wave 6: +second MFA or Firewall
  110,  // Wave 7: +Firewall/Access for fast thieves
  160,  // Wave 8: +second Patch + support
  140,  // Wave 9: +extra MFA/Access
  180   // Wave 10: Final coverage
];

// Enemy types with counter relationships
export const THREATS = {
  PHISHING: {
    id: 'PHISHING',
    name: 'Phishing Payload',
    hp: 80,
    speed: 0.9,
    iconIdx: 0,
    tags: ['PHISHING', 'EMAIL'],
    desc: "Disguised as legitimate email. Spawns more threats if not stopped."
  },
  CREDENTIAL: {
    id: 'CREDENTIAL',
    name: 'Credential Harvester',
    hp: 55,
    speed: 1.5,
    iconIdx: 1,
    tags: ['CREDENTIAL', 'FAST'],
    desc: "Fast attack that steals passwords. Rushes past defenses."
  },
  RANSOMWARE: {
    id: 'RANSOMWARE',
    name: 'Ransomware Crawler',
    hp: 230,
    speed: 0.45,
    iconIdx: 2,
    tags: ['RANSOMWARE', 'ENCRYPTED'],
    desc: "Slow but tough. Encrypts everything in its path."
  },
  INSIDER: {
    id: 'INSIDER',
    name: 'Insider Threat',
    hp: 140,
    speed: 0.85,
    iconIdx: 3,
    tags: ['INSIDER', 'INTERNAL'],
    desc: "Looks legitimate. Bypasses many external defenses."
  },
  ZERODAY: {
    id: 'ZERODAY',
    name: 'Zero-Day Exploit',
    hp: 200,
    speed: 0.7,
    iconIdx: 4,
    tags: ['ZERODAY', 'UNKNOWN'],
    desc: "Exploits unknown vulnerabilities. Immune to patches."
  },
  BRUTEFORCE: {
    id: 'BRUTEFORCE',
    name: 'Brute Force Bot',
    hp: 260,
    speed: 0.35,
    iconIdx: 5,
    tags: ['BRUTEFORCE', 'CREDENTIAL'],
    desc: "Slow but persistent. Tries millions of passwords."
  },
  DEVICETHIEF: {
    id: 'DEVICETHIEF',
    name: 'Device Thief',
    hp: 70,
    speed: 1.7,
    iconIdx: 6,
    tags: ['DEVICETHIEF', 'PHYSICAL'],
    desc: "Very fast. Grabs devices and escapes."
  },
  SOCIAL: {
    id: 'SOCIAL',
    name: 'Social Engineer',
    hp: 110,
    speed: 1.0,
    iconIdx: 7,
    tags: ['SOCIAL', 'MANIPULATION'],
    desc: "Tricks employees into breaking security procedures."
  }
};

// Wave designs - each level teaches ONE concept
export const WAVES = [
  {
    id: 1,
    name: "The Friendly Email",
    concept: "PHISHING",
    intro: "You're catching up on email after a long meeting. There's a message from 'IT Support' asking you to verify your password...",
    threats: [
      { type: 'PHISHING', count: 3, interval: 3000 }
    ],
    suggestedTowers: ['TRAINING', 'MFA'],
    endMessage: "Phishing emails are the #1 attack vector. 91% of cyberattacks start with a phishing email."
  },
  {
    id: 2,
    name: "Credential Storm",
    concept: "PHISHING",
    intro: "The phishing attack succeeded elsewhere. Now credential harvesters are flooding in with stolen passwords.",
    threats: [
      { type: 'PHISHING', count: 2, interval: 3500 },
      { type: 'CREDENTIAL', count: 4, interval: 2000 }
    ],
    suggestedTowers: ['MFA', 'TRAINING'],
    endMessage: "MFA stops 99.9% of credential-based attacks. Even stolen passwords are useless without the second factor."
  },
  {
    id: 3,
    name: "Remind Me Later",
    concept: "PATCHING",
    intro: "Your software has been nagging about updates for weeks. You keep clicking 'remind me later'...",
    threats: [
      { type: 'RANSOMWARE', count: 2, interval: 4000 }
    ],
    suggestedTowers: ['PATCH', 'FIREWALL'],
    endMessage: "Every 'remind me later' click leaves windows open for attackers. The Change Healthcare ransomware attack affected 190 million people."
  },
  {
    id: 4,
    name: "Patch Tuesday",
    concept: "PATCHING",
    intro: "A critical vulnerability was just announced. Attackers are racing to exploit unpatched systems.",
    threats: [
      { type: 'RANSOMWARE', count: 3, interval: 3500 },
      { type: 'ZERODAY', count: 1, interval: 8000 }
    ],
    suggestedTowers: ['PATCH', 'ENCRYPTION'],
    endMessage: "Zero-day exploits can't be patched yet. That's why defense-in-depth matters—no single defense catches everything."
  },
  {
    id: 5,
    name: "The Trusted Colleague",
    concept: "INSIDER",
    intro: "Not all threats come from outside. Someone with legitimate access is behaving suspiciously...",
    threats: [
      { type: 'INSIDER', count: 3, interval: 3000 }
    ],
    suggestedTowers: ['ACCESS', 'TRAINING'],
    endMessage: "70% of healthcare breaches involve insiders. Access controls limit what any single person can reach."
  },
  {
    id: 6,
    name: "Social Engineering",
    concept: "INSIDER",
    intro: "'Hi, this is IT—I need your password to fix an issue.' Sounds legitimate, right?",
    threats: [
      { type: 'SOCIAL', count: 3, interval: 3500 },
      { type: 'INSIDER', count: 2, interval: 4000 }
    ],
    suggestedTowers: ['TRAINING', 'ACCESS'],
    endMessage: "Real IT never asks for your password. Security awareness training helps employees recognize manipulation."
  },
  {
    id: 7,
    name: "The Lost Laptop",
    concept: "PHYSICAL",
    intro: "A laptop was left unlocked while grabbing coffee. Now it's missing...",
    threats: [
      { type: 'DEVICETHIEF', count: 4, interval: 2500 }
    ],
    suggestedTowers: ['ENCRYPTION'],
    endMessage: "Lost devices are a major breach cause. Encryption makes stolen devices useless without the key."
  },
  {
    id: 8,
    name: "Defense in Depth",
    concept: "LAYERS",
    intro: "A coordinated attack is hitting from all angles. No single defense will be enough.",
    threats: [
      { type: 'PHISHING', count: 3, interval: 2500 },
      { type: 'RANSOMWARE', count: 2, interval: 4000 },
      { type: 'INSIDER', count: 2, interval: 3500 },
      { type: 'CREDENTIAL', count: 3, interval: 2000 }
    ],
    suggestedTowers: ['MFA', 'PATCH', 'TRAINING', 'ACCESS'],
    endMessage: "Layered security means no single point of failure. Multiple defenses working together stop sophisticated attacks."
  },
  {
    id: 9,
    name: "The Persistent Attacker",
    concept: "PASSWORDS",
    intro: "A brute force attack is trying millions of passwords. 'Password123' would be cracked in seconds...",
    threats: [
      { type: 'BRUTEFORCE', count: 3, interval: 5000 },
      { type: 'CREDENTIAL', count: 5, interval: 2000 }
    ],
    suggestedTowers: ['MFA', 'ACCESS'],
    endMessage: "Strong passwords + MFA make brute force attacks nearly impossible. Don't be the weak link."
  },
  {
    id: 10,
    name: "The Final Breach",
    concept: "ALLDEFENSE",
    intro: "This is it. A full-scale attack targeting every vulnerability. Everything you've learned matters now.",
    threats: [
      { type: 'PHISHING', count: 5, interval: 2000 },
      { type: 'RANSOMWARE', count: 3, interval: 3500 },
      { type: 'INSIDER', count: 3, interval: 3000 },
      { type: 'ZERODAY', count: 2, interval: 6000 },
      { type: 'BRUTEFORCE', count: 2, interval: 5000 },
      { type: 'SOCIAL', count: 3, interval: 3500 },
      { type: 'DEVICETHIEF', count: 2, interval: 2500 }
    ],
    suggestedTowers: ['MFA', 'PATCH', 'FIREWALL', 'ENCRYPTION', 'TRAINING', 'ACCESS'],
    endMessage: "You ARE the security. Those 'annoying' IT policies protect real patients whose data you're responsible for."
  }
];
