interface CharacterPortraitProps {
  src: string;
  alt: string;
}

export default function CharacterPortrait({ src, alt }: CharacterPortraitProps) {
  return (
    <div className="flex justify-center mb-6">
      <div 
        className="relative"
        style={{
          imageRendering: 'pixelated',
        }}
      >
        <img
          src={src}
          alt={alt}
          className="w-48 h-48 md:w-52 md:h-52 border-4 border-game-border"
          style={{
            imageRendering: 'pixelated',
          }}
          data-testid="img-character-portrait"
        />
      </div>
    </div>
  );
}
