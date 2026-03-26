import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import NPCSprite from './NPCSprite';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';

interface BattleEncounterScreenProps {
  npcId: string;
  npcName: string;
  dialogue: string;
  choices?: { text: string; index: number }[];
  feedback?: { text: string; type: 'correct' | 'partial' | 'incorrect'; scoreChange: number } | null;
  onChoiceSelect?: (choiceIndex: number) => void;
  onAdvance?: () => void;
  onDialogueComplete?: () => void;
  phase: 'dialogue' | 'choices' | 'feedback';
  privacyScore?: number;
}

export default function BattleEncounterScreen({
  npcId,
  npcName,
  dialogue,
  choices = [],
  feedback = null,
  onChoiceSelect,
  onAdvance,
  onDialogueComplete,
  phase,
  privacyScore,
}: BattleEncounterScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [feedbackFlash, setFeedbackFlash] = useState<'correct' | 'incorrect' | 'partial' | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsTyping(true);
  }, [dialogue]);

  useEffect(() => {
    if (currentIndex < dialogue.length) {
      const timer = setTimeout(() => {
        setDisplayedText(dialogue.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 25);
      return () => clearTimeout(timer);
    } else if (isTyping) {
      setIsTyping(false);
      onDialogueComplete?.();
    }
  }, [currentIndex, dialogue, isTyping, onDialogueComplete]);

  useEffect(() => {
    if (phase === 'choices') {
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.35 });
    }
  }, [phase]);

  useEffect(() => {
    if (feedback) {
      if (feedback.type === 'correct') {
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_tower_place', volume: 0.55 });
      } else if (feedback.type === 'incorrect') {
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_breach_alert', volume: 0.45 });
      } else {
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.4 });
      }
      setFeedbackFlash(feedback.type);
      setTimeout(() => setFeedbackFlash(null), 400);
    }
  }, [feedback]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (isTyping) {
          setDisplayedText(dialogue);
          setCurrentIndex(dialogue.length);
          setIsTyping(false);
          onDialogueComplete?.();
        } else if (phase === 'dialogue') {
          onAdvance?.();
        }
      }

      if (phase === 'choices' && !isTyping) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= choices.length) {
          eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.4 });
          onChoiceSelect?.(choices[num - 1].index);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isTyping, phase, dialogue, choices, onDialogueComplete, onAdvance, onChoiceSelect]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only handle clicks on the overlay background itself, not the panel
    if (e.target === e.currentTarget) {
      if (isTyping) {
        setDisplayedText(dialogue);
        setCurrentIndex(dialogue.length);
        setIsTyping(false);
        onDialogueComplete?.();
      } else if (phase === 'dialogue') {
        onAdvance?.();
      }
    }
  };

  const handleDialogueClick = () => {
    if (isTyping) {
      setDisplayedText(dialogue);
      setCurrentIndex(dialogue.length);
      setIsTyping(false);
      onDialogueComplete?.();
    } else if (phase === 'dialogue') {
      onAdvance?.();
    }
  };

  const getFeedbackBorderColor = () => {
    if (!feedback) return 'border-[#FF6B9D]';
    switch (feedback.type) {
      case 'correct': return 'border-green-500';
      case 'partial': return 'border-yellow-500';
      case 'incorrect': return 'border-red-500';
      default: return 'border-[#FF6B9D]';
    }
  };

  return (
    <>
    <style>{`
      @keyframes feedback-flash {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
    `}</style>
    <div
      className={`absolute inset-0 z-40 flex flex-col justify-end transition-all duration-200 ${
        isVisible ? 'bg-black/60' : 'bg-black/0'
      }`}
      onClick={handleOverlayClick}
      data-testid="battle-encounter-screen"
    >
      {/* Feedback flash overlay */}
      {feedbackFlash && (
        <div
          className="absolute inset-0 pointer-events-none z-50 transition-opacity duration-400"
          style={{
            backgroundColor: feedbackFlash === 'correct' ? 'rgba(68, 255, 68, 0.15)'
              : feedbackFlash === 'incorrect' ? 'rgba(255, 68, 68, 0.15)'
              : 'rgba(255, 200, 68, 0.12)',
            animation: 'feedback-flash 0.4s ease-out forwards',
          }}
        />
      )}

      {/* Bottom-anchored dialogue panel */}
      <div
        className={`relative bg-[#1a1a2e] border-t-4 border-[#FF6B9D] max-h-[60vh] overflow-y-auto transform transition-all duration-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: NPC portrait + name + optional privacy meter */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          {/* NPC portrait */}
          <div
            className="flex-shrink-0 w-12 h-12 bg-[#16213e] border-2 border-[#FF6B9D] rounded flex items-center justify-center overflow-hidden"
            data-testid="npc-battle-sprite"
          >
            <div className="w-10 h-10">
              <NPCSprite npcId={npcId} direction="down" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <span className="font-['Press_Start_2P'] text-[#FF6B9D] text-sm">
              {npcName}
            </span>
          </div>

          {/* Compact privacy meter in header */}
          {privacyScore !== undefined && (
            <div className="flex-shrink-0 w-32">
              <div className="flex items-center gap-1">
                <span className="font-['Press_Start_2P'] text-[8px] text-[#FF6B9D]">TRUST</span>
                <div className="flex-1 h-3 bg-[#16213e] border border-[#FF6B9D] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      privacyScore >= 70 ? 'bg-[#4CAF50]' :
                      privacyScore >= 40 ? 'bg-[#FFA726]' :
                      'bg-[#FF6B9D]'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, privacyScore))}%` }}
                  />
                </div>
                <span className="font-['Press_Start_2P'] text-[8px] text-white">
                  {Math.round(privacyScore)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dialogue text */}
        {phase === 'dialogue' && (
          <div
            className="px-4 pb-4 cursor-pointer"
            onClick={handleDialogueClick}
            data-testid="container-battle-dialogue"
          >
            <div className="font-['Press_Start_2P'] text-white text-xs leading-relaxed min-h-[3rem]">
              {displayedText}
              {isTyping && <span className="animate-pulse">|</span>}
            </div>
            {!isTyping && (
              <div className="mt-3 text-right">
                <span className="font-['Press_Start_2P'] text-[#FF6B9D] text-[10px] animate-pulse">
                  SPACE / Click to continue ...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Choices */}
        {phase === 'choices' && (
          <div className="px-4 pb-4">
            {/* Repeat dialogue context */}
            <div className="mb-3">
              <p className="font-['Press_Start_2P'] text-white text-xs leading-relaxed">
                {dialogue}
              </p>
            </div>

            {/* Choice buttons — single column, full width */}
            <div className="flex flex-col gap-2">
              {choices.map((choice, idx) => (
                <Button
                  key={choice.index}
                  onClick={() => {
                    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.4 });
                    onChoiceSelect?.(choice.index);
                  }}
                  className="w-full bg-[#16213e] border-2 border-[#FF6B9D] hover:bg-[#1a1a3e] hover:border-[#ff8fb5] text-left p-3 h-auto"
                  data-testid={`choice-button-${idx + 1}`}
                >
                  <div className="flex items-start gap-2 w-full">
                    <span className="font-['Press_Start_2P'] text-[#FF6B9D] text-[10px] flex-shrink-0">
                      {idx + 1}.
                    </span>
                    <span
                      className="font-['Press_Start_2P'] text-white text-[10px] leading-relaxed text-left"
                      style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
                    >
                      {choice.text}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        {phase === 'feedback' && feedback && (
          <div className="px-4 pb-4">
            <Card
              className={`bg-[#1a1a2e] border-4 ${getFeedbackBorderColor()} p-4 mb-3`}
              style={{
                boxShadow: feedback.type === 'correct' ? '0 0 20px rgba(68, 255, 68, 0.4)'
                  : feedback.type === 'incorrect' ? '0 0 20px rgba(255, 68, 68, 0.4)'
                  : '0 0 20px rgba(255, 200, 68, 0.3)',
                transition: 'box-shadow 300ms ease-out'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-['Press_Start_2P'] text-xs ${
                  feedback.type === 'correct' ? 'text-green-400' :
                  feedback.type === 'partial' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {feedback.type === 'correct' ? 'CORRECT' :
                   feedback.type === 'partial' ? '~ PARTIAL' :
                   'INCORRECT'}
                </span>
                {feedback.scoreChange < 0 && (
                  <span className="font-['Press_Start_2P'] text-xs text-red-400">
                    {feedback.scoreChange} trust
                  </span>
                )}
              </div>
              <p className="font-['Press_Start_2P'] text-white text-xs leading-relaxed">
                {feedback.text}
              </p>
            </Card>

            <div className="text-center">
              <Button
                onClick={onAdvance}
                className="font-['Press_Start_2P'] text-xs bg-[#FF6B9D] hover:bg-[#ff8fb5] border-4 border-[#FF6B9D]"
                data-testid="button-next-scene"
              >
                CONTINUE
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
