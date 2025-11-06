import { Progress } from '@/components/ui/progress';

interface PrivacyMeterProps {
  privacyScore: number;
}

export default function PrivacyMeter({ privacyScore }: PrivacyMeterProps) {
  const percentage = Math.max(0, Math.min(100, privacyScore));
  
  const getColor = () => {
    if (percentage >= 70) return 'bg-[#4CAF50]';
    if (percentage >= 40) return 'bg-[#FFA726]';
    return 'bg-[#FF6B9D]';
  };

  return (
    <div className="w-full mb-6 bg-[#1a1a2e] border-4 border-[#FF6B9D] p-4" data-testid="container-privacy-meter">
      <div className="flex items-center justify-between mb-2">
        <span className="font-['Press_Start_2P'] text-[#FF6B9D] text-xs" data-testid="text-privacy-label">
          PRIVACY METER
        </span>
        <span className="font-['Press_Start_2P'] text-white text-xs font-bold" data-testid="text-privacy-score">
          {Math.round(privacyScore)}%
        </span>
      </div>
      <div className="h-6 bg-[#16213e] border-2 border-[#FF6B9D] overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
          data-testid="privacy-meter-bar"
        />
      </div>
    </div>
  );
}
