import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import CharacterPortrait from './CharacterPortrait';
import DialogueBox from './DialogueBox';
import ChoiceButton from './ChoiceButton';
import ScoreMeter from './ScoreMeter';
import FeedbackDisplay from './FeedbackDisplay';
import SceneCounter from './SceneCounter';
import type { Scene, Choice } from '@shared/schema';
import nurseNinaImg from '@assets/generated_images/Nurse_Nina_pixel_portrait_6f9bfea3.png';

interface GameContainerProps {
  scenes: Scene[];
}

export default function GameContainer({ scenes }: GameContainerProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [sessionLog, setSessionLog] = useState<Array<{
    sceneId: string;
    choice: string;
    score: number;
    timestamp: Date;
  }>>([]);

  const currentScene = scenes[currentSceneIndex];
  const maxScore = scenes.reduce(
    (total, scene) => total + Math.max(...scene.choices.map(c => c.score)),
    0
  );

  useEffect(() => {
    const savedLog = localStorage.getItem('hipaa-game-log');
    if (savedLog) {
      try {
        setSessionLog(JSON.parse(savedLog));
      } catch (e) {
        console.error('Failed to load session log:', e);
      }
    }
  }, []);

  const handleChoiceClick = (choice: Choice) => {
    setSelectedChoice(choice);
    setScore(prev => prev + choice.score);
    
    const logEntry = {
      sceneId: currentScene.id,
      choice: choice.text,
      score: choice.score,
      timestamp: new Date(),
    };
    
    const updatedLog = [...sessionLog, logEntry];
    setSessionLog(updatedLog);
    localStorage.setItem('hipaa-game-log', JSON.stringify(updatedLog));
  };

  const handleNextScene = () => {
    if (currentScene.isEnd) {
      setGameComplete(true);
    } else {
      setCurrentSceneIndex(prev => prev + 1);
      setSelectedChoice(null);
    }
  };

  const handleRestart = () => {
    setCurrentSceneIndex(0);
    setScore(0);
    setSelectedChoice(null);
    setGameComplete(false);
    setSessionLog([]);
    localStorage.removeItem('hipaa-game-log');
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
              <div className="text-game-success text-lg mb-4" data-testid="text-passed">
                ✓ PASSED
              </div>
            ) : (
              <div className="text-game-warning text-lg mb-4" data-testid="text-review">
                ⚠ REVIEW RECOMMENDED
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
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <SceneCounter current={currentSceneIndex + 1} total={scenes.length} />
      </div>
      
      <ScoreMeter score={score} maxScore={maxScore} />
      
      <CharacterPortrait src={nurseNinaImg} alt={currentScene.character} />
      
      <DialogueBox
        character={currentScene.character}
        dialogue={currentScene.dialogue}
      />
      
      <div className="space-y-2 mb-4">
        {currentScene.choices.map((choice, index) => (
          <ChoiceButton
            key={index}
            text={choice.text}
            onClick={() => handleChoiceClick(choice)}
            disabled={selectedChoice !== null}
          />
        ))}
      </div>
      
      {selectedChoice && (
        <>
          <FeedbackDisplay
            feedback={selectedChoice.feedback}
            type={getFeedbackType(selectedChoice)}
          />
          
          <div className="mt-6 text-center">
            <Button
              onClick={handleNextScene}
              size="lg"
              className="text-sm"
              data-testid="button-next"
            >
              {currentScene.isEnd ? 'VIEW RESULTS' : 'NEXT SCENE'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
