import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import CharacterPortrait from './CharacterPortrait';
import DialogueBox from './DialogueBox';
import ChoiceButton from './ChoiceButton';
import PrivacyMeter from './PrivacyMeter';
import FeedbackDisplay from './FeedbackDisplay';
import SceneCounter from './SceneCounter';
import type { Scene, Choice } from '@shared/schema';
import nurseNinaImg from '@assets/generated_images/Nurse_Nina_pixel_portrait_6f9bfea3.png';

type GamePhase = 'dialogue' | 'choices' | 'feedback';

interface GameContainerProps {
  scenes: Scene[];
  onComplete?: () => void;
  onGameOver?: (finalScore: number) => void;
}

export default function GameContainer({ scenes, onComplete, onGameOver }: GameContainerProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [privacyScore, setPrivacyScore] = useState(100);
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

    const privacyChange = choice.score < 0 ? choice.score : choice.score > 0 ? 5 : 0;
    const newPrivacyScore = Math.max(0, Math.min(100, privacyScore + privacyChange));
    setPrivacyScore(newPrivacyScore);

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

  useEffect(() => {
    if (gamePhase !== 'choices' || !currentScene) return;

    const handleNumberKey = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= currentScene.choices.length) {
        const choice = currentScene.choices[num - 1];
        if (choice && !selectedChoice) {
          handleChoiceClick(choice);
        }
      }
    };

    window.addEventListener('keydown', handleNumberKey);
    return () => window.removeEventListener('keydown', handleNumberKey);
  }, [gamePhase, currentScene, selectedChoice]);

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

  return (
    <div className="relative min-h-screen bg-[#0f0f1e] pb-32">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <SceneCounter current={currentSceneIndex + 1} total={scenes.length} />
        </div>

        <PrivacyMeter privacyScore={privacyScore} />

        {gamePhase === 'dialogue' && (
          <DialogueBox
            character={currentScene.character}
            dialogue={currentScene.dialogue}
            isComplete={dialogueComplete}
            onComplete={handleDialogueComplete}
            onAdvance={handleDialogueAdvance}
            portraitImage={nurseNinaImg}
          />
        )}

        {gamePhase === 'choices' && (
          <div className="space-y-3">
            <div className="bg-[#1a1a2e] border-4 border-[#FF6B9D] p-6 mb-4">
              <p className="font-['Press_Start_2P'] text-white text-xs leading-relaxed">
                {currentScene.dialogue}
              </p>
            </div>
            {currentScene.choices.map((choice, index) => (
              <ChoiceButton
                key={index}
                text={choice.text}
                onClick={() => handleChoiceClick(choice)}
                disabled={!!selectedChoice}
                numberKey={index + 1}
              />
            ))}
          </div>
        )}

        {gamePhase === 'feedback' && selectedChoice && (
          <div>
            <div className="bg-[#1a1a2e] border-4 border-[#FF6B9D] p-6 mb-4">
              <p className="font-['Press_Start_2P'] text-white text-xs leading-relaxed">
                {currentScene.dialogue}
              </p>
            </div>
            
            <FeedbackDisplay
              feedback={selectedChoice.feedback}
              type={getFeedbackType(selectedChoice)}
              scoreChange={selectedChoice.score}
            />

            <div className="mt-6 text-center">
              <Button
                onClick={handleNextScene}
                size="lg"
                className="font-['Press_Start_2P'] text-xs bg-[#FF6B9D] hover:bg-[#ff8fb5] border-4 border-[#FF6B9D]"
                data-testid="button-next"
              >
                {currentScene.isEnd ? 'VIEW RESULTS' : 'NEXT SCENE →'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}