import { Heart } from 'lucide-react';

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

  const getStatusText = () => {
    if (percentage >= 70) return 'Patients trust freely';
    if (percentage >= 40) return 'Trust is eroding...';
    return 'Trust is breaking!';
  };

  return (
    <div className="w-full mb-6 bg-[#1a1a2e] border-4 border-[#FF6B9D] p-4" data-testid="container-privacy-meter">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#FF6B9D]" />
          <span className="font-['Press_Start_2P'] text-[#FF6B9D] text-xs" data-testid="text-privacy-label">
            COMMUNITY TRUST
          </span>
        </div>
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
      <div className="mt-2 text-center">
        <span className="font-['Press_Start_2P'] text-[10px] text-muted-foreground">
          {getStatusText()}
        </span>
      </div>
    </div>
  );
}
