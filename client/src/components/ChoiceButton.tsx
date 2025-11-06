import { Button } from '@/components/ui/button';

interface ChoiceButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  numberKey?: number;
}

export default function ChoiceButton({ text, onClick, disabled = false, numberKey }: ChoiceButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="outline"
      className="w-full text-left justify-start p-4 h-auto min-h-[3rem] border-4 border-[#FF6B9D] bg-[#1a1a2e] hover:bg-[#2a2a4e] text-white font-['Press_Start_2P'] text-xs disabled:opacity-50"
      style={{
        whiteSpace: 'normal',
        wordWrap: 'break-word',
      }}
      data-testid={`button-choice-${numberKey || ''}`}
    >
      {numberKey && (
        <span className="inline-block mr-3 text-[#FF6B9D]" data-testid="choice-number">
          {numberKey}.
        </span>
      )}
      {text}
    </Button>
  );
}
