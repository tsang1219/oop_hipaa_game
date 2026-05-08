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
import { SorterTakeawaysPanel } from '@/components/phi-sorter/SorterTakeawaysPanel';
import { getSorterDocumentSet } from '@/data/sorterData';

interface RoomWithDoors {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  unlockRequirement?: string | null;
  alwaysUnlocked?: boolean;
  patientStory?: { title: string; text: string; icon: string };
  completionRequirements?: { requiredNpcs: string[]; requiredZones: string[]; requiredItems: string[] };
  width: number;
  height: number;
  backgroundImage: string;
  obstacles: any[];
  npcs: any[];
  interactionZones: any[];
  educationalItems: any[];
  spawnPoint: { x: number; y: number };
  config?: any;
  doors?: Array<{
    id: string;
    targetRoomId: string;
    x: number;
    y: number;
    side: string;
    label: string;
  }>;
}

type PageMode =
  | 'start-menu'
  | 'title'
  | 'exploration'
  | 'dialogue'
  | 'gameover'
  | 'win'
  | 'tower-defense-standalone'
  | 'demo-complete'; // Phase 21 — sponsor demo capstone (cert + sponsor handoff)

// Phase 19 — standalone TD round result. Distinct from EncounterResult (which carries
// scoreContribution / outcome semantics tied to the unified compliance score).
// Standalone mode is score-isolated by design (TD-02 / TD-03).
type TDStandaloneResult =
  | { outcome: 'victory'; securityScore: number; wavesCompleted: number; towersPlaced: number }
  | { outcome: 'defeat'; wavesCompleted: number; towersPlaced: number };

const rooms = roomDataJson.rooms as RoomWithDoors[];
const scenes = (gameDataJson as any).scenes as Scene[];

// Run migration before React renders
const ROOM_IDS = rooms.map(r => r.id);
migrateV1toV2(ROOM_IDS);

