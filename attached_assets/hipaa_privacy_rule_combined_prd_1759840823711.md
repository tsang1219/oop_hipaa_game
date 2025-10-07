
# HIPAA Privacy Rule Interactive Dialogue Game PRD (Phase 1 + 1.5)

**Project Title:** HIPAA Privacy Rule Interactive Dialogue Game  
**Version:** Phase 1 + Phase 1.5 Combined  
**Platform:** HTML5 / JavaScript (Replit Compatible)  
**Visual Style:** Retro 16-bit pixel art (Game Boy/NES aesthetic with Out-of-Pocket palette)

---

## 🎯 Overview

This PRD defines the initial and extended scope of an interactive HIPAA Privacy Rule learning game designed for compliance training that is *actually engaging*. The core mechanic revolves around dialogue choices, player feedback, and subtle scoring — all designed to test comprehension of HIPAA Privacy Rule concepts while offering nostalgic, emotionally resonant visuals.

The user interacts with characters (like Nurse Nina) who face HIPAA-related ethical and compliance dilemmas. Each decision branches the dialogue and impacts both the player's score and “trust level” — a soft feedback system showing how closely the user aligns with compliant thinking.

---

## 🧩 Objectives

- Make HIPAA training **engaging** through light narrative mechanics.
- Ensure **compliance** with HIPAA Privacy Rule coverage.
- Deliver trackable completion, scoring, and feedback metrics.
- Make the platform easily **auditable** and exportable (SCORM/xAPI optional).

---

## ✅ Success Metrics

| Metric | Description | Target |
|--------|--------------|--------|
| Completion Rate | % of users finishing all dialogue sequences | >95% |
| Comprehension Accuracy | % of correct or near-correct answers | >80% |
| Engagement Time | Avg. time spent per scene | 8–10 minutes |
| Replay Rate | % of users replaying at least one scenario | >30% |

---

## 📘 Core Modules

### Phase 1: Basic Functionality

| Module | Description |
|---------|--------------|
| Dialogue Engine | Player interacts with static scenes and dialogue boxes (no animation yet). |
| Choice Selection | Player chooses between 3–4 text-based responses per prompt. |
| Scoring System | Each choice maps to a compliance score (correct, partial, incorrect). |
| Feedback Loop | Simple text feedback (“That’s partially correct…”). |
| Scene Progression | Linear advancement through a single “Privacy Rule” case. |
| Logging | Basic console output or local storage log of decisions. |

### Phase 1.5: Enhancements

| Module | Description |
|---------|--------------|
| Scoring Visualization | Add visible trust/compliance meters. |
| Character Portrait Integration | Incorporate 16-bit style static images (like Nurse Nina). |
| JSON-Based Scene Data | Load scenes from external JSON file for easier authoring. |
| Subtle Branching | Allow minor dialogue variations based on player performance. |
| HUD Polish | Stylized dialogue boxes and branded UI (Out-of-Pocket palette). |
| Export Logging | Optionally store session data (local storage or CSV). |

---

## 🧠 Educational Focus Areas (Privacy Rule)

1. **Permitted Uses & Disclosures** – When PHI can be shared without authorization.  
2. **Minimum Necessary Rule** – Sharing only the minimum PHI needed.  
3. **Individual Rights** – Access, amendment, and accounting of disclosures.  
4. **Administrative Requirements** – Notice of privacy practices, complaints.  
5. **Examples & Edge Cases** – Gray areas where reasonable judgment applies.

---

## 🕹️ Game Flow

### Example Scene

**Character:** Nurse Nina  
**Setting:** Hospital corridor (pixel-art background)  
**Prompt:** “I need access to patient data...”  

**Choices:**
1. “Sure, I’ll give you full access to the EHR.” *(Incorrect – violates minimum necessary)*  
2. “Let’s confirm if it’s needed for treatment before accessing.” *(Correct)*  
3. “You can look up anything — it’s internal.” *(Incorrect)*  
4. “Check with your supervisor about the scope of your role.” *(Partial credit)*

