import { Button } from '@/components/ui/button';

interface ChoiceButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function ChoiceButton({ text, onClick, disabled = false }: ChoiceButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="outline"
      className="w-full text-left justify-start p-4 h-auto min-h-[3rem] border-2 border-game-border hover-elevate active-elevate-2 text-xs md:text-sm"
      style={{
        whiteSpace: 'normal',
        wordWrap: 'break-word',
      }}
      data-testid="button-choice"
    >
      {text}
    </Button>
  );
}
