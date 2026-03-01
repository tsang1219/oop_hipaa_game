# Phase 4: BreachDefense HUD Data - Research

**Researched:** 2026-03-01
**Domain:** React overlay UI, Phaser EventBridge, Tailwind CSS, existing modal/HUD patterns
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Wave Intro Banner:**
- Pausing banner on every wave start: game pauses briefly (3-4 seconds), banner auto-dismisses, game resumes
- Banner shows: wave name, intro narrative text, suggested tower names, and incoming threat icons/names
- Rendered as a React overlay positioned over the Phaser canvas (not in-canvas Phaser text)
- Coexists with existing TutorialModal system: odd waves still get deeper TutorialModal for educational content; the banner fires on all waves (including odd ones, before or alongside the tutorial)

**Tower Descriptions & Hints:**
- Tooltip on hover showing: description text + strongAgainst/weakAgainst counter info
- On mobile (no hover): description shows on tower select (tap to select = shows desc)
- Suggested towers for the current wave get a subtle pulsing border or "suggested" badge in the tower selection panel

**Threat Preview:**
- Two placements: (1) in the wave intro banner during pause, and (2) persistent strip during gameplay
- Persistent threat strip: new row between the Phaser canvas and the existing HUD bar
- Shows all wave threats upfront when wave starts (not progressive reveal)
- Each threat shows: colored icon + name + count (e.g., "Phishing x3, Credential x4")

**Wave End Messages:**
- Integrate endMessage from constants.ts into the existing RecapModal as a highlighted callout box (blockquote/colored box at bottom)
- Every wave now gets a RecapModal on completion (not just concept-recap waves) — at minimum showing the endMessage fact
- Include brief wave performance stats in RecapModal: "Threats stopped: X/Y | Towers active: Z"

### Claude's Discretion
- Exact banner auto-dismiss timing and animation (slide, fade, etc.)
- Tooltip positioning and styling details
- Threat strip icon design (reuse existing sprite thumbnails or simplified colored dots)
- How to handle the interaction between wave banner and TutorialModal on odd waves (sequence, merge, etc.)
- Performance stats data collection from BreachDefenseScene

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HUD-01 | Wave intro text overlay displays wave name on wave start | New React banner component + new BRIDGE_EVENTS.BREACH_WAVE_START event; game pauses 3-4s then auto-resumes |
| HUD-02 | Suggested tower hint shown per wave during prep phase | WAVES[n].suggestedTowers data exists in constants.ts; tower selection panel needs pulsing border/badge CSS; wave state passed via existing BREACH_STATE_UPDATE or a new event |
| HUD-03 | Tower description shown on hover in selection panel | TOWERS[n].desc, strongAgainst, weakAgainst data exists; tooltip via Radix UI Tooltip (already in package.json) or inline state pattern |
| HUD-04 | Wave end message displayed on wave completion | WAVES[n].endMessage data exists; RecapModal needs an endMessage prop and a stat summary; BREACH_WAVE_COMPLETE needs to emit endMessage + stats |
| HUD-05 | Incoming threat type icons shown before wave starts | WAVES[n].threats[] data exists; shown in banner (HUD-01) + persistent threat strip below canvas |
</phase_requirements>

## Summary

This phase is a pure UI/data surfacing phase: all educational content already exists in `constants.ts` and `tutorialContent.ts`. No new game mechanics, no new data sources, no new npm packages needed (Radix UI Tooltip is already installed). The work is entirely in React overlays and one-way data flow from Phaser to React via EventBridge.

The central pattern is: Phaser scene emits an event with wave data → React component receives it via EventBridge → React renders the appropriate UI. The existing `BREACH_WAVE_COMPLETE` event needs one new field (`endMessage` + wave stats). A new `BREACH_WAVE_START` event is needed to trigger the banner and threat strip. The `BREACH_STATE_UPDATE` event (already emitting every 200ms) can carry `suggestedTowers` for the tower panel badges.

