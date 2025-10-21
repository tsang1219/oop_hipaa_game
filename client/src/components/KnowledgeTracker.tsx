import { useEffect, useState } from 'react';
import { FileText, Target, Search, Lock } from 'lucide-react';

const PRIVACY_PRINCIPLES = [
  {
    id: 'patient_rights_poster',
    name: 'Patient Rights',
    icon: FileText,
  },
  {
    id: 'minimum_necessary_manual',
    name: 'Minimum Necessary',
    icon: Target,
  },
  {
    id: 'authorization_guide',
    name: 'PHI Identifiers',
    icon: Search,
  },
  {
    id: 'security_training',
    name: 'Safeguards',
    icon: Lock,
  },
];

export default function KnowledgeTracker() {
  const [learnedPrinciples, setLearnedPrinciples] = useState<Set<string>>(new Set());

  useEffect(() => {
    const updateProgress = () => {
      const saved = localStorage.getItem('collectedEducationalItems');
      if (saved) {
        const collected = JSON.parse(saved);
        const principleIds = PRIVACY_PRINCIPLES.map(p => p.id);
        const learned = collected.filter((id: string) => principleIds.includes(id));
        setLearnedPrinciples(new Set(learned));
      }
    };

    updateProgress();
    
    window.addEventListener('storage', updateProgress);
    const interval = setInterval(updateProgress, 500);

    return () => {
      window.removeEventListener('storage', updateProgress);
      clearInterval(interval);
    };
  }, []);

  const learnedCount = learnedPrinciples.size;

  return (
    <div 
      className="bg-cream border-4 border-dark p-4 mb-4"
      style={{ imageRendering: 'pixelated' }}
      data-testid="knowledge-tracker"
    >
      <div className="text-center mb-3">
        <h3 
          className="text-sm font-bold text-dark"
          style={{ fontFamily: '"Press Start 2P", cursive' }}
          data-testid="text-principles-count"
        >
          Privacy Principles Learned: {learnedCount}/4
        </h3>
      </div>
      
      <div className="flex justify-center gap-6">
        {PRIVACY_PRINCIPLES.map((principle) => {
          const isLearned = learnedPrinciples.has(principle.id);
          const Icon = principle.icon;
          
          return (
            <div
              key={principle.id}
              className="flex flex-col items-center gap-2"
              data-testid={`principle-${principle.id}`}
            >
              <div
                className="w-10 h-10 flex items-center justify-center transition-all duration-300"
                style={{
                  color: isLearned ? '#FF6B9D' : '#9CA3AF',
                }}
              >
                <Icon size={32} strokeWidth={2.5} />
              </div>
              <span
                className="text-xs text-center max-w-[80px]"
                style={{
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '6px',
                  lineHeight: '1.4',
                  color: isLearned ? '#FF6B9D' : '#9CA3AF',
                }}
              >
                {principle.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
