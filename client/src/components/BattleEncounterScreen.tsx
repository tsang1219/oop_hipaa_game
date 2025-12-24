import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PlayerBackSprite from './PlayerBackSprite';
import NPCSprite from './NPCSprite';

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
}: BattleEncounterScreenProps) {
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
          onChoiceSelect?.(choices[num - 1].index);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isTyping, phase, dialogue, choices, onDialogueComplete, onAdvance, onChoiceSelect]);

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
    <div className="fixed inset-0 z-40 bg-[#0a0a1a] flex flex-col" data-testid="battle-encounter-screen">
      {/* Battle Arena - Top section with sprites */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background gradient for arena effect */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center bottom, #1a1a3a 0%, #0a0a1a 70%)',
          }}
        />
        
        {/* Arena floor lines for depth */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2">
          <div 
            className="w-full h-full"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 20px, rgba(255,107,157,0.1) 20px, rgba(255,107,157,0.1) 21px)',
              transform: 'perspective(200px) rotateX(60deg)',
              transformOrigin: 'bottom',
            }}
          />
        </div>

        {/* NPC - Top Right (opponent position) */}
        <div 
          className="absolute top-8 right-8 md:top-12 md:right-16 animate-pulse"
          style={{ animationDuration: '3s' }}
          data-testid="npc-battle-sprite"
        >
          {/* NPC platform/shadow */}
          <div 
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/30 rounded-full blur-sm"
          />
          
          {/* NPC Name plate */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="bg-[#1a1a2e] border-2 border-[#FF6B9D] px-3 py-1 rounded">
              <span className="font-['Press_Start_2P'] text-[#FF6B9D] text-xs">
                {npcName}
              </span>
            </div>
          </div>
          
          {/* NPC Sprite - Larger, facing player - reusing NPCSprite component */}
          <div className="relative w-24 h-24 md:w-32 md:h-32" style={{ transform: 'scale(3)', transformOrigin: 'center center' }}>
            <NPCSprite npcId={npcId} direction="down" />
          </div>
        </div>

        {/* Player - Bottom Left (from behind) */}
        <div 
          className="absolute bottom-16 left-8 md:bottom-24 md:left-16"
          data-testid="player-battle-sprite"
        >
          {/* Player platform/shadow */}
          <div 
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/30 rounded-full blur-sm"
          />
          
          {/* Player Sprite - From behind, facing NPC */}
          <PlayerBackSprite characterType="blue" size={80} />
        </div>

        {/* VS Effect - Optional flair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
          <span className="font-['Press_Start_2P'] text-4xl text-[#FF6B9D]">VS</span>
        </div>
      </div>

      {/* Dialogue/Choice Box - Bottom section */}
      <div className="relative">
        {phase === 'dialogue' && (
          <Card 
            className={`mx-4 mb-4 bg-[#1a1a2e] border-4 border-[#FF6B9D] shadow-lg cursor-pointer hover-elevate`}
            onClick={handleDialogueClick}
            data-testid="container-battle-dialogue"
          >
            <div className="p-6">
              <div className="mb-2">
                <span className="font-['Press_Start_2P'] text-[#FF6B9D] text-sm">
                  {npcName}
                </span>
              </div>
              <div className="font-['Press_Start_2P'] text-white text-xs leading-relaxed min-h-[4rem]">
                {displayedText}
                {isTyping && <span className="animate-pulse">▼</span>}
              </div>
              {!isTyping && (
                <div className="mt-4 text-right">
                  <span className="font-['Press_Start_2P'] text-[#FF6B9D] text-xs animate-pulse">
                    Press SPACE ▼
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        {phase === 'choices' && (
          <div className="mx-4 mb-4 space-y-3">
            {/* Repeat dialogue context */}
            <Card className="bg-[#1a1a2e] border-4 border-[#FF6B9D] p-4">
              <p className="font-['Press_Start_2P'] text-white text-xs leading-relaxed">
                {dialogue}
              </p>
            </Card>
            
            {/* Choice buttons in battle menu style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {choices.map((choice, idx) => (
                <Button
                  key={choice.index}
                  onClick={() => onChoiceSelect?.(choice.index)}
                  className="w-full bg-[#16213e] border-2 border-[#FF6B9D] hover:bg-[#1a1a3e] hover:border-[#ff8fb5] text-left p-4 h-auto"
                  data-testid={`choice-button-${idx + 1}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-['Press_Start_2P'] text-[#FF6B9D] text-xs flex-shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="font-['Press_Start_2P'] text-white text-xs leading-relaxed text-left">
                      {choice.text}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {phase === 'feedback' && feedback && (
          <div className="mx-4 mb-4 space-y-3">
            <Card className={`bg-[#1a1a2e] border-4 ${getFeedbackBorderColor()} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-['Press_Start_2P'] text-xs ${
                  feedback.type === 'correct' ? 'text-green-400' :
                  feedback.type === 'partial' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {feedback.type === 'correct' ? '✓ CORRECT' :
                   feedback.type === 'partial' ? '~ PARTIAL' :
                   '✗ INCORRECT'}
                </span>
                <span className={`font-['Press_Start_2P'] text-xs ${
                  feedback.scoreChange >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {feedback.scoreChange >= 0 ? `+${feedback.scoreChange}` : feedback.scoreChange}
                </span>
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
                CONTINUE →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
