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
import { TutorialModal } from '../components/breach-defense/TutorialModal';
import { MusicVolumeSlider } from '../components/MusicVolumeSlider';
import { useNotification } from '../components/NotificationToast';
import { GameBanner } from '../components/GameBanner';
import { useToast } from '@/hooks/use-toast';
import { ValidationOverlay } from '../dev/ValidationOverlay';
import type { Scene, Gate } from '@shared/schema';
import gameDataJson from '@/data/gameData.json';
import roomDataJson from '@/data/roomData.json';
import { migrateV1toV2, loadSave, writeSave } from '@/lib/saveData';
import { NarrativeContextCard } from '../components/breach-defense/NarrativeContextCard';
import { EncounterDebrief } from '../components/breach-defense/EncounterDebrief';
import { EncounterHud } from '../components/EncounterHud';
import type { BreachDefenseInitData } from '../phaser/scenes/BreachDefenseScene';

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

type PageMode = 'exploration' | 'dialogue' | 'gameover' | 'win';

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
  const [pageMode, setPageMode] = useState<PageMode>('exploration');
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

  // ── Encounter phase state (Phase 13) ───────────────────────────
  type EncounterPhase = 'idle' | 'narrative-card' | 'encounter' | 'debrief';
  const [encounterPhase, setEncounterPhase] = useState<EncounterPhase>('idle');
  const [narrativeCardData, setNarrativeCardData] = useState<{
    narrativeText: string;
    config: BreachDefenseInitData;
    encounterId: string;
  } | null>(null);
  const [encounterResult, setEncounterResult] = useState<{
    encounterId: string;
    outcome: 'victory' | 'defeat';
    securityScore: number;
    scoreContribution: number;
  } | null>(null);
  const [encounterHudData, setEncounterHudData] = useState({
    wave: 1, totalWaves: 4, budget: 150, securityScore: 100, gameState: 'WAITING', waveName: undefined as string | undefined,
  });

  // Gate state per room
  const [resolvedGates, setResolvedGates] = useState<Set<string>>(new Set());
  const [unlockedNpcs, setUnlockedNpcs] = useState<Set<string>>(new Set());

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
      const resumeRoomId = gameState.state.currentRoomId ?? 'hospital_entrance';
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

  // ── Encounter lifecycle listeners (Phase 13) ────────────────────
  useEffect(() => {
    const onEncounterTriggered = (data: {
      encounterId: string;
      narrativeText: string;
      config: BreachDefenseInitData;
    }) => {
      setNarrativeCardData(data);
      setEncounterPhase('narrative-card');
    };

    const onBreachStateUpdate = (data: {
      securityScore: number;
      budget: number;
      wave: number;
      gameState: string;
    }) => {
      setEncounterHudData(prev => ({ ...prev, ...data }));
    };

    const onBreachWaveStart = (data: { wave: number; name: string }) => {
      setEncounterHudData(prev => ({ ...prev, waveName: data.name }));
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
    eventBridge.on(BRIDGE_EVENTS.BREACH_STATE_UPDATE, onBreachStateUpdate);
    eventBridge.on(BRIDGE_EVENTS.BREACH_WAVE_START, onBreachWaveStart);
    eventBridge.on(BRIDGE_EVENTS.ENCOUNTER_COMPLETE, onEncounterComplete);

    return () => {
      eventBridge.off(BRIDGE_EVENTS.ENCOUNTER_TRIGGERED, onEncounterTriggered);
      eventBridge.off(BRIDGE_EVENTS.BREACH_STATE_UPDATE, onBreachStateUpdate);
      eventBridge.off(BRIDGE_EVENTS.BREACH_WAVE_START, onBreachWaveStart);
      eventBridge.off(BRIDGE_EVENTS.ENCOUNTER_COMPLETE, onEncounterComplete);
    };
  }, []);

  const handleConfirmNarrativeCard = useCallback(() => {
    if (!narrativeCardData) return;
    setEncounterPhase('encounter');
    eventBridge.emit(BRIDGE_EVENTS.REACT_LAUNCH_ENCOUNTER, { config: narrativeCardData.config });
  }, [narrativeCardData]);

  const handleDismissDebrief = useCallback(() => {
    setEncounterPhase('idle');
    setEncounterResult(null);
    setNarrativeCardData(null);
    eventBridge.emit(BRIDGE_EVENTS.REACT_RETURN_FROM_ENCOUNTER);
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
    eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
  }, []);

  const handleShowHelpModal = useCallback(() => {
    setShowIntroModal(true);
    eventBridge.emit(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION);
  }, []);

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
  };

  const formatElapsedTime = (): string => {
    const elapsed = Date.now() - gameState.state.gameStartTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

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
          <NarrativeContextCard
            narrativeText={narrativeCardData.narrativeText}
            onConfirm={handleConfirmNarrativeCard}
          />
        )}

        {encounterPhase === 'encounter' && (
          <EncounterHud
            wave={encounterHudData.wave}
            totalWaves={encounterHudData.totalWaves}
            budget={encounterHudData.budget}
            securityScore={encounterHudData.securityScore}
            gameState={encounterHudData.gameState}
            waveName={encounterHudData.waveName}
          />
        )}

        {encounterPhase === 'debrief' && encounterResult && (
          <EncounterDebrief
            encounterId={encounterResult.encounterId}
            outcome={encounterResult.outcome}
            securityScore={encounterResult.securityScore}
            scoreContribution={encounterResult.scoreContribution}
            onDismiss={handleDismissDebrief}
          />
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
