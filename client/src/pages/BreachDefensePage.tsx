import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import * as Tooltip from '@radix-ui/react-tooltip';
import { PhaserGame } from '../phaser/PhaserGame';
import { eventBridge, BRIDGE_EVENTS } from '../phaser/EventBridge';
import { TOWERS, THREATS, WAVES } from '../game/breach-defense/constants';
import { TUTORIAL_CONTENT } from '../game/breach-defense/tutorialContent';
import { TutorialModal } from '../components/breach-defense/TutorialModal';
import { RecapModal } from '../components/breach-defense/RecapModal';
import { CodexModal } from '../components/breach-defense/CodexModal';
import { MusicVolumeSlider } from '../components/MusicVolumeSlider';
import { WaveIntroBanner } from '../components/breach-defense/WaveIntroBanner';
import { ThreatStrip } from '../components/breach-defense/ThreatStrip';
import { useNotification } from '../components/NotificationToast';
import { GameBanner } from '../components/GameBanner';
import { Shield, BookOpen, ArrowLeft, Heart, DollarSign, Layers } from 'lucide-react';

type TowerType = keyof typeof TOWERS;

type PageState = 'START' | 'TUTORIAL' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export default function BreachDefensePage() {
  const [, navigate] = useLocation();
  const gameRef = useRef<Phaser.Game | null>(null);
  const { notify } = useNotification();

  // Game state synced from Phaser
  const [pageState, setPageState] = useState<PageState>('START');
  const [securityScore, setSecurityScore] = useState(100);
  const [budget, setBudget] = useState(150);
  const [wave, setWave] = useState(1);
  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);

  // Animation state for budget flash
  const prevBudgetRef = useRef(budget);
  const [budgetFlash, setBudgetFlash] = useState<'spend' | 'gain' | null>(null);
  const budgetFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [budgetScale, setBudgetScale] = useState(1);

  // Animation state for wave number transition
  const [waveScale, setWaveScale] = useState(1);
  const prevWaveRef = useRef(wave);

  // Animation state for security score pulse on drop
  const [scorePulse, setScorePulse] = useState(false);
  const prevScoreRef = useRef(securityScore);

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

  // Wave cleared celebration banner
  const [waveClearedBanner, setWaveClearedBanner] = useState<{ wave: number } | null>(null);
  const [pendingRecap, setPendingRecap] = useState<{
    concept: string;
    endMessage?: string;
    stats?: { threatsStop: number; threatsTotal: number; towersActive: number };
  } | null>(null);

  // Track newly unlocked towers for glow effect
  const [newlyUnlockedTowers, setNewlyUnlockedTowers] = useState<Set<string>>(new Set());

  // Staged reveal for end screens (GAMEOVER / VICTORY)
  const [endShowTitle, setEndShowTitle] = useState(false);
  const [endShowStats, setEndShowStats] = useState(false);
  const [endShowMessage, setEndShowMessage] = useState(false);
  const [endShowButtons, setEndShowButtons] = useState(false);

  // Staged reveal for start screen
  const [startShowTitle, setStartShowTitle] = useState(false);
  const [startShowDesc, setStartShowDesc] = useState(false);
  const [startShowButton, setStartShowButton] = useState(false);

  // Track previous threats for discovery notifications
  const prevSeenThreatsRef = useRef<string[]>([]);

  // Mute toggle
  const [muted, setMuted] = useState(() =>
    localStorage.getItem('sfx_muted') === 'true'
  );

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
      // Show celebration banner first, then recap after it finishes
      setWaveClearedBanner({ wave: data.wave });
      setPendingRecap({
        concept: data.concept,
        endMessage: data.endMessage,
        stats: data.stats,
      });
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

  // Staged reveal cascade for end screens
  useEffect(() => {
    if (pageState === 'GAMEOVER' || pageState === 'VICTORY') {
      setEndShowTitle(false);
      setEndShowStats(false);
      setEndShowMessage(false);
      setEndShowButtons(false);

      const sfxKey = pageState === 'VICTORY' ? 'sfx_wave_start' : 'sfx_interact';
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: sfxKey, volume: 0.6 });

      const t1 = setTimeout(() => setEndShowTitle(true), 200);
      const t2 = setTimeout(() => setEndShowStats(true), 600);
      const t3 = setTimeout(() => setEndShowMessage(true), 1000);
      const t4 = setTimeout(() => setEndShowButtons(true), 1400);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [pageState]);

  // Staged reveal cascade for start screen
  useEffect(() => {
    if (pageState === 'START') {
      setStartShowTitle(false);
      setStartShowDesc(false);
      setStartShowButton(false);

      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.4 });

      const t1 = setTimeout(() => setStartShowTitle(true), 200);
      const t2 = setTimeout(() => setStartShowDesc(true), 600);
      const t3 = setTimeout(() => setStartShowButton(true), 1000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [pageState]);

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

  // ── Budget flash animation ────────────────────────────────────
  useEffect(() => {
    if (budget !== prevBudgetRef.current) {
      const direction = budget > prevBudgetRef.current ? 'gain' : 'spend';
      prevBudgetRef.current = budget;
      setBudgetFlash(direction);
      setBudgetScale(1.15);
      setTimeout(() => setBudgetScale(1), 200);

      if (budgetFlashTimer.current) clearTimeout(budgetFlashTimer.current);
      budgetFlashTimer.current = setTimeout(() => {
        setBudgetFlash(null);
      }, 400);
    }
  }, [budget]);

  // ── Wave number transition animation ───────────────────────────
  useEffect(() => {
    if (wave !== prevWaveRef.current) {
      prevWaveRef.current = wave;
      setWaveScale(1.2);
      setTimeout(() => setWaveScale(1), 300);
    }
  }, [wave]);

  // ── Security score pulse on drop ───────────────────────────────
  useEffect(() => {
    if (securityScore < prevScoreRef.current) {
      setScorePulse(true);
      setTimeout(() => setScorePulse(false), 400);
    }
    prevScoreRef.current = securityScore;
  }, [securityScore]);

  // ── Threat discovery notifications ────────────────────────────
  useEffect(() => {
    const newThreats = seenThreats.filter(t => !prevSeenThreatsRef.current.includes(t));
    prevSeenThreatsRef.current = seenThreats;
    newThreats.forEach(threatKey => {
      const threat = THREATS[threatKey as keyof typeof THREATS];
      if (threat) {
        notify(`${threat.name} — logged in Codex`, { label: 'THREAT DETECTED', type: 'discovery' });
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.6 });
      }
    });
  }, [seenThreats, notify]);

  // ── Tower unlock notifications ──────────────────────────────────
  useEffect(() => {
    if (wave <= 1) return;
    const newUnlocks = Object.entries(TOWERS)
      .filter(([_, t]) => t.unlockWave === wave)
      .map(([id]) => id);
    if (newUnlocks.length > 0) {
      setNewlyUnlockedTowers(prev => {
        const newSet = new Set(prev);
        newUnlocks.forEach(id => newSet.add(id));
        return newSet;
      });
      newUnlocks.forEach(id => {
        const tower = TOWERS[id as keyof typeof TOWERS];
        if (tower) {
          notify(`${tower.name} is now available!`, { label: 'NEW DEFENSE', type: 'unlock' });
        }
      });
    }
  }, [wave, notify]);

  // Mute toggle — apply to Phaser + persist
  useEffect(() => {
    if (gameRef.current?.sound) {
      gameRef.current.sound.setMute(muted);
    }
    localStorage.setItem('sfx_muted', String(muted));
  }, [muted]);

  // ── QA auto-start via ?qa-start URL param ──────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('qa-start')) {
      // Auto-start the game for Playwright screenshot capture
      const timer = setTimeout(() => {
        setPageState('PLAYING');
        eventBridge.emit(BRIDGE_EVENTS.REACT_START_BREACH);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

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
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.3 });
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

  const handleWaveClearedComplete = useCallback(() => {
    setWaveClearedBanner(null);
    if (pendingRecap) {
      setShowRecap(true);
      setRecapConcept(pendingRecap.concept);
      setWaveEndMessage(pendingRecap.endMessage);
      setWaveEndStats(pendingRecap.stats);
      setPendingRecap(null);
    }
  }, [pendingRecap]);

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
    setWaveClearedBanner(null);
    setPendingRecap(null);
    setNewlyUnlockedTowers(new Set());
    prevSeenThreatsRef.current = [];
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
      <style>{`
        @keyframes selected-pulse {
          0%, 100% { box-shadow: 0 0 8px rgba(255, 200, 0, 0.3); border-color: #facc15; }
          50% { box-shadow: 0 0 16px rgba(255, 200, 0, 0.6); border-color: #fde047; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shield-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(232,97,140,0.3)); }
          50% { filter: drop-shadow(0 0 14px rgba(232,97,140,0.7)); }
        }
      `}</style>

      {/* Phaser canvas */}
      <div className="relative border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <PhaserGame ref={gameRef} width={960} height={720} />
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
      <div className="flex gap-6 items-center p-2 bg-[#2a2a3e] border-2 border-[#e8618c] rounded w-[960px] justify-between px-4">
        <div className={`flex items-center gap-2 ${securityScore <= 25 ? 'animate-[hp-throb_0.8s_ease-in-out_infinite]' : ''}`}
          style={{
            boxShadow: scorePulse ? '0 0 15px rgba(255, 50, 50, 0.5)' : 'none',
            transition: 'box-shadow 200ms ease-out'
          }}>
          <Heart className={`w-4 h-4 text-red-400 ${securityScore <= 25 ? 'animate-ping' : ''}`}
            style={securityScore <= 25 ? { animationDuration: '1.2s' } : undefined}
          />
          <span className="text-[11px] text-red-400">
            {securityScore}%
          </span>
          <div className={`w-24 h-2 bg-gray-700 rounded overflow-hidden ml-1 ${securityScore <= 25 ? 'shadow-[0_0_8px_rgba(255,68,68,0.6)]' : ''}`}>
            <div
              className="h-full rounded"
              style={{
                width: `${securityScore}%`,
                background: securityScore > 50
                  ? 'linear-gradient(90deg, #2ecc71, #27ae60)'
                  : securityScore > 25
                  ? 'linear-gradient(90deg, #f39c12, #e67e22)'
                  : 'linear-gradient(90deg, #e74c3c, #c0392b)',
                transition: 'width 300ms ease-out, background 300ms ease-out',
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2"
          style={{ transform: `scale(${budgetScale})`, transition: 'transform 200ms ease-out' }}>
          <DollarSign className={`w-4 h-4 transition-colors duration-150 ${
            budgetFlash === 'spend' ? 'text-red-400' : budgetFlash === 'gain' ? 'text-emerald-300' : 'text-green-400'
          }`} />
          <span
            className={`text-[11px] transition-all duration-150 ${
              budgetFlash === 'spend'
                ? 'text-red-400'
                : budgetFlash === 'gain'
                ? 'text-emerald-300'
                : 'text-green-400'
            }`}
            style={{
              display: 'inline-block',
              transform: budgetFlash === 'gain' ? 'scale(1.25)' : budgetFlash === 'spend' ? 'scale(1.1)' : 'scale(1)',
              textShadow: budgetFlash === 'gain'
                ? '0 0 8px rgba(52, 211, 153, 0.8)'
                : budgetFlash === 'spend'
                ? '0 0 6px rgba(248, 113, 113, 0.6)'
                : 'none',
              transition: 'transform 0.15s ease-out, color 0.15s ease-out, text-shadow 0.15s ease-out',
            }}
          >
            ${budget}
          </span>
        </div>
        <div className="flex items-center gap-2"
          style={{ transform: `scale(${waveScale})`, transition: 'transform 300ms ease-out' }}>
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-[11px] text-blue-400">Wave {wave}/10</span>
        </div>
        <button
          onClick={() => setShowCodex(true)}
          className="flex items-center gap-1 text-[8px] text-purple-300 hover:text-purple-100 transition-colors"
        >
          <BookOpen className="w-3 h-3" />
          CODEX
        </button>
        <button
          onClick={() => setMuted(m => !m)}
          className="text-[10px] text-gray-300 hover:text-white transition-colors"
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '\u{1F507}' : '\u{1F50A}'}
        </button>
        <MusicVolumeSlider />
      </div>

      {/* Tower selection panel */}
      <Tooltip.Provider delayDuration={200}>
        <div className="flex gap-1 p-2 bg-[#2a2a3e] border-2 border-[#e8618c] rounded w-[960px] justify-center flex-wrap items-start"
             style={{ borderTop: '3px solid #e8618c' }}>
          <span className="font-['Press_Start_2P'] text-[7px] text-gray-500 mb-1 block w-full text-center tracking-[3px]">DEFENSES</span>
          {Object.entries(TOWERS).map(([id, tower]) => {
            const locked = wave < tower.unlockWave;
            const tooExpensive = budget < tower.cost;
            const isSelected = selectedTower === id;
            const disabled = locked || tooExpensive || pageState !== 'PLAYING';
            const isSuggested = currentWaveSuggestedTowers.includes(id);
            const isNewlyUnlocked = newlyUnlockedTowers.has(id);

            return (
              <Tooltip.Root key={id}>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => !disabled && handleSelectTower(id as TowerType)}
                    disabled={disabled}
                    style={{ transition: 'transform 0.15s ease-out, border-color 0.2s, box-shadow 0.2s, opacity 0.2s', transform: isSelected ? 'scale(1.08)' : 'scale(1)' }}
                    className={`relative p-1.5 border-2 rounded text-center w-[100px] ${
                      isSelected
                        ? 'border-yellow-400 bg-yellow-900/30 shadow-[0_0_12px_rgba(255,200,0,0.5)] animate-[selected-pulse_1.5s_ease-in-out_infinite]'
                        : isSuggested && !locked
                          ? 'border-yellow-400 animate-pulse shadow-[0_0_8px_rgba(255,200,0,0.4)]'
                          : 'border-gray-600 hover:border-gray-400'
                    } ${isNewlyUnlocked && !locked ? 'ring-2 ring-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]' : ''
                    } ${locked ? 'opacity-25 cursor-not-allowed' : tooExpensive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isSuggested && !locked && (
                      <span className="absolute -top-1.5 -right-1.5 text-[5px] bg-yellow-400 text-black px-1 font-bold border border-black leading-tight">
                        HINT
                      </span>
                    )}
                    <div className="flex items-center gap-1 justify-center">
                      {!locked && (
                        <div className={`w-2 h-2 flex-shrink-0 ${
                          id === 'MFA' ? 'bg-blue-500' :
                          id === 'PATCH' ? 'bg-green-500' :
                          id === 'FIREWALL' ? 'bg-orange-500' :
                          id === 'ENCRYPTION' ? 'bg-purple-500' :
                          id === 'TRAINING' ? 'bg-yellow-500' :
                          id === 'ACCESS' ? 'bg-red-500' : 'bg-gray-500'
                        }`} />
                      )}
                      <div className="text-[9px] font-bold truncate" style={{ color: tower.color }}>
                        {locked ? '???' : tower.name}
                      </div>
                    </div>
                    <div className="text-[8px] text-gray-400">
                      {locked ? `Wave ${tower.unlockWave}` : (
                        <span className="inline-flex items-center gap-0.5">
                          <span className="inline-block w-2.5 h-2.5 rounded-full text-[5px] leading-[10px] text-center font-bold"
                                style={{ background: 'linear-gradient(135deg, #f5d442, #c9a227)', color: '#3a2e00', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>$</span>
                          <span>{tower.cost}</span>
                        </span>
                      )}
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
      <div className="flex items-center gap-4 w-[960px] justify-between">
        <button
          onClick={handleBackToHub}
          className="flex items-center gap-1 text-[9px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Hub World
        </button>
        <p className="text-[9px] text-gray-600">Click grid to place selected tower</p>
      </div>

      {/* ── START SCREEN ──────────────────────────────────────── */}
      {pageState === 'START' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div
            className="relative text-center border-4 border-[#FF6B9D] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #1e2240 50%, #1a1a2e 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 8s ease infinite',
            }}
          >
            {/* Corner brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#00d4aa]" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#00d4aa]" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#00d4aa]" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#00d4aa]" />

            <div style={{
              opacity: startShowTitle ? 1 : 0,
              transform: startShowTitle ? 'translateY(0)' : 'translateY(15px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}>
              <p className="text-[7px] text-[#00d4aa] tracking-[4px] opacity-60 mb-2">SECURITY BRIEFING</p>
              <Shield
                className="w-16 h-16 text-[#FF6B9D] mx-auto mb-4"
                style={{ animation: 'shield-glow 3s ease-in-out infinite' }}
              />
              <h1 className="text-xl font-bold text-[#FF6B9D] mb-3">BREACH DEFENSE</h1>
            </div>
            <div style={{
              opacity: startShowDesc ? 1 : 0,
              transform: startShowDesc ? 'translateY(0)' : 'translateY(15px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}>
              <p className="text-[9px] text-gray-400 mb-6 leading-relaxed">
                Defend the hospital network from cyber threats using real security tools.
                Every tower represents a real HIPAA security measure.
              </p>
            </div>
            <div style={{
              opacity: startShowButton ? 1 : 0,
              transform: startShowButton ? 'translateY(0)' : 'translateY(15px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}>
              <button
                onClick={handleStart}
                className="bg-[#2ECC71] hover:bg-[#27AE60] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] text-black font-bold px-8 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer text-sm transition-shadow duration-300"
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

      {/* ── WAVE CLEARED BANNER ───────────────────────────────── */}
      {waveClearedBanner && (
        <GameBanner
          text={`Wave ${waveClearedBanner.wave} Cleared!`}
          subtext="Defenses held strong"
          onComplete={handleWaveClearedComplete}
          color="green"
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
            <div style={{
              opacity: endShowTitle ? 1 : 0,
              transform: endShowTitle ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 400ms ease-out'
            }}>
              <h1 className="text-xl font-bold text-red-400 mb-3">NETWORK BREACHED</h1>
              <p className="text-[9px] text-gray-400 mb-4 leading-relaxed">
                The attackers got through. Patient data has been compromised.
              </p>
            </div>
            <div style={{
              opacity: endShowStats ? 1 : 0,
              transform: endShowStats ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 400ms ease-out'
            }}>
              <div className="bg-[#2a2a3e] border-2 border-gray-600 p-3 rounded mb-4">
                <p className="text-[8px] text-gray-300">
                  Waves Survived: <span className="text-yellow-400">{endStats.wavesCompleted}</span>
                </p>
                <p className="text-[8px] text-gray-300">
                  Towers Placed: <span className="text-blue-400">{endStats.towersPlaced}</span>
                </p>
              </div>
            </div>
            <div style={{
              opacity: endShowMessage ? 1 : 0,
              transform: endShowMessage ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 400ms ease-out'
            }}>
              <p className="text-[8px] text-[#FF6B9D] mb-6 leading-relaxed">
                No security is perfect. You delayed the inevitable. In real healthcare, that delay saves lives.
              </p>
            </div>
            <div style={{
              opacity: endShowButtons ? 1 : 0,
              transform: endShowButtons ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 400ms ease-out'
            }}>
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
        </div>
      )}

      {/* ── VICTORY SCREEN ────────────────────────────────────── */}
      {pageState === 'VICTORY' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center border-4 border-[#2ECC71] bg-[#1a1a2e] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md">
            <div style={{
              opacity: endShowTitle ? 1 : 0,
              transform: endShowTitle ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 400ms ease-out'
            }}>
              <h1 className="text-xl font-bold text-[#2ECC71] mb-3">NETWORK SECURED</h1>
              <p className="text-[9px] text-gray-400 mb-4 leading-relaxed">
                You defended the hospital network through all 10 waves.
                Patient data remains protected.
              </p>
            </div>
            <div style={{
              opacity: endShowStats ? 1 : 0,
              transform: endShowStats ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 400ms ease-out'
            }}>
              <div className="bg-[#2a2a3e] border-2 border-gray-600 p-3 rounded mb-4">
                <p className="text-[8px] text-gray-300">
                  Security Score: <span className="text-green-400">{securityScore}%</span>
                </p>
                <p className="text-[8px] text-gray-300">
                  Towers Placed: <span className="text-blue-400">{endStats.towersPlaced}</span>
                </p>
              </div>
            </div>
            <div style={{
              opacity: endShowMessage ? 1 : 0,
              transform: endShowMessage ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 400ms ease-out'
            }}>
              <p className="text-[8px] text-[#FF6B9D] mb-6 leading-relaxed">
                You ARE the security. Those "annoying" IT policies protect real patients whose data you're responsible for.
              </p>
            </div>
            <div style={{
              opacity: endShowButtons ? 1 : 0,
              transform: endShowButtons ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 400ms ease-out'
            }}>
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
        </div>
      )}
    </div>
  );
}