function computeDoorStates(
  room: RoomWithDoors,
  completedRooms: string[],
): Record<string, 'locked' | 'available' | 'completed'> {
  const states: Record<string, 'locked' | 'available' | 'completed'> = {};
  if (!room.doors) return states;
  for (const door of room.doors) {
    const target = door.targetRoomId;
    if (!isDepartmentAccessible(target, completedRooms)) {
      states[door.id] = 'locked';
    } else if (completedRooms.includes(target)) {
      states[door.id] = 'completed';
    } else {
      states[door.id] = 'available';
    }
  }
  return states;
}

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

  // ── Local UI state (not persisted) ────────────────────────────
  const [pageMode, setPageMode] = useState<PageMode>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('qa-room') || params.has('qa-skip-onboarding') || params.has('qa-no-save')) {
      return 'exploration';
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

  // ── Standalone Tower Defense state (Phase 19 — TD-01..03) ─────
  // Result is null while the round is in progress, populated when BreachDefenseScene
  // emits BREACH_VICTORY or BREACH_GAME_OVER. The standalone path NEVER updates
  // gameState (no score, no encounter registry, no save write) — this is enforced by
  // the handlers below not calling any gameState mutator.
  const [tdStandaloneResult, setTdStandaloneResult] = useState<TDStandaloneResult | null>(null);
  const [tdWaveBanner, setTdWaveBanner] = useState<{ wave: number; key: number } | null>(null); // DESIGN-009
  const [tdHelperVisible, setTdHelperVisible] = useState(false); // DESIGN-009

  // ── Encounter phase state (Phase 13 + 16) ──────────────────────
  type EncounterPhase = 'idle' | 'narrative-card' | 'encounter' | 'phi-sorter' | 'debrief';
  const [encounterPhase, setEncounterPhase] = useState<EncounterPhase>('idle');
  const [narrativeCardData, setNarrativeCardData] = useState<{
    narrativeText: string;
    config?: BreachDefenseInitData;         // optional — only TD encounters carry it
    encounterId: string;
    type: 'td' | 'phi-sorter';             // discriminator (Phase 16)
    sorterConfig?: { documentSetId: string }; // present when type === 'phi-sorter'
  } | null>(null);
  const [encounterResult, setEncounterResult] = useState<{
    encounterId: string;
    outcome: 'victory' | 'defeat';
    securityScore: number;
    scoreContribution: number;
    takeaways?: string[];  // populated by handleSorterComplete (BLOCKER 4 — sibling SorterTakeawaysPanel reads this)
  } | null>(null);
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

  // ── Consolidated persistence ──────────────────────────────────
  useEffect(() => {
    if (qaNoSaveRef.current) return;
    // Phase 18 (DEMO-06): skip the writeSave call entirely when a demo session
    // is active. Combined with the same guard in useGameState's persistence
    // effect, this guarantees pq:save:v2 is byte-identical before and after a
    // demo session.
    if (isDemoActive()) return;
    const currentMusicVolume = parseFloat(localStorage.getItem('music_volume') ?? '0.6');
    writeSave({
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
      const timer = setTimeout(() => {
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
      }, 2000);
      return () => clearTimeout(timer);
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

      if (showIntroModal) {
        eventBridge.emit(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION);
      }
    };

    const handleSceneReady = (sceneKey: string) => {
      if (sceneKey === 'Boot') startExploration();
      if (sceneKey === 'BreachDefense') {
        // BreachDefense scene is ready — tell it to start the game
        eventBridge.emit(BRIDGE_EVENTS.REACT_START_BREACH);
      }
    };
    eventBridge.on(BRIDGE_EVENTS.SCENE_READY, handleSceneReady);

    // If Boot already fired before this effect registered (race condition),
    // poll briefly for the game ref to become available
    const bootPoll = setInterval(() => {
      if (gameRef.current && !sceneStartedRef.current) {
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
  ]);

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
      const { targetRoomId, fromDoorId } = payload;

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
      if (game.scene.isActive('Exploration')) game.scene.stop('Exploration');
      if (game.scene.isActive('BreachDefense')) game.scene.stop('BreachDefense');
      game.scene.start('BreachDefense');
    };
    if (gameRef.current) {
      launch();
      return () => { cancelled = true; };
    }
    // gameRef populates after PhaserGame mounts in the JSX branch — poll briefly.
    const poll = setInterval(() => {
      if (gameRef.current) {
        clearInterval(poll);
        launch();
      }
    }, 50);
    const timeout = setTimeout(() => clearInterval(poll), 5000);
    return () => { cancelled = true; clearInterval(poll); clearTimeout(timeout); };
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
    // BreachDefenseScene's standalone (encounterId===null) branch PAUSES the wave
    // loop on waves 3/5/7/9 and waits for REACT_DISMISS_TUTORIAL — the legacy
    // BreachDefensePage used to surface a TutorialModal here. Since standalone TD
    // is now a self-contained sponsor-pitch mini-game (no educational lessons), we
    // immediately re-emit DISMISS_TUTORIAL on wave-complete so the loop never stalls.
    const onWaveComplete = (data?: { wave?: number }) => {
      eventBridge.emit(BRIDGE_EVENTS.REACT_DISMISS_TUTORIAL);
      if (data?.wave) { // DESIGN-009: wave-cleared banner + soft fanfare
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
      // Feed encounter score into unified compliance score
      if (data.scoreContribution > 0) {
        gameState.addScore(data.scoreContribution);
      }
      // Record encounter result in game state
      gameState.recordEncounterResult(data.encounterId, {
        completed: true,
        score: data.securityScore,
        outcome: data.outcome,
      });
    };

    eventBridge.on(BRIDGE_EVENTS.ENCOUNTER_TRIGGERED, onEncounterTriggered);
    eventBridge.on(BRIDGE_EVENTS.ENCOUNTER_COMPLETE, onEncounterComplete);

    return () => {
      eventBridge.off(BRIDGE_EVENTS.ENCOUNTER_TRIGGERED, onEncounterTriggered);
      eventBridge.off(BRIDGE_EVENTS.ENCOUNTER_COMPLETE, onEncounterComplete);
    };
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
    setEncounterPhase('idle');
    setEncounterResult(null);
    setNarrativeCardData(null);
    eventBridge.emit(
      BRIDGE_EVENTS.REACT_RETURN_FROM_ENCOUNTER,
      encounterId ? { encounterId } : undefined,
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
  }, [narrativeCardData, gameState]);

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

        // Win condition
        if (
          currentSceneId === 'final_boss_1' &&
          gameState.state.completedNPCs.length + 1 >= totalScenarios + 1
        ) {
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
    [currentNPCId, currentSceneId, gameState, totalScenarios, currentRoom, notify],
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
    sessionStorage.setItem('pq:skip-title', '1');
    window.location.reload();
  }, []);

  const handleResume = useCallback(() => {
    setPageMode('exploration');
  }, []);

  // ── Start menu (Phase 18) ──────────────────────────────────────
  // FULL GAME: replicate the original cold-boot path — go to TitleScreen if a
  // save exists (Resume / New Game prompt), otherwise straight into exploration.
  const handleSelectFullGame = useCallback(() => {
    setPageMode(hasSaveData() ? 'title' : 'exploration');
  }, []);

  // DEMO: start a fresh demo session (in-memory, isolated from full-game save)
  // and route to exploration. Plan 18-04 wires the runtime gating that uses
  // isDemoActive() to bypass UNLOCK_ORDER and skip writeSave calls.
  const handleSelectDemo = useCallback(() => {
    startDemo();
    setPageMode('exploration');
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

  // ── Standalone Tower Defense (Phase 19 — TD-01..03) ───────────
  // Mounts the Phaser canvas + EncounterGameUI HUD with no exploration overlays,
  // no narrative card, no ITS-Office encounter context. Win/lose surfaces a minimal
  // result overlay with PLAY AGAIN (in-place restart) and BACK TO MENU (full reload).
  // The reload pattern guarantees the StartMenu reappears with localStorage
  // untouched (TD-03 — no writeSave call ever fires from this code path).
  if (pageMode === 'tower-defense-standalone') {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-4">
        <div className="relative border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <PhaserGame ref={gameRef} width={960} height={720} />

          {/* CRT scanline overlay (matches the rest of the app) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)',
              mixBlendMode: 'multiply',
            }}
          />

          {/* In-game HUD: tower panel + score/budget/wave readouts. Standalone
              mode surfaces all 6 tower types from the start (the scene's
              wave-based unlocking still gates *placement* via the budget +
              unlockWave logic, but for the sponsor-pitch arcade flow we let the
              player see the full toolkit on the panel from frame one). */}
          {!tdStandaloneResult && (
            <EncounterGameUI
              availableTowerIds={['MFA', 'PATCH', 'FIREWALL', 'ENCRYPTION', 'TRAINING', 'ACCESS']}
            />
          )}

          {/* DESIGN-009: helper hint + wave-cleared banner */}
          {!tdStandaloneResult && tdHelperVisible && (
            <div onClick={() => setTdHelperVisible(false)}
              className="absolute top-6 left-1/2 -translate-x-1/2 z-40 cursor-pointer px-4 py-2 bg-black/80 border-2 border-[#FFD700] text-[8px] text-[#FFD700]"
              style={{ fontFamily: '"Press Start 2P", monospace', animation: 'td-hint-fade 600ms ease-out forwards' }}>
              PLACE TOWERS &bull; DEFEND THE NETWORK
            </div>
          )}
          {!tdStandaloneResult && tdWaveBanner && (
            <div key={tdWaveBanner.key} className="absolute inset-x-0 top-1/3 z-40 pointer-events-none flex justify-center"
              style={{ animation: 'td-banner-pop 1.6s ease-out forwards' }}>
              <div className="px-6 py-3 bg-black/85 border-4 border-[#FFD700] text-[14px] text-[#FFD700]"
                style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '0 0 12px rgba(255,215,0,0.8)' }}>
                WAVE {tdWaveBanner.wave} CLEARED
              </div>
            </div>
          )}

          {/* Win / lose overlay — minimal, no compliance-score wiring. */}
          {tdStandaloneResult && (
            <StandaloneTDResultOverlay
              result={tdStandaloneResult}
              onPlayAgain={handleTdPlayAgain}
              onBackToMenu={handleTdBackToMenu}
            />
          )}

          {/* DESIGN-009 inline keyframes (index.css is DO-NOT-TOUCH) */}
          <style>{`@keyframes td-hint-fade{0%{opacity:0;transform:translate(-50%,-8px)}100%{opacity:1;transform:translate(-50%,0)}}@keyframes td-banner-pop{0%{opacity:0;transform:scale(0.7)}18%{opacity:1;transform:scale(1.08)}32%{transform:scale(1)}78%{opacity:1}100%{opacity:0;transform:scale(1)}}@keyframes td-result-in{0%{opacity:0;transform:scale(0.85)}70%{opacity:1;transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}@keyframes td-result-glow-win{0%,100%{box-shadow:12px 12px 0 0 #000,0 0 24px rgba(46,204,113,0.45)}50%{box-shadow:12px 12px 0 0 #000,0 0 40px rgba(46,204,113,0.85)}}@keyframes td-result-glow-lose{0%,100%{box-shadow:12px 12px 0 0 #000,0 0 24px rgba(239,68,68,0.4)}50%{box-shadow:12px 12px 0 0 #000,0 0 36px rgba(239,68,68,0.75)}}`}</style>
        </div>
        <p
          className="text-[8px] text-gray-500"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          TOWER DEFENSE &bull; STANDALONE MODE &bull; ESC TO RETURN TO MENU
        </p>
      </div>
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
        totalScenarios={totalScenarios + 1}
        timeElapsed={formatElapsedTime()}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  // ── Story reveal modal ────────────────────────────────────────
  if (showStoryModal && currentStoryRoom?.patientStory) {
    return (
      <PatientStoryReveal
        story={currentStoryRoom.patientStory}
        roomName={currentStoryRoom.name}
        onClose={handleCloseStoryModal}
      />
    );
  }

  // ── Main game view (Phaser canvas + React overlays) ───────────
  const dialogueScenes = currentSceneId ? scenes.filter(s => s.id === currentSceneId) : [];
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
          />
        )}

        {encounterPhase === 'phi-sorter' && narrativeCardData?.sorterConfig && (
          <PHISorterOverlay
            documentSetId={narrativeCardData.sorterConfig.documentSetId}
            encounterId={narrativeCardData.encounterId}
            onComplete={handleSorterComplete}
            onAbort={handleSorterAbort}
          />
        )}

        {encounterPhase === 'debrief' && encounterResult && (
          <>
            <EncounterDebrief
              encounterId={encounterResult.encounterId}
              outcome={encounterResult.outcome}
              securityScore={encounterResult.securityScore}
              scoreContribution={encounterResult.scoreContribution}
              onDismiss={handleDismissDebrief}
            />
            {encounterResult.takeaways && encounterResult.takeaways.length > 0 && (
              <SorterTakeawaysPanel takeaways={encounterResult.takeaways} />
            )}
          </>
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

        {/* Intro modal */}
        {showIntroModal && (
          <TutorialModal
            title="Welcome to HIPAA General"
            description={
              "You're a new employee at HIPAA General Hospital. Explore rooms, talk to staff, and learn how patient privacy really works.\n\nWASD or Arrow Keys \u2014 Move\nSPACE \u2014 Talk to people and interact\nWalk to a door \u2014 Go to the next area"
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
          WASD or Arrow Keys to move &bull; SPACE to interact &bull; Walk to doors to navigate
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

// ── Standalone TD result overlay (Phase 19) ────────────────────────
// Minimal end-of-round screen for the standalone Tower Defense path. Distinct from
// EncounterDebrief because that component carries score-contribution + "return to
// hospital" semantics; standalone TD is score-isolated by design (TD-02). Two
// buttons only: PLAY AGAIN (in-place restart) and BACK TO MENU (full reload to
// the cold-boot StartMenu). No score, no compliance bar, no encounter takeaways.
interface StandaloneTDResultOverlayProps {
  result: TDStandaloneResult;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

function StandaloneTDResultOverlay({
  result,
  onPlayAgain,
  onBackToMenu,
}: StandaloneTDResultOverlayProps): JSX.Element {
  const isWin = result.outcome === 'victory';
  const targetScore = isWin ? result.securityScore : 0; // DESIGN-009: count-up
  const [shownScore, setShownScore] = useState(0);
  useEffect(() => {
    if (!isWin) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setShownScore(Math.round((1 - Math.pow(1 - t, 3)) * targetScore));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isWin, targetScore]);
  return (
    <div
      className="absolute inset-0 bg-black/85 flex items-center justify-center z-50"
      data-testid="td-standalone-result"
    >
      <div
        className={`text-center border-4 ${isWin ? 'border-[#2ECC71]' : 'border-red-500'} bg-[#1a1a2e] p-8 max-w-md`}
        style={{ fontFamily: '"Press Start 2P", monospace', animation: `td-result-in 460ms cubic-bezier(0.34,1.56,0.64,1) forwards, ${isWin ? 'td-result-glow-win' : 'td-result-glow-lose'} 2.4s ease-in-out infinite` }}
      >
        <h1
          className={`text-xl font-bold mb-3 ${
            isWin ? 'text-[#2ECC71]' : 'text-red-400'
          }`}
        >
          {isWin ? 'NETWORK SECURED' : 'NETWORK BREACHED'}
        </h1>
        <p className="text-[8px] text-gray-400 mb-4 leading-relaxed">
          {isWin
            ? 'You held the line through every wave. The patient data is safe today.'
            : 'The attackers got through. Try again — every restart is more practice.'}
        </p>
        <div className="bg-[#2a2a3e] border-2 border-gray-600 p-3 rounded mb-6">
          {result.outcome === 'victory' && (
            <p className="text-[8px] text-gray-300">
              Security:{' '}
              <span className="text-green-400">{shownScore}%</span>
            </p>
          )}
          <p className="text-[8px] text-gray-300">
            Waves Cleared:{' '}
            <span className="text-yellow-400">{result.wavesCompleted}</span>
          </p>
          <p className="text-[8px] text-gray-300">
            Towers Placed:{' '}
            <span className="text-blue-400">{result.towersPlaced}</span>
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onPlayAgain}
            data-testid="td-standalone-play-again"
            className={`${
              isWin
                ? 'bg-[#2ECC71] hover:bg-[#27AE60] text-black'
                : 'bg-[#FF6B9D] hover:bg-[#FF5A8A] text-white'
            } font-bold px-6 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer text-[10px]`}
          >
            PLAY AGAIN
          </button>
          <button
            onClick={onBackToMenu}
            data-testid="td-standalone-back-to-menu"
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold px-6 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer text-[10px]"
          >
            BACK TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}
