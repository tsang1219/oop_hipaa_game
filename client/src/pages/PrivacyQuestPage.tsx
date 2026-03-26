import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { PhaserGame } from '../phaser/PhaserGame';
import { eventBridge, BRIDGE_EVENTS } from '../phaser/EventBridge';
import GameContainer from '@/components/GameContainer';
import EducationalItemModal from '@/components/EducationalItemModal';
import ObservationHint from '@/components/ObservationHint';
import ChoicePrompt from '@/components/ChoicePrompt';
import { PatientStoryReveal } from '@/components/PatientStoryReveal';
import EndScreen from '@/components/EndScreen';
import HallwayHub from '@/components/HallwayHub';
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

type PageMode = 'hub' | 'exploration' | 'dialogue' | 'gameover' | 'win';

interface RoomWithStory {
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
}

const rooms = roomDataJson.rooms as RoomWithStory[];
const scenes = (gameDataJson as any).scenes as Scene[];

export default function PrivacyQuestPage() {
  const { toast } = useToast();
  const { notify } = useNotification();
  const [, navigate] = useLocation();
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneStartedForRoom = useRef<string | null>(null);

  // ── State ────────────────────────────────────────────────────
  const [pageMode, setPageMode] = useState<PageMode>('hub');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [currentNPCId, setCurrentNPCId] = useState<string | null>(null);

  const [completedRooms, setCompletedRooms] = useState<string[]>(() => {
    const s = localStorage.getItem('completedRooms');
    return s ? JSON.parse(s) : [];
  });
  const [collectedStories, setCollectedStories] = useState<string[]>(() => {
    const s = localStorage.getItem('collectedStories');
    return s ? JSON.parse(s) : [];
  });
  const [completedNPCs, setCompletedNPCs] = useState<Set<string>>(() => {
    const s = localStorage.getItem('completedNPCs');
    return s ? new Set(JSON.parse(s)) : new Set();
  });
  const [completedZones, setCompletedZones] = useState<Set<string>>(() => {
    const s = localStorage.getItem('completedZones');
    return s ? new Set(JSON.parse(s)) : new Set();
  });
  const [collectedItems, setCollectedItems] = useState<Set<string>>(() => {
    const s = localStorage.getItem('collectedEducationalItems');
    return s ? new Set(JSON.parse(s)) : new Set();
  });
  const [privacyScore, setPrivacyScore] = useState(() => {
    const s = localStorage.getItem('current-privacy-score');
    return s ? parseInt(s) : 100;
  });
  const [finalPrivacyScore, setFinalPrivacyScore] = useState(100);
  const [gameStartTime] = useState(() => {
    const s = localStorage.getItem('gameStartTime');
    return s ? parseInt(s) : Date.now();
  });

  // Modal state
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [currentStoryRoom, setCurrentStoryRoom] = useState<RoomWithStory | null>(null);
  const [isNewStory, setIsNewStory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ title: string; fact: string; type: 'poster' | 'manual' | 'computer' | 'whiteboard' } | null>(null);
  const [activeObservationGate, setActiveObservationGate] = useState<Gate | null>(null);
  const [activeChoiceGate, setActiveChoiceGate] = useState<Gate | null>(null);

  // Room cleared banner
  const [roomClearedBanner, setRoomClearedBanner] = useState<{ roomName: string } | null>(null);

  // Gate state per room
  const [resolvedGates, setResolvedGates] = useState<Set<string>>(() => {
    if (!currentRoomId) return new Set();
    const s = localStorage.getItem(`resolvedGates_${currentRoomId}`);
    return s ? new Set(JSON.parse(s)) : new Set();
  });
  const [unlockedNpcs, setUnlockedNpcs] = useState<Set<string>>(() => {
    if (!currentRoomId) return new Set();
    const s = localStorage.getItem(`unlockedNpcs_${currentRoomId}`);
    return s ? new Set(JSON.parse(s)) : new Set();
  });

  // Score milestone celebrations
  const shownMilestones = useRef<Set<number>>(new Set());

  // Score delta floating indicator
  const prevPrivacyScoreRef = useRef(privacyScore);
  const [scoreDelta, setScoreDelta] = useState<{ value: number; key: number } | null>(null);
  const scoreDeltaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Intro modal — shown once (gated by localStorage flag), skipped in QA mode
  const [showIntroModal, setShowIntroModal] = useState(() => {
    if (new URLSearchParams(window.location.search).has('qa-room')) return false;
    return !localStorage.getItem('pq:onboarding:seen');
  });

  // Mute toggle
  const [muted, setMuted] = useState(() =>
    localStorage.getItem('sfx_muted') === 'true'
  );
  const totalScenarios = rooms.reduce((sum, r) => sum + r.npcs.filter((n: any) => !n.isFinalBoss).length, 0);
  const currentRoom = rooms.find(r => r.id === currentRoomId) || null;

  // ── Persistence ──────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('gameStartTime', gameStartTime.toString()); }, [gameStartTime]);
  useEffect(() => { localStorage.setItem('completedRooms', JSON.stringify(completedRooms)); }, [completedRooms]);
  useEffect(() => { localStorage.setItem('collectedStories', JSON.stringify(collectedStories)); }, [collectedStories]);
  useEffect(() => { localStorage.setItem('completedNPCs', JSON.stringify(Array.from(completedNPCs))); }, [completedNPCs]);
  useEffect(() => { localStorage.setItem('completedZones', JSON.stringify(Array.from(completedZones))); }, [completedZones]);
  useEffect(() => { localStorage.setItem('collectedEducationalItems', JSON.stringify(Array.from(collectedItems))); }, [collectedItems]);
  useEffect(() => { localStorage.setItem('current-privacy-score', privacyScore.toString()); }, [privacyScore]);

  // ── Score delta floating indicator ──────────────────────────
  useEffect(() => {
    if (privacyScore !== prevPrivacyScoreRef.current) {
      const delta = privacyScore - prevPrivacyScoreRef.current;
      prevPrivacyScoreRef.current = privacyScore;
      setScoreDelta({ value: delta, key: Date.now() });

      if (scoreDeltaTimer.current) clearTimeout(scoreDeltaTimer.current);
      scoreDeltaTimer.current = setTimeout(() => {
        setScoreDelta(null);
      }, 900);
    }
  }, [privacyScore]);

  // ── Score milestone celebrations ────────────────────────────
  useEffect(() => {
    if (totalScenarios === 0) return;
    const pct = Math.floor((completedNPCs.size / totalScenarios) * 100);
    const milestones = [25, 50, 75, 100];
    for (const m of milestones) {
      if (pct >= m && !shownMilestones.current.has(m)) {
        shownMilestones.current.add(m);
        const labels: Record<number, string> = {
          25: 'QUARTER WAY THERE!',
          50: 'HALFWAY HERO!',
          75: 'ALMOST THERE!',
          100: 'HIPAA CHAMPION!'
        };
        notify(labels[m] || `${m}% Complete`, {
          label: `${m}% PROGRESS`,
          type: m === 100 ? 'success' : 'info'
        });
        // Camera flash via Phaser
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.7 });
      }
    }
  }, [completedNPCs, totalScenarios, notify]);

  // ── Load gate state when room changes ────────────────────────
  useEffect(() => {
    if (!currentRoomId) return;
    const sg = localStorage.getItem(`resolvedGates_${currentRoomId}`);
    setResolvedGates(sg ? new Set(JSON.parse(sg)) : new Set());
    const sn = localStorage.getItem(`unlockedNpcs_${currentRoomId}`);
    setUnlockedNpcs(sn ? new Set(JSON.parse(sn)) : new Set());

    // Check for choice gates in the new room
    const room = rooms.find(r => r.id === currentRoomId);
    const gates: Gate[] = room?.config?.gates || [];
    const resolved = sg ? new Set(JSON.parse(sg)) : new Set();
    const choiceGate = gates.find(g => g.type === 'choice' && !resolved.has(g.id));
    if (choiceGate) setActiveChoiceGate(choiceGate);
  }, [currentRoomId]);

  // Mute toggle — apply to Phaser + persist
  useEffect(() => {
    if (gameRef.current?.sound) {
      gameRef.current.sound.setMute(muted);
    }
    localStorage.setItem('sfx_muted', String(muted));
  }, [muted]);

  // ── Gate helpers ─────────────────────────────────────────────
  const isNpcGated = useCallback((npcId: string): Gate | null => {
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
  }, [currentRoomId, resolvedGates, unlockedNpcs]);

  const resolveGate = useCallback((gateId: string, unlockNpcId?: string) => {
    const newResolved = new Set(resolvedGates);
    newResolved.add(gateId);
    setResolvedGates(newResolved);
    if (currentRoomId) localStorage.setItem(`resolvedGates_${currentRoomId}`, JSON.stringify(Array.from(newResolved)));
    if (unlockNpcId) {
      const newUnlocked = new Set(unlockedNpcs);
      newUnlocked.add(unlockNpcId);
      setUnlockedNpcs(newUnlocked);
      if (currentRoomId) localStorage.setItem(`unlockedNpcs_${currentRoomId}`, JSON.stringify(Array.from(newUnlocked)));
    }
  }, [resolvedGates, unlockedNpcs, currentRoomId]);

  // ── QA auto-navigation via ?qa-room=roomId URL param ────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qaRoom = params.get('qa-room');
    if (qaRoom && rooms.some(r => r.id === qaRoom)) {
      // Wait for Phaser to finish booting and loading all assets before entering room
      const timer = setTimeout(() => {
        setCurrentRoomId(qaRoom);
        setPageMode('exploration');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // ── Room selection from HallwayHub ───────────────────────────
  const handleSelectRoom = useCallback((roomId: string) => {
    setCurrentRoomId(roomId);
    setPageMode('exploration');
  }, []);

  // ── Start Phaser exploration scene when entering a NEW room ──
  useEffect(() => {
    if (pageMode !== 'exploration' || !currentRoomId) {
      // Leaving exploration (hub, gameover, win) — clear the started flag
      // but NOT when entering dialogue (scene stays running behind overlay)
      if (pageMode !== 'dialogue') {
        sceneStartedForRoom.current = null;
      }
      return;
    }
    // Scene already running for this room — don't restart
    if (sceneStartedForRoom.current === currentRoomId) return;
    sceneStartedForRoom.current = currentRoomId;

    const room = rooms.find(r => r.id === currentRoomId);
    if (!room) return;

    // Give Phaser a tick to be ready, then start the scene
    const timer = setTimeout(() => {
      const game = gameRef.current;
      if (!game) return;
      const scene = game.scene.getScene('Exploration');
      if (scene) {
        game.scene.start('Exploration', {
          room,
          completedNPCs: Array.from(completedNPCs),
          completedZones: Array.from(completedZones),
          collectedItems: Array.from(collectedItems),
        });
        if (showIntroModal) {
          eventBridge.emit(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION);
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [pageMode, currentRoomId, showIntroModal]);

  // ── Sync completion state to running Phaser scene ───────────
  useEffect(() => {
    if (!sceneStartedForRoom.current) return;
    const scene = gameRef.current?.scene.getScene('Exploration') as any;
    if (scene?.updateCompletionState) {
      scene.updateCompletionState(
        Array.from(completedNPCs),
        Array.from(completedZones),
        Array.from(collectedItems),
      );
    }
  }, [completedNPCs, completedZones, collectedItems]);

  // ── EventBridge listeners ────────────────────────────────────
  useEffect(() => {
    const onInteractNPC = (data: { npcId: string; npcName: string; sceneId: string; isFinalBoss?: boolean }) => {
      const gate = isNpcGated(data.npcId);
      if (gate) {
        // NPC is gated — resume Phaser without opening dialogue
        eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
        return;
      }
      const sceneExists = scenes.some(s => s.id === data.sceneId);
      if (!sceneExists) {
        toast({ title: 'Scene Not Found', description: `"${data.sceneId}" is not available yet.`, variant: 'destructive' });
        eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
        return;
      }
      setCurrentSceneId(data.sceneId);
      setCurrentNPCId(data.npcId);
      setPageMode('dialogue');
    };

    const onInteractZone = (data: { zoneId: string; zoneName: string; sceneId: string }) => {
      // Check observation gate
      const room = rooms.find(r => r.id === currentRoomId);
      const gates: Gate[] = room?.config?.gates || [];
      for (const gate of gates) {
        if (gate.type === 'observation' && gate.prerequisiteId === data.zoneId && !resolvedGates.has(gate.id)) {
          setActiveObservationGate(gate);
          return; // Don't open dialogue — show hint instead
        }
      }

      // Mark zone complete
      if (!completedZones.has(data.zoneId)) {
        const newZones = new Set(completedZones);
        newZones.add(data.zoneId);
        setCompletedZones(newZones);
      }

      const sceneExists = scenes.some(s => s.id === data.sceneId);
      if (!sceneExists) {
        toast({ title: 'Scene Not Found', description: `"${data.sceneId}" is not available yet.`, variant: 'destructive' });
        eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
        return;
      }
      setCurrentSceneId(data.sceneId);
      setCurrentNPCId(null);
      setPageMode('dialogue');
    };

    const onInteractItem = (data: { itemId: string; title: string; fact: string; type: string }) => {
      setSelectedItem({ title: data.title, fact: data.fact, type: data.type as any });
      if (!collectedItems.has(data.itemId)) {
        const newItems = new Set(collectedItems);
        newItems.add(data.itemId);
        setCollectedItems(newItems);
        notify(data.title, { label: 'HIPAA FACT LEARNED', type: 'discovery' });
      }
    };

    const onExitRoom = () => {
      handleExitRoom();
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
  }, [currentRoomId, resolvedGates, completedZones, collectedItems, isNpcGated]);

  // ── Room completion check ────────────────────────────────────
  const checkRoomCompletion = (room: RoomWithStory): boolean => {
    const reqs = room.completionRequirements;
    if (!reqs) {
      return room.npcs.filter((n: any) => !n.isFinalBoss).every((n: any) => completedNPCs.has(n.id));
    }
    return reqs.requiredNpcs.every(id => completedNPCs.has(id))
      && reqs.requiredZones.every(id => completedZones.has(id))
      && reqs.requiredItems.every(id => collectedItems.has(id));
  };

  const handleExitRoom = useCallback(() => {
    const room = rooms.find(r => r.id === currentRoomId);
    if (room) {
      const isComplete = checkRoomCompletion(room);
      if (isComplete && !completedRooms.includes(currentRoomId!)) {
        setCompletedRooms(prev => [...prev, currentRoomId!]);
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_wave_start', volume: 0.6 });

        // Room completion celebration — notify + camera flash
        notify(`Room Complete: ${room.name}`, { label: 'ALL CLEAR', type: 'success' });
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.7 });

        // Show room cleared banner before story reveal or hub return
        setRoomClearedBanner({ roomName: room.name });
        return;
      }
    }
    setCurrentRoomId(null);
    setPageMode('hub');
  }, [currentRoomId, completedRooms, completedNPCs, completedZones, collectedItems]);

  const handleRoomClearedComplete = useCallback(() => {
    setRoomClearedBanner(null);
    const room = rooms.find(r => r.id === currentRoomId);
    if (room?.patientStory && !collectedStories.includes(currentRoomId!)) {
      setCollectedStories(prev => [...prev, currentRoomId!]);
      setCurrentStoryRoom(room);
      setIsNewStory(true);
      setShowStoryModal(true);
      return;
    }
    setCurrentRoomId(null);
    setPageMode('hub');
  }, [currentRoomId, collectedStories]);

  // ── Dialogue complete ────────────────────────────────────────
  const handleDialogueComplete = useCallback(() => {
    if (currentNPCId) {
      const newCompleted = new Set(completedNPCs);
      const isFirstCompletion = !newCompleted.has(currentNPCId);
      newCompleted.add(currentNPCId);
      setCompletedNPCs(newCompleted);

      // Celebration for completing an NPC dialogue for the first time
      if (isFirstCompletion) {
        const npcData = currentRoom?.npcs.find((n: any) => n.id === currentNPCId);
        const npcName = npcData?.name || 'NPC';
        notify(`Scenario complete: ${npcName}`, { label: 'SCENARIO CLEARED', type: 'success' });
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.5 });
      }

      // Win condition check
      if (currentSceneId === 'final_boss_1' && newCompleted.size === totalScenarios + 1) {
        const ps = parseInt(localStorage.getItem('final-privacy-score') || '100');
        if (ps > 0) {
          setFinalPrivacyScore(ps);
          setPageMode('win');
          return;
        }
      }
    }

    setCurrentSceneId(null);
    setCurrentNPCId(null);
    setPageMode('exploration');

    // Resume Phaser scene
    eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
  }, [currentNPCId, currentSceneId, completedNPCs, totalScenarios, currentRoom, notify]);

  const handleGameOver = useCallback((finalScore: number) => {
    setFinalPrivacyScore(finalScore);
    setPrivacyScore(finalScore);
    setPageMode('gameover');
  }, []);

  const handlePrivacyScoreChange = useCallback((newScore: number) => {
    setPrivacyScore(newScore);
  }, []);

  const handleDismissIntroModal = useCallback(() => {
    localStorage.setItem('pq:onboarding:seen', '1');
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
    if (isNewStory) {
      setCurrentRoomId(null);
      setPageMode('hub');
    }
  };

  const formatElapsedTime = (): string => {
    const elapsed = Date.now() - gameStartTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // ── Win / GameOver screens ───────────────────────────────────
  if (pageMode === 'gameover' || pageMode === 'win') {
    return (
      <EndScreen
        isWin={pageMode === 'win'}
        finalScore={finalPrivacyScore}
        scenariosCompleted={completedNPCs.size}
        totalScenarios={totalScenarios + 1}
        timeElapsed={formatElapsedTime()}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  // ── Story reveal modal ───────────────────────────────────────
  if (showStoryModal && currentStoryRoom?.patientStory) {
    return (
      <PatientStoryReveal
        story={currentStoryRoom.patientStory}
        roomName={currentStoryRoom.name}
        onClose={handleCloseStoryModal}
      />
    );
  }

  // ── Room selection hub ───────────────────────────────────────
  if (pageMode === 'hub') {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-4 py-8">
        <HallwayHub
          rooms={rooms}
          onSelectRoom={handleSelectRoom}
          completedRooms={completedRooms}
          collectedStories={collectedStories}
          onViewStory={handleViewStory}
          privacyScore={privacyScore}
        />
        <button
          onClick={() => navigate('/')}
          className="text-[8px] text-gray-500 hover:text-gray-300 transition-colors"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          Back to Hub World
        </button>
      </div>
    );
  }

  // ── Exploration + Dialogue (Phaser canvas with React overlays) ─
  const dialogueScenes = currentSceneId ? scenes.filter(s => s.id === currentSceneId) : [];
  const npc = currentRoom?.npcs.find((n: any) => n.id === currentNPCId);

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-4">
      {/* Phaser canvas */}
      <div className="relative border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <PhaserGame ref={gameRef} width={960} height={720} />

        {/* CRT scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* Room progress overlay — top-right of canvas */}
        {currentRoom && (
          <RoomProgressHUD
            room={currentRoom as any}
            completedNpcs={completedNPCs}
            completedZones={completedZones}
            collectedItems={collectedItems}
          />
        )}

        {/* Floating score delta indicator — anchored inside canvas */}
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
              textShadow: scoreDelta.value > 0
                ? '0 0 8px rgba(68, 255, 68, 0.6), 0 0 16px rgba(68, 255, 68, 0.3)'
                : '0 0 8px rgba(255, 68, 68, 0.6), 0 0 16px rgba(255, 68, 68, 0.3)',
              animation: 'score-float-up 0.9s ease-out forwards',
              transform: 'translateX(-50%)',
              zIndex: 30,
            }}
          >
            {scoreDelta.value > 0 ? `+${scoreDelta.value}` : scoreDelta.value}
          </div>
        )}

        {/* ── React overlays — confined to canvas bounds ── */}

        {/* Dialogue overlay */}
        {pageMode === 'dialogue' && currentSceneId && dialogueScenes.length > 0 && (
          <GameContainer
            scenes={dialogueScenes}
            onComplete={handleDialogueComplete}
            onGameOver={handleGameOver}
            npcId={currentNPCId || undefined}
            npcName={npc?.name}
            initialPrivacyScore={privacyScore}
            onPrivacyScoreChange={handlePrivacyScoreChange}
          />
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
            onChoice={(unlockedId) => {
              resolveGate(activeChoiceGate.id, unlockedId);
              setActiveChoiceGate(null);
              eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
            }}
          />
        )}

        {/* Intro modal — shown on first visit, re-openable via help icon */}
        {showIntroModal && (
          <TutorialModal
            title="Welcome to HIPAA General"
            description={"You're a new employee at HIPAA General Hospital. Explore rooms, talk to staff, and learn how patient privacy really works.\n\nWASD or Arrow Keys — Move\nSPACE — Talk to people and interact\nESC — Exit the room"}
            onAcknowledge={handleDismissIntroModal}
            type="info"
            ctaText="Start exploring →"
          />
        )}
      </div>

      {/* Control hints + mute */}
      <div className="flex items-center gap-2">
        <p className="text-[8px] text-gray-500" style={{ fontFamily: '"Press Start 2P"' }}>
          WASD or Arrow Keys to move &bull; SPACE to interact &bull; ESC to exit room
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
          {muted ? '🔇' : '🔊'}
        </button>
        <MusicVolumeSlider />
      </div>

      {/* Dev-only runtime validation checklist — hidden in production */}
      <ValidationOverlay gameRef={gameRef} />
    </div>
  );
}
