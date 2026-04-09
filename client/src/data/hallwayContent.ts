/**
 * Hallway bulletin board content — environmental storytelling that shifts per act.
 *
 * 5 hallway segments x 3 acts = 15 entries.
 * Act 1: warm/orientation. Act 2: stress/compliance pressure. Act 3: incident/lockdown.
 */

export interface HallwayBoardEntry {
  title: string;    // Board heading, max 28 chars
  text: string;     // Body, max 3 lines \n-delimited, max 28 chars/line
  propType: 'poster';
}

export const HALLWAY_CONTENT: Record<string, Record<1 | 2 | 3, HallwayBoardEntry>> = {
  hallway_reception_break: {
    1: {
      title: 'WELCOME!',
      text: 'Orientation today at 2pm\nBadges required after lobby\nHave a great first day!',
      propType: 'poster',
    },
    2: {
      title: 'COMPLIANCE NOTICE',
      text: 'Three audit flags this week\nMinimum Necessary applies\neven here \u2014 every time',
      propType: 'poster',
    },
    3: {
      title: 'LOCKDOWN PROTOCOL',
      text: 'Escort ALL visitors now\nNo unattended devices\nIT is monitoring access',
      propType: 'poster',
    },
  },

  hallway_break_lab: {
    1: {
      title: 'STAFF ONLY',
      text: 'Patient info stays in\npatient areas. Public\nhallways are public.',
      propType: 'poster',
    },
    2: {
      title: 'PRIVACY OFFICER NOTICE',
      text: 'Patient names overheard\nin the break room again\nReminder: walls are thin',
      propType: 'poster',
    },
    3: {
      title: 'URGENT \u2014 CMO ORDER',
      text: 'All patient records to\nsecure locations NOW\n\u2014 Dr. Kim, CMO',
      propType: 'poster',
    },
  },

  hallway_lab_records: {
    1: {
      title: 'SPECIMEN SAFETY',
      text: 'Double-check patient IDs\nWrong patient = wrong tx\nSafety starts with you',
      propType: 'poster',
    },
    2: {
      title: 'FAX VERIFICATION',
      text: 'Lab results: 3rd wrong-\nnumber fax this month\nVerify every recipient',
      propType: 'poster',
    },
    3: {
      title: 'BREACH CONFIRMED',
      text: 'All outbound comms\nsuspended pending review\nIT investigating NOW',
      propType: 'poster',
    },
  },

  hallway_records_it: {
    1: {
      title: 'ePHI REMINDER',
      text: 'Passwords: 90-day cycle\nNever share credentials\nQuestions? See IT x4433',
      propType: 'poster',
    },
    2: {
      title: 'SECURITY ALERT',
      text: 'Suspicious logins found\nIf you see something \u2014\nsay something. IT x4433',
      propType: 'poster',
    },
    3: {
      title: 'ACTIVE INCIDENT',
      text: 'Disconnect from network\nif instructed by IT\nDo NOT call \u2014 they know',
      propType: 'poster',
    },
  },

  hallway_it_er: {
    1: {
      title: 'ER PROTOCOLS',
      text: 'Treatment > paperwork\nin emergencies \u2014 know\nyour HIPAA exceptions!',
      propType: 'poster',
    },
    2: {
      title: 'ER REMINDER',
      text: 'Cover whiteboards when\nfamily is present\nPatient dignity matters',
      propType: 'poster',
    },
    3: {
      title: 'ALL HANDS',
      text: 'Hospital under attack\nOral orders only until\nsystems are restored',
      propType: 'poster',
    },
  },
};

/**
 * Look up bulletin board content for a hallway room and act.
 * Returns null if the hallway ID is not recognized.
 */
export function getHallwayBoard(hallwayId: string, act: 1 | 2 | 3): HallwayBoardEntry | null {
  return HALLWAY_CONTENT[hallwayId]?.[act] ?? null;
}
