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
import KnowledgeTracker from '@/components/KnowledgeTracker';
import ChecklistUI from '@/components/ChecklistUI';
import { RoomProgressHUD } from '@/components/RoomProgressHUD';
import { TutorialModal } from '../components/breach-defense/TutorialModal';
import { useToast } from '@/hooks/use-toast';
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
  const [, navigate] = useLocation();
  const gameRef = useRef<Phaser.Game | null>(null);

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

  // Intro modal — shown once (gated by localStorage flag)
  const [showIntroModal, setShowIntroModal] = useState(() => {
    return !localStorage.getItem('pq:onboarding:seen');
  });

  // Mute toggle
  const [muted, setMuted] = useState(() =>
    localStorage.getItem('sfx_muted') === 'true'
  );

  const totalEducationalItems = rooms.reduce((sum, r) => sum + r.educationalItems.length, 0);
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

  // ── Room selection from HallwayHub ───────────────────────────
  const handleSelectRoom = useCallback((roomId: string) => {
    setCurrentRoomId(roomId);
    setPageMode('exploration');
  }, []);

  // ── Start Phaser exploration scene when entering exploration ──
  useEffect(() => {
    if (pageMode !== 'exploration' || !currentRoomId) return;
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
        if (room.patientStory && !collectedStories.includes(currentRoomId!)) {
          setCollectedStories(prev => [...prev, currentRoomId!]);
          setCurrentStoryRoom(room);
          setIsNewStory(true);
          setShowStoryModal(true);
          return;
        }
      }
    }
    setCurrentRoomId(null);
    setPageMode('hub');
  }, [currentRoomId, completedRooms, collectedStories, completedNPCs, completedZones, collectedItems]);

  // ── Dialogue complete ────────────────────────────────────────
  const handleDialogueComplete = useCallback(() => {
    if (currentNPCId) {
      const newCompleted = new Set(completedNPCs);
      newCompleted.add(currentNPCId);
      setCompletedNPCs(newCompleted);

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
  }, [currentNPCId, currentSceneId, completedNPCs, totalScenarios]);

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
        <PhaserGame ref={gameRef} width={640} height={480} />

        {/* CRT scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)',
            mixBlendMode: 'multiply',
          }}
        />
      </div>

      {/* HUD below canvas */}
      <div className="flex items-center gap-6">
        <KnowledgeTracker />
        <ChecklistUI
          educationalItemsCollected={collectedItems.size}
          totalEducationalItems={totalEducationalItems}
          scenariosCompleted={completedNPCs.size}
          totalScenarios={totalScenarios}
        />
        <button
          onClick={() => setMuted(m => !m)}
          className="text-[10px] text-gray-300 hover:text-white transition-colors"
          title={muted ? 'Unmute' : 'Mute'}
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {muted ? '\u{1F507}' : '\u{1F50A}'}
        </button>
      </div>

      {currentRoom && (
        <RoomProgressHUD
          room={currentRoom as any}
          completedNpcs={completedNPCs}
          completedZones={completedZones}
          collectedItems={collectedItems}
        />
      )}

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
      </div>

      {/* ── React overlays ── */}

      {/* Dialogue overlay */}
      {pageMode === 'dialogue' && currentSceneId && dialogueScenes.length > 0 && (
        <div className="fixed inset-0 z-40">
          <GameContainer
            scenes={dialogueScenes}
            onComplete={handleDialogueComplete}
            onGameOver={handleGameOver}
            npcId={currentNPCId || undefined}
            npcName={npc?.name}
            initialPrivacyScore={privacyScore}
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
  );
}
