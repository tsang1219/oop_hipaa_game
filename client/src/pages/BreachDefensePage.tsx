import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import * as Tooltip from '@radix-ui/react-tooltip';
import { PhaserGame } from '../phaser/PhaserGame';
import { eventBridge, BRIDGE_EVENTS } from '../phaser/EventBridge';
import { TOWERS, WAVES } from '../game/breach-defense/constants';
import { TUTORIAL_CONTENT } from '../game/breach-defense/tutorialContent';
import { TutorialModal } from '../components/breach-defense/TutorialModal';
import { RecapModal } from '../components/breach-defense/RecapModal';
import { CodexModal } from '../components/breach-defense/CodexModal';
import { WaveIntroBanner } from '../components/breach-defense/WaveIntroBanner';
import { ThreatStrip } from '../components/breach-defense/ThreatStrip';
import { Shield, BookOpen, ArrowLeft, Heart, DollarSign, Layers } from 'lucide-react';

type TowerType = keyof typeof TOWERS;

type PageState = 'START' | 'TUTORIAL' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export default function BreachDefensePage() {
  const [, navigate] = useLocation();
  const gameRef = useRef<Phaser.Game | null>(null);

  // Game state synced from Phaser
  const [pageState, setPageState] = useState<PageState>('START');
  const [securityScore, setSecurityScore] = useState(100);
  const [budget, setBudget] = useState(150);
  const [wave, setWave] = useState(1);
  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);

  // Tutorial state
  const [currentTutorial, setCurrentTutorial] = useState<string | null>(null);
  const [seenThreats, setSeenThreats] = useState<string[]>([]);
  const [seenTowers, setSeenTowers] = useState<string[]>([]);

  // Recap
  const [showRecap, setShowRecap] = useState(false);
  const [recapConcept, setRecapConcept] = useState<string | null>(null);

  // Codex
  const [showCodex, setShowCodex] = useState(false);

  // End stats
  const [endStats, setEndStats] = useState({ wavesCompleted: 0, towersPlaced: 0 });

  // Wave banner
  const [showWaveBanner, setShowWaveBanner] = useState(false);
  const [waveBannerData, setWaveBannerData] = useState<{
    wave: number;
    name: string;
    intro: string;
    suggestedTowers: string[];
    threats: Array<{ type: string; count: number }>;
  } | null>(null);

  // Persistent threat strip
  const [currentWaveThreats, setCurrentWaveThreats] = useState<Array<{ type: string; count: number }>>([]);

  // Suggested towers for badges
  const [currentWaveSuggestedTowers, setCurrentWaveSuggestedTowers] = useState<string[]>([]);

  // Wave end data for RecapModal
  const [waveEndMessage, setWaveEndMessage] = useState<string | undefined>(undefined);
  const [waveEndStats, setWaveEndStats] = useState<{ threatsStop: number; threatsTotal: number; towersActive: number } | undefined>(undefined);

  // ── Scene launch ───────────────────────────────────────────────

  const sceneStarted = useRef(false);

  useEffect(() => {
    sceneStarted.current = false;

    const onSceneReady = (sceneKey: string) => {
      if (sceneKey === 'Boot' && !sceneStarted.current) {
        sceneStarted.current = true;
        const game = gameRef.current;
        if (game) {
          game.scene.stop('HubWorld');
          game.scene.start('BreachDefense');
        }
      }
    };

    eventBridge.on(BRIDGE_EVENTS.SCENE_READY, onSceneReady);
    return () => {
      eventBridge.off(BRIDGE_EVENTS.SCENE_READY, onSceneReady);
    };
  }, []);

  // ── EventBridge listeners ──────────────────────────────────────

  useEffect(() => {
    const onStateUpdate = (data: {
      securityScore: number;
      budget: number;
      wave: number;
      gameState: string;
      enemyCount: number;
      towerCount: number;
    }) => {
      setSecurityScore(data.securityScore);
      setBudget(data.budget);
      setWave(data.wave);
    };

    const onWaveStart = (data: {
      wave: number;
      name: string;
      intro: string;
      suggestedTowers: string[];
      threats: Array<{ type: string; count: number; interval?: number }>;
    }) => {
      setWaveBannerData({
        wave: data.wave,
        name: data.name,
        intro: data.intro,
        suggestedTowers: data.suggestedTowers,
        threats: data.threats.map(t => ({ type: t.type, count: t.count })),
      });
      setShowWaveBanner(true);
      setCurrentWaveThreats(data.threats.map(t => ({ type: t.type, count: t.count })));
      setCurrentWaveSuggestedTowers(data.suggestedTowers);
    };

    const onWaveComplete = (data: {
      wave: number;
      concept: string;
      endMessage?: string;
      stats?: { threatsStop: number; threatsTotal: number; towersActive: number };
    }) => {
      setShowRecap(true);
      setRecapConcept(data.concept);
      setWaveEndMessage(data.endMessage);
      setWaveEndStats(data.stats);
      setCurrentWaveThreats([]); // Clear threat strip between waves
    };

    const onGameOver = (data: { wavesCompleted: number; towersPlaced: number }) => {
      setEndStats(data);
      setPageState('GAMEOVER');
    };

    const onVictory = (data: { securityScore: number; wavesCompleted: number; towersPlaced: number }) => {
      setEndStats(data);
      setPageState('VICTORY');
    };

    const onTowerPlaced = (data: { type: string; cost: number; newBudget: number }) => {
      setBudget(data.newBudget);
      setSeenTowers(prev =>
        prev.includes(data.type) ? prev : [...prev, data.type]
      );
    };

    const onTutorialTrigger = (data: { tutorialKey: string }) => {
      setCurrentTutorial(data.tutorialKey);
      setPageState('TUTORIAL');
    };

    eventBridge.on(BRIDGE_EVENTS.BREACH_WAVE_START, onWaveStart);
    eventBridge.on(BRIDGE_EVENTS.BREACH_STATE_UPDATE, onStateUpdate);
    eventBridge.on(BRIDGE_EVENTS.BREACH_WAVE_COMPLETE, onWaveComplete);
    eventBridge.on(BRIDGE_EVENTS.BREACH_GAME_OVER, onGameOver);
    eventBridge.on(BRIDGE_EVENTS.BREACH_VICTORY, onVictory);
    eventBridge.on(BRIDGE_EVENTS.BREACH_TOWER_PLACED, onTowerPlaced);
    eventBridge.on(BRIDGE_EVENTS.BREACH_TUTORIAL_TRIGGER, onTutorialTrigger);

    return () => {
      eventBridge.off(BRIDGE_EVENTS.BREACH_WAVE_START, onWaveStart);
      eventBridge.off(BRIDGE_EVENTS.BREACH_STATE_UPDATE, onStateUpdate);
      eventBridge.off(BRIDGE_EVENTS.BREACH_WAVE_COMPLETE, onWaveComplete);
      eventBridge.off(BRIDGE_EVENTS.BREACH_GAME_OVER, onGameOver);
      eventBridge.off(BRIDGE_EVENTS.BREACH_VICTORY, onVictory);
      eventBridge.off(BRIDGE_EVENTS.BREACH_TOWER_PLACED, onTowerPlaced);
      eventBridge.off(BRIDGE_EVENTS.BREACH_TUTORIAL_TRIGGER, onTutorialTrigger);
    };
  }, []);

  // Track seen threats from wave data
  useEffect(() => {
    if (wave <= WAVES.length) {
      const waveData = WAVES[wave - 1];
      if (waveData) {
        const types = waveData.threats.map(t => t.type);
        setSeenThreats(prev => {
          const newSet = new Set(prev);
          types.forEach(t => newSet.add(t));
          return Array.from(newSet);
        });
      }
    }
  }, [wave]);

  // ── Handlers ───────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    setPageState('TUTORIAL');
    setCurrentTutorial('welcome');
    eventBridge.emit(BRIDGE_EVENTS.REACT_START_BREACH);
  }, []);

  const handleSelectTower = useCallback((type: TowerType) => {
    const newType = selectedTower === type ? null : type;
    setSelectedTower(newType);
    eventBridge.emit(BRIDGE_EVENTS.REACT_SELECT_TOWER_TYPE, { type: newType });
  }, [selectedTower]);

  const handleDismissTutorial = useCallback(() => {
    const tut = currentTutorial;
    setCurrentTutorial(null);

    if (tut === 'welcome') {
      setCurrentTutorial('firstTower');
    } else {
      setPageState('PLAYING');
      eventBridge.emit(BRIDGE_EVENTS.REACT_DISMISS_TUTORIAL);
    }
  }, [currentTutorial]);

  const handleRecapContinue = useCallback(() => {
    setShowRecap(false);
    setRecapConcept(null);
    setWaveEndMessage(undefined);
    setWaveEndStats(undefined);
    eventBridge.emit(BRIDGE_EVENTS.REACT_DISMISS_TUTORIAL);
  }, []);

  const handleBannerDismiss = useCallback(() => {
    setShowWaveBanner(false);
  }, []);

  const handleRestart = useCallback(() => {
    setPageState('START');
    setSecurityScore(100);
    setBudget(150);
    setWave(1);
    setSelectedTower(null);
    setCurrentTutorial(null);
    setShowRecap(false);
    setShowCodex(false);
    setSeenThreats([]);
    setSeenTowers([]);
    setShowWaveBanner(false);
    setWaveBannerData(null);
    setCurrentWaveThreats([]);
    setCurrentWaveSuggestedTowers([]);
    setWaveEndMessage(undefined);
    setWaveEndStats(undefined);
    eventBridge.emit(BRIDGE_EVENTS.REACT_RESTART_BREACH);
  }, []);

  const handleBackToHub = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // ── Tutorial content resolution ────────────────────────────────

  const getTutorialContent = () => {
    if (!currentTutorial) return null;

    if (currentTutorial === 'welcome') {
      return TUTORIAL_CONTENT.welcome;
    }
    if (currentTutorial === 'firstTower') {
      return TUTORIAL_CONTENT.firstTower;
    }
    const waveMatch = currentTutorial.match(/^wave_(\d+)$/);
    if (waveMatch) {
      const waveNum = parseInt(waveMatch[1]);
      const content = TUTORIAL_CONTENT.waves[waveNum as keyof typeof TUTORIAL_CONTENT.waves];
      if (content) return content;
    }
    return null;
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-2 p-4"
         style={{ fontFamily: '"Press Start 2P", monospace' }}>

      {/* Phaser canvas */}
      <div className="relative border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <PhaserGame ref={gameRef} width={640} height={480} />
        {showWaveBanner && waveBannerData && (
          <WaveIntroBanner
            wave={waveBannerData.wave}
            name={waveBannerData.name}
            intro={waveBannerData.intro}
            suggestedTowers={waveBannerData.suggestedTowers}
            threats={waveBannerData.threats}
            onDismiss={handleBannerDismiss}
            autoDismissMs={3000}
          />
        )}
      </div>

      {/* Incoming threat strip */}
      <ThreatStrip threats={currentWaveThreats} />

      {/* HUD bar */}
      <div className="flex gap-6 items-center p-2 bg-[#2a2a3e] border-2 border-[#FF6B9D] rounded w-[640px] justify-between px-4">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-400" />
          <span className="text-[10px] text-red-400">
            {securityScore}%
          </span>
          <div className="w-24 h-2 bg-gray-700 rounded overflow-hidden ml-1">
            <div
              className="h-full transition-all duration-300 rounded"
              style={{
                width: `${securityScore}%`,
                backgroundColor: securityScore > 50 ? '#44ff44' : securityScore > 25 ? '#ffaa00' : '#ff4444'
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span className="text-[10px] text-green-400">${budget}</span>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] text-blue-400">Wave {wave}/10</span>
        </div>
        <button
          onClick={() => setShowCodex(true)}
          className="flex items-center gap-1 text-[8px] text-purple-300 hover:text-purple-100 transition-colors"
        >
          <BookOpen className="w-3 h-3" />
          CODEX
        </button>
      </div>

      {/* Tower selection panel */}
      <Tooltip.Provider delayDuration={200}>
        <div className="flex gap-1 p-2 bg-[#2a2a3e] border-2 border-[#FF6B9D] rounded w-[640px] justify-center flex-wrap">
          {Object.entries(TOWERS).map(([id, tower]) => {
            const locked = wave < tower.unlockWave;
            const tooExpensive = budget < tower.cost;
            const isSelected = selectedTower === id;
            const disabled = locked || tooExpensive || pageState !== 'PLAYING';
            const isSuggested = currentWaveSuggestedTowers.includes(id);

            return (
              <Tooltip.Root key={id}>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => !disabled && handleSelectTower(id as TowerType)}
                    disabled={disabled}
                    className={`relative p-1.5 border-2 rounded text-center w-[100px] transition-all ${
                      isSelected
                        ? 'border-yellow-400 bg-yellow-900/30 shadow-[0_0_8px_rgba(255,200,0,0.3)]'
                        : isSuggested && !locked
                          ? 'border-yellow-400 animate-pulse shadow-[0_0_8px_rgba(255,200,0,0.4)]'
                          : 'border-gray-600 hover:border-gray-400'
                    } ${locked ? 'opacity-25 cursor-not-allowed' : tooExpensive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isSuggested && !locked && (
                      <span className="absolute -top-1.5 -right-1.5 text-[5px] bg-yellow-400 text-black px-1 font-bold border border-black leading-tight">
                        HINT
                      </span>
                    )}
                    <div className="text-[7px] font-bold truncate" style={{ color: tower.color }}>
                      {locked ? '???' : tower.name}
                    </div>
                    <div className="text-[7px] text-gray-400">
                      {locked ? `Wave ${tower.unlockWave}` : `$${tower.cost}`}
                    </div>
                  </button>
                </Tooltip.Trigger>
                {!locked && (
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-[#1a1a2e] border-2 border-[#FF6B9D] p-2 rounded max-w-[200px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                      side="top"
                      sideOffset={4}
                    >
                      <p className="text-[7px] text-gray-200 mb-1.5 leading-relaxed">{tower.desc}</p>
                      <p className="text-[6px] text-green-400">+ {tower.strongAgainst.join(', ')}</p>
                      <p className="text-[6px] text-red-400">- {tower.weakAgainst.join(', ')}</p>
                      <Tooltip.Arrow className="fill-[#FF6B9D]" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
            );
          })}
        </div>
      </Tooltip.Provider>

      {/* Controls hint + back button */}
      <div className="flex items-center gap-4 w-[640px] justify-between">
        <button
          onClick={handleBackToHub}
          className="flex items-center gap-1 text-[8px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Hub World
        </button>
        <p className="text-[7px] text-gray-600">Click grid to place selected tower</p>
      </div>

      {/* ── START SCREEN ──────────────────────────────────────── */}
      {pageState === 'START' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center border-4 border-[#FF6B9D] bg-[#1a1a2e] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md">
            <Shield className="w-16 h-16 text-[#FF6B9D] mx-auto mb-4" />
            <h1 className="text-xl font-bold text-[#FF6B9D] mb-3">BREACH DEFENSE</h1>
            <p className="text-[9px] text-gray-400 mb-6 leading-relaxed">
              Defend the hospital network from cyber threats using real security tools.
              Every tower represents a real HIPAA security measure.
            </p>
            <button
              onClick={handleStart}
              className="bg-[#2ECC71] hover:bg-[#27AE60] text-black font-bold px-8 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer text-sm"
            >
              Start Mission
            </button>
            <div className="mt-4">
              <button onClick={handleBackToHub} className="text-[8px] text-gray-500 hover:text-gray-300 underline">
                Back to Hub World
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TUTORIAL MODAL ────────────────────────────────────── */}
      {currentTutorial && getTutorialContent() && (
        <TutorialModal
          title={getTutorialContent()!.title}
          description={getTutorialContent()!.description}
          onAcknowledge={handleDismissTutorial}
          type={currentTutorial.startsWith('wave_') ? 'threat' : 'info'}
        />
      )}

      {/* ── RECAP MODAL ───────────────────────────────────────── */}
      {showRecap && recapConcept && (
        <RecapModal
          concept={recapConcept}
          onContinue={handleRecapContinue}
          endMessage={waveEndMessage}
          stats={waveEndStats}
        />
      )}

      {/* ── CODEX MODAL ───────────────────────────────────────── */}
      {showCodex && (
        <CodexModal
          onClose={() => setShowCodex(false)}
          seenThreats={seenThreats}
          seenTowers={seenTowers}
        />
      )}

      {/* ── GAME OVER SCREEN ──────────────────────────────────── */}
      {pageState === 'GAMEOVER' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center border-4 border-red-500 bg-[#1a1a2e] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md">
            <h1 className="text-xl font-bold text-red-400 mb-3">NETWORK BREACHED</h1>
            <p className="text-[9px] text-gray-400 mb-4 leading-relaxed">
              The attackers got through. Patient data has been compromised.
            </p>
            <div className="bg-[#2a2a3e] border-2 border-gray-600 p-3 rounded mb-4">
              <p className="text-[8px] text-gray-300">
                Waves Survived: <span className="text-yellow-400">{endStats.wavesCompleted}</span>
              </p>
              <p className="text-[8px] text-gray-300">
                Towers Placed: <span className="text-blue-400">{endStats.towersPlaced}</span>
              </p>
            </div>
            <p className="text-[8px] text-[#FF6B9D] mb-6 leading-relaxed">
              No security is perfect. You delayed the inevitable. In real healthcare, that delay saves lives.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRestart}
                className="bg-[#FF6B9D] hover:bg-[#FF5A8A] text-white font-bold px-6 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer text-[10px]"
              >
                Try Again
              </button>
              <button
                onClick={handleBackToHub}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold px-6 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer text-[10px]"
              >
                Hub World
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VICTORY SCREEN ────────────────────────────────────── */}
      {pageState === 'VICTORY' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center border-4 border-[#2ECC71] bg-[#1a1a2e] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md">
            <h1 className="text-xl font-bold text-[#2ECC71] mb-3">NETWORK SECURED</h1>
            <p className="text-[9px] text-gray-400 mb-4 leading-relaxed">
              You defended the hospital network through all 10 waves.
              Patient data remains protected.
            </p>
            <div className="bg-[#2a2a3e] border-2 border-gray-600 p-3 rounded mb-4">
              <p className="text-[8px] text-gray-300">
                Security Score: <span className="text-green-400">{securityScore}%</span>
              </p>
              <p className="text-[8px] text-gray-300">
                Towers Placed: <span className="text-blue-400">{endStats.towersPlaced}</span>
              </p>
            </div>
            <p className="text-[8px] text-[#FF6B9D] mb-6 leading-relaxed">
              You ARE the security. Those "annoying" IT policies protect real patients whose data you're responsible for.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRestart}
                className="bg-[#2ECC71] hover:bg-[#27AE60] text-black font-bold px-6 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer text-[10px]"
              >
                Play Again
              </button>
              <button
                onClick={handleBackToHub}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold px-6 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer text-[10px]"
              >
                Hub World
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
