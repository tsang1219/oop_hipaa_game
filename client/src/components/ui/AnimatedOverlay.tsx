import { useState, useEffect, type ReactNode } from 'react';

interface AnimatedOverlayProps {
  children: ReactNode;
  /** Extra classes for the backdrop container */
  backdropClassName?: string;
  /** Extra classes for the content wrapper (default centers content) */
  contentClassName?: string;
}

/**
 * Wraps modal/overlay content with a fade-in backdrop + slide-up content animation.
 * Mount this component conditionally — it animates in on mount.
 *
 * Backdrop: fades from transparent to the provided bg color (200ms)
 * Content: slides up 24px + fades in + slight scale (300ms, ease-out)
 */
export default function AnimatedOverlay({
  children,
  backdropClassName = '',
  contentClassName = '',
}: AnimatedOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${backdropClassName}`}
    >
      <div
        className={`transform transition-all duration-300 ease-out ${
          isVisible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-6 opacity-0 scale-95'
        } ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