The one hidden complexity is the RecapModal gap: waves with `concept: "LAYERS"` (wave 8) and `concept: "PASSWORDS"` (wave 9) have no corresponding entries in `TUTORIAL_CONTENT.recaps`. These two recap entries must be added to `tutorialContent.ts`, or the RecapModal must gracefully handle missing concepts by falling back to showing just the `endMessage` callout.

**Primary recommendation:** Build from the inside out — start with data flow (EventBridge events), then add the three UI components (WaveIntroBanner, ThreatStrip, tower tooltip), then modify existing components (RecapModal, tower panel). No new dependencies needed.

## Standard Stack

### Core (already installed, no new installs needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | ^18.3.1 | All overlay UI rendering | Already in use for all HUD components |
| Tailwind CSS 3 | ^3.4.17 | Styling, animations | `animate-pulse` built-in for suggested tower badge; all existing retro styling uses Tailwind |
| @radix-ui/react-tooltip | ^1.2.0 | Tower description tooltips | Already installed; accessible, handles positioning/overflow edge cases automatically |
| Phaser 3 | ^3.90.0 | Game engine, EventEmitter | EventBridge is a Phaser.Events.EventEmitter singleton |
| lucide-react | ^0.453.0 | Icons in HUD overlays | Already used throughout BreachDefensePage.tsx |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| THREAT_COLORS (constants.ts) | n/a | Colored dot for each threat type in threat strip | Use the existing hex color map for threat icons |

**Installation:** None required. All dependencies already present.

## Architecture Patterns

### Recommended Project Structure (additions only)
```
client/src/
├── components/breach-defense/
│   ├── WaveIntroBanner.tsx     # NEW: auto-dismissing wave start overlay
│   ├── ThreatStrip.tsx         # NEW: persistent "Incoming:" threat row
│   ├── RecapModal.tsx          # MODIFY: add endMessage callout + stats
│   └── CodexModal.tsx          # unchanged
├── pages/
│   └── BreachDefensePage.tsx   # MODIFY: wire new events, new state, new components
├── game/breach-defense/
│   └── tutorialContent.ts      # MODIFY: add LAYERS and PASSWORDS recap entries
└── phaser/
    ├── EventBridge.ts           # MODIFY: add BREACH_WAVE_START event constant
    └── scenes/
        └── BreachDefenseScene.ts # MODIFY: emit BREACH_WAVE_START + enhanced BREACH_WAVE_COMPLETE
```

### Pattern 1: New EventBridge Event — BREACH_WAVE_START

**What:** When a new wave is about to begin, the scene emits wave data (name, intro, suggestedTowers, threats array) to React. React pauses the game display and shows the banner.

**When to use:** Wave completion triggers wave increment → scene emits BREACH_WAVE_START before wave spawning begins.

**Where in scene:** In `BreachDefenseScene.update()`, at the point where `this.wave++` is called and the wave resets (around line 475-499). Emit immediately after incrementing wave number. Also emit for wave 1 in `onStartGame()`.

**Example:**
```typescript
// In EventBridge.ts — add to BRIDGE_EVENTS:
BREACH_WAVE_START: 'breach:wave-start',

// In BreachDefenseScene.ts — emit when wave transitions:
eventBridge.emit(BRIDGE_EVENTS.BREACH_WAVE_START, {
  wave: this.wave,                          // new wave number
  name: WAVES[this.wave - 1].name,
  intro: WAVES[this.wave - 1].intro,
  suggestedTowers: WAVES[this.wave - 1].suggestedTowers,
  threats: WAVES[this.wave - 1].threats,   // [{type, count}] array
  endMessage: WAVES[this.wave - 1].endMessage // carried for banner display
});
```

### Pattern 2: Enhanced BREACH_WAVE_COMPLETE

**What:** The existing `onWaveComplete` handler in `BreachDefensePage.tsx` (line 82-85) only receives `{ wave, concept }`. It needs `endMessage` and wave performance stats added.

**Where in scene:** `BreachDefenseScene.ts` line ~470, where `eventBridge.emit(BRIDGE_EVENTS.BREACH_WAVE_COMPLETE, ...)` is called. The scene already tracks `this.towers.length`. For "threats stopped" count, the scene needs a counter incremented on each successful kill (enemy hp <= 0 branch) and total spawned count from `waveState.enemiesSpawned`.

**Example:**
```typescript
// Scene tracks per-wave kill count:
private waveKillCount = 0;  // reset each wave
private waveTotalSpawned = 0; // = waveState.enemiesSpawned at wave end

// Emit:
eventBridge.emit(BRIDGE_EVENTS.BREACH_WAVE_COMPLETE, {
  wave: this.wave,
  concept: currentWaveData.concept,
  endMessage: currentWaveData.endMessage,
  stats: {
    threatsStop: this.waveKillCount,
    threatsTotal: this.waveState.enemiesSpawned,
    towersActive: this.towers.length
  }
});
```

### Pattern 3: WaveIntroBanner Component

**What:** A fixed overlay (z-50) appearing above the canvas that auto-dismisses after 3-4 seconds. Does NOT use `fixed inset-0` (full screen) — it's positioned over the 640x480 canvas area only, matching the retro aesthetic.

**Dismissal approach:** Use `setTimeout` in a `useEffect` hook inside the component, or in `BreachDefensePage` where `showBanner` state is set. The game scene stays in PLAYING state but `waveState.active = false` (wave hasn't started) during banner display — the existing prep period already handles this.

**Key insight from existing code:** The wave transition already has a 3000ms delay (`nextSpawnTime = time + 3000`) before enemies spawn. The banner can simply auto-dismiss within that window. No additional scene pausing is needed beyond what already exists.

**Example structure:**
```tsx
// WaveIntroBanner.tsx
interface WaveIntroBannerProps {
  wave: number;
  name: string;
  intro: string;
  suggestedTowers: string[];
  threats: Array<{ type: string; count: number }>;
  onDismiss: () => void;
  autoDismissMs?: number; // default 3500
}

export function WaveIntroBanner({ wave, name, intro, suggestedTowers, threats, onDismiss, autoDismissMs = 3500 }: WaveIntroBannerProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(t);
  }, [onDismiss, autoDismissMs]);

  return (
    <div className="absolute inset-x-0 top-0 z-40 border-4 border-black bg-[#1a1a2e] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4"
         style={{ fontFamily: '"Press Start 2P", monospace' }}>
      {/* Wave name header */}
      {/* Intro narrative */}
      {/* Threat preview row */}
      {/* Suggested towers */}
    </div>
  );
}
```

**Positioning:** WaveIntroBanner renders inside the `relative` div that wraps `<PhaserGame>` (line 218 in BreachDefensePage.tsx: `<div className="relative border-4 border-black...">`). This ensures the banner sits over the canvas without covering the HUD bar or tower panel.

### Pattern 4: ThreatStrip Component (Persistent)

**What:** A persistent row between the canvas and HUD bar showing `Incoming: [ThreatIcon x3] [ThreatIcon x4]`. Appears when wave starts, persists during the wave, clears between waves.

**Data flow:** Populated by the same wave data from `BREACH_WAVE_START`. Cleared when `BREACH_WAVE_COMPLETE` fires.

**Icon approach (Claude's discretion):** Use colored filled circles (matching `THREAT_COLORS`) with a text label. This is simpler than loading PNG sprites for a strip and consistent with the Phaser particle circle aesthetic already established. Alternatively, reuse the threat PNG sprites already loaded by BootScene (`threat_${type}` keys) via `<img>` tags with `imageRendering: pixelated`.

**Example structure:**
```tsx
// In BreachDefensePage.tsx layout — between canvas div and HUD bar:
{currentWaveThreats.length > 0 && (
  <div className="flex items-center gap-2 px-4 py-1 bg-[#2a2a3e] border-2 border-[#FF6B9D] rounded w-[640px]">
    <span className="text-[8px] text-gray-400">INCOMING:</span>
    {currentWaveThreats.map(({ type, count }) => (
      <div key={type} className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `#${THREAT_COLORS[type].toString(16).padStart(6,'0')}` }} />
        <span className="text-[7px] text-gray-300">{THREATS[type].name} x{count}</span>
      </div>
    ))}
  </div>
)}
```

### Pattern 5: Tower Tooltip (HUD-03)

**What:** Hover tooltip on each tower button in the selection panel showing `desc`, `strongAgainst`, `weakAgainst`.

**Implementation approach:** Radix UI Tooltip (`@radix-ui/react-tooltip`) is already installed. Wrap each tower button in `<Tooltip.Root>`, `<Tooltip.Trigger>`, `<Tooltip.Content>`. This handles positioning, keyboard accessibility, and mobile behavior automatically.

**Mobile fallback (Claude's discretion — user stated):** On tap (no hover), the description shows instead of selecting the tower. In practice: use a single `onClick` to toggle a "desc visible" state for that tower on mobile, and rely on Radix Tooltip's native hover on desktop. Simplest approach: always show description in a fixed info area below the tower panel when a tower is selected, so desktop hover + mobile tap both work with one code path.

**Example using Radix Tooltip:**
```tsx
import * as Tooltip from '@radix-ui/react-tooltip';

