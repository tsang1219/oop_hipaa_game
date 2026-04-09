import { useState, useEffect, useCallback } from 'react';
import { TOWERS } from '../../game/breach-defense/constants';
import { eventBridge, BRIDGE_EVENTS } from '../../phaser/EventBridge';
import { OnboardingOverlay, type OnboardingStep } from './OnboardingOverlay';
import { WaveIntroBanner } from './WaveIntroBanner';
import { ThreatStrip } from './ThreatStrip';

type TowerType = keyof typeof TOWERS;

const TOWER_ICONS: Record<string, string> = {
  MFA: '\u{1F510}',        // locked with key
  FIREWALL: '\u{1F6E1}',   // shield
  TRAINING: '\u{1F4DA}',   // books
  ACCESS: '\u{1F6AA}',     // door
  PATCH: '\u{1F529}',      // nut and bolt
  ENCRYPTION: '\u{1F512}', // lock
};

interface EncounterGameUIProps {
  availableTowerIds: string[];
}

export function EncounterGameUI({ availableTowerIds }: EncounterGameUIProps) {
  const pixelFont = { fontFamily: '"Press Start 2P", monospace' };
  const availableSet = new Set(availableTowerIds);

  // ── HUD state ───────────────────────────────────────────────────
  const [budget, setBudget] = useState(0);
  const [securityScore, setSecurityScore] = useState(100);
  const [wave, setWave] = useState(1);
  const [totalWaves, setTotalWaves] = useState(3);
  const [gameState, setGameState] = useState('WAITING');

  // ── Tower selection ─────────────────────────────────────────────
  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);

  // ── Onboarding ──────────────────────────────────────────────────
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('WELCOME');

  // ── Wave banner ─────────────────────────────────────────────────
  const [waveBannerData, setWaveBannerData] = useState<{
    wave: number;
    name: string;
    intro: string;
    suggestedTowers: string[];
    threats: Array<{ type: string; count: number }>;
  } | null>(null);

  // ── Threat strip ────────────────────────────────────────────────
  const [currentWaveThreats, setCurrentWaveThreats] = useState<Array<{ type: string; count: number }>>([]);
  const [currentWaveSuggestedTowers, setCurrentWaveSuggestedTowers] = useState<string[]>([]);

  // ── EventBridge subscriptions ───────────────────────────────────
  useEffect(() => {
    const onStateUpdate = (data: {
      securityScore: number;
      budget: number;
      wave: number;
      totalWaves?: number;
      gameState: string;
    }) => {
      setSecurityScore(data.securityScore);
      setBudget(data.budget);
      setWave(data.wave);
      if (data.totalWaves) setTotalWaves(data.totalWaves);
      setGameState(data.gameState);
    };

    const onWaveStart = (data: {
      wave: number;
      name: string;
      intro: string;
      suggestedTowers: string[];
      threats: Array<{ type: string; count: number }>;
    }) => {
      setWaveBannerData(data);
      setCurrentWaveThreats(data.threats.map(t => ({ type: t.type, count: t.count })));
      setCurrentWaveSuggestedTowers(data.suggestedTowers);
    };

    eventBridge.on(BRIDGE_EVENTS.BREACH_STATE_UPDATE, onStateUpdate);
    eventBridge.on(BRIDGE_EVENTS.BREACH_WAVE_START, onWaveStart);

    return () => {
      eventBridge.off(BRIDGE_EVENTS.BREACH_STATE_UPDATE, onStateUpdate);
      eventBridge.off(BRIDGE_EVENTS.BREACH_WAVE_START, onWaveStart);
    };
  }, []);

  // ── Tower selection handler ─────────────────────────────────────
  const handleSelectTower = useCallback((type: TowerType) => {
    const newType = selectedTower === type ? null : type;
    setSelectedTower(newType);
    eventBridge.emit(BRIDGE_EVENTS.REACT_SELECT_TOWER_TYPE, { type: newType });
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.3 });
  }, [selectedTower]);

  // ── Onboarding advancement ─────────────────────────────────────
  const handleOnboardingAdvance = useCallback((nextStep: OnboardingStep) => {
    setOnboardingStep(nextStep);

    if (nextStep === 'SELECT_TOWER') {
      eventBridge.emit(BRIDGE_EVENTS.REACT_DISMISS_TUTORIAL);
    } else if (nextStep === 'PLACE_TOWER') {
      eventBridge.emit(BRIDGE_EVENTS.REACT_ONBOARDING_HIGHLIGHT);
    } else if (nextStep === 'PREP') {
      eventBridge.emit(BRIDGE_EVENTS.REACT_ONBOARDING_CLEAR);
      eventBridge.emit(BRIDGE_EVENTS.REACT_START_PREP);
      setOnboardingStep(null);
    }
  }, []);

  // ── Auto-advance: tower selected during SELECT_TOWER step ──────
  useEffect(() => {
    if (onboardingStep === 'SELECT_TOWER' && selectedTower !== null) {
      handleOnboardingAdvance('PLACE_TOWER');
    }
  }, [selectedTower, onboardingStep, handleOnboardingAdvance]);

  // ── Auto-advance: tower placed during PLACE_TOWER step ─────────
  useEffect(() => {
    const onTowerPlaced = () => {
      if (onboardingStep === 'PLACE_TOWER') {
        eventBridge.emit(BRIDGE_EVENTS.REACT_ONBOARDING_CLEAR);
        setOnboardingStep('TOWER_PLACED');
      }
    };
    eventBridge.on(BRIDGE_EVENTS.BREACH_TOWER_PLACED, onTowerPlaced);
    return () => { eventBridge.off(BRIDGE_EVENTS.BREACH_TOWER_PLACED, onTowerPlaced); };
  }, [onboardingStep]);

  // ── Render ──────────────────────────────────────────────────────
  return (
    <>
      {/* Top HUD bar */}
      <div className="absolute top-0 left-0 right-0 z-40">
        <div className="bg-gray-900/90 border-b border-green-500/30 px-4 py-2 flex items-center justify-between">
          <span className="text-green-400" style={{ ...pixelFont, fontSize: '10px' }}>
            WAVE {wave}/{totalWaves}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-yellow-400" style={{ ...pixelFont, fontSize: '9px' }}>
              BUDGET: ${budget}
            </span>
            <span
              className={securityScore > 40 ? 'text-green-400' : securityScore > 20 ? 'text-amber-400' : 'text-red-400'}
              style={{ ...pixelFont, fontSize: '9px' }}
            >
              DEFENSE: {securityScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Wave intro banner */}
      {waveBannerData && (
        <WaveIntroBanner
          wave={waveBannerData.wave}
          name={waveBannerData.name}
          intro={waveBannerData.intro}
          suggestedTowers={waveBannerData.suggestedTowers}
          threats={waveBannerData.threats}
          onDismiss={() => setWaveBannerData(null)}
        />
      )}

      {/* Threat strip — above tower panel */}
      {currentWaveThreats.length > 0 && !waveBannerData && (
        <div className="absolute left-0 right-0 flex justify-center z-10" style={{ bottom: 160 }}>
          <ThreatStrip threats={currentWaveThreats} />
        </div>
      )}

      {/* Tower selection panel + HUD (bottom bar) */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 backdrop-blur-sm"
        style={{ background: 'rgba(20, 22, 40, 0.92)', borderTop: '2px solid #3a5d8e' }}
      >
        {/* Tower cards row */}
        <div
          className="flex gap-2 px-3 py-2 justify-center flex-wrap items-stretch"
          style={{ borderBottom: '1px solid rgba(58, 93, 142, 0.3)' }}
        >
          {Object.entries(TOWERS)
            .filter(([id]) => availableSet.has(id))
            .map(([id, tower]) => {
              const tooExpensive = budget < tower.cost;
              const isSelected = selectedTower === id;
              const isGameOver = gameState === 'GAMEOVER' || gameState === 'VICTORY';
              const disabled = tooExpensive || isGameOver;
              const isSuggested = currentWaveSuggestedTowers.includes(id);

              return (
                <button
                  key={id}
                  onClick={() => !disabled && handleSelectTower(id as TowerType)}
                  disabled={disabled}
                  style={{
                    transition: 'transform 0.15s ease-out, border-color 0.2s, box-shadow 0.2s, opacity 0.2s',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  }}
                  className={`relative p-2 border-2 rounded text-left w-[140px] ${
                    isSelected
                      ? 'border-yellow-400 bg-yellow-900/30 shadow-[0_0_12px_rgba(255,200,0,0.5)]'
                      : isSuggested
                        ? 'border-yellow-400 animate-pulse shadow-[0_0_8px_rgba(255,200,0,0.4)]'
                        : 'border-gray-600 hover:border-gray-400 hover:bg-gray-800/30'
                  } ${tooExpensive ? 'opacity-50 cursor-not-allowed' : isGameOver ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {isSuggested && (
                    <span className="absolute -top-2 -right-2 text-[6px] bg-yellow-400 text-black px-1.5 py-0.5 font-bold border border-black" style={pixelFont}>
                      HINT
                    </span>
                  )}
                  {/* Icon + Name row */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl leading-none">{TOWER_ICONS[id] ?? '\u{1F6E1}'}</span>
                    <span className="text-[9px] font-bold" style={{ ...pixelFont, color: tower.color }}>
                      {tower.name}
                    </span>
                  </div>
                  {/* Description */}
                  <p className="text-[7px] text-gray-400 leading-relaxed mb-1.5" style={pixelFont}>
                    {tower.desc.split('.')[0]}.
                  </p>
                  {/* Cost badge */}
                  <div className="flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 rounded-full text-[6px] leading-[12px] text-center font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #f5d442, #c9a227)',
                        color: '#3a2e00',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      }}
                    >$</span>
                    <span className="text-[8px] text-gray-300" style={pixelFont}>{tower.cost}</span>
                  </div>
                </button>
              );
            })}
        </div>

        {/* HUD stats row */}
        <div className="flex items-center justify-between px-4 py-1.5" style={pixelFont}>
          <div className={`flex items-center gap-2 ${securityScore <= 25 ? 'animate-pulse' : ''}`}>
            <span className="text-red-400">&#x2764;&#xFE0F;</span>
            <span className="text-[10px] text-red-400">{securityScore}%</span>
            <div className={`w-24 h-2 bg-gray-700 rounded overflow-hidden ${securityScore <= 25 ? 'shadow-[0_0_8px_rgba(255,68,68,0.6)]' : ''}`}>
              <div className="h-full rounded" style={{
                width: `${securityScore}%`,
                background: securityScore > 50
                  ? 'linear-gradient(90deg, #2ecc71, #27ae60)'
                  : securityScore > 25
                  ? 'linear-gradient(90deg, #f39c12, #e67e22)'
                  : 'linear-gradient(90deg, #e74c3c, #c0392b)',
                transition: 'width 300ms ease-out, background 300ms ease-out',
              }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">&#x1F4B0;</span>
            <span className="text-[10px] text-green-400">${budget}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">&#x1F30A;</span>
            <span className="text-[10px] text-blue-400">Wave {wave}/{totalWaves}</span>
          </div>
        </div>
      </div>

      {/* Onboarding overlay */}
      <OnboardingOverlay step={onboardingStep} onAdvance={handleOnboardingAdvance} />
    </>
  );
}
