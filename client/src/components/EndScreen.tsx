import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, XCircle } from 'lucide-react';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';

interface EndScreenProps {
  isWin: boolean;
  finalScore: number;
  scenariosCompleted: number;
  totalScenarios: number;
  timeElapsed: string;
  onPlayAgain: () => void;
}

export default function EndScreen({
  isWin,
  finalScore,
  scenariosCompleted,
  totalScenarios,
  timeElapsed,
  onPlayAgain,
}: EndScreenProps) {
  const [showIcon, setShowIcon] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, {
      key: isWin ? 'sfx_wave_start' : 'sfx_breach_alert',
      volume: 0.7
    });
  }, [isWin]);

  useEffect(() => {
    setTimeout(() => setShowIcon(true), 200);
    setTimeout(() => setShowTitle(true), 600);
    setTimeout(() => setShowMessage(true), 1000);
    setTimeout(() => setShowStats(true), 1400);
    setTimeout(() => setShowButton(true), 1800);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 font-['Press_Start_2P']">
      <div className="max-w-2xl w-full bg-card border-4 border-primary rounded-[4px] p-8 text-center space-y-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {isWin ? (
          <>
            <div style={{
              opacity: showIcon ? 1 : 0,
              transform: showIcon ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
              transition: 'all 500ms ease-out'
            }}>
              <div className="flex justify-center">
                <Trophy className="w-24 h-24 text-primary animate-bounce" data-testid="trophy-icon" />
              </div>
            </div>
            <div style={{
              opacity: showTitle ? 1 : 0,
              transform: showTitle ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 500ms ease-out'
            }}>
              <h1 className="text-[14px] font-bold text-primary" data-testid="result-title">
                PRIVACY GUARDIAN
              </h1>
            </div>
            <div style={{
              opacity: showMessage ? 1 : 0,
              transform: showMessage ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 500ms ease-out'
            }}>
              <p className="text-[10px] leading-relaxed text-foreground">
                You've honored the trust patients placed in this organization.
                Every room cleared represents lives quietly protected—patients who
                will never know your name, but whose trust you kept.
              </p>
            </div>
          </>
        ) : (
          <>
            <div style={{
              opacity: showIcon ? 1 : 0,
              transform: showIcon ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
              transition: 'all 500ms ease-out'
            }}>
              <div className="flex justify-center">
                <XCircle className="w-24 h-24 text-destructive animate-pulse" data-testid="fail-icon" />
              </div>
            </div>
            <div style={{
              opacity: showTitle ? 1 : 0,
              transform: showTitle ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 500ms ease-out'
            }}>
              <h1 className="text-[14px] font-bold text-destructive" data-testid="result-title">
                PRIVACY BREACH!
              </h1>
            </div>
            <div style={{
              opacity: showMessage ? 1 : 0,
              transform: showMessage ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 500ms ease-out'
            }}>
              <p className="text-[10px] leading-relaxed text-foreground">
                Community Trust has been destroyed. Patients are hiding symptoms,
                skipping treatment, suffering alone. In the real world, this means
                lives lost—not just regulatory fines. Time to rebuild that trust.
              </p>
            </div>
          </>
        )}

        <div style={{
          opacity: showStats ? 1 : 0,
          transform: showStats ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 500ms ease-out'
        }}>
          <div className="bg-card-foreground/5 border-2 border-primary/30 rounded-[4px] p-6 space-y-3">
            <h2 className="text-[12px] font-bold text-primary mb-4">FINAL STATS</h2>

            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted-foreground">Community Trust:</span>
              <span
                className={`font-bold ${finalScore >= 70 ? 'text-green-500' : finalScore >= 40 ? 'text-orange-500' : 'text-pink-500'}`}
                data-testid="final-score"
              >
                {finalScore}%
              </span>
            </div>

            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted-foreground">Scenarios Completed:</span>
              <span className="font-bold text-foreground" data-testid="scenarios-completed">
                {scenariosCompleted}/{totalScenarios}
              </span>
            </div>

            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted-foreground">Time Elapsed:</span>
              <span className="font-bold text-foreground" data-testid="time-elapsed">
                {timeElapsed}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          opacity: showButton ? 1 : 0,
          transform: showButton ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 500ms ease-out'
        }}>
          <div className="space-y-3">
            <Button
              onClick={onPlayAgain}
              size="lg"
              className="w-full text-[10px] rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              data-testid="button-play-again"
            >
              {isWin ? '🔄 PLAY AGAIN' : '🔄 TRY AGAIN'}
            </Button>

            {isWin && (
              <p className="text-[8px] text-muted-foreground italic leading-relaxed">
                "Remember: HIPAA isn't about memorizing rules. It's about making
                privacy-first decisions every single day. Stay vigilant!"
                <br />
                — Chief Compliance Officer
              </p>
            )}

            {!isWin && (
              <p className="text-[8px] text-muted-foreground italic leading-relaxed">
                "Every HIPAA violation you make in this game would be a career-ending
                mistake in real life. Learn from these errors!"
                <br />
                — Chief Compliance Officer
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