// In tower panel map:
<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      <button key={id} ...>
        {/* existing button content */}
      </button>
    </Tooltip.Trigger>
    <Tooltip.Content
      className="bg-[#1a1a2e] border-2 border-[#FF6B9D] p-2 text-[7px] max-w-[180px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50"
      side="top"
    >
      <p className="text-gray-200 mb-1">{tower.desc}</p>
      <p className="text-green-400">+ {tower.strongAgainst.join(', ')}</p>
      <p className="text-red-400">- {tower.weakAgainst.join(', ')}</p>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
```

### Pattern 6: Suggested Tower Badge (HUD-02)

**What:** The tower buttons for towers in the current wave's `suggestedTowers` array get a pulsing border or badge to visually suggest them.

**Data flow:** `currentWaveSuggestedTowers` state in `BreachDefensePage` populated from `BREACH_WAVE_START` event. Reset on `BREACH_WAVE_COMPLETE`.

**CSS pattern:** Tailwind's `animate-pulse` on a border or badge element:
```tsx
const isSuggested = currentWaveSuggestedTowers.includes(id);

// Add to button className:
isSuggested ? 'border-yellow-400 animate-pulse shadow-[0_0_8px_rgba(255,200,0,0.4)]' : ''

// Or a badge overlay:
{isSuggested && (
  <span className="absolute -top-1 -right-1 text-[5px] bg-yellow-400 text-black px-1 font-bold border border-black">
    HINT
  </span>
)}
```

### Pattern 7: Enhanced RecapModal (HUD-04)

**What:** RecapModal receives two new props: `endMessage: string` and `stats: { threatsStop: number; threatsTotal: number; towersActive: number }`. Every wave now triggers RecapModal (not just concept-recap waves).

**Current RecapModal limitation:** RecapModal requires `concept` to be a key of `TUTORIAL_CONTENT.recaps`. Waves 8 (LAYERS) and 9 (PASSWORDS) have no recap entries. Two solutions:
1. **Add LAYERS and PASSWORDS recap entries to tutorialContent.ts** (preferred — maintains consistency)
2. **Make recap content optional** — show only `endMessage` callout when no recap content exists

**Recommended:** Add both missing recap entries to tutorialContent.ts. This is the cleanest solution and improves the educational content.

**Props change:**
```tsx
interface RecapModalProps {
  concept: string; // relaxed from strict keyof
  onContinue: () => void;
  endMessage?: string;   // NEW
  stats?: {              // NEW
    threatsStop: number;
    threatsTotal: number;
    towersActive: number;
  };
}
```

**New callout box at bottom of RecapModal (before Continue button):**
```tsx
{endMessage && (
  <div className="bg-[#1a1a2e] border-2 border-yellow-400 p-3 rounded">
    <p className="text-[8px] font-bold text-yellow-400 mb-1">KEY FACT:</p>
    <p className="text-[9px] text-gray-200 leading-relaxed">{endMessage}</p>
  </div>
)}
{stats && (
  <div className="bg-gray-50 border-2 border-gray-300 p-2 rounded text-[8px] text-gray-600 flex gap-4 justify-center">
    <span>Threats stopped: <strong>{stats.threatsStop}/{stats.threatsTotal}</strong></span>
    <span>Towers active: <strong>{stats.towersActive}</strong></span>
  </div>
)}
```

### Anti-Patterns to Avoid

- **Pausing the Phaser game engine for the banner:** The existing 3000ms wave transition gap is sufficient. Don't call `this.game.pause()` — it pauses tweens and renders, causing visual glitches. The current `PAUSED` gameState only happens for the TutorialModal, not needed for the auto-dismiss banner.
- **Emitting BREACH_WAVE_START inside `update()`:** The wave complete condition fires every frame until enemies.length drops to 0. Use a guard flag (like existing `shownWaveSplashes` Set) to emit only once per wave transition.
- **Tooltip `Provider` outside the component tree:** `Tooltip.Provider` must wrap all `Tooltip.Root` instances. Place it at the tower panel level, not around individual buttons — one Provider per tree is correct.
- **String formatting of THREAT_COLORS hex:** `THREAT_COLORS` values are numbers (e.g., `0xFF6B35`). Convert to CSS: `#${color.toString(16).padStart(6, '0')}`.
- **Using `React.useState` for auto-dismiss timer without cleanup:** Always return `clearTimeout` from `useEffect` to prevent setState calls after unmount.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tooltip positioning | Custom absolute-positioned div with JS calculations | `@radix-ui/react-tooltip` (already installed) | Handles viewport overflow, focus management, aria-describedby automatically |
| Pulse animation | Custom CSS keyframes | Tailwind `animate-pulse` | Already in Tailwind config, consistent with existing retro style |
| Auto-dismiss timer logic | Complex interval/observable system | `setTimeout` in `useEffect` with cleanup | Simple, correct, idiomatic React |

**Key insight:** Every UI problem here has an obvious solution using what's already installed. Custom implementations would add complexity without benefit.

## Common Pitfalls

### Pitfall 1: RecapModal fires on waves without recap content (LAYERS, PASSWORDS)
**What goes wrong:** `TUTORIAL_CONTENT.recaps["LAYERS"]` is `undefined`. RecapModal returns `null` early, showing nothing at all.
**Why it happens:** `tutorialContent.ts` only defines 5 recap keys (PHISHING, PATCHING, INSIDER, PHYSICAL, ALLDEFENSE) but `constants.ts` has 7 concept values (adds LAYERS, PASSWORDS).
**How to avoid:** Add LAYERS and PASSWORDS entries to `TUTORIAL_CONTENT.recaps` before wiring RecapModal to all waves. Alternatively, loosen the null guard to still render the endMessage callout even without recap content.
**Warning signs:** RecapModal renders nothing for waves 8 and 9.

### Pitfall 2: BREACH_WAVE_START emitting every frame
**What goes wrong:** The wave-complete condition (`enemies.length === 0 && enemiesSpawned === total`) stays true for multiple frames. The banner fires repeatedly.
**Why it happens:** The update loop runs 60fps and the wave transition condition can be true for several consecutive frames before `waveState.active` is reset.
**How to avoid:** Use the existing `shownWaveSplashes` Set pattern already in the scene, OR immediately reset `waveState.active = false` and start the delay before emitting. Verify the existing code flow: `waveState.active` is set false in the reset block, so the emission should be in the same block, not a separate conditional.
**Warning signs:** Multiple banners appear or events fire multiple times.

### Pitfall 3: Tower tooltip overlaps the Phaser canvas on lower tower buttons
**What goes wrong:** Tooltip appears behind the canvas border or gets clipped.
**Why it happens:** Radix Tooltip defaults to `side="top"` but the canvas is directly above the tower panel.
**How to avoid:** Use `side="bottom"` or `side="top"` with `sideOffset` adjustment. Test that `z-index` of tooltip content (z-50) is above the canvas wrapper.
**Warning signs:** Tooltip appears clipped or partially hidden.

