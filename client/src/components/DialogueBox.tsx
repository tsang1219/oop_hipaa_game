interface DialogueBoxProps {
  character: string;
  dialogue: string;
}

export default function DialogueBox({ character, dialogue }: DialogueBoxProps) {
  return (
    <div 
      className="bg-card border-4 border-game-border p-6 mb-4"
      style={{ 
        boxShadow: 'var(--shadow)',
        borderRadius: 'var(--radius)',
        minHeight: '180px'
      }}
      data-testid="container-dialogue-box"
    >
      <div className="mb-4">
        <h2 className="text-base text-foreground font-bold" data-testid="text-character-name">
          {character}
        </h2>
      </div>
      <p 
        className="text-sm leading-relaxed text-foreground"
        style={{ lineHeight: '1.8' }}
        data-testid="text-dialogue"
      >
        {dialogue}
      </p>
    </div>
  );
}
