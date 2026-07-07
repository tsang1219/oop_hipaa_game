/**
 * UnifiedGamePage — Single page for all PrivacyQuest gameplay (Phase 12).
 *
 * Replaces HubWorldPage + PrivacyQuestPage. The game runs entirely at /.
 * Phaser ExplorationScene handles room rendering; React handles overlays.
 * Door-to-door navigation replaces the HallwayHub room picker.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Phaser from 'phaser';
import { PhaserGame } from '../phaser/PhaserGame';
import { eventBridge, BRIDGE_EVENTS } from '../phaser/EventBridge';
import { useGameState, isDepartmentAccessible } from '../hooks/useGameState';
import GameContainer from '@/components/GameContainer';
import EducationalItemModal from '@/components/EducationalItemModal';
import ObservationHint from '@/components/ObservationHint';
import ChoicePrompt from '@/components/ChoicePrompt';
import { PatientStoryReveal } from '@/components/PatientStoryReveal';
import EndScreen from '@/components/EndScreen';
import { RoomProgressHUD } from '@/components/RoomProgressHUD';
import { RoomIntroOverlay } from '@/components/RoomIntroOverlay';
import { TutorialModal } from '../components/breach-defense/TutorialModal';
import { MusicVolumeSlider } from '../components/MusicVolumeSlider';
import { useNotification } from '../components/NotificationToast';
import { GameBanner } from '../components/GameBanner';
import { useToast } from '@/hooks/use-toast';
import { ValidationOverlay } from '../dev/ValidationOverlay';
import type { Scene, Gate } from '@shared/schema';
import gameDataJson from '@/data/gameData.json';
import roomDataJson from '@/data/roomData.json';
import { migrateV1toV2, loadSave, writeSave, hasSaveData } from '@/lib/saveData';
import { TitleScreen } from '../components/TitleScreen';
import { StartMenu } from '../components/StartMenu';
import { CharacterSelectScreen } from '../components/CharacterSelectScreen';
import {
  startDemo,
  endDemo,
  isDemoActive,
  markRoomComplete,
  getCompletedDemoRooms,
  DEMO_ROOM_ORDER,
} from '@/lib/demoSession';
import { CertificateOverlay } from '../components/CertificateOverlay';
import { NarrativeContextCard } from '../components/breach-defense/NarrativeContextCard';
import { EncounterDebrief } from '../components/breach-defense/EncounterDebrief';
import { EncounterGameUI } from '../components/breach-defense/EncounterGameUI';
import type { BreachDefenseInitData } from '../phaser/scenes/BreachDefenseScene';
import { PHISorterOverlay } from '@/components/phi-sorter/PHISorterOverlay';
import { SorterContextCard } from '@/components/phi-sorter/SorterContextCard';
import { SorterDebrief } from '@/components/phi-sorter/SorterDebrief';
import { EncounterRequestModal } from '@/components/phi-sorter/EncounterRequestModal';
import { getSorterDocumentSet } from '@/data/sorterData';
import { getNPCColor } from '@/data/spriteAssetPaths';
import { BreachTriageOverlay } from '@/components/breach-triage/BreachTriageOverlay';
import { TriageDebrief } from '@/components/breach-triage/TriageDebrief';
import { Phi18Codex } from '@/components/Phi18Codex';
import { phi18Count, PHI18_TOTAL, phi18Complete } from '@/data/phi18';
import { CorkboardOverlay } from '@/components/CorkboardOverlay';
import { CORKBOARD_SCORE } from '@/data/corkboardData';
import { getTriageIncidentSet } from '@/data/triageData';
import { computeDoorStates, type RoomWithDoors } from '@/lib/doorGraph';
import { StandaloneTDView, type TDStandaloneResult } from '../components/breach-defense/StandaloneTDView';

// Map an encounter ID to the NPC display name for the SorterDebrief "BACK TO {NPC}" close button.
// PHASE 22 (data-only change — no routing, no state-machine changes):
//   Previously mapped to room names ("RECEPTION", "LAB", "RECORDS").
//   Now maps to NPC names per SORTV2-06 so the button reads "BACK TO AIYANA" etc.
//   This is the only UnifiedGamePage.tsx change in Phase 22.
const SORTER_LOCATION_LABELS: Record<string, string> = {
  'phi-sort-reception': 'AIYANA',
  'phi-sort-lab': 'MARCUS',
  'phi-sort-records': 'DR. TOVAR',
  'breach-triage-er': 'PRIYA',  // Phase 17: Breach Triage close button reads "BACK TO PRIYA"
};

// F-04 fix (Run 07): map encounterId → the NPC that hosts it, built from roomData.
// Encounter-trigger NPCs (Aiyana, Marcus, Dr. Tovar, Priya) never went through the
// dialogue flow, so they could never enter completedNPCs — capping completion at
// 22/26 and making the win condition (talk to the CCO with all 26 done) unreachable.
// Winning an encounter now marks its host NPC complete, same as finishing a dialogue.
const ENCOUNTER_NPC_BY_ID: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const room of (roomDataJson as any).rooms ?? roomDataJson) {
    for (const npc of room.npcs ?? []) {
      if (npc.encounterTrigger?.encounterId) {
        map[npc.encounterTrigger.encounterId] = npc.id;
      }
    }
  }
  return map;
})();

type PageMode =
  | 'start-menu'
  | 'character-select'
  | 'title'
  | 'exploration'
  | 'dialogue'
  | 'gameover'
  | 'win'
  | 'tower-defense-standalone'
  | 'demo-complete'; // Phase 21 — sponsor demo capstone (cert + sponsor handoff)

const rooms = roomDataJson.rooms as RoomWithDoors[];
const scenes = (gameDataJson as any).scenes as Scene[];

// Run migration before React renders
const ROOM_IDS = rooms.map(r => r.id);
migrateV1toV2(ROOM_IDS);

// Door-graph pure functions (DoorState union, deriveNextTargetRoom,
// findFirstHopDoorId, computeDoorStates) moved to @/lib/doorGraph in
// Refactor Round 2. Re-export DoorState to keep this module's surface stable.
export type { DoorState } from '@/lib/doorGraph';

export default function UnifiedGamePage() {
  // QA: clear save data on FIRST render only for clean test state
  const qaNoSaveRef = useRef(new URLSearchParams(window.location.search).has('qa-no-save'));
  const qaClearedRef = useRef(false);
  if (qaNoSaveRef.current && !qaClearedRef.current) {
    qaClearedRef.current = true;
    localStorage.removeItem('pq:save:v2');
    localStorage.removeItem('pq_save');
  }

  const { toast } = useToast();
  const { notify } = useNotification();
  const gameRef = useRef<Phaser.Game | null>(null);
  const gameState = useGameState();
  const sceneStartedRef = useRef(false);
  // Track current pageMode in a ref so handleSceneReady (registered once on
  // mount) can read the latest value without re-registering. Without this,
  // Boot.SCENE_READY auto-starts Exploration even when the player picked
  // TOWER DEFENSE — leaving Exploration running in the background and the
  // player sprite responding to clicks (audible footsteps under the TD HUD).
  const pageModeRef = useRef<PageMode>('start-menu');

  // ── Local UI state (not persisted) ────────────────────────────
  const [pageMode, setPageMode] = useState<PageMode>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('qa-room') || params.has('qa-skip-onboarding') || params.has('qa-no-save')) {
      return 'exploration';
    }
    // Post-reload landing flag set by handleNewGame: take the player straight
    // to character-select (skipping the start-menu) so they immediately pick a
    // hero for their fresh game.
    if (sessionStorage.getItem('pq:goto-character-select')) {
      // Flag is consumed in the postSelectIntent initializer below.
      return 'character-select';
    }
    const skip = sessionStorage.getItem('pq:skip-title');
    if (skip) {
      sessionStorage.removeItem('pq:skip-title');
      return 'exploration';
    }
    // Phase 18: cold-boot players land on the StartMenu (3-button mode selector).
    // FULL GAME button transitions to 'title' (then existing TitleScreen → exploration path).
    return 'start-menu';
  });
  // Tracks which post-character-select flow to run on confirm. 'demo' fires
  // startDemo() before transitioning to exploration; 'full-game' goes straight.
  const [postSelectIntent, setPostSelectIntent] = useState<'full-game' | 'demo' | null>(() => {
    const goto = sessionStorage.getItem('pq:goto-character-select');
    if (goto) {
      sessionStorage.removeItem('pq:goto-character-select');
      return 'full-game';
    }
    return null;
  });
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [currentNPCId, setCurrentNPCId] = useState<string | null>(null);

  // Modal state
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [currentStoryRoom, setCurrentStoryRoom] = useState<RoomWithDoors | null>(null);
  const [isNewStory, setIsNewStory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    title: string; fact: string; type: 'poster' | 'manual' | 'computer' | 'whiteboard';
  } | null>(null);
  const [activeObservationGate, setActiveObservationGate] = useState<Gate | null>(null);
  const [activeChoiceGate, setActiveChoiceGate] = useState<Gate | null>(null);

  // Room cleared banner
  const [roomClearedBanner, setRoomClearedBanner] = useState<{ roomName: string } | null>(null);
  // R7-05: celebration that must wait for an active encounter overlay to close
  const [pendingCelebration, setPendingCelebration] = useState<{ roomId: string; roomName: string } | null>(null);

  // ── Standalone Tower Defense state (Phase 19 — TD-01..03) ─────
  // Result is null while the round is in progress, populated when BreachDefenseScene
  // emits BREACH_VICTORY or BREACH_GAME_OVER. The standalone path NEVER updates
  // gameState (no score, no encounter registry, no save write) — this is enforced by
  // the handlers below not calling any gameState mutator.
  const [tdStandaloneResult, setTdStandaloneResult] = useState<TDStandaloneResult | null>(null);
  const [tdWaveBanner, setTdWaveBanner] = useState<{ wave: number; key: number } | null>(null); // DESIGN-009
  const [tdHelperVisible, setTdHelperVisible] = useState(false); // DESIGN-009
  // Standalone TD wave-pause state — drives the "START NEXT WAVE" button.
  // The scene PAUSES between waves in standalone mode and waits for the
  // player to click. Wave 1 still uses the auto-prep countdown.
  const [tdWavePause, setTdWavePause] = useState<{ wave: number; total: number } | null>(null);

  // ── Encounter phase state (Phase 13 + 16 + 17) ─────────────────
  type EncounterPhase = 'idle' | 'narrative-card' | 'encounter' | 'phi-sorter' | 'breach-triage' | 'debrief';
  const [encounterPhase, setEncounterPhase] = useState<EncounterPhase>('idle');
  const [narrativeCardData, setNarrativeCardData] = useState<{
    narrativeText: string;
    config?: BreachDefenseInitData;         // optional — only TD encounters carry it
    encounterId: string;
    type: 'td' | 'phi-sorter' | 'breach-triage';  // discriminator (Phase 16 + 17)
    sorterConfig?: { documentSetId: string }; // present when type === 'phi-sorter'
    triageConfig?: { incidentSetId: string }; // present when type === 'breach-triage' (Phase 17)
  } | null>(null);
  const [encounterResult, setEncounterResult] = useState<{
    encounterId: string;
    outcome: 'victory' | 'defeat';
    securityScore: number;
    scoreContribution: number;
    takeaways?: string[];        // sorter-only + triage: presence discriminates from TD debrief
    correctCount?: number;       // sorter + triage: feeds accuracy bar
    totalCount?: number;         // sorter + triage: feeds accuracy bar
    avgResponseMs?: number;      // triage-only: feeds AVG RESPONSE stat in TriageDebrief
    kind?: 'triage';             // triage-only discriminator — sorter leaves this absent
    points?: number;             // triage arcade points (HIPAA-is-the-game pass)
    bestStreak?: number;         // triage best correct chain
    isNewRecord?: boolean;       // triage: beat the stored personal best
    ruleOutcomes?: { tag: string; short: string; ok: boolean }[]; // triage rule report card
  } | null>(null);

  // ── Encounter request modal state (NPC-driven trigger, 2026-05-08) ──
  // Populated when Phaser emits ENCOUNTER_REQUEST (player pressed SPACE on a
  // trigger NPC like Aiyana or Marcus). Rendered as EncounterRequestModal.
  const [encounterRequest, setEncounterRequest] = useState<{
    npcId: string;
    npcName: string;
    npcRole?: string;
    requestText: string;
    encounterId: string;
    documentSetId: string;
    encounterType?: 'phi-sorter' | 'breach-triage';  // Phase 17: discriminates which overlay to launch
  } | null>(null);
  // Mirror of encounterResults for listeners registered once on mount —
  // onEncounterComplete needs current completion state to gate replay scoring.
  const encounterResultsRef = useRef(gameState.state.encounterResults);
  useEffect(() => {
    encounterResultsRef.current = gameState.state.encounterResults;
  }, [gameState.state.encounterResults]);

  // ── The Eighteen codex (HIPAA-is-the-game pass) ────────────────
  const [showCodex, setShowCodex] = useState(false);
  const [recentIdentifierKey, setRecentIdentifierKey] = useState<string | null>(null);
  const [codexChipPulse, setCodexChipPulse] = useState(0);

  // ── Break-room corkboard minigame (HIPAA-is-the-game pass) ─────
  const [corkboardOpen, setCorkboardOpen] = useState(false);

  // Gate state per room
  const [resolvedGates, setResolvedGates] = useState<Set<string>>(new Set());
  const [unlockedNpcs, setUnlockedNpcs] = useState<Set<string>>(new Set());
  const [showRoomIntro, setShowRoomIntro] = useState(false);
  const prevRoomIdRef = useRef<string | null>(null);

  // Accumulated gate state across all rooms
  const initialSave = useRef(loadSave());
  const resolvedGatesAll = useRef<Record<string, string[]>>(initialSave.current.resolvedGates);
  const unlockedNpcsAll = useRef<Record<string, string[]>>(initialSave.current.unlockedNpcs);
  const npcPulsedRooms = useRef<string[]>(initialSave.current.npcPulsedRooms);

  // Score milestone celebrations
  const shownMilestones = useRef<Set<number>>(new Set());

  // Score delta floating indicator
  const prevPrivacyScoreRef = useRef(gameState.state.privacyScore);
  const [scoreDelta, setScoreDelta] = useState<{ value: number; key: number } | null>(null);
  const scoreDeltaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Intro modal
  const [showIntroModal, setShowIntroModal] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('qa-room') || params.has('qa-skip-onboarding') || params.has('qa-no-save')) return false;
    // Phase 18: demo mode skips the full-game onboarding modal — the start
    // menu already framed the experience and the demo path is curated.
    if (isDemoActive()) return false;
    return !initialSave.current.onboardingSeen;
  });

  // Mute toggle
  const [muted, setMuted] = useState<boolean>(initialSave.current.sfxMuted);

  // Derived
  const totalScenarios = rooms.reduce(
    (sum, r) => sum + r.npcs.filter((n: any) => !n.isFinalBoss).length, 0
  );
  const currentRoomId = gameState.state.currentRoomId;
  const currentRoom = rooms.find(r => r.id === currentRoomId) || null;
  const completedRooms = gameState.state.completedRooms;

  // Keep pageModeRef in sync so handleSceneReady (registered once on mount)
  // can read the latest pageMode without re-registering.
  useEffect(() => {
    pageModeRef.current = pageMode;
  }, [pageMode]);

  // ── Consolidated persistence ──────────────────────────────────
  useEffect(() => {
    if (qaNoSaveRef.current) return;
    // Phase 18 (DEMO-06): skip the writeSave call entirely when a demo session
    // is active. Combined with the same guard in useGameState's persistence
    // effect, this guarantees pq:save:v2 is byte-identical before and after a
    // demo session.
    if (isDemoActive()) return;
    const currentMusicVolume = parseFloat(localStorage.getItem('music_volume') ?? '0.6');
    // F-03 fix (Run 07): merge over the existing blob instead of writing a fixed
    // 15-field shape. useGameState's own persistence effect stores 8 extended
    // fields (currentAct, act1/2Complete, actFlags, decisions, encounterResults,
    // unifiedScore, currentRoomId) in the same key; the old fixed-shape write ran
    // AFTER it on every state change and wiped them all — no act ever survived a
    // save, which made Act 3 (Priya / Breach Triage) unreachable.
    writeSave({
      ...loadSave(),
      version: 2,
      completedRooms: gameState.state.completedRooms,
      collectedStories: gameState.state.collectedStories,
      completedNPCs: gameState.state.completedNPCs,
      completedZones: gameState.state.completedZones,
      collectedItems: gameState.state.collectedItems,
      privacyScore: gameState.state.privacyScore,
      finalPrivacyScore: gameState.state.privacyScore,
      resolvedGates: resolvedGatesAll.current,
      unlockedNpcs: unlockedNpcsAll.current,
      npcPulsedRooms: npcPulsedRooms.current,
      gameStartTime: gameState.state.gameStartTime,
      onboardingSeen: !showIntroModal,
      sfxMuted: muted,
      musicVolume: isNaN(currentMusicVolume) ? 0.6 : currentMusicVolume,
    });
  }, [gameState.state, muted, showIntroModal]);

  // ── Score delta floating indicator ────────────────────────────
  useEffect(() => {
    const score = gameState.state.privacyScore;
    if (score !== prevPrivacyScoreRef.current) {
      const delta = score - prevPrivacyScoreRef.current;
      prevPrivacyScoreRef.current = score;
      setScoreDelta({ value: delta, key: Date.now() });

      if (delta > 0) {
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.3 });
      } else if (delta < 0) {
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_breach_alert', volume: 0.35 });
      }

      if (scoreDeltaTimer.current) clearTimeout(scoreDeltaTimer.current);
      scoreDeltaTimer.current = setTimeout(() => setScoreDelta(null), 900);
    }
  }, [gameState.state.privacyScore]);

  // ── Score milestone celebrations ──────────────────────────────
  useEffect(() => {
    if (totalScenarios === 0) return;
    const completedCount = gameState.state.completedNPCs.length;
    const pct = Math.floor((completedCount / totalScenarios) * 100);
    const milestones = [25, 50, 75, 100];
    for (const m of milestones) {
      if (pct >= m && !shownMilestones.current.has(m)) {
        shownMilestones.current.add(m);
        const labels: Record<number, string> = {
          25: 'QUARTER WAY THERE!',
          50: 'HALFWAY HERO!',
          75: 'ALMOST THERE!',
          100: 'HIPAA CHAMPION!',
        };
        notify(labels[m] || `${m}% Complete`, {
          label: `${m}% PROGRESS`,
          type: m === 100 ? 'success' : 'info',
        });
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.7 });
      }
    }
  }, [gameState.state.completedNPCs, totalScenarios, notify]);

  // ── Sync game state to QA bridge (bypasses localStorage for qa-no-save) ──
  useEffect(() => {
    if (window.__QA__) {
      window.__QA__.completedRooms = gameState.state.completedRooms;
      window.__QA__.completedNPCs = gameState.state.completedNPCs;
      window.__QA__.completedZones = gameState.state.completedZones;
      window.__QA__.collectedItems = gameState.state.collectedItems;
    }
  }, [gameState.state.completedRooms, gameState.state.completedNPCs, gameState.state.completedZones, gameState.state.collectedItems]);

  // ── Load gate state when room changes ─────────────────────────
  useEffect(() => {
    if (!currentRoomId) return;
    const gatesForRoom = resolvedGatesAll.current[currentRoomId] || [];
    const npcsForRoom = unlockedNpcsAll.current[currentRoomId] || [];
    setResolvedGates(new Set(gatesForRoom));
    setUnlockedNpcs(new Set(npcsForRoom));

    const room = rooms.find(r => r.id === currentRoomId);
    const gates: Gate[] = room?.config?.gates || [];
    const choiceGate = gates.find(g => g.type === 'choice' && !new Set(gatesForRoom).has(g.id));
    if (choiceGate) setActiveChoiceGate(choiceGate);

    // Show room intro title card on room change
    if (currentRoomId !== prevRoomIdRef.current) {
      prevRoomIdRef.current = currentRoomId;
      setShowRoomIntro(true);
    }
  }, [currentRoomId]);

  // Mute toggle
  useEffect(() => {
    if (gameRef.current?.sound) {
      gameRef.current.sound.setMute(muted);
    }
    localStorage.setItem('sfx_muted', String(muted));
  }, [muted]);

  // ── Gate helpers ───────────────────────────────────────────────
  const isNpcGated = useCallback(
    (npcId: string): Gate | null => {
      if (unlockedNpcs.has(npcId)) return null;
      const room = rooms.find(r => r.id === currentRoomId);
      const gates: Gate[] = room?.config?.gates || [];
      for (const gate of gates) {
        if (gate.type === 'choice' && gate.choiceOptions?.some(opt => opt.unlocksId === npcId)) {
          if (!unlockedNpcs.has(npcId)) return gate;
        }
        if (gate.targetId === npcId && !resolvedGates.has(gate.id)) return gate;
      }
      return null;
    },
    [currentRoomId, resolvedGates, unlockedNpcs],
  );

  const resolveGate = useCallback(
    (gateId: string, unlockNpcId?: string) => {
      const newResolved = new Set(resolvedGates);
      newResolved.add(gateId);
      setResolvedGates(newResolved);
      if (currentRoomId) {
        resolvedGatesAll.current[currentRoomId] = Array.from(newResolved);
      }
      if (unlockNpcId) {
        const newUnlocked = new Set(unlockedNpcs);
        newUnlocked.add(unlockNpcId);
        setUnlockedNpcs(newUnlocked);
        if (currentRoomId) {
          unlockedNpcsAll.current[currentRoomId] = Array.from(newUnlocked);
        }
      }
    },
    [resolvedGates, unlockedNpcs, currentRoomId],
  );

  // ── QA auto-navigation — jump directly to a room for testing ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qaRoom = params.get('qa-room');
    if (qaRoom && rooms.some(r => r.id === qaRoom)) {
      // Run 07 (QA-infra fix): this used to blind-fire REACT_LOAD_ROOM on a
      // fixed 2s timer. Two failure modes: (a) if Boot finished late the event
      // fired before ExplorationScene registered its listener and was lost;
      // (b) if the target room WAS the boot room, the redundant scene.restart
      // landed 0–1.5s after the scene became playable and silently wiped any
      // in-flight interaction (exposed by the F-10 boot-timing fix). Now we
      // poll until the scene is actually up, and skip the redundant restart.
      const poll = setInterval(() => {
        const bridge = window.__QA__;
        if (!bridge?.scenesVisited?.includes('Exploration') || !bridge.currentRoomId) return;
        clearInterval(poll);
        if (bridge.currentRoomId === qaRoom) return; // already there
        const targetRoom = rooms.find(r => r.id === qaRoom);
        if (!targetRoom) return;
        gameState.setCurrentRoom(qaRoom);
        // Emit REACT_LOAD_ROOM to actually transition the Phaser scene
        const doorStates = computeDoorStates(targetRoom, gameState.state.completedRooms);
        eventBridge.emit(BRIDGE_EVENTS.REACT_LOAD_ROOM, {
          room: targetRoom,
          completedNPCs: gameState.state.completedNPCs,
          completedZones: gameState.state.completedZones,
          collectedItems: gameState.state.collectedItems,
          doorStates,
        });
      }, 200);
      return () => clearInterval(poll);
    }
  }, []);

  // ── Boot → Start ExplorationScene with hospital_entrance ──────
  useEffect(() => {
    const startExploration = () => {
      if (!gameRef.current || sceneStartedRef.current) return;
      sceneStartedRef.current = true;
      // Phase 18 (DEMO-04): demo sessions always boot the player into Reception
      // (the first curated demo room) regardless of any persisted currentRoomId.
      // Full-game flow is unchanged — resume room or hospital_entrance fallback.
      const resumeRoomId = isDemoActive()
        ? 'reception'
        : (gameState.state.currentRoomId ?? 'hospital_entrance');
      const startRoom = rooms.find(r => r.id === resumeRoomId)
        ?? rooms.find(r => r.id === 'hospital_entrance')!;
      const doorStates = computeDoorStates(startRoom, gameState.state.completedRooms);

      gameState.setCurrentRoom(startRoom.id);

      gameRef.current.scene.start('Exploration', {
        room: startRoom,
        completedNPCs: gameState.state.completedNPCs,
        completedZones: gameState.state.completedZones,
        collectedItems: gameState.state.collectedItems,
        doorStates,
      });

      // Demo guard: showIntroModal is computed at mount — before startDemo()
      // flips isDemoActive() — so a fresh browser entering DEMO would pause
      // here for a TutorialModal that demo mode never renders (soft-lock).
      if (showIntroModal && !isDemoActive()) {
        eventBridge.emit(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION);
      }
    };

    const handleSceneReady = (sceneKey: string) => {
      if (sceneKey === 'Boot') {
        // Don't auto-start Exploration if the player picked TOWER DEFENSE
        // standalone — that path starts BreachDefense directly.
        if (pageModeRef.current === 'tower-defense-standalone') return;
        startExploration();
      }
      if (sceneKey === 'BreachDefense') {
        // BreachDefense scene is ready — tell it to start the game
        eventBridge.emit(BRIDGE_EVENTS.REACT_START_BREACH);
      }
    };
    eventBridge.on(BRIDGE_EVENTS.SCENE_READY, handleSceneReady);

    // If Boot already fired before this effect registered (race condition),
    // poll briefly for the game ref to become available.
    // F-10 fix (Run 07): the poll used to start Exploration ~50ms after mount —
    // long before BootScene's preload finished downloading the music tracks —
    // so every cold boot logged "music_hub not ready, skipping BGM" and the
    // first room of every session was silent. Now the poll only fires once the
    // qa-bridge has seen Boot's SCENE_READY (assets loaded); the SCENE_READY
    // listener above covers the normal path.
    // F-17 fix (Run 07): same pageModeRef guard as handleSceneReady — the poll
    // used to boot Exploration underneath the standalone Tower Defense.
    const bootPoll = setInterval(() => {
      if (pageModeRef.current === 'tower-defense-standalone') return;
      if (
        gameRef.current &&
        !sceneStartedRef.current &&
        window.__QA__?.scenesVisited?.includes('Boot')
      ) {
        clearInterval(bootPoll);
        startExploration();
      }
    }, 50);
    // Stop polling after 5 seconds as safety valve
    const bootTimeout = setTimeout(() => clearInterval(bootPoll), 5000);

    return () => {
      eventBridge.off(BRIDGE_EVENTS.SCENE_READY, handleSceneReady);
      clearInterval(bootPoll);
      clearTimeout(bootTimeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Room completion check ─────────────────────────────────────
  const checkRoomCompletion = useCallback(
    (room: RoomWithDoors): boolean => {
      const reqs = room.completionRequirements;
      const completedNPCSet = new Set(gameState.state.completedNPCs);
      const completedZoneSet = new Set(gameState.state.completedZones);
      const collectedItemSet = new Set(gameState.state.collectedItems);
      if (!reqs) {
        return room.npcs.filter((n: any) => !n.isFinalBoss).every((n: any) => completedNPCSet.has(n.id));
      }
      return (
        reqs.requiredNpcs.every(id => completedNPCSet.has(id)) &&
        reqs.requiredZones.every(id => completedZoneSet.has(id)) &&
        reqs.requiredItems.every(id => collectedItemSet.has(id))
      );
    },
    [gameState.state.completedNPCs, gameState.state.completedZones, gameState.state.collectedItems],
  );

  // ── Auto-complete current room + refresh door visuals ─────────
  // When the player satisfies all requirements mid-exploration, mark the room complete
  // and push fresh door states to Phaser so doors update in place (no stale red X).
  useEffect(() => {
    if (!currentRoom || !currentRoomId) return;
    const justCompleted =
      checkRoomCompletion(currentRoom) && !completedRooms.includes(currentRoomId);
    const effectiveCompleted = justCompleted
      ? [...completedRooms, currentRoomId]
      : completedRooms;
    if (justCompleted) {
      gameState.completeRoom(currentRoomId);
      // F-03 fix (Run 07): checkActAdvance existed since Phase 14 but was never
      // called from anywhere — acts could not advance even in memory. This is
      // the single funnel through which every room completion flows.
      gameState.checkActAdvance(effectiveCompleted);

      // F-08 fix (Run 07): the room-complete celebration existed on both sides
      // but was never wired — the Phaser fanfare listener had no emitter, and
      // setRoomClearedBanner was only ever called with null, which also made
      // the six authored patient stories unreachable (banner → GameBanner →
      // handleRoomClearedComplete → PatientStoryReveal). Only celebrate rooms
      // with real requirements — hallways auto-complete on entry and get no
      // fanfare (Commandment 8: feedback scales with moment size).
      const reqs = currentRoom.completionRequirements;
      const earnedCompletion = reqs
        ? reqs.requiredNpcs.length + reqs.requiredZones.length + reqs.requiredItems.length > 0
        : currentRoom.npcs.length > 0;
      if (earnedCompletion) {
        if (encounterPhase === 'idle') {
          eventBridge.emit(BRIDGE_EVENTS.REACT_ROOM_COMPLETE_FANFARE, { roomId: currentRoomId });
          setRoomClearedBanner({ roomName: currentRoom.name });
        } else {
          // R7-05: an encounter overlay (sorter/triage/TD) is open — landing the
          // banner + patient story on top of it blocks its inputs. Defer the
          // celebration until the encounter closes.
          setPendingCelebration({ roomId: currentRoomId, roomName: currentRoom.name });
        }
      }
    }
    const doorStates = computeDoorStates(currentRoom, effectiveCompleted);
    eventBridge.emit(BRIDGE_EVENTS.REACT_UPDATE_DOOR_STATES, { doorStates });
  }, [
    currentRoomId,
    currentRoom,
    completedRooms,
    gameState.state.completedNPCs,
    gameState.state.completedZones,
    gameState.state.collectedItems,
    checkRoomCompletion,
    encounterPhase,
  ]);

  // R7-05: fire a deferred room celebration once the encounter overlay closes.
  useEffect(() => {
    if (encounterPhase === 'idle' && pendingCelebration) {
      eventBridge.emit(BRIDGE_EVENTS.REACT_ROOM_COMPLETE_FANFARE, { roomId: pendingCelebration.roomId });
      setRoomClearedBanner({ roomName: pendingCelebration.roomName });
      setPendingCelebration(null);
    }
  }, [encounterPhase, pendingCelebration]);

  // ── Door navigation handler (EXPLORATION_EXIT_ROOM) ───────────
  const handleExitRoom = useCallback(
    (payload: string | { targetRoomId: string; fromDoorId: string }) => {
      // Legacy string payload (ESC key) — just mark room complete if applicable
      if (typeof payload === 'string') {
        const room = rooms.find(r => r.id === payload);
        if (room) {
          const isComplete = checkRoomCompletion(room);
          if (isComplete && !completedRooms.includes(payload)) {
            gameState.completeRoom(payload);
            eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_wave_start', volume: 0.6 });
            notify(`Room Complete: ${room.name}`, { label: 'ALL CLEAR', type: 'success' });
          }
        }
        return;
      }

      // Door navigation payload
      // targetRoomId is a let: demo mode reroutes door exits along the curated
      // tour order (see the demo block below).
      let { targetRoomId } = payload;
      const { fromDoorId } = payload;

      // Check if current room is complete on exit
      if (currentRoomId) {
        const room = rooms.find(r => r.id === currentRoomId);
        if (room) {
          const isComplete = checkRoomCompletion(room);
          if (isComplete && !completedRooms.includes(currentRoomId)) {
            gameState.completeRoom(currentRoomId);
            eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_wave_start', volume: 0.6 });
            notify(`Room Complete: ${room.name}`, { label: 'ALL CLEAR', type: 'success' });
          }
        }
      }

      // ── Phase 21 — Sponsor demo capstone trigger ───────────────
      // When a demo session is active and the player walks out of Medical
      // Records AFTER having cleared all 4 demo rooms, fire the completion
      // sequence INSTEAD OF transitioning to the next room. Player who walks
      // through Records without satisfying its requirements simply lands at
      // the next demo room normally — the capstone only fires once the
      // session has actually marked all 4 rooms complete (gated by the
      // `checkRoomCompletion` block above feeding `markRoomComplete`).
      if (isDemoActive() && currentRoomId) {
        const justCompleted = checkRoomCompletion(
          rooms.find(r => r.id === currentRoomId)!,
        );
        if (justCompleted) {
          // Idempotent: only adds the room if it's a demo room and not already in.
          markRoomComplete(currentRoomId);
        }
        const completedDemo = getCompletedDemoRooms();
        const allDemoRoomsDone = DEMO_ROOM_ORDER.every(id =>
          completedDemo.includes(id),
        );
        if (currentRoomId === 'records_room' && allDemoRoomsDone) {
          setPageMode('demo-complete');
          return; // skip REACT_LOAD_ROOM — capstone takes over
        }
        // Curated routing: the demo order (reception → er → break_room →
        // records_room) is deliberately non-physical — on the real map, ER and
        // Records sit behind the demo-locked lab / IT office, so walking the
        // curated tour is impossible. Any door out of a demo room therefore
        // leads to the next demo room still on the tour, not to the hallway
        // the door nominally points at. (Incomplete rooms stay on the list, so
        // skipping ahead circles back before the capstone can fire.)
        const nextDemoRoom = DEMO_ROOM_ORDER.find(
          id => id !== currentRoomId && !completedDemo.includes(id),
        );
        if (nextDemoRoom) {
          targetRoomId = nextDemoRoom;
        }
      }

      // Check if target is accessible
      // Use latest completedRooms (includes the room we may have just completed)
      const latestCompleted = gameState.state.completedRooms.includes(currentRoomId ?? '')
        ? gameState.state.completedRooms
        : currentRoomId && checkRoomCompletion(rooms.find(r => r.id === currentRoomId)!)
          ? [...gameState.state.completedRooms, currentRoomId]
          : gameState.state.completedRooms;

      if (!isDepartmentAccessible(targetRoomId, latestCompleted)) {
        eventBridge.emit(BRIDGE_EVENTS.REACT_DOOR_LOCKED);
        return;
      }

      // Find target room
      const nextRoom = rooms.find(r => r.id === targetRoomId);
      if (!nextRoom) return;

      // Find spawn door on the other side
      const spawnDoor = nextRoom.doors?.find(d => d.targetRoomId === currentRoomId);

      // Update state
      gameState.setCurrentRoom(targetRoomId);

      // Compute door states for the new room
      const doorStates = computeDoorStates(nextRoom, latestCompleted);

      // Send new room to ExplorationScene
      eventBridge.emit(BRIDGE_EVENTS.REACT_LOAD_ROOM, {
        room: nextRoom,
        spawnDoorId: spawnDoor?.id,
        completedNPCs: gameState.state.completedNPCs,
        completedZones: gameState.state.completedZones,
        collectedItems: gameState.state.collectedItems,
        doorStates,
      });
    },
    [currentRoomId, completedRooms, gameState, checkRoomCompletion, notify],
  );

  // ── EventBridge listeners ─────────────────────────────────────
  useEffect(() => {
    const onInteractNPC = (data: {
      npcId: string;
      npcName: string;
      sceneId: string;
      isFinalBoss?: boolean;
    }) => {
      const gate = isNpcGated(data.npcId);
      if (gate) {
        if (gate.type === 'social') {
          // Social gates auto-resolve on first interaction attempt — show context, then unlock
          const hint = gate.description || 'Something feels off here...';
          toast({
            title: hint,
            description: `Talk to ${data.npcName} again to continue.`,
          });
          resolveGate(gate.id, gate.targetId);
          eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
          return;
        }
        const hint = gate.observationHint || gate.description || 'Look around the room first...';
        toast({
          title: `${data.npcName} isn't ready to talk yet`,
          description: hint,
        });
        eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
        return;
      }
      const sceneExists = scenes.some(s => s.id === data.sceneId);
      if (!sceneExists) {
        toast({
          title: 'Scene Not Found',
          description: `"${data.sceneId}" is not available yet.`,
          variant: 'destructive',
        });
        eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
        return;
      }
      setCurrentSceneId(data.sceneId);
      setCurrentNPCId(data.npcId);
      setPageMode('dialogue');
    };

    const onInteractZone = (data: { zoneId: string; zoneName: string; sceneId: string }) => {
      // Minigame zones (HIPAA-is-the-game pass) bypass the dialogue-scene path.
      // Zone completion + scene resume are owned by the minigame overlay.
      if (data.sceneId === 'minigame:corkboard') {
        setCorkboardOpen(true);
        return;
      }

      const room = rooms.find(r => r.id === currentRoomId);
      const gates: Gate[] = room?.config?.gates || [];
      for (const gate of gates) {
        if (
          gate.type === 'observation' &&
          gate.prerequisiteId === data.zoneId &&
          !resolvedGates.has(gate.id)
        ) {
          gameState.completeZone(data.zoneId);
          setActiveObservationGate(gate);
          return;
        }
      }

      gameState.completeZone(data.zoneId);

      const sceneExists = scenes.some(s => s.id === data.sceneId);
      if (!sceneExists) {
        toast({
          title: 'Scene Not Found',
          description: `"${data.sceneId}" is not available yet.`,
          variant: 'destructive',
        });
        eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
        return;
      }
      setCurrentSceneId(data.sceneId);
      setCurrentNPCId(null);
      setPageMode('dialogue');
    };

    const onInteractItem = (data: {
      itemId: string;
      title: string;
      fact: string;
      type: string;
    }) => {
      setSelectedItem({ title: data.title, fact: data.fact, type: data.type as any });
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.4, rate: 1.3 });
      if (!gameState.state.collectedItems.includes(data.itemId)) {
        gameState.collectItem(data.itemId);
        notify(data.title, { label: 'HIPAA FACT LEARNED', type: 'discovery' });
      }
    };

    const onExitRoom = (payload: string | { targetRoomId: string; fromDoorId: string }) => {
      handleExitRoom(payload);
    };

    eventBridge.on(BRIDGE_EVENTS.EXPLORATION_INTERACT_NPC, onInteractNPC);
    eventBridge.on(BRIDGE_EVENTS.EXPLORATION_INTERACT_ZONE, onInteractZone);
    eventBridge.on(BRIDGE_EVENTS.EXPLORATION_INTERACT_ITEM, onInteractItem);
    eventBridge.on(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, onExitRoom);

    return () => {
      eventBridge.off(BRIDGE_EVENTS.EXPLORATION_INTERACT_NPC, onInteractNPC);
      eventBridge.off(BRIDGE_EVENTS.EXPLORATION_INTERACT_ZONE, onInteractZone);
      eventBridge.off(BRIDGE_EVENTS.EXPLORATION_INTERACT_ITEM, onInteractItem);
      eventBridge.off(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, onExitRoom);
    };
  }, [currentRoomId, resolvedGates, isNpcGated, handleExitRoom, gameState, toast, notify]);

  // ── Standalone Tower Defense handlers (Phase 19 — TD-01..03) ──
  // Declared here (above the dependent useEffects) so the Esc effect can list
  // handleTdBackToMenu in its dep array without a TDZ error. handleSelectDemo /
  // handleSelectFullGame remain alongside the other start-menu handlers further
  // down for grouping symmetry.

  // TOWER DEFENSE: launches BreachDefenseScene as a standalone mini-game. The
  // actual scene.start() call lives in a useEffect keyed on pageMode because the
  // Phaser canvas only mounts when the standalone branch renders below — gameRef
  // is null while the StartMenu is showing.
  const handleSelectTowerDefense = useCallback(() => {
    setTdStandaloneResult(null);
    setPageMode('tower-defense-standalone');
  }, []);

  // Restart the round in place — emit RESTART (resets scene state) then START
  // (re-arms wave 1). No save mutation; no encounter registry write.
  const handleTdPlayAgain = useCallback(() => {
    setTdStandaloneResult(null);
    eventBridge.emit(BRIDGE_EVENTS.REACT_RESTART_BREACH);
    eventBridge.emit(BRIDGE_EVENTS.REACT_START_BREACH);
  }, []);

  // Return to the start menu via full reload. Matches the demo-Esc pattern: since
  // standalone TD never wrote to localStorage (TD-03), reload restores the
  // pre-TD state cleanly and the cold-boot StartMenu reappears.
  const handleTdBackToMenu = useCallback(() => {
    window.location.reload();
  }, []);

  // ── Standalone Tower Defense scene launch (Phase 19 — TD-01) ───
  // When entering 'tower-defense-standalone' mode, stop any other Phaser scene and
  // boot BreachDefenseScene with no init data — encounterId stays undefined, which
  // the scene already treats as "standalone arcade mode" (full WAVES, full
  // WAVE_BUDGETS, all TOWERS, BREACH_VICTORY/BREACH_GAME_OVER events instead of
  // ENCOUNTER_COMPLETE). The existing handleSceneReady listener emits
  // REACT_START_BREACH on 'BreachDefense' scene-ready, so the wave loop arms itself.
  useEffect(() => {
    if (pageMode !== 'tower-defense-standalone') return;
    let cancelled = false;
    const launch = () => {
      if (cancelled || !gameRef.current) return;
      const game = gameRef.current;
      // Wait until Boot's preload has populated the audio cache before launching.
      // When the user clicks TD from StartMenu, Phaser mounts fresh and Boot is
      // still in preload — calling scene.start('BreachDefense') too early throws
      // "Audio key 'music_breach' not found in cache" inside create(), which
      // breaks the scene's update loop (timers still fire, but no enemies spawn).
      if (!game.cache.audio.exists('music_breach')) {
        // Re-poll until Boot finishes its preload.
        return;
      }
      if (game.scene.isActive('Exploration')) game.scene.stop('Exploration');
      if (game.scene.isActive('BreachDefense')) game.scene.stop('BreachDefense');
      game.scene.start('BreachDefense');
    };
    let started = false;
    const tryLaunch = () => {
      if (started || cancelled || !gameRef.current) return;
      if (!gameRef.current.cache.audio.exists('music_breach')) return;
      started = true;
      launch();
    };
    if (gameRef.current) tryLaunch();
    // gameRef populates after PhaserGame mounts in the JSX branch — poll briefly.
    const poll = setInterval(() => {
      tryLaunch();
      if (started) clearInterval(poll);
    }, 50);
    const timeout = setTimeout(() => clearInterval(poll), 10000);
    return () => { cancelled = true; clearInterval(poll); clearTimeout(timeout); };
  }, [pageMode]);

  // ── Standalone TD: kick wave 1 prep countdown ───────────────────
  // In encounter mode, EncounterGameUI's onboarding (SELECT_TOWER → PLACE_TOWER →
  // PREP) emits REACT_START_PREP after the player places a tower. Standalone has
  // no narrative wrapper or onboarding state machine, so nothing fires that event
  // and wave 1 never spawns enemies. We listen for the BREACH_WAVE_START signal
  // (emitted by onStartGame for wave 1) and emit REACT_START_PREP after a short
  // grace period so the player sees the wave intro banner and has time to place
  // initial towers before the countdown begins.
  useEffect(() => {
    if (pageMode !== 'tower-defense-standalone') return;
    let prepTimer: number | null = null;
    let armed = false;
    const onWaveStart = (data?: { wave?: number }) => {
      if (data?.wave !== 1 || armed) return;
      armed = true;
      prepTimer = window.setTimeout(() => {
        eventBridge.emit(BRIDGE_EVENTS.REACT_START_PREP);
      }, 1500);
    };
    eventBridge.on(BRIDGE_EVENTS.BREACH_WAVE_START, onWaveStart);
    return () => {
      eventBridge.off(BRIDGE_EVENTS.BREACH_WAVE_START, onWaveStart);
      if (prepTimer !== null) window.clearTimeout(prepTimer);
    };
  }, [pageMode]);

  // ── Standalone TD result listeners (Phase 19 — TD-02) ──────────
  // Only listens while the player is in standalone TD mode. NEVER calls
  // gameState.addScore or gameState.recordEncounterResult — that's the encounter
  // path. Standalone mode is score-isolated.
  useEffect(() => {
    if (pageMode !== 'tower-defense-standalone') return;
    const onVictory = (data: { securityScore: number; wavesCompleted: number; towersPlaced: number }) => {
      setTdStandaloneResult({ outcome: 'victory', ...data });
    };
    const onGameOver = (data: { wavesCompleted: number; towersPlaced: number }) => {
      setTdStandaloneResult({ outcome: 'defeat', ...data });
    };
    // BreachDefenseScene now PAUSES between every wave in standalone mode and
    // waits for the player to click "START NEXT WAVE". This handler only owns
    // the wave-cleared celebration (banner + fanfare) — wave activation is
    // user-driven via the button.
    const onWaveComplete = (data?: { wave?: number }) => {
      if (data?.wave) {
        setTdWaveBanner({ wave: data.wave, key: Date.now() });
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_fanfare', volume: 0.45 });
        window.setTimeout(() => setTdWaveBanner(null), 1600);
      }
    };
    eventBridge.on(BRIDGE_EVENTS.BREACH_VICTORY, onVictory);
    eventBridge.on(BRIDGE_EVENTS.BREACH_GAME_OVER, onGameOver);
    eventBridge.on(BRIDGE_EVENTS.BREACH_WAVE_COMPLETE, onWaveComplete);
    return () => {
      eventBridge.off(BRIDGE_EVENTS.BREACH_VICTORY, onVictory);
      eventBridge.off(BRIDGE_EVENTS.BREACH_GAME_OVER, onGameOver);
      eventBridge.off(BRIDGE_EVENTS.BREACH_WAVE_COMPLETE, onWaveComplete);
    };
  }, [pageMode]);

  // ── Standalone TD: wave-pause state listener ───────────────────
  // Reads BREACH_STATE_UPDATE; shows the "START NEXT WAVE" button when the
  // scene is PAUSED between waves (wave > 1, no result overlay yet).
  useEffect(() => {
    if (pageMode !== 'tower-defense-standalone') return;
    const onState = (data: { gameState: string; wave: number; totalWaves: number }) => {
      const showBtn = data.gameState === 'PAUSED' && data.wave > 1 && data.wave <= data.totalWaves;
      setTdWavePause(showBtn ? { wave: data.wave, total: data.totalWaves } : null);
    };
    eventBridge.on(BRIDGE_EVENTS.BREACH_STATE_UPDATE, onState);
    return () => {
      eventBridge.off(BRIDGE_EVENTS.BREACH_STATE_UPDATE, onState);
    };
  }, [pageMode]);

  const handleStartNextWave = useCallback(() => {
    eventBridge.emit(BRIDGE_EVENTS.REACT_START_NEXT_WAVE);
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.4 });
    setTdWavePause(null);
  }, []);

  // ── Standalone TD Esc-to-menu (Phase 19) ───────────────────────
  // Mirrors the demo-Esc pattern: reload returns the player to the cold-boot
  // StartMenu cleanly. The save key is untouched (TD-03), so this is safe.
  useEffect(() => {
    if (pageMode !== 'tower-defense-standalone') return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleTdBackToMenu();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [pageMode, handleTdBackToMenu]);

  useEffect(() => { // DESIGN-009: first-time helper hint (600ms in, 4s hold)
    if (pageMode !== 'tower-defense-standalone') return;
    setTdHelperVisible(false);
    const inT = window.setTimeout(() => setTdHelperVisible(true), 600);
    const outT = window.setTimeout(() => setTdHelperVisible(false), 4600);
    return () => { window.clearTimeout(inT); window.clearTimeout(outT); };
  }, [pageMode]);

  // ── Encounter lifecycle listeners (Phase 13) ────────────────────
  useEffect(() => {
    const onEncounterTriggered = (data: any) => {
      setNarrativeCardData({
        narrativeText: data.narrativeText,
        config: data.config,
        encounterId: data.encounterId,
        type: data.type ?? 'td',        // default 'td' for Phase 13 backward compat
        sorterConfig: data.sorterConfig,
      });
      setEncounterPhase('narrative-card');
    };

    const onEncounterComplete = (data: {
      encounterId: string;
      outcome: 'victory' | 'defeat';
      securityScore: number;
      scoreContribution: number;
    }) => {
      setEncounterResult(data);
      setEncounterPhase('debrief');
      // Feed encounter score into unified compliance score — first completion
      // only. The Threat Console re-runs the TD encounter as a simulation
      // (HIPAA-is-the-game pass); replays are for mastery, not score farming.
      const alreadyCompleted = encounterResultsRef.current[data.encounterId]?.completed;
      if (data.scoreContribution > 0 && !alreadyCompleted) {
        gameState.addScore(data.scoreContribution);
      }
      // Record encounter result in game state
      gameState.recordEncounterResult(data.encounterId, {
        completed: true,
        score: data.securityScore,
        outcome: data.outcome,
      });
    };

    // NPC-driven encounter request (2026-05-08): Phaser emits this when player
    // presses SPACE on a trigger NPC. We show EncounterRequestModal — the player
    // picks accept (→ open sorter) or decline (→ resume exploration).
    const onEncounterRequest = (data: {
      npcId: string;
      npcName: string;
      npcRole?: string;
      requestText: string;
      encounterId: string;
      documentSetId: string;
      encounterType?: 'phi-sorter' | 'breach-triage';
    }) => {
      setEncounterRequest(data);
    };

    eventBridge.on(BRIDGE_EVENTS.ENCOUNTER_TRIGGERED, onEncounterTriggered);
    eventBridge.on(BRIDGE_EVENTS.ENCOUNTER_COMPLETE, onEncounterComplete);
    eventBridge.on(BRIDGE_EVENTS.ENCOUNTER_REQUEST, onEncounterRequest);

    return () => {
      eventBridge.off(BRIDGE_EVENTS.ENCOUNTER_TRIGGERED, onEncounterTriggered);
      eventBridge.off(BRIDGE_EVENTS.ENCOUNTER_COMPLETE, onEncounterComplete);
      eventBridge.off(BRIDGE_EVENTS.ENCOUNTER_REQUEST, onEncounterRequest);
    };
  }, []);

  // Accept handler: skip the narrative card phase and go directly to the encounter.
  // (The modal already provided the NPC framing — narrative card would be redundant.)
  // Phase 17: branches on encounterType to route to breach-triage vs phi-sorter.
  const handleAcceptEncounterRequest = useCallback(() => {
    if (!encounterRequest) return;
    const { encounterId, documentSetId, encounterType } = encounterRequest;

    if (encounterType === 'breach-triage') {
      setNarrativeCardData({
        narrativeText: '',
        encounterId,
        type: 'breach-triage',
        triageConfig: { incidentSetId: documentSetId },
      });
      setEncounterPhase('breach-triage');
    } else {
      // Default: phi-sorter (backward compat with Aiyana, Marcus, Dr. Tovar)
      setNarrativeCardData({
        narrativeText: '',
        encounterId,
        type: 'phi-sorter',
        sorterConfig: { documentSetId },
      });
      setEncounterPhase('phi-sorter');
    }
    setEncounterRequest(null);
  }, [encounterRequest]);

  // Decline handler: close modal, signal Phaser to unpause via the existing
  // aborted path. No registry write — encounter remains replayable.
  const handleDeclineEncounterRequest = useCallback(() => {
    setEncounterRequest(null);
    eventBridge.emit(BRIDGE_EVENTS.REACT_RETURN_FROM_ENCOUNTER, { aborted: true });
  }, []);

  const handleConfirmNarrativeCard = useCallback(() => {
    if (!narrativeCardData) return;
    if (narrativeCardData.type === 'phi-sorter') {
      setEncounterPhase('phi-sorter');
      // Pure React encounter — do NOT emit REACT_LAUNCH_ENCOUNTER
    } else {
      setEncounterPhase('encounter');
      if (narrativeCardData.config) {
        eventBridge.emit(BRIDGE_EVENTS.REACT_LAUNCH_ENCOUNTER, { config: narrativeCardData.config });
      }
    }
  }, [narrativeCardData]);

  const handleDeclineNarrativeCard = useCallback(() => {
    setEncounterPhase('idle');
    setNarrativeCardData(null);
    // Unpause ExplorationScene so the player can keep exploring
    eventBridge.emit(BRIDGE_EVENTS.REACT_RESUME_EXPLORATION);
  }, []);

  const handleDismissDebrief = useCallback(() => {
    // BLOCKER 3: capture encounterId BEFORE state setters so async setState ordering doesn't lose it.
    const encounterId = encounterResult?.encounterId;
    // F-05 fix (Run 07): only a VICTORY seals the encounter (registry write →
    // no replay). A defeat used to be recorded as done too, locking the player
    // to a 0 forever. Now defeat returns via the aborted path — the encounter
    // stays replayable (walk back to the trigger / talk to the NPC again).
    const wasVictory = encounterResult?.outcome === 'victory';
    setEncounterPhase('idle');
    setEncounterResult(null);
    setNarrativeCardData(null);
    eventBridge.emit(
      BRIDGE_EVENTS.REACT_RETURN_FROM_ENCOUNTER,
      wasVictory && encounterId ? { encounterId } : { aborted: true },
    );
  }, [encounterResult]);

  // PHI Sorter abort handler — player exits via X button or Esc.
  // No score change, no registry write — encounter remains replayable.
  const handleSorterAbort = useCallback(() => {
    setEncounterPhase('idle');
    setEncounterResult(null);
    setNarrativeCardData(null);
    eventBridge.emit(BRIDGE_EVENTS.REACT_RETURN_FROM_ENCOUNTER, { aborted: true });
  }, []);

  // Breach Triage encounter completion handler (Phase 17)
  // Mirrors handleSorterComplete — routes to TriageDebrief via kind:'triage' discriminator.
  const handleTriageComplete = useCallback((result: {
    encounterId: string;
    correctCount: number;
    totalCount: number;
    scoreContribution: number;
    avgResponseMs: number;
    takeaways: [string, string];
    points?: number;
    bestStreak?: number;
    ruleOutcomes?: { tag: string; short: string; ok: boolean }[];
  }) => {
    const incidentSet = getTriageIncidentSet(narrativeCardData?.triageConfig?.incidentSetId ?? '');
    const accuracy = result.totalCount > 0 ? result.correctCount / result.totalCount : 0;
    const passingAccuracy = incidentSet?.passingAccuracy ?? 0.7;
    const outcome: 'victory' | 'defeat' = accuracy >= passingAccuracy ? 'victory' : 'defeat';

    // Local personal best for arcade points — replay incentive, never synced
    let isNewRecord = false;
    try {
      const bestKey = `pq:triage:best:${result.encounterId}`;
      const prevBest = parseInt(localStorage.getItem(bestKey) ?? '0', 10) || 0;
      if ((result.points ?? 0) > prevBest) {
        isNewRecord = prevBest > 0; // first run isn't a "record", it's a baseline
        localStorage.setItem(bestKey, String(result.points ?? 0));
      }
    } catch { /* localStorage unavailable — skip records */ }

    setEncounterResult({
      encounterId: result.encounterId,
      outcome,
      securityScore: Math.round(accuracy * 100),
      scoreContribution: result.scoreContribution,
      takeaways: result.takeaways.filter((t: string) => t && t.length > 0),
      correctCount: result.correctCount,
      totalCount: result.totalCount,
      avgResponseMs: result.avgResponseMs,
      kind: 'triage',
      points: result.points,
      bestStreak: result.bestStreak,
      isNewRecord,
      ruleOutcomes: result.ruleOutcomes,
    });
    setEncounterPhase('debrief');

    if (result.scoreContribution > 0) {
      gameState.addScore(result.scoreContribution);
    }
    gameState.recordEncounterResult(result.encounterId, {
      completed: true,
      score: result.correctCount,
      outcome,
    });
    // F-04 fix (Run 07): a won encounter completes its host NPC (Priya),
    // same as a finished dialogue — otherwise the 26-NPC win condition is unreachable.
    if (outcome === 'victory' && ENCOUNTER_NPC_BY_ID[result.encounterId]) {
      gameState.completeNPC(ENCOUNTER_NPC_BY_ID[result.encounterId]);
    }
  }, [narrativeCardData, gameState]);

  // PHI Sorter encounter completion handler (Phase 16)
  const handleSorterComplete = useCallback((result: {
    encounterId: string;
    correctCount: number;
    totalCount: number;
    scoreContribution: number;
    takeaways: [string, string];
  }) => {
    const docSet = getSorterDocumentSet(narrativeCardData?.sorterConfig?.documentSetId ?? '');
    const accuracy = result.totalCount > 0 ? result.correctCount / result.totalCount : 0;
    const passingAccuracy = docSet?.passingAccuracy ?? 0.7;
    const outcome: 'victory' | 'defeat' = accuracy >= passingAccuracy ? 'victory' : 'defeat';

    setEncounterResult({
      encounterId: result.encounterId,
      outcome,
      securityScore: Math.round(accuracy * 100),
      scoreContribution: result.scoreContribution,
      takeaways: result.takeaways.filter((t: string) => t && t.length > 0),
      correctCount: result.correctCount,
      totalCount: result.totalCount,
    });
    setEncounterPhase('debrief');

    if (result.scoreContribution > 0) {
      gameState.addScore(result.scoreContribution);
    }
    gameState.recordEncounterResult(result.encounterId, {
      completed: true,
      score: result.correctCount,
      outcome,
    });
    // F-04 fix (Run 07): a won encounter completes its host NPC (Aiyana /
    // Marcus / Dr. Tovar), same as a finished dialogue — otherwise the
    // 26-NPC win condition is unreachable.
    if (outcome === 'victory' && ENCOUNTER_NPC_BY_ID[result.encounterId]) {
      gameState.completeNPC(ENCOUNTER_NPC_BY_ID[result.encounterId]);
    }
  }, [narrativeCardData, gameState]);

  // ── The Eighteen codex handlers (HIPAA-is-the-game pass) ──────
  // An identifier was correctly caught for the first time (sorter / corkboard).
  const handleIdentifierFound = useCallback((key: string) => {
    const before = gameState.state.identifiersFound;
    if (before.includes(key)) return;
    gameState.collectIdentifier(key);
    setRecentIdentifierKey(key);
    setCodexChipPulse((n) => n + 1);
    if (phi18Complete([...before, key])) {
      // Completion payoff: compliance bonus + toast. The in-encounter banner
      // carries the gold moment; this makes it count.
      gameState.addScore(10);
      notify('All 18 identifiers logged — Safe Harbor certified', { label: 'THE EIGHTEEN', type: 'success' });
    }
  }, [gameState, notify]);

  const handleOpenCodex = useCallback(() => {
    setShowCodex(true);
    eventBridge.emit(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION);
  }, []);

  const handleCloseCodex = useCallback(() => {
    setShowCodex(false);
    setRecentIdentifierKey(null);
    eventBridge.emit(BRIDGE_EVENTS.REACT_RESUME_EXPLORATION);
  }, []);

  // [I] opens the codex during idle exploration (codex handles its own close)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'i' && e.key !== 'I') return;
      if (showCodex || corkboardOpen || pageMode !== 'exploration' || encounterPhase !== 'idle') return;
      e.preventDefault();
      handleOpenCodex();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pageMode, encounterPhase, showCodex, corkboardOpen, handleOpenCodex]);

  // ── Corkboard minigame handlers ────────────────────────────────
  const handleCorkboardComplete = useCallback((result: { mistakes: number }) => {
    const first = !gameState.state.completedZones.includes('staff_corkboard');
    gameState.completeZone('staff_corkboard');
    if (first) {
      gameState.addScore(CORKBOARD_SCORE);
      notify(
        result.mistakes === 0
          ? 'Corkboard cleared — not a single wrong pull'
          : 'Corkboard cleared',
        { label: 'PHI TAKEN DOWN', type: 'success' },
      );
    }
  }, [gameState, notify]);

  const handleCorkboardClose = useCallback(() => {
    setCorkboardOpen(false);
    // Same resume path a dialogue uses — clears the scene dim + unpauses
    eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
  }, []);

  // ── Sync completion state to running Phaser scene ─────────────
  useEffect(() => {
    if (!sceneStartedRef.current) return;
    const scene = gameRef.current?.scene.getScene('Exploration') as any;
    if (scene?.updateCompletionState) {
      scene.updateCompletionState(
        gameState.state.completedNPCs,
        gameState.state.completedZones,
        gameState.state.collectedItems,
      );
    }
  }, [gameState.state.completedNPCs, gameState.state.completedZones, gameState.state.collectedItems]);

  const handleRoomClearedComplete = useCallback(() => {
    setRoomClearedBanner(null);
    const room = rooms.find(r => r.id === currentRoomId);
    if (room?.patientStory && !gameState.state.collectedStories.includes(currentRoomId!)) {
      gameState.collectStory(currentRoomId!);
      setCurrentStoryRoom(room);
      setIsNewStory(true);
      setShowStoryModal(true);
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.3, rate: 1.1 });
    }
  }, [currentRoomId, gameState]);

  // ── Dialogue complete ─────────────────────────────────────────
  const handleDialogueComplete = useCallback(
    (result?: { finalPrivacyScore: number }) => {
      if (result?.finalPrivacyScore !== undefined) {
        const delta = result.finalPrivacyScore - gameState.state.privacyScore;
        if (delta !== 0) gameState.addScore(delta);
      }
      if (currentNPCId) {
        const isFirst = !gameState.state.completedNPCs.includes(currentNPCId);
        gameState.completeNPC(currentNPCId);

        if (isFirst) {
          const npcData = currentRoom?.npcs.find((n: any) => n.id === currentNPCId);
          const npcName = npcData?.name || 'NPC';
          notify(`Scenario complete: ${npcName}`, { label: 'SCENARIO CLEARED', type: 'success' });
          eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.5 });
        }

        // F-15 fix (Run 07): the choice gate asks "who do you assist FIRST?" —
        // "first" promises you'll get to both. Once the chosen person's scenario
        // completes, unlock the other option so their content (and the 26-NPC
        // ending, which needs every NPC) stays reachable.
        const gatesHere: Gate[] = currentRoom?.config?.gates || [];
        for (const gate of gatesHere) {
          if (gate.type !== 'choice') continue;
          if (!gate.choiceOptions?.some(opt => opt.unlocksId === currentNPCId)) continue;
          for (const opt of gate.choiceOptions) {
            if (opt.unlocksId && opt.unlocksId !== currentNPCId && !unlockedNpcs.has(opt.unlocksId)) {
              resolveGate(gate.id, opt.unlocksId);
              const otherNpc = currentRoom?.npcs.find((n: any) => n.id === opt.unlocksId);
              if (otherNpc) {
                notify(`${otherNpc.name} is ready to talk now`, { label: 'NEW SCENARIO', type: 'info' });
              }
            }
          }
        }

        // Win condition — F-04 fix (Run 07): count the boss conversation that is
        // completing RIGHT NOW (state is stale until the next render).
        // R7-06 (ported from twin run): the CCO now carries isFinalBoss, so
        // totalScenarios counts only the 25 regular NPCs — the finale requires
        // all of them plus the boss talk that is completing here. The boss is
        // excluded from the count so a prior boss chat can't stand in for a
        // missed scenario.
        const completedRegulars = new Set(gameState.state.completedNPCs);
        completedRegulars.delete(currentNPCId);
        if (currentSceneId === 'final_boss_1' && completedRegulars.size >= totalScenarios) {
          if (gameState.state.privacyScore > 0) {
            setPageMode('win');
            return;
          }
        }
      }

      setCurrentSceneId(null);
      setCurrentNPCId(null);
      setPageMode('exploration');
      eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
    },
    [currentNPCId, currentSceneId, gameState, totalScenarios, currentRoom, notify, unlockedNpcs, resolveGate],
  );

  const handleGameOver = useCallback(
    (finalScore: number) => {
      const delta = finalScore - gameState.state.privacyScore;
      if (delta !== 0) gameState.addScore(delta);
      setPageMode('gameover');
    },
    [gameState],
  );

  const handlePrivacyScoreChange = useCallback(
    (newScore: number) => {
      const delta = newScore - gameState.state.privacyScore;
      if (delta !== 0) gameState.addScore(delta);
    },
    [gameState],
  );

  const handleDismissIntroModal = useCallback(() => {
    setShowIntroModal(false);
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.2, rate: 0.9 });
    eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
  }, []);

  const handleShowHelpModal = useCallback(() => {
    setShowIntroModal(true);
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.3, rate: 1.1 });
    eventBridge.emit(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION);
  }, []);

  const handleNewGame = useCallback(() => {
    localStorage.clear();
    // After reload, land on character-select instead of start-menu so the
    // player immediately picks a hero for their fresh game.
    sessionStorage.setItem('pq:goto-character-select', '1');
    window.location.reload();
  }, []);

  const handleResume = useCallback(() => {
    setPageMode('exploration');
  }, []);

  // ── Start menu (Phase 18) ──────────────────────────────────────
  // FULL GAME: if a save exists, route to TitleScreen (Resume / New Game prompt).
  // Otherwise route through character-select on the way to a fresh exploration.
  const handleSelectFullGame = useCallback(() => {
    if (hasSaveData()) {
      setPageMode('title');
    } else {
      setPostSelectIntent('full-game');
      setPageMode('character-select');
    }
  }, []);

  // DEMO: route through character-select first, then start the demo session
  // on confirm. We deliberately delay startDemo() until after selection so the
  // player can ESC back to the start-menu without a half-initialized demo.
  const handleSelectDemo = useCallback(() => {
    setPostSelectIntent('demo');
    setPageMode('character-select');
  }, []);

  // Character-select confirm — fires startDemo() if the demo path was chosen,
  // then drops the player into exploration. Phaser mounts at this transition,
  // so BootScene reads the just-saved character ID and loads the right sheet.
  const handleCharacterConfirmed = useCallback(() => {
    if (postSelectIntent === 'demo') {
      startDemo();
      // showIntroModal was initialized before the demo existed (mount time);
      // clear it so nothing downstream pauses for the never-rendered modal.
      setShowIntroModal(false);
    }
    setPostSelectIntent(null);
    setPageMode('exploration');
  }, [postSelectIntent]);

  // Character-select cancel — bail back to the start-menu without committing.
  const handleCharacterCancel = useCallback(() => {
    setPostSelectIntent(null);
    setPageMode('start-menu');
  }, []);

  // Phase 19 — Tower Defense standalone handlers were declared earlier in the
  // component (above the standalone-TD useEffects) so they could be referenced as
  // effect dependencies without a "used before declaration" TS error. Keeping this
  // anchor comment here for grep discoverability.

  const handlePlayAgain = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleViewStory = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room?.patientStory) {
      setCurrentStoryRoom(room);
      setIsNewStory(false);
      setShowStoryModal(true);
    }
  };

  const handleCloseStoryModal = () => {
    setShowStoryModal(false);
    setCurrentStoryRoom(null);
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.2, rate: 0.9 });
  };

  // ── Demo Esc-to-start-menu (Phase 18 — DEMO-07) ────────────────
  // While in an active demo session and currently exploring (not in dialogue,
  // encounter, gameover, etc.), the Esc key closes the demo and returns the
  // player to the start menu. We end the demo session and reload the page so
  // useGameState rehydrates from the unchanged save (DEMO-06 guarantees the
  // save key was never written during the demo, so reload restores the
  // pre-demo full-game state cleanly). This matches the existing
  // handleNewGame / handlePlayAgain reload pattern used elsewhere in this file.
  useEffect(() => {
    if (!isDemoActive()) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (pageMode !== 'exploration') return;
      endDemo();
      // Force a clean reload so all in-memory state (Phaser scene, gameState,
      // resolvedGates, encounter overlays) returns to a fresh boot. The
      // start menu is the new default cold-boot screen, so the player lands
      // back there automatically.
      window.location.reload();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [pageMode]);

  const formatElapsedTime = (): string => {
    const elapsed = Date.now() - gameState.state.gameStartTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // ── Start menu (Phase 18 — DEMO-01) ──────────────────────────
  // First screen the player sees on `/`. Three buttons route to:
  //   DEMO          → curated 4-room sponsor pitch (handleSelectDemo)
  //   TOWER DEFENSE → standalone TD scene (Phase 19 will wire)
  //   FULL GAME     → existing TitleScreen / exploration flow (unchanged)
  // Phaser is NOT mounted while in this mode — the canvas div renders only in
  // the main game view branch below. QA bypass paths still skip this screen.
  if (pageMode === 'start-menu') {
    return (
      <StartMenu
        onDemo={handleSelectDemo}
        onTowerDefense={handleSelectTowerDefense}
        onFullGame={handleSelectFullGame}
      />
    );
  }

  // ── Character select (sponsor-pitch flourish) ─────────────────
  // Shown on New Game (both demo and full-game paths). Phaser is NOT mounted
  // here — the choice persists to localStorage before BootScene runs, so the
  // selected character's spritesheet is what loads under the `player_sheet`
  // texture key. ESC returns to the start-menu.
  if (pageMode === 'character-select') {
    return (
      <CharacterSelectScreen
        onConfirm={handleCharacterConfirmed}
        onCancel={handleCharacterCancel}
      />
    );
  }

  // ── Standalone Tower Defense (Phase 19 — TD-01..03) ───────────
  // Presentational view extracted to StandaloneTDView (Refactor Round 2).
  // ALL state and handlers stay here and are passed down as props.
  if (pageMode === 'tower-defense-standalone') {
    return (
      <StandaloneTDView
        gameRef={gameRef}
        result={tdStandaloneResult}
        wavePause={tdWavePause}
        waveBanner={tdWaveBanner}
        helperVisible={tdHelperVisible}
        onStartNextWave={handleStartNextWave}
        onPlayAgain={handleTdPlayAgain}
        onBackToMenu={handleTdBackToMenu}
        onDismissHelper={() => setTdHelperVisible(false)}
      />
    );
  }

  // ── Title screen ──────────────────────────────────────────────
  if (pageMode === 'title') {
    return (
      <TitleScreen
        hasSave={hasSaveData()}
        onNewGame={handleNewGame}
        onResume={handleResume}
      />
    );
  }

  // ── Phase 21 — Sponsor demo capstone (CERT-01..03) ────────────
  // Demo-only completion sequence: dim → 500ms beat → fanfare → certificate
  // animation → sponsor code reveal, with end-NPC handoff (sprite + two
  // dialogue lines from SPONSOR_CONFIG). On dismiss, end the demo session
  // and reload — same pattern as Phase 18 Esc and Phase 19 BACK TO MENU.
  if (pageMode === 'demo-complete') {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-4">
        <div className="relative w-[960px] h-[720px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <CertificateOverlay
            onReturn={() => {
              endDemo();
              window.location.reload();
            }}
          />
        </div>
      </div>
    );
  }

  // ── Win / GameOver screens ────────────────────────────────────
  if (pageMode === 'gameover' || pageMode === 'win') {
    return (
      <EndScreen
        isWin={pageMode === 'win'}
        finalScore={gameState.state.privacyScore}
        scenariosCompleted={gameState.state.completedNPCs.length}
        // R7-06: totalScenarios counts only regular NPCs now that the CCO
        // carries isFinalBoss; +1 folds the boss back in so a full run reads
        // 26/26 (completedNPCs includes the boss at win time).
        totalScenarios={totalScenarios + 1}
        timeElapsed={formatElapsedTime()}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  // ── Story reveal modal ────────────────────────────────────────
  // F-26 fix (Run 07, new finding): this used to be a full-page early return —
  // it UNMOUNTED PhaserGame (which destroys the Game instance on unmount) for
  // the duration of the story, and nothing ever rebooted the scene afterwards
  // (sceneStartedRef stays true), leaving a dead black canvas. The path was
  // unreachable while F-08 kept stories dead; fixing F-08 exposed it. The
  // component is styled `absolute inset-0` — it was always meant to be an
  // overlay. It now renders inside the canvas container below.

  // ── Main game view (Phaser canvas + React overlays) ───────────
  // F-22 fix (Run 07, new finding): pass the FULL nextSceneId chain, not just the
  // entry scene. GameContainer resolves choice.nextSceneId by findIndex into this
  // array; with only the entry scene present, every cross-scene jump fell through
  // to "no next scene → onComplete", silently ending multi-scene dialogues after
  // scene 1 — the CCO's 3-scenario final exam played only scenario 1.
  const dialogueScenes = (() => {
    if (!currentSceneId) return [];
    const byId = new Map(scenes.map(s => [s.id, s]));
    const out: Scene[] = [];
    const seen = new Set<string>();
    const queue = [currentSceneId];
    while (queue.length) {
      const id = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const s = byId.get(id);
      if (!s) continue;
      out.push(s);
      for (const c of s.choices ?? []) {
        if (c.nextSceneId) queue.push(c.nextSceneId);
      }
    }
    return out;
  })();
  const npc = currentRoom?.npcs.find((n: any) => n.id === currentNPCId);

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-4">
      <div className="relative border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <PhaserGame ref={gameRef} width={960} height={720} />

        {/* CRT scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* Room progress overlay — hidden during encounter */}
        {encounterPhase === 'idle' && currentRoom && (
          <RoomProgressHUD
            room={currentRoom as any}
            completedNpcs={new Set(gameState.state.completedNPCs)}
            completedZones={new Set(gameState.state.completedZones)}
            collectedItems={new Set(gameState.state.collectedItems)}
          />
        )}

        {/* The Eighteen codex chip — bottom-left during idle exploration */}
        {encounterPhase === 'idle' && pageMode === 'exploration' && currentRoom && !showCodex && (
          <button
            onClick={handleOpenCodex}
            className={`absolute bottom-2 left-2 z-30 border-2 bg-black/80 px-2.5 py-2 transition-colors hover:bg-black/95 ${
              phi18Complete(gameState.state.identifiersFound)
                ? 'border-[#FFD93D] text-[#FFD93D]'
                : 'border-[#4FB3D9]/70 text-white'
            }`}
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
            data-testid="phi18-chip"
            aria-label="Open The Eighteen codex"
          >
            <span
              key={codexChipPulse}
              className="inline-block animate-[sorter-score-pulse_0.4s_ease-out]"
            >
              📇 THE 18 · {phi18Count(gameState.state.identifiersFound)}/{PHI18_TOTAL}
            </span>
            <span className="text-white/40 ml-1.5">[I]</span>
          </button>
        )}

        {/* The Eighteen codex overlay */}
        {showCodex && (
          <Phi18Codex
            foundKeys={gameState.state.identifiersFound}
            recentKey={recentIdentifierKey}
            onClose={handleCloseCodex}
          />
        )}

        {/* Break-room corkboard minigame */}
        {corkboardOpen && (
          <CorkboardOverlay
            alreadyCleaned={gameState.state.completedZones.includes('staff_corkboard')}
            identifiersFound={gameState.state.identifiersFound}
            onIdentifierFound={handleIdentifierFound}
            onComplete={handleCorkboardComplete}
            onClose={handleCorkboardClose}
          />
        )}

        {/* Encounter overlays (Phase 13) */}
        {encounterPhase === 'narrative-card' && narrativeCardData && (
          narrativeCardData.type === 'phi-sorter' && narrativeCardData.sorterConfig
            ? (() => {
                const docSet = getSorterDocumentSet(narrativeCardData.sorterConfig.documentSetId);
                return docSet ? (
                  <SorterContextCard
                    title={docSet.contextCard.title}
                    body={docSet.contextCard.body}
                    onConfirm={handleConfirmNarrativeCard}
                  />
                ) : null;
              })()
            : (
              <NarrativeContextCard
                narrativeText={narrativeCardData.narrativeText}
                onConfirm={handleConfirmNarrativeCard}
                onDecline={handleDeclineNarrativeCard}
              />
            )
        )}

        {encounterPhase === 'encounter' && narrativeCardData?.config && (
          <EncounterGameUI
            availableTowerIds={narrativeCardData?.config?.availableTowerIds ?? []}
            // F-06 (Run 07): same abort semantics as the sorter — no score
            // change, no registry write, encounter replayable.
            onExit={handleSorterAbort}
          />
        )}

        {encounterPhase === 'phi-sorter' && narrativeCardData?.sorterConfig && (
          <PHISorterOverlay
            documentSetId={narrativeCardData.sorterConfig.documentSetId}
            encounterId={narrativeCardData.encounterId}
            identifiersFound={gameState.state.identifiersFound}
            onIdentifierFound={handleIdentifierFound}
            onComplete={handleSorterComplete}
            onAbort={handleSorterAbort}
          />
        )}

        {/* Phase 17: Breach Triage encounter — Act 3 ER, Priya the Privacy Officer */}
        {encounterPhase === 'breach-triage' && narrativeCardData?.triageConfig && (
          <BreachTriageOverlay
            incidentSetId={narrativeCardData.triageConfig.incidentSetId}
            encounterId={narrativeCardData.encounterId}
            onComplete={handleTriageComplete}
            onAbort={handleSorterAbort}
          />
        )}

        {/* NPC-driven encounter request modal — shown when the player presses
            SPACE on Aiyana (Reception) or Marcus (Lab). Replaced the proximity-
            tile auto-pop on 2026-05-08 so the player has explicit agency. */}
        {encounterRequest && (
          <EncounterRequestModal
            npcName={encounterRequest.npcName}
            npcRole={encounterRequest.npcRole}
            requestText={encounterRequest.requestText}
            accentColor={getNPCColor(encounterRequest.npcId)}
            onAccept={handleAcceptEncounterRequest}
            onDecline={handleDeclineEncounterRequest}
          />
        )}

        {encounterPhase === 'debrief' && encounterResult && (
          encounterResult.kind === 'triage' ? (
            // Phase 17: Breach Triage debrief — accuracy bar + AVG RESPONSE + takeaways
            <TriageDebrief
              encounterId={encounterResult.encounterId}
              correctCount={encounterResult.correctCount ?? 0}
              totalCount={encounterResult.totalCount ?? 0}
              scoreContribution={encounterResult.scoreContribution}
              avgResponseMs={encounterResult.avgResponseMs ?? 0}
              takeaways={encounterResult.takeaways as [string, string] ?? ['', '']}
              locationLabel={SORTER_LOCATION_LABELS[encounterResult.encounterId]}
              points={encounterResult.points}
              bestStreak={encounterResult.bestStreak}
              isNewRecord={encounterResult.isNewRecord}
              ruleOutcomes={encounterResult.ruleOutcomes}
              onDismiss={handleDismissDebrief}
            />
          ) : encounterResult.takeaways && encounterResult.takeaways.length > 0 ? (
            // Phase 16: PHI Sorter debrief — sorter-themed, no TD content
            <SorterDebrief
              encounterId={encounterResult.encounterId}
              correctCount={encounterResult.correctCount ?? 0}
              totalCount={encounterResult.totalCount ?? 0}
              scoreContribution={encounterResult.scoreContribution}
              takeaways={encounterResult.takeaways}
              locationLabel={SORTER_LOCATION_LABELS[encounterResult.encounterId]}
              onDismiss={handleDismissDebrief}
            />
          ) : (
            // Phase 13: TD encounter debrief — original debrief
            <EncounterDebrief
              encounterId={encounterResult.encounterId}
              outcome={encounterResult.outcome}
              securityScore={encounterResult.securityScore}
              scoreContribution={encounterResult.scoreContribution}
              onDismiss={handleDismissDebrief}
            />
          )
        )}

        {/* Floating score delta indicator */}
        {scoreDelta && (
          <div
            key={scoreDelta.key}
            className="pointer-events-none absolute"
            style={{
              top: '8px',
              left: '50%',
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '14px',
              fontWeight: 'bold',
              color: scoreDelta.value > 0 ? '#44ff44' : '#ff4444',
              textShadow:
                scoreDelta.value > 0
                  ? '0 0 8px rgba(68, 255, 68, 0.7), 0 0 20px rgba(68, 255, 68, 0.4), 0 0 40px rgba(68, 255, 68, 0.15)'
                  : '0 0 8px rgba(255, 68, 68, 0.7), 0 0 20px rgba(255, 68, 68, 0.4), 0 0 40px rgba(255, 68, 68, 0.15)',
              background:
                scoreDelta.value > 0
                  ? 'radial-gradient(ellipse at center, rgba(68, 255, 68, 0.12) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at center, rgba(255, 68, 68, 0.12) 0%, transparent 70%)',
              padding: '4px 12px',
              borderRadius: '4px',
              animation: 'score-float-up 0.9s ease-out forwards',
              transform: `translateX(-50%) ${scoreDelta.value > 0 ? 'scale(1.2)' : 'scale(1.1)'}`,
              zIndex: 30,
            }}
          >
            {scoreDelta.value > 0 ? `+${scoreDelta.value}` : scoreDelta.value}
          </div>
        )}

        {/* Dialogue overlay */}
        {pageMode === 'dialogue' && currentSceneId && dialogueScenes.length > 0 && (
          <div data-testid="dialogue-overlay" className="contents">
            <GameContainer
              scenes={dialogueScenes}
              onComplete={handleDialogueComplete}
              onGameOver={handleGameOver}
              npcId={currentNPCId || undefined}
              npcName={npc?.name}
              initialPrivacyScore={gameState.state.privacyScore}
              onPrivacyScoreChange={handlePrivacyScoreChange}
            />
          </div>
        )}

        {/* Educational item modal */}
        {selectedItem && (
          <EducationalItemModal
            title={selectedItem.title}
            fact={selectedItem.fact}
            type={selectedItem.type}
            onClose={() => {
              setSelectedItem(null);
              eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
            }}
          />
        )}

        {/* Room intro title card */}
        {showRoomIntro && currentRoom && (
          <RoomIntroOverlay
            roomName={currentRoom.name}
            subtitle={currentRoom.subtitle}
            introText={currentRoom.config?.introText}
            onDismiss={() => {
              setShowRoomIntro(false);
              eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.2, rate: 0.9 });
            }}
          />
        )}

        {/* Patient story reveal — overlay, NOT a page swap (F-26, Run 07) */}
        {showStoryModal && currentStoryRoom?.patientStory && (
          <PatientStoryReveal
            story={currentStoryRoom.patientStory}
            roomName={currentStoryRoom.name}
            onClose={handleCloseStoryModal}
          />
        )}

        {/* Room cleared banner */}
        {roomClearedBanner && (
          <GameBanner
            text="Room Cleared!"
            subtext={roomClearedBanner.roomName}
            onComplete={handleRoomClearedComplete}
            color="blue"
          />
        )}

        {/* Observation gate hint */}
        {activeObservationGate && (
          <ObservationHint
            gate={activeObservationGate}
            onAcknowledge={() => {
              eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.2, rate: 0.9 });
              resolveGate(activeObservationGate.id, activeObservationGate.targetId);
              setActiveObservationGate(null);
              eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
            }}
          />
        )}

        {/* Choice gate prompt */}
        {activeChoiceGate && (
          <ChoicePrompt
            gate={activeChoiceGate}
            onChoice={unlockedId => {
              eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.35, rate: 1.15 });
              resolveGate(activeChoiceGate.id, unlockedId);
              setActiveChoiceGate(null);
              eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
            }}
          />
        )}

        {/* Intro modal.
            F-16 fix (Run 07): the demo flag is set at character-confirm, AFTER
            this component's useState initializer ran — so demo sessions showed
            the full-game onboarding despite the Phase 18 decision. Re-check at
            render time.
            F-11 fix (Run 07): the door instructions said "Walk to a door" but
            standing at a door does nothing — SPACE is required. A first-timer's
            literal first navigation attempt failed silently. */}
        {showIntroModal && !isDemoActive() && (
          <TutorialModal
            title="Welcome to HIPAA General"
            description={
              "You're a new employee at HIPAA General Hospital. Explore rooms, talk to staff, and learn how patient privacy really works.\n\nWASD or Arrow Keys \u2014 Move\nHold SHIFT \u2014 Run\nSPACE \u2014 Talk to people and interact\nSPACE at a door \u2014 Go to the next area"
            }
            onAcknowledge={handleDismissIntroModal}
            type="info"
            ctaText="Start exploring →"
          />
        )}
      </div>

      {/* Control hints + mute */}
      <div className="flex items-center gap-2">
        <p
          className="text-[8px] text-gray-500"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          WASD / Arrows to move &bull; <span className="text-gray-300">SHIFT to run</span> &bull; SPACE to interact &bull; SPACE at a door to travel
        </p>
        <button
          onClick={handleShowHelpModal}
          className="text-[8px] text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 px-2 py-1 transition-colors"
          style={{ fontFamily: '"Press Start 2P"' }}
          title="Show controls"
        >
          ?
        </button>
        <button
          onClick={() => setMuted(m => !m)}
          className="text-[10px] text-gray-300 hover:text-white transition-colors"
          title={muted ? 'Unmute' : 'Mute'}
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {muted ? '\u{1F507}' : '\u{1F50A}'}
        </button>
        <MusicVolumeSlider />
      </div>

      <ValidationOverlay gameRef={gameRef} />
    </div>
  );
}

// StandaloneTDResultOverlay moved to components/breach-defense/StandaloneTDView.tsx
// (Refactor Round 2).
