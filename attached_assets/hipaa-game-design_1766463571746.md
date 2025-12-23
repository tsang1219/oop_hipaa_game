# HIPAA Privacy Guardian: Game Design Document

## Core Mission

You are a Privacy Guardian. Your role is not to check compliance boxes—it's to protect something sacred: the trust patients place in your organization when they share their most vulnerable information.

Every principle learned, every scenario completed, every room cleared represents lives quietly protected. Patients who will never know your name, but whose trust you've honored.

---

## World Structure

### The Setting

A health tech organization on your first day as Privacy Guardian. Something feels off—not a crisis yet, but small lapses, unclear practices, a culture that means well but hasn't been vigilant. Your mission: move through the organization, strengthen each area, and build a culture of protection.

### Map Layout

```
                    ┌─────────────┐
                    │  IT Office  │
                    │ (The Vault) │
                    └──────┬──────┘
                           │
┌──────────────┐    ┌──────┴──────┐    ┌─────────────────┐
│  Break Room  ├────┤   Hallway   ├────┤ Medical Records │
│ (The Human)  │    │   (Hub)     │    │  (The Archive)  │
└──────────────┘    └──────┬──────┘    └─────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
   ┌─────┴─────┐    ┌──────┴──────┐   ┌──────┴──────┐
   │ Reception │    │  Emergency  │   │ Laboratory  │
   │(The Entry)│    │ (The Edge)  │   │(The Source) │
   └───────────┘    └─────────────┘   └─────────────┘
```

### Progression Flow

1. **Reception** → unlocks Hallway Hub
2. **Emergency Room** → unlocks after Reception
3. **Laboratory** → unlocks after Emergency
4. **Medical Records** → unlocks after Lab
5. **IT Office** → unlocks after Medical Records
6. **Break Room** → always unlocked (the human temptation)

---

## Room Designs

### Reception — "The Entry Point"

**Theme**: Where privacy begins. The first touch. The moment someone decides to trust you.

**Privacy Topics**:
- Notice of Privacy Practices
- Consent and authorization
- Verbal disclosures in public spaces
- Sign-in sheets and visual privacy

**NPCs**:
- Front desk coordinator (mentor figure)
- Nervous new patient (teaches why privacy matters)
- Chatty visitor fishing for info (early test)

**Explorable Elements**:
- Sign-in sheet (is it visible to others?)
- Waiting room layout (can conversations be overheard?)
- Notice of Privacy Practices posted (or missing?)

**Patient Story Earned**: *"Because you ensured that sign-in sheet was private, Elena felt safe seeking treatment for addiction. Her employer in the waiting room never knew why she was there."*

---

### Emergency Room — "The Edge Cases"

**Theme**: Where rules meet urgency. The hardest judgment calls.

**Privacy Topics**:
- Emergency exceptions to consent
- Minimum necessary under pressure
- Law enforcement requests
- Family notification decisions

**NPCs**:
- Rushed ER doctor (tests your judgment under pressure)
- Police officer demanding records (authority challenge)
- Frantic family member (emotional pressure)

**Explorable Elements**:
- Whiteboard with patient names (visible to visitors?)
- Computer left logged in (time pressure vs. security)
- Fax machine in open area

**Patient Story Earned**: *"Because you held the line when that officer demanded records without a warrant, Marcus's mental health crisis stayed between him and his care team. He got help. He's still here."*

---

### Laboratory — "The Source"

**Theme**: Where data is born. Test results, diagnoses, the raw material of PHI.

**Privacy Topics**:
- The 18 PHI identifiers
- Data integrity and accuracy
- Chain of custody for results
- Research access boundaries

**NPCs**:
- Lab technician (teaches PHI identifiers)
- Researcher wanting "just a quick look" (scope creep)
- Courier picking up samples (third-party access)

**Explorable Elements**:
- Sample labels (what identifiers are visible?)
- Results printout left on counter
- Research request form

**Patient Story Earned**: *"Because you questioned that researcher's access request, David's genetic test results stayed confidential. He told his family on his own terms, not theirs."*

---

### Medical Records — "The Archive"

**Theme**: The long memory. Everything lives here. Access, amendments, the right to your own story.