### Pitfall 4: Wave stats tracking — kill count not reset between waves
**What goes wrong:** "Threats stopped" in RecapModal accumulates across all waves instead of showing per-wave count.
**Why it happens:** If `waveKillCount` is a class field in BreachDefenseScene, it must be explicitly reset in the wave-complete handler, same place where `waveState` is reset.
**How to avoid:** Reset `this.waveKillCount = 0` and `this.waveTotalSpawned = 0` in the same block where `waveState` is reset at wave completion.

### Pitfall 5: Suggested towers not cleared between waves
**What goes wrong:** Previous wave's suggested towers remain highlighted through the next wave.
**Why it happens:** `currentWaveSuggestedTowers` state in React is set on BREACH_WAVE_START but only cleared if BREACH_WAVE_COMPLETE clears it.
**How to avoid:** Reset `currentWaveSuggestedTowers` to `[]` when BREACH_WAVE_START fires for a new wave (replacing previous wave's suggestions), and clear on BREACH_WAVE_COMPLETE and BREACH_GAME_OVER/BREACH_VICTORY.

## Code Examples

### EventBridge: Adding BREACH_WAVE_START
```typescript
// Source: client/src/phaser/EventBridge.ts
export const BRIDGE_EVENTS = {
  // ... existing events ...
  BREACH_WAVE_START: 'breach:wave-start',  // ADD THIS
  // ...
} as const;
```

### Scene: Emitting BREACH_WAVE_START (guarded)
```typescript
// Source: client/src/phaser/scenes/BreachDefenseScene.ts
// In the wave complete block (~line 466-512):
// After: this.wave++;
// After: grant stipend
// After: reset waveState

// Guard with a new Set to prevent double-emit:
if (!this.shownWaveStartBanners.has(this.wave)) {
  this.shownWaveStartBanners.add(this.wave);
  const waveData = WAVES[this.wave - 1];
  if (waveData) {
    eventBridge.emit(BRIDGE_EVENTS.BREACH_WAVE_START, {
      wave: this.wave,
      name: waveData.name,
      intro: waveData.intro,
      suggestedTowers: waveData.suggestedTowers,
      threats: waveData.threats,
    });
  }
}
```

### Page: New state and listener for BREACH_WAVE_START
```typescript
// Source: client/src/pages/BreachDefensePage.tsx
// New state:
const [showWaveBanner, setShowWaveBanner] = useState(false);
const [waveBannerData, setWaveBannerData] = useState<WaveBannerData | null>(null);
const [currentWaveThreats, setCurrentWaveThreats] = useState<Array<{type: string; count: number}>>([]);
const [currentWaveSuggestedTowers, setCurrentWaveSuggestedTowers] = useState<string[]>([]);

// New listener in useEffect:
const onWaveStart = (data: WaveBannerData) => {
  setWaveBannerData(data);
  setShowWaveBanner(true);
  setCurrentWaveThreats(data.threats);
  setCurrentWaveSuggestedTowers(data.suggestedTowers);
};
eventBridge.on(BRIDGE_EVENTS.BREACH_WAVE_START, onWaveStart);
// cleanup: eventBridge.off(BRIDGE_EVENTS.BREACH_WAVE_START, onWaveStart);
```

### RecapModal: Enhanced props
```typescript
// Source: client/src/components/breach-defense/RecapModal.tsx
interface RecapModalProps {
  concept: string; // was: keyof typeof TUTORIAL_CONTENT.recaps
  onContinue: () => void;
  endMessage?: string;
  stats?: { threatsStop: number; threatsTotal: number; towersActive: number };
}
// Render recap?.summary and recap?.action only if recap exists
// Always render endMessage callout and stats if provided
```

### tutorialContent.ts: Missing recap entries to add
```typescript
// Source: client/src/game/breach-defense/tutorialContent.ts
recaps: {
  // ... existing entries ...
  LAYERS: {
    title: "Defense in Depth: Key Takeaway",
    summary: "No single defense catches everything. Coordinated attacks require layered responses.",
    action: "Use multiple overlapping security controls. When one fails, others catch the threat."
  },
  PASSWORDS: {
    title: "Strong Passwords: Key Takeaway",
    summary: "Weak passwords fall to brute force in seconds. MFA makes stolen passwords useless.",
    action: "Use a password manager for unique, complex passwords. Enable MFA everywhere."
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phaser.GameObjects.Text for HUD text | React overlays over canvas | Phase 1-3 of this project | All new UI must be React components, not in-canvas text |
| Custom tooltip divs | @radix-ui/react-tooltip | Already installed | Use Radix, not manual positioning |

**Deprecated/outdated:**
- `createEmitter()` (Phaser particles): Replaced by `this.add.particles(x, y, key, config)` in Phaser 3.60+. Already correctly handled in Phase 3 (existing scene code is correct).

## Open Questions

1. **Wave intro banner + TutorialModal sequencing on odd waves**
   - What we know: Odd waves (1, 3, 5, 7, 9) already trigger TutorialModal via `BREACH_TUTORIAL_TRIGGER`. The banner should fire on ALL waves.
   - What's unclear: Should the banner fire BEFORE or AFTER the TutorialModal on odd waves? The CONTEXT.md says "before or alongside" but the exact UX order wasn't locked.
   - Recommendation: Fire banner first (all waves), then TutorialModal appears on odd waves after banner auto-dismisses. Sequence: BREACH_WAVE_START → banner shows 3s → banner dismisses → if odd wave, emit BREACH_TUTORIAL_TRIGGER → TutorialModal → player dismisses → wave starts. This means the scene should NOT emit `BREACH_TUTORIAL_TRIGGER` simultaneously with `BREACH_WAVE_START`; instead emit it after `REACT_BANNER_DISMISSED` (a new React→Phaser event), OR simply rely on timing (banner auto-dismisses in 3s, tutorial fires after `onDismissTutorial` which player controls).
   - **Simplest approach:** Emit BREACH_WAVE_START and set a delayed emit of BREACH_TUTORIAL_TRIGGER (3500ms later) for odd waves. The banner auto-dismisses at 3s, then the tutorial appears at 3.5s. No new React→Phaser event needed.

2. **Threat strip icon design: PNG vs colored dot**
   - What we know: BootScene preloads `threat_${type}` PNG sprites. They're 48x48 pixels in the canvas. Using them as `<img>` in React would require the PNG URLs (not Phaser texture keys).
   - What's unclear: Are PNG assets referenced by file path accessible in React `<img>` tags? Need to check how assets are loaded in BootScene.
   - Recommendation: Use colored filled circles (CSS + THREAT_COLORS hex values) for the persistent threat strip. Zero dependency on asset pipeline, consistent with existing retro dot aesthetics. The banner can optionally show threat names + counts in text form.

## Validation Architecture

> Skipping: `workflow.nyquist_validation` not present in config.json (only `workflow.research`, `workflow.plan_check`, `workflow.verifier` are defined — no `nyquist_validation` key).

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `BreachDefensePage.tsx`, `BreachDefenseScene.ts`, `EventBridge.ts`, `constants.ts`, `tutorialContent.ts`, `RecapModal.tsx`, `TutorialModal.tsx`, `CodexModal.tsx` — all read and analyzed
- `package.json` — verified all dependencies (React 18, Tailwind 3, Radix UI Tooltip already installed, Phaser 3.90)

### Secondary (MEDIUM confidence)
- Radix UI Tooltip API pattern — based on installed version `^1.2.0` and standard Radix usage; consistent with existing CodexModal/RecapModal patterns in the codebase
- Tailwind `animate-pulse` — standard Tailwind 3 utility, confirmed present in `tailwindcss: ^3.4.17`

### Tertiary (LOW confidence)
- None — all findings based on direct codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies verified by reading package.json
- Architecture: HIGH — all integration points verified by reading source files
- Pitfalls: HIGH — gaps (LAYERS/PASSWORDS recaps) confirmed by cross-referencing constants.ts concept values against tutorialContent.ts recap keys

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable stack, no fast-moving dependencies)
