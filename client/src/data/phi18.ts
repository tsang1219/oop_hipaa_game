/**
 * The Eighteen — Safe Harbor identifier codex (HIPAA-is-the-game pass).
 *
 * Source authority: 45 CFR §164.514(b)(2)(i)(A)-(R) — the Safe Harbor
 * de-identification method. Remove all 18 identifier categories (and have no
 * actual knowledge the remainder could identify someone) and health data is
 * no longer PHI.
 *
 * This is the game's collection mechanic: every identifier the player
 * correctly redacts for the first time (PHI Sorter, break-room corkboard)
 * fills a codex slot. Complete the set → Safe Harbor Certified.
 *
 * The `key` values match SorterIdentifierType in sorterData.ts — the sorter's
 * identifierType field is the grant channel.
 *
 * Per CLAUDE.md: all game data lives in TypeScript constants files.
 */

export type Phi18Key =
  | 'name'
  | 'geographic'
  | 'date'
  | 'phone'
  | 'fax'
  | 'email'
  | 'ssn'
  | 'mrn'
  | 'plan_id'
  | 'account'
  | 'license'
  | 'vehicle'
  | 'device_serial'
  | 'url'
  | 'ip_address'
  | 'biometric'
  | 'photo'
  | 'other';

export type Phi18Entry = {
  key: Phi18Key;
  num: number;      // canonical position (A)=1 … (R)=18
  name: string;     // short display name, ALL CAPS
  icon: string;     // emoji glyph
  blurb: string;    // one deadpan line, shown in the codex when unlocked
};

export const PHI18_ENTRIES: Phi18Entry[] = [
  { key: 'name',          num: 1,  name: 'NAMES',                    icon: '🧑', blurb: 'The classic. If it fits on a coffee cup, it can identify a patient.' },
  { key: 'geographic',    num: 2,  name: 'GEO SMALLER THAN STATE',   icon: '🏠', blurb: 'Street, city, county, full ZIP. Anything smaller than a state narrows the crowd.' },
  { key: 'date',          num: 3,  name: 'DATES + AGES 90+',         icon: '📅', blurb: 'Birth, admission, discharge — only the year survives. And age 90+ is basically a name.' },
  { key: 'phone',         num: 4,  name: 'PHONE NUMBERS',            icon: '📞', blurb: 'Ten digits that ring one specific person.' },
  { key: 'fax',           num: 5,  name: 'FAX NUMBERS',              icon: '📠', blurb: 'Yes, hospitals still fax. Yes, the number counts.' },
  { key: 'email',         num: 6,  name: 'EMAIL ADDRESSES',          icon: '✉️', blurb: 'A username is a name. It\'s right there in the word.' },
  { key: 'ssn',           num: 7,  name: 'SOCIAL SECURITY NUMBERS',  icon: '🔢', blurb: 'The skeleton key. Nine digits, entire identity.' },
  { key: 'mrn',           num: 8,  name: 'MEDICAL RECORD NUMBERS',   icon: '🏷️', blurb: 'The hospital\'s own name for you is still a name.' },
  { key: 'plan_id',       num: 9,  name: 'HEALTH PLAN IDS',          icon: '🪪', blurb: 'A beneficiary number points at exactly one covered life.' },
  { key: 'account',       num: 10, name: 'ACCOUNT NUMBERS',          icon: '💳', blurb: 'Billing follows the patient. So does the account number.' },
  { key: 'license',       num: 11, name: 'CERTIFICATE / LICENSE #s', icon: '📜', blurb: 'Pilot licenses, CDLs, professional certs — papers with your number on them.' },
  { key: 'vehicle',       num: 12, name: 'VEHICLE IDS & PLATES',     icon: '🚗', blurb: 'A license plate is a name that parks.' },
  { key: 'device_serial', num: 13, name: 'DEVICE SERIALS',           icon: '🔧', blurb: 'Pacemakers and pumps have serial numbers. Serial numbers have owners.' },
  { key: 'url',           num: 14, name: 'WEB URLS',                 icon: '🔗', blurb: 'A link with a record token in it is a link to a person.' },
  { key: 'ip_address',    num: 15, name: 'IP ADDRESSES',             icon: '🌐', blurb: 'Where your computer lives is close enough to where you live.' },
  { key: 'biometric',     num: 16, name: 'BIOMETRICS',               icon: '👁️', blurb: 'Fingerprints, voice prints. Can\'t reset them, shouldn\'t share them.' },
  { key: 'photo',         num: 17, name: 'FULL-FACE PHOTOS',         icon: '📷', blurb: 'A face is the original identifier. "Comparable images" count too.' },
  { key: 'other',         num: 18, name: 'ANY OTHER UNIQUE CODE',    icon: '🧩', blurb: 'The catch-all: any number, characteristic, or code that points at one person.' },
];

export const PHI18_TOTAL = PHI18_ENTRIES.length; // 18, forever

const BY_KEY = new Map(PHI18_ENTRIES.map((e) => [e.key, e]));

/** Look up a codex entry by identifier key. Undefined for non-collectible types. */
export function getPhi18Entry(key: string): Phi18Entry | undefined {
  return BY_KEY.get(key as Phi18Key);
}

/** How many of the 18 a found-keys list covers (ignores unknown/duplicate keys). */
export function phi18Count(foundKeys: string[]): number {
  const found = new Set(foundKeys.filter((k) => BY_KEY.has(k as Phi18Key)));
  return found.size;
}

export function phi18Complete(foundKeys: string[]): boolean {
  return phi18Count(foundKeys) >= PHI18_TOTAL;
}
