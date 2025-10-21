import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
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
  onComplete?: () => void;
  storageKey?: string;
}

export default function GameContainer({ scenes, onComplete, storageKey = 'hipaa-game' }: GameContainerProps) {
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
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const currentScene = scenes[currentSceneIndex];
  const maxScore = scenes.reduce(
    (total, scene) => total + Math.max(...scene.choices.map(c => c.score)),
    0
  );

  useEffect(() => {
    const savedProgress = localStorage.getItem(`${storageKey}-progress`);
    const savedLog = localStorage.getItem(`${storageKey}-log`);

    let loadedLog: typeof sessionLog = [];

    if (savedLog) {
      try {
        loadedLog = JSON.parse(savedLog);
        setSessionLog(loadedLog);
      } catch (e) {
        console.error('Failed to load session log:', e);
      }
    }

    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        const hasProgress = progress.currentSceneIndex > 0 || progress.score !== 0 || loadedLog.length > 0;

        if (hasProgress) {
          setShowResumePrompt(true);
        }
      } catch (e) {
        console.error('Failed to load progress:', e);
      }
    }
  }, [storageKey]);

  const resumeProgress = () => {
    const savedProgress = localStorage.getItem(`${storageKey}-progress`);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        const safeSceneIndex = Math.min(progress.currentSceneIndex, scenes.length - 1);
        setCurrentSceneIndex(Math.max(0, safeSceneIndex));
        setScore(progress.score);
        setGameComplete(progress.gameComplete);

        if (progress.selectedChoiceText) {
          const scene = scenes[safeSceneIndex];
          if (scene) {
            const choice = scene.choices.find(c => c.text === progress.selectedChoiceText);
            if (choice) {
              setSelectedChoice(choice);
            }
          }
        }
      } catch (e) {
        console.error('Failed to resume progress:', e);
      }
    }
    setShowResumePrompt(false);
  };

  const startFresh = () => {
    localStorage.removeItem(`${storageKey}-progress`);
    localStorage.removeItem(`${storageKey}-log`);
    setCurrentSceneIndex(0);
    setScore(0);
    setSelectedChoice(null);
    setGameComplete(false);
    setSessionLog([]);
    setShowResumePrompt(false);
  };

  const handleChoiceClick = (choice: Choice) => {
    const sceneAlreadyAnswered = sessionLog.some(log => log.sceneId === currentScene.id);
    if (sceneAlreadyAnswered || selectedChoice !== null) {
      return;
    }

    setSelectedChoice(choice);
    const newScore = score + choice.score;
    setScore(newScore);

    const logEntry = {
      sceneId: currentScene.id,
      choice: choice.text,
      score: choice.score,
      timestamp: new Date(),
    };

    const updatedLog = [...sessionLog, logEntry];
    setSessionLog(updatedLog);
    localStorage.setItem(`${storageKey}-log`, JSON.stringify(updatedLog));
  };

  useEffect(() => {
    const progress = {
      currentSceneIndex,
      score,
      gameComplete,
      selectedChoiceText: selectedChoice?.text || null,
    };
    localStorage.setItem(`${storageKey}-progress`, JSON.stringify(progress));
  }, [currentSceneIndex, score, gameComplete, selectedChoice, storageKey]);

  const handleNextScene = () => {
    if (currentScene.isEnd) {
      setGameComplete(true);
      onComplete?.();
    } else {
      if (selectedChoice?.nextSceneId) {
        const nextSceneIndex = scenes.findIndex(s => s.id === selectedChoice.nextSceneId);
        if (nextSceneIndex !== -1) {
          setCurrentSceneIndex(nextSceneIndex);
        } else {
          const nextIndex = currentSceneIndex + 1;
          if (nextIndex >= scenes.length) {
            onComplete?.();
          } else {
            setCurrentSceneIndex(nextIndex);
          }
        }
      } else {
        const nextIndex = currentSceneIndex + 1;
        if (nextIndex >= scenes.length) {
          onComplete?.();
        } else {
          setCurrentSceneIndex(nextIndex);
        }
      }
      setSelectedChoice(null);
    }
  };

  const handleRestart = () => {
    setCurrentSceneIndex(0);
    setScore(0);
    setSelectedChoice(null);
    setGameComplete(false);
    setSessionLog([]);
    localStorage.removeItem(`${storageKey}-log`);
    localStorage.removeItem(`${storageKey}-progress`);
  };

  const getFeedbackType = (choice: Choice): 'correct' | 'partial' | 'incorrect' => {
    if (choice.score >= 3) return 'correct';
    if (choice.score >= 1) return 'partial';
    return 'incorrect';
  };

  const exportToJSON = () => {
    const exportData = {
      completionDate: new Date().toISOString(),
      finalScore: score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      sessionLog: sessionLog.map(log => ({
        sceneId: log.sceneId,
        choice: log.choice,
        score: log.score,
        timestamp: new Date(log.timestamp).toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hipaa-training-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeCsvValue = (value: string | number): string => {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportToCSV = () => {
    const headers = ['Scene ID', 'Choice Made', 'Score', 'Timestamp'];
    const rows = sessionLog.map(log => [
      escapeCsvValue(log.sceneId),
      escapeCsvValue(log.choice),
      escapeCsvValue(log.score),
      escapeCsvValue(new Date(log.timestamp).toISOString()),
    ]);

    const csvContent = [
      headers.map(h => escapeCsvValue(h)).join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total Score,${escapeCsvValue(score)}`,
      `Max Score,${escapeCsvValue(maxScore)}`,
      `Percentage,${escapeCsvValue(Math.round((score / maxScore) * 100))}%`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hipaa-training-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (showResumePrompt) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="bg-card border-4 border-game-border p-8 text-center" style={{ boxShadow: 'var(--shadow)' }}>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-6" data-testid="text-resume-prompt">
            CONTINUE TRAINING?
          </h1>

          <CharacterPortrait src={nurseNinaImg} alt="Nurse Nina" />

          <p className="text-sm text-foreground mb-6">
            We found a saved training session. Would you like to continue where you left off or start fresh?
          </p>

          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <Button
              onClick={resumeProgress}
              size="lg"
              className="text-sm"
              data-testid="button-resume"
            >
              RESUME TRAINING
            </Button>
            <Button
              onClick={startFresh}
              variant="outline"
              size="lg"
              className="text-sm"
              data-testid="button-start-fresh"
            >
              START FRESH
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

          <div className="flex flex-col md:flex-row gap-3 justify-center items-center mb-4">
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="lg"
              className="text-xs md:text-sm"
              data-testid="button-export-csv"
            >
              EXPORT CSV
            </Button>
            <Button
              onClick={exportToJSON}
              variant="outline"
              size="lg"
              className="text-xs md:text-sm"
              data-testid="button-export-json"
            >
              EXPORT JSON
            </Button>
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
            disabled={selectedChoice !== null || sessionLog.some(log => log.sceneId === currentScene.id)}
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