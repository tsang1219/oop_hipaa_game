import { useState, useEffect } from 'react';
import HallwayHub from './HallwayHub';
import RoomExploration from './RoomExploration';
import GameContainer from './GameContainer';
import EndScreen from './EndScreen';
import PatientStoryModal from './PatientStoryModal';
import { useToast } from '@/hooks/use-toast';
import type { Room, Scene } from '@shared/schema';

type GameMode = 'hub' | 'exploration' | 'dialogue' | 'gameover' | 'win';

interface PatientStory {
  title: string;
  text: string;
  icon: string;
}

interface RoomWithStory extends Room {
  subtitle?: string;
  description?: string;
  unlockRequirement?: string | null;
  alwaysUnlocked?: boolean;
  patientStory?: PatientStory;
}

interface ExplorationGameProps {
  rooms: RoomWithStory[];
  scenes: Scene[];
}

export default function ExplorationGame({ rooms, scenes }: ExplorationGameProps) {
  const { toast } = useToast();
  const [gameMode, setGameMode] = useState<GameMode>('hub');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [currentNPCId, setCurrentNPCId] = useState<string | null>(null);
  const [completedRooms, setCompletedRooms] = useState<string[]>(() => {
    const saved = localStorage.getItem('completedRooms');
    return saved ? JSON.parse(saved) : [];
  });
  const [collectedStories, setCollectedStories] = useState<string[]>(() => {
    const saved = localStorage.getItem('collectedStories');
    return saved ? JSON.parse(saved) : [];
  });
  const [visitedScenes, setVisitedScenes] = useState<Set<string>>(new Set());
  const [completedNPCs, setCompletedNPCs] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('completedNPCs');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [finalPrivacyScore, setFinalPrivacyScore] = useState(100);
  const [gameStartTime] = useState(() => {
    const saved = localStorage.getItem('gameStartTime');
    return saved ? parseInt(saved) : Date.now();
  });
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [currentStoryRoom, setCurrentStoryRoom] = useState<RoomWithStory | null>(null);
  const [isNewStory, setIsNewStory] = useState(false);

  const totalEducationalItems = rooms.reduce((sum, room) => sum + room.educationalItems.length, 0);
  const totalScenarios = rooms.reduce((sum, room) => sum + room.npcs.filter(npc => !npc.isFinalBoss).length, 0);

  useEffect(() => {
    localStorage.setItem('gameStartTime', gameStartTime.toString());
  }, [gameStartTime]);

  useEffect(() => {
    localStorage.setItem('completedRooms', JSON.stringify(completedRooms));
  }, [completedRooms]);

  useEffect(() => {
    localStorage.setItem('collectedStories', JSON.stringify(collectedStories));
  }, [collectedStories]);

  useEffect(() => {
    const savedProgress = localStorage.getItem('hipaa-exploration-progress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setVisitedScenes(new Set(progress.visitedScenes || []));
      } catch (e) {
        console.error('Failed to load exploration progress:', e);
      }
    }
  }, []);

  useEffect(() => {
    const progress = {
      completedRooms,
      visitedScenes: Array.from(visitedScenes),
    };
    localStorage.setItem('hipaa-exploration-progress', JSON.stringify(progress));
  }, [completedRooms, visitedScenes]);

  useEffect(() => {
    if (completedNPCs.size === totalScenarios + 1) {
      const savedProgress = localStorage.getItem('exploration-dialogue-final_boss_1-progress');
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress);
          if (progress.gameComplete) {
            setFinalPrivacyScore(100);
            setGameMode('win');
          }
        } catch (e) {
          console.error('Failed to check win condition:', e);
        }
      }
    }
  }, [completedNPCs, totalScenarios]);

  const currentRoom = rooms.find(r => r.id === currentRoomId);
  
  const scenesForDialogue = currentSceneId 
    ? scenes.filter(s => s.id === currentSceneId)
    : scenes;

  const handleSelectRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    setGameMode('exploration');
  };

  const handleViewStory = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room?.patientStory) {
      setCurrentStoryRoom(room);
      setIsNewStory(false);
      setShowStoryModal(true);
    }
  };

  const handleExitRoom = () => {
    const room = rooms.find(r => r.id === currentRoomId);
    if (room) {
      const roomNPCs = room.npcs.filter(npc => !npc.isFinalBoss);
      const allNPCsCompleted = roomNPCs.every(npc => 
        completedNPCs.has(npc.id)
      );
      
      if (allNPCsCompleted && roomNPCs.length > 0 && !completedRooms.includes(currentRoomId!)) {
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
    setGameMode('hub');
  };

  const handleCloseStoryModal = () => {
    setShowStoryModal(false);
    setCurrentStoryRoom(null);
    if (isNewStory) {
      setCurrentRoomId(null);
      setGameMode('hub');
    }
  };

  const handleTriggerScene = (sceneId: string, npcId?: string) => {
    const sceneExists = scenes.some(s => s.id === sceneId);
    if (!sceneExists) {
      toast({
        title: "Scene Not Found",
        description: `The scene "${sceneId}" is not available yet. More content coming soon!`,
        variant: "destructive",
      });
      return;
    }
    setCurrentSceneId(sceneId);
    setCurrentNPCId(npcId || null);
    setGameMode('dialogue');
  };

  const handleDialogueComplete = () => {
    if (currentSceneId) {
      setVisitedScenes(prev => new Set(Array.from(prev).concat(currentSceneId)));
    }
    
    if (currentNPCId) {
      const newCompleted = new Set(completedNPCs);
      newCompleted.add(currentNPCId);
      setCompletedNPCs(newCompleted);
      localStorage.setItem('completedNPCs', JSON.stringify(Array.from(newCompleted)));

      if (currentSceneId === 'final_boss_1' && newCompleted.size === totalScenarios + 1) {
        const privacyScore = parseInt(localStorage.getItem('final-privacy-score') || '100');
        if (privacyScore > 0) {
          setFinalPrivacyScore(privacyScore);
          setGameMode('win');
          return;
        }
      }
    }
    
    setCurrentSceneId(null);
    setCurrentNPCId(null);
    setGameMode('exploration');
  };

  const handleGameOver = (finalScore: number) => {
    setFinalPrivacyScore(finalScore);
    setGameMode('gameover');
  };

  const handlePlayAgain = () => {
    localStorage.clear();
    window.location.reload();
  };

  const formatElapsedTime = (): string => {
    const elapsed = Date.now() - gameStartTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (gameMode === 'gameover' || gameMode === 'win') {
    return (
      <EndScreen
        isWin={gameMode === 'win'}
        finalScore={finalPrivacyScore}
        scenariosCompleted={completedNPCs.size}
        totalScenarios={totalScenarios + 1}
        timeElapsed={formatElapsedTime()}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  if (showStoryModal && currentStoryRoom?.patientStory) {
    return (
      <PatientStoryModal
        story={currentStoryRoom.patientStory}
        roomName={currentStoryRoom.name}
        onClose={handleCloseStoryModal}
        isRoomClear={isNewStory}
      />
    );
  }

  if (gameMode === 'hub') {
    return (
      <HallwayHub 
        rooms={rooms}
        onSelectRoom={handleSelectRoom}
        completedRooms={completedRooms}
        collectedStories={collectedStories}
        onViewStory={handleViewStory}
      />
    );
  }

  if (gameMode === 'exploration' && currentRoom) {
    return (
      <RoomExploration 
        key={currentRoomId}
        room={currentRoom}
        onTriggerScene={(sceneId) => {
          const npc = currentRoom.npcs.find(n => n.sceneId === sceneId);
          handleTriggerScene(sceneId, npc?.id);
        }}
        onExitRoom={handleExitRoom}
        totalEducationalItems={totalEducationalItems}
        totalScenarios={totalScenarios}
        completedNPCs={completedNPCs}
      />
    );
  }

  if (gameMode === 'dialogue' && currentSceneId) {
    if (scenesForDialogue.length === 0) {
      handleDialogueComplete();
      return null;
    }
    
    return (
      <div className="relative">
        <GameContainer 
          scenes={scenesForDialogue}
          onComplete={handleDialogueComplete}
          onGameOver={handleGameOver}
        />
      </div>
    );
  }

  return null;
}