**Privacy Topics**:
- Patient right to access records
- Right to request amendments
- Accounting of disclosures
- Retention and destruction policies

**NPCs**:
- Records clerk (guardian of the archive)
- Patient requesting their complete file (access rights)
- Attorney with a subpoena (legal boundaries)

**Explorable Elements**:
- Filing system (physical security)
- Audit log on screen (who's been looking?)
- Shredder and destruction policy

**Patient Story Earned**: *"Because you helped Mrs. Chen correct that error in her record, she got the insurance coverage she needed. A wrong diagnosis almost followed her forever. You stopped it."*

---

### IT Office — "The Vault"

**Theme**: The invisible infrastructure. Encryption, access controls, breach detection.

**Privacy Topics**:
- Technical safeguards (encryption, access controls)
- Password policies and authentication
- Breach detection and response
- Vendor and third-party security

**NPCs**:
- Security analyst (technical mentor)
- Vendor requesting system access (third-party risk)
- Employee needing a "quick workaround" (convenience vs. security)

**Explorable Elements**:
- Server room access log
- Breach response playbook
- Vendor access agreements

**Patient Story Earned**: *"Because you caught that phishing attempt, 50,000 patient records stayed secure. Fifty thousand people who will never know how close they came. That's the point."*

---

### Break Room — "The Human Factor"

**Theme**: Where people are just people. Gossip, venting, casual lapses. The hardest place to stay vigilant.

**Privacy Topics**:
- Verbal disclosures and gossip
- Social engineering awareness
- The "interesting case" temptation
- Fatigue and lapses

**NPCs**:
- Coworkers chatting about "that patient in Room 4"
- Friend from another department fishing for info
- Your own internal voice (fatigue, curiosity)

**Explorable Elements**:
- Overheard conversation (intervene or not?)
- Phone left unlocked on table
- "Interesting case" being discussed

**Patient Story Earned**: *"Because you changed the subject when your coworkers started gossiping, James's coworker—sitting two tables away—never learned about his cancer diagnosis. He told people when he was ready."*

**Special Mechanic**: The Break Room is always unlocked but gets harder as you progress. Early on, the lapses are obvious. Later, they're subtle. Your growing knowledge makes you see risks others miss.

---

## Core Mechanics

### The Trust Meter (0-100)

Not your score—*theirs*. Represents community trust in the organization.

- **100**: Warm, connected. Patients share openly, seek care freely.
- **70-99**: Healthy. Small lapses happen but trust holds.
- **40-69**: Eroding. Hesitation creeps in. Some avoid care.
- **Below 40**: Broken. People hide symptoms, skip treatment, suffer alone.

**Behavior**: Drops quickly with mistakes. Rebuilds slowly with sustained good practice. Just like real trust.

### The Five Commitments

Reframed from clinical categories:

| Commitment | What It Means |
|------------|---------------|
| **The Foundation** (Privacy Principles) | Why patients trust us at all |
| **The Promise** (Patient Rights) | What we owe to every person |
| **The Discipline** (Minimum Necessary) | Taking only what we need |
| **The Recognition** (PHI Identifiers) | Knowing what's sacred |
| **The Vigilance** (Safeguards) | How we keep the walls strong |

### Patient Story Collection

The true reward. Not badges—lives protected.

Each room cleared adds a story to your collection. These aren't abstract. They're specific people whose trust you honored. Your gallery of quiet victories.

### Room Structure (Consistent Across All Rooms)

Each room contains:

1. **NPCs** — Dialogue teaches principles naturally
2. **Explorable elements** — Click to discover risks or good practices
3. **Scenarios** — Situation-based decisions (the "battles")
4. **Guardian moment** — Culminating challenge that earns the patient story

---

## Hallway Hub

Your home base. Visual map showing:

- Room status (locked/available/cleared)
- Trust Meter (prominent, central)
- Patient Story collection
- Your Five Commitments progress
- Privacy Guardian's Journal (tracks what you've learned)

---

## Emotional Arc

**Early game**: Rules feel abstract. You're learning mechanics.

**Mid game**: Patient stories start landing. *Oh. This is why it matters.*

**Late game**: Gray areas. Pressure. "Just this once" temptations. But now you have faces. You know the stakes.

**End state**: A full collection. Not a score to brag about—a responsibility you carry.
