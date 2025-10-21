import { useState, useEffect } from 'react';
import HospitalHub from './HospitalHub';
import RoomExploration from './RoomExploration';
import GameContainer from './GameContainer';
import { useToast } from '@/hooks/use-toast';
import type { Room, Scene } from '@shared/schema';

type GameMode = 'hub' | 'exploration' | 'dialogue';

interface ExplorationGameProps {
  rooms: Room[];
  scenes: Scene[];
}

export default function ExplorationGame({ rooms, scenes }: ExplorationGameProps) {
  const { toast } = useToast();
  const [gameMode, setGameMode] = useState<GameMode>('hub');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [completedRooms, setCompletedRooms] = useState<string[]>([]);
  const [visitedScenes, setVisitedScenes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedProgress = localStorage.getItem('hipaa-exploration-progress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setCompletedRooms(progress.completedRooms || []);
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

  const currentRoom = rooms.find(r => r.id === currentRoomId);
  
  const scenesForDialogue = currentSceneId 
    ? scenes.filter(s => s.id === currentSceneId)
    : scenes;

  const handleSelectRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    setGameMode('exploration');
  };

  const handleExitRoom = () => {
    const room = rooms.find(r => r.id === currentRoomId);
    if (room) {
      const allInteractions = [...room.npcs, ...room.interactionZones];
      const allCompleted = allInteractions.every(interaction => 
        visitedScenes.has(interaction.sceneId)
      );
      
      if (allCompleted && !completedRooms.includes(currentRoomId!)) {
        setCompletedRooms(prev => [...prev, currentRoomId!]);
      }
    }
    
    setCurrentRoomId(null);
    setGameMode('hub');
  };

  const handleTriggerScene = (sceneId: string) => {
    const sceneExists = scenes.some(s => s.id === sceneId);
    if (!sceneExists) {
      toast({
        title: "Scene Not Found",
        description: `The scene "${sceneId}" is not available. Please report this issue.`,
        variant: "destructive",
      });
      return;
    }
    setCurrentSceneId(sceneId);
    setGameMode('dialogue');
  };

  const handleDialogueComplete = () => {
    if (currentSceneId) {
      setVisitedScenes(prev => new Set(Array.from(prev).concat(currentSceneId)));
    }
    setCurrentSceneId(null);
    setGameMode('exploration');
  };

  const hospitalRooms = rooms.map(room => ({
    id: room.id,
    name: room.name,
    icon: '',
    description: '',
  }));

  if (gameMode === 'hub') {
    return (
      <HospitalHub 
        rooms={hospitalRooms}
        onSelectRoom={handleSelectRoom}
        completedRooms={completedRooms}
      />
    );
  }

  if (gameMode === 'exploration' && currentRoom) {
    return (
      <RoomExploration 
        key={currentRoomId}
        room={currentRoom}
        onTriggerScene={handleTriggerScene}
        onExitRoom={handleExitRoom}
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
          storageKey={`exploration-dialogue-${currentSceneId}`}
        />
      </div>
    );
  }

  return null;
}