**Feedback Example:**  
> *That’s close! You’re right that we should confirm the purpose, but HIPAA allows sharing PHI for treatment without explicit authorization — just be sure it’s relevant to your duties.*

---

## 💾 Data Model

**scene.json**
```json
{
  "scenes": [
    {
      "id": "scene1",
      "character": "Nurse Nina",
      "background": "hospital_corridor.png",
      "dialogue": "I need access to patient data...",
      "choices": [
        {"text": "Sure, I’ll give you full access to the EHR.", "score": -2, "feedback": "Violates the Minimum Necessary Rule."},
        {"text": "Let’s confirm if it’s needed for treatment before accessing.", "score": 3, "feedback": "Correct! PHI can be used for treatment if relevant."},
        {"text": "You can look up anything — it’s internal.", "score": -3, "feedback": "Incorrect. Access must be limited to job role."},
        {"text": "Check with your supervisor about the scope of your role.", "score": 1, "feedback": "Partial credit for role awareness."}
      ]
    }
  ]
}
```

---

## 🧩 Architecture Overview

| Component | File | Description |
|------------|------|--------------|
| UI | `index.html` | Game layout, HUD containers |
| Style | `style.css` | Retro color palette, pixel font |
| Logic | `script.js` | Dialogue progression, scoring, feedback rendering |
| Data | `scene.json` | Externalized scene data for easy content updates |

---

## 💻 Minimal Code Skeleton

### `index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HIPAA Privacy Rule Game</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="game-container">
    <img id="character" src="nurse_nina.png" alt="Nurse Nina">
    <div id="dialogue-box">
      <p id="dialogue-text"></p>
      <div id="choices"></div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>
```

### `style.css`
```css
body {
  background-color: #cde8ff;
  font-family: 'Press Start 2P', monospace;
  color: #1a1a1a;
}
#game-container {
  width: 600px;
  margin: 50px auto;
  text-align: center;
}
#dialogue-box {
  background-color: #ffffff;
  border: 3px solid #333;
  padding: 20px;
  border-radius: 8px;
}
.choice {
  background-color: #f0f0f0;
  border: 1px solid #999;
  margin: 5px;
  padding: 10px;
  cursor: pointer;
}
.choice:hover {
  background-color: #b0e0ff;
}
```

### `script.js`
```javascript
let currentScene = 0;
let score = 0;

async function loadScene() {
  const response = await fetch('scene.json');
  const data = await response.json();
  showScene(data.scenes[currentScene]);
}

function showScene(scene) {
  document.getElementById("character").src = scene.background;
  document.getElementById("dialogue-text").innerText = scene.dialogue;
  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";
  scene.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.innerText = choice.text;
    btn.onclick = () => {
      score += choice.score;
      alert(choice.feedback);
    };
    choicesDiv.appendChild(btn);
  });
}

loadScene();
```

---

## 🧱 Phase Roadmap

| Phase | Focus | Deliverable |
|--------|--------|-------------|
| **1.0** | Basic dialogue engine, manual scene | Playable conversation with Nurse Nina |
| **1.5** | Scoring, JSON data, character portraits | Improved UX and partial branching |
| **2.0** | Scene transitions, data export | Replayability and analytics |
| **3.0** | Full module expansion | Additional HIPAA rules, leaderboards, mobile polish |

---

## 🧩 Integration & Next Steps

- Implement this skeleton in **Replit** as base scaffold.
- Add `scene.json` and at least one background image (like your Nurse Nina example).
- Test flow through dialogue -> choice -> feedback -> scoring.
- Later: connect to xAPI or SCORM-compatible LMS endpoints.

---

**Author:** Concept by Andrew • PRD generated by GPT-5  
**Date:** 2025-10-07  
**File Name:** `hipaa_privacy_rule_combined_prd.md`
