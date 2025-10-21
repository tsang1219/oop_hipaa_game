import { Button } from '@/components/ui/button';

interface EducationalItemModalProps {
  title: string;
  fact: string;
  type: 'poster' | 'manual' | 'computer' | 'whiteboard';
  onClose: () => void;
}

const ITEM_ICONS = {
  poster: '📋',
  manual: '📖',
  computer: '💻',
  whiteboard: '📝'
};

export default function EducationalItemModal({ title, fact, type, onClose }: EducationalItemModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      data-testid="modal-educational-item"
    >
      <div 
        className="bg-background border-4 border-primary max-w-2xl w-full p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
        style={{
          imageRendering: 'pixelated',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl" style={{ imageRendering: 'auto' }}>
            {ITEM_ICONS[type]}
          </span>
          <h2 
            className="text-lg md:text-xl font-bold text-foreground"
            data-testid="text-item-title"
          >
            {title}
          </h2>
        </div>

        <div className="bg-card border-2 border-primary p-4 md:p-6 mb-6">
          <p 
            className="text-xs md:text-sm leading-relaxed text-foreground"
            data-testid="text-item-fact"
          >
            {fact}
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onClose}
            variant="default"
            size="lg"
            className="min-w-[200px]"
            data-testid="button-close-modal"
          >
            GOT IT!
          </Button>
        </div>
      </div>
    </div>
  );
}
