import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import CharacterPortrait from './CharacterPortrait';
import BattleEncounterScreen from './BattleEncounterScreen';
import type { Scene, Choice } from '@shared/schema';
import nurseNinaImg from '@assets/generated_images/Nurse_Nina_pixel_portrait_6f9bfea3.png';

type GamePhase = 'dialogue' | 'choices' | 'feedback';

interface GameContainerProps {
  scenes: Scene[];
  onComplete?: () => void;
  onGameOver?: (finalScore: number) => void;
  npcId?: string;
  npcName?: string;
  initialPrivacyScore?: number;
  onPrivacyScoreChange?: (score: number) => void;
}

export default function GameContainer({ scenes, onComplete, onGameOver, npcId, npcName, initialPrivacyScore = 100, onPrivacyScoreChange }: GameContainerProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [privacyScore, setPrivacyScore] = useState(initialPrivacyScore);
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>('dialogue');
  const [dialogueComplete, setDialogueComplete] = useState(false);

  const currentScene = scenes[currentSceneIndex];
  const maxScore = scenes.reduce(
    (total, scene) => total + Math.max(...scene.choices.map(c => c.score)),
    0
  );


  const handleChoiceClick = (choice: Choice) => {
    if (selectedChoice) return;

    setSelectedChoice(choice);
    const newScore = score + choice.score;
    setScore(newScore);

    const privacyChange = choice.score < 0 ? choice.score : 0;
    const newPrivacyScore = Math.max(0, Math.min(100, privacyScore + privacyChange));
    setPrivacyScore(newPrivacyScore);
    onPrivacyScoreChange?.(newPrivacyScore);

    if (newPrivacyScore <= 0) {
      onGameOver?.(0);
      return;
    }

    setGamePhase('feedback');
  };

  const handleDialogueComplete = () => {
    setDialogueComplete(true);
  };

  const handleDialogueAdvance = () => {
    setGamePhase('choices');
  };


  const handleNextScene = () => {
    if (currentScene.isEnd) {
      setGameComplete(true);
      localStorage.setItem('final-privacy-score', privacyScore.toString());
      onComplete?.();
    } else {
      if (selectedChoice?.nextSceneId) {
        const nextSceneIndex = scenes.findIndex(s => s.id === selectedChoice.nextSceneId);
        if (nextSceneIndex !== -1) {
          setCurrentSceneIndex(nextSceneIndex);
        } else {
          const nextIndex = currentSceneIndex + 1;
          if (nextIndex >= scenes.length) {
            localStorage.setItem('final-privacy-score', privacyScore.toString());
            onComplete?.();
          } else {
            setCurrentSceneIndex(nextIndex);
          }
        }
      } else {
        const nextIndex = currentSceneIndex + 1;
        if (nextIndex >= scenes.length) {
          localStorage.setItem('final-privacy-score', privacyScore.toString());
          onComplete?.();
        } else {
          setCurrentSceneIndex(nextIndex);
        }
      }
      setSelectedChoice(null);
      setGamePhase('dialogue');
      setDialogueComplete(false);
    }
  };

  const handleRestart = () => {
    setCurrentSceneIndex(0);
    setScore(0);
    setSelectedChoice(null);
    setGameComplete(false);
  };

  const getFeedbackType = (choice: Choice): 'correct' | 'partial' | 'incorrect' => {
    if (choice.score >= 3) return 'correct';
    if (choice.score >= 1) return 'partial';
    return 'incorrect';
  };

  if (gameComplete) {
    const percentage = Math.round((score / maxScore) * 100);
    const passed = percentage >= 70;

    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="bg-card border-4 border-game-border p-8 text-center" style={{ boxShadow: 'var(--shadow)' }}>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-6" data-testid="text-game-complete">
            TRAINING COMPLETE
          </h1>

          <CharacterPortrait src={nurseNinaImg} alt="Nurse Nina" />

          <div className="mb-6">
            <p className="text-sm text-foreground mb-4">
              {passed
                ? "Excellent work! You've demonstrated strong understanding of HIPAA Privacy Rule compliance."
                : "You've completed the training. Review the scenarios to strengthen your HIPAA knowledge."}
            </p>

            <div className="bg-muted p-4 border-2 border-game-border mb-4">
              <div className="text-2xl font-bold text-foreground mb-2" data-testid="text-final-score">
                {score} / {maxScore}
              </div>
              <div className="text-sm text-muted-foreground">
                {percentage}% Compliance Score
              </div>
            </div>

            {passed ? (
              <div className="flex items-center justify-center gap-2 text-game-success text-lg mb-4" data-testid="text-passed">
                <CheckCircle2 className="w-6 h-6" />
                <span>PASSED</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-game-warning text-lg mb-4" data-testid="text-review">
                <AlertTriangle className="w-6 h-6" />
                <span>REVIEW RECOMMENDED</span>
              </div>
            )}
          </div>

          <Button
            onClick={handleRestart}
            size="lg"
            className="text-sm"
            data-testid="button-restart"
          >
            RESTART TRAINING
          </Button>
        </div>
      </div>
    );
  }

  const handleBattleChoiceSelect = (choiceIndex: number) => {
    const choice = currentScene.choices[choiceIndex];
    if (choice) {
      handleChoiceClick(choice);
    }
  };

  const battleChoices = currentScene.choices.map((choice, idx) => ({
    text: choice.text,
    index: idx,
  }));

  const battleFeedback = selectedChoice ? {
    text: selectedChoice.feedback,
    type: getFeedbackType(selectedChoice),
    scoreChange: selectedChoice.score,
  } : null;

  return (
    <div className="fixed inset-0 z-40">
      {/* Dialogue Overlay — room visible through transparent wrapper */}
      <BattleEncounterScreen
        npcId={npcId || currentScene.character.toLowerCase().replace(/\s+/g, '_')}
        npcName={npcName || currentScene.character}
        dialogue={currentScene.dialogue}
        choices={gamePhase === 'choices' ? battleChoices : undefined}
        feedback={gamePhase === 'feedback' ? battleFeedback : null}
        onChoiceSelect={handleBattleChoiceSelect}
        onAdvance={gamePhase === 'dialogue' ? handleDialogueAdvance : gamePhase === 'feedback' ? handleNextScene : undefined}
        onDialogueComplete={handleDialogueComplete}
        phase={gamePhase}
        privacyScore={privacyScore}
      />
    </div>
  );
}
