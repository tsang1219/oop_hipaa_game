// Tutorial content for educational moments in the game
// CONSOLIDATED: Only 5 teaching moments during gameplay (waves 1, 3, 5, 7, 9)
// Plus welcome and first tower at game start

export const TUTORIAL_CONTENT = {
  welcome: {
    title: "Welcome to Breach Defense",
    description: "You're the last line of defense for a hospital network.\n\nEvery day, cyber attackers try to steal patient records, encrypt files for ransom, or trick employees into giving up passwords.\n\nYour job: Stop them using real security tools that healthcare organizations use every day.\n\nThe lessons you learn here are the same ones that could have prevented the Change Healthcare attack that exposed 190 million patient records in 2024."
  },

  firstTower: {
    title: "Build Your Defenses",
    description: "Select a defense tower from the panel, then click on the grid to place it.\n\nTip: Different defenses work better against different threats. The Training Beacon is strong against phishing and social engineering. MFA Shield blocks credential theft.\n\nPlace your first tower to begin the first wave."
  },

  waves: {
    1: {
      title: "Lesson 1: The Phishing Problem",
      description: "SCENARIO: You're catching up on email. There's a message from 'IT Support' asking you to verify your password by clicking a link.\n\nTHE REALITY: 91% of all cyberattacks start with a phishing email just like this. Attackers send millions of these hoping just one person clicks.\n\nWHAT TO LEARN: Phishing emails create urgency ('Your account will be locked!'), impersonate authority ('This is IT Support'), and ask for credentials. Real IT never asks for your password via email.\n\nBEST DEFENSE: Training Beacon teaches users to recognize phishing. MFA Shield ensures stolen passwords are useless."
    },
    3: {
      title: "Lesson 2: Patch Your Systems",
      description: "SCENARIO: Your software has been nagging about updates for weeks. You keep clicking 'remind me later'...\n\nTHE REALITY: In February 2024, the Change Healthcare ransomware attack disrupted pharmacies nationwide for weeks and exposed 190 million patient records. The attackers exploited known vulnerabilities that patches would have fixed.\n\nWHAT TO LEARN: Software updates fix security holes. Every 'remind me later' leaves a window open for attackers. Ransomware specifically targets unpatched systems.\n\nBEST DEFENSE: Patch Cannon devastates ransomware and known exploits. But zero-day attacks exploit unknown vulnerabilities—that's why you need multiple layers."
    },
    5: {
      title: "Lesson 3: Insider Threats",
      description: "SCENARIO: Not all threats come from outside. A trusted employee with legitimate access is behaving suspiciously...\n\nTHE REALITY: 70% of healthcare data breaches involve insiders—employees who snoop on celebrity patient records, share login credentials, or intentionally steal data. They already have access, which makes them dangerous.\n\nWHAT TO LEARN: Curiosity isn't a valid reason to access records. 'Just checking on a friend's file' is a HIPAA violation. Social engineers also manipulate employees into breaking rules—'Hi, this is IT, I need your password to fix something.'\n\nBEST DEFENSE: Access Control limits what any person can reach. Training Beacon helps employees recognize manipulation. Real IT NEVER asks for your password."
    },
    7: {
      title: "Lesson 4: Physical Security",
      description: "SCENARIO: A laptop was left unlocked while someone grabbed coffee. Now it's missing...\n\nTHE REALITY: In 2016, an unencrypted iPhone without a password was lost, exposing 400 patients' data and resulting in a $650,000 fine. Lost and stolen devices are one of the leading causes of healthcare data breaches.\n\nWHAT TO LEARN: Physical security is cyber security. Lock your screen every time you step away. Enable encryption on all devices. Never leave devices unattended in public.\n\nBEST DEFENSE: Encryption Vault makes stolen devices useless without the encryption key. Even if a thief gets the hardware, encrypted data is unreadable."
    },
    9: {
      title: "Lesson 5: Defense in Depth",
      description: "SCENARIO: A coordinated attack is hitting from multiple angles simultaneously—phishing, brute force password attacks, and insider threats.\n\nTHE REALITY: Sophisticated attackers don't rely on one technique. They combine social engineering, credential theft, and malware. No single defense catches everything.\n\nWHAT TO LEARN: This is called 'defense in depth'—multiple overlapping security layers. If one fails, others catch the threat. MFA stops credential theft. Patches stop exploits. Training stops social engineering. Together, they create a security posture with no single point of failure.\n\nBEST DEFENSE: Use ALL your towers strategically. The counter system matters now—each defense excels against specific threats."
    }
  },

  codex: {
    threats: {
      PHISHING: {
        name: "Phishing Payload",
        description: "Disguised as legitimate email asking for credentials or containing malicious links.",
        realWorld: "91% of cyberattacks start with phishing. In 2020, Twitter was compromised through spear-phishing that targeted employees.",
        counters: "Training Beacon (strong), MFA Shield (blocks follow-up credential theft)"
      },
      CREDENTIAL: {
        name: "Credential Harvester",
        description: "Fast attack that uses stolen or guessed passwords to gain access.",
        realWorld: "Stolen credentials from data breaches are sold on the dark web. Attackers try them across multiple services.",
        counters: "MFA Shield (strong), Firewall (slows fast attacks)"
      },
      RANSOMWARE: {
        name: "Ransomware Crawler",
        description: "Slow but devastating. Encrypts files and demands payment.",
        realWorld: "Change Healthcare 2024: $22 million ransom paid, 190 million records exposed, pharmacies disrupted for weeks.",
        counters: "Patch Cannon (strong against known exploits)"
      },
      INSIDER: {
        name: "Insider Threat",
        description: "Someone with legitimate access misusing their privileges.",
        realWorld: "70% of healthcare breaches involve insiders. UCLA Health 2015: Employee viewed records of celebrities and other patients.",
        counters: "Access Control (strong), Training Beacon (prevents manipulation)"
      },
      ZERODAY: {
        name: "Zero-Day Exploit",
        description: "Exploits unknown vulnerabilities that haven't been patched yet.",
        realWorld: "Log4j 2021: A zero-day in common logging software affected millions of systems worldwide.",
        counters: "Defense in depth—no single tower is strong. Layer multiple defenses."
      },
      BRUTEFORCE: {
        name: "Brute Force Bot",
        description: "Tries millions of password combinations until one works.",
        realWorld: "Simple passwords like 'Password123' are cracked in seconds. Complex passwords take centuries.",
        counters: "MFA Shield (strong), Firewall (strong against repeated attempts)"
      },
      DEVICETHIEF: {
        name: "Device Thief",
        description: "Very fast. Targets unattended devices.",
        realWorld: "2016: Lost iPhone with 400 patient records resulted in $650,000 HIPAA fine.",
        counters: "Encryption Vault (strong—makes stolen data unreadable)"
      },
      SOCIAL: {
        name: "Social Engineer",
        description: "Manipulates employees into breaking security procedures.",
        realWorld: "MGM Resorts 2023: Attackers called help desk pretending to be an employee, gained access to entire network.",
        counters: "Training Beacon (strong), Access Control (limits damage if successful)"
      }
    },
    towers: {
      MFA: {
        name: "MFA Shield",
        description: "Multi-factor authentication checkpoint.",
        howItWorks: "Even with your password, attackers can't get in without your phone or security key.",
        realWorld: "MFA blocks 99.9% of automated credential attacks according to Microsoft.",
        strongAgainst: "Credential Harvester, Brute Force Bot",
        weakAgainst: "Physical theft, Zero-day exploits"
      },
      PATCH: {
        name: "Patch Cannon",
        description: "Applies security updates to close known vulnerabilities.",
        howItWorks: "Software vulnerabilities are like unlocked windows. Patches close them.",
        realWorld: "WannaCry ransomware 2017 exploited a vulnerability that had been patched 2 months earlier.",
        strongAgainst: "Ransomware, known exploits",
        weakAgainst: "Zero-day exploits (unknown vulnerabilities)"
      },
      FIREWALL: {
        name: "Firewall Barrier",
        description: "Filters network traffic and blocks suspicious connections.",
        howItWorks: "Acts as a gatekeeper between your network and the outside world.",
        realWorld: "Firewalls are the first line of defense but can't stop attacks that come through legitimate channels.",
        strongAgainst: "Brute Force Bot, fast network attacks",
        weakAgainst: "Insider threats, encrypted malicious traffic"
      },
      ENCRYPTION: {
        name: "Encryption Vault",
        description: "Scrambles data so only authorized users can read it.",
        howItWorks: "Even if attackers steal files, they're useless without the encryption key.",
        realWorld: "HIPAA requires encryption for patient data at rest and in transit.",
        strongAgainst: "Device Thief, data exfiltration",
        weakAgainst: "Ransomware (encrypts your encrypted files)"
      },
      TRAINING: {
        name: "Training Beacon",
        description: "Security awareness training for employees.",
        howItWorks: "Teaches employees to recognize threats and follow security procedures. Buffs nearby defenses.",
        realWorld: "Organizations with security training programs have 70% fewer security incidents.",
        strongAgainst: "Phishing, Social Engineering",
        weakAgainst: "Technical exploits that don't involve humans"
      },
      ACCESS: {
        name: "Access Control",
        description: "Limits who can access what based on job requirements.",
        howItWorks: "Principle of least privilege: employees only access what they need for their job.",
        realWorld: "Limiting access contains breaches. If one account is compromised, damage is limited.",
        strongAgainst: "Insider Threat, privilege escalation",
        weakAgainst: "Zero-day exploits, brute force on authorized accounts"
      }
    }
  },

  recaps: {
    PHISHING: {
      title: "Phishing: Key Takeaway",
      summary: "If an email creates urgency and asks for your password, it's probably phishing.",
      action: "Always verify suspicious requests through a separate channel—call IT directly, don't click the link."
    },
    PATCHING: {
      title: "Patching: Key Takeaway",
      summary: "Software updates fix security holes. 'Remind me later' leaves windows open for attackers.",
      action: "Install updates promptly. The Change Healthcare attack exploited vulnerabilities that patches would have fixed."
    },
    INSIDER: {
      title: "Insider Threats: Key Takeaway",
      summary: "70% of healthcare breaches involve insiders. Curiosity is not a valid reason to access records.",
      action: "Only access what you need for your job. If someone asks for your password—even 'IT'—say no and report it."
    },
    PHYSICAL: {
      title: "Physical Security: Key Takeaway",
      summary: "Lost devices cause major breaches. An unlocked laptop is an open door.",
      action: "Lock your screen every time you step away. Enable encryption. Never leave devices unattended."
    },
    LAYERS: {
      title: "Defense in Depth: Key Takeaway",
      summary: "No single defense catches everything. Coordinated attacks require layered responses — when one control fails, others catch the threat.",
      action: "Use multiple overlapping security controls. Firewalls, MFA, encryption, and training each cover different attack vectors."
    },
    PASSWORDS: {
      title: "Strong Passwords: Key Takeaway",
      summary: "Weak passwords like 'Password123' fall to brute force in seconds. MFA makes stolen passwords useless without a second factor.",
      action: "Use a password manager for unique, complex passwords on every account. Enable multi-factor authentication everywhere it's available."
    },
    ALLDEFENSE: {
      title: "Defense in Depth: Key Takeaway",
      summary: "No single defense catches everything. Layered security has no single point of failure.",
      action: "YOU are the security. Those 'annoying' IT policies protect real patients whose data you're responsible for."
    }
  }
};
