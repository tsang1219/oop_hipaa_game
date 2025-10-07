import { useEffect, useState } from 'react';
import GameContainer from '@/components/GameContainer';
import type { GameData } from '@shared/schema';
import gameDataJson from '@/data/gameData.json';
import hospitalBg from '@assets/generated_images/Hospital_corridor_pixel_background_72c96c5f.png';

export default function Game() {
  const [gameData, setGameData] = useState<GameData | null>(null);

  useEffect(() => {
    setGameData(gameDataJson as GameData);
  }, []);

  if (!gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground text-sm">LOADING...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-8"
      style={{
        backgroundImage: `linear-gradient(rgba(204, 231, 255, 0.95), rgba(204, 231, 255, 0.95)), url(${hospitalBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="container mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2" data-testid="text-game-title">
            HIPAA PRIVACY RULE
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Interactive Training Game
          </p>
        </header>
        
        <GameContainer scenes={gameData.scenes} />
      </div>
    </div>
  );
}
