import { createContext, useContext, useCallback, useState, useEffect, useRef, type ReactNode } from 'react';

// ── Types ──────────────────────────────────────────────────────────

export type NotificationType = 'success' | 'info' | 'discovery' | 'unlock';

interface Notification {
  id: string;
  message: string;
  label?: string;
  type: NotificationType;
  duration: number;
}

interface NotificationContextValue {
  notify: (message: string, opts?: { label?: string; type?: NotificationType; duration?: number }) => void;
}

// ── Context ────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    // Fallback no-op if used outside provider (e.g., during SSR or tests)
    return { notify: () => {} };
  }
  return ctx;
}

// ── Provider ───────────────────────────────────────────────────────

let idCounter = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Notification[]>([]);

  const notify = useCallback(
    (message: string, opts?: { label?: string; type?: NotificationType; duration?: number }) => {
      const id = `notif-${++idCounter}`;
      const notification: Notification = {
        id,
        message,
        label: opts?.label,
        type: opts?.type ?? 'info',
        duration: opts?.duration ?? 2500,
      };
      setQueue(prev => [...prev, notification]);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setQueue(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {/* Render the toast stack */}
      <div
        className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: 340 }}
      >
        {queue.slice(0, 4).map(n => (
          <NotificationToastItem key={n.id} notification={n} onDismiss={dismiss} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// ── Individual Toast ───────────────────────────────────────────────

const TYPE_STYLES: Record<NotificationType, { border: string; labelColor: string; icon: string }> = {
  success:   { border: 'border-l-green-400',  labelColor: 'text-green-400',  icon: '\u2713' },
  info:      { border: 'border-l-blue-400',   labelColor: 'text-blue-400',   icon: '\u2139' },
  discovery: { border: 'border-l-yellow-400', labelColor: 'text-yellow-400', icon: '\u2605' },
  unlock:    { border: 'border-l-purple-400', labelColor: 'text-purple-400', icon: '\u2191' },
};

function NotificationToastItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Enter animation
    const enterTimer = setTimeout(() => setPhase('visible'), 20);
    return () => clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    if (phase === 'visible') {
      timerRef.current = setTimeout(() => setPhase('exit'), notification.duration);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
    if (phase === 'exit') {
      const exitTimer = setTimeout(() => onDismiss(notification.id), 350);
      return () => clearTimeout(exitTimer);
    }
  }, [phase, notification.duration, notification.id, onDismiss]);

  const styles = TYPE_STYLES[notification.type];

  return (
    <div
      className={`
        pointer-events-auto
        bg-[#1a1a2e]/95 border-2 border-[#3a3a5e] border-l-4 ${styles.border}
        px-3 py-2 rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,0.6)]
        transition-all duration-300 ease-out
        ${phase === 'enter' ? 'opacity-0 translate-x-16' : ''}
        ${phase === 'visible' ? 'opacity-100 translate-x-0' : ''}
        ${phase === 'exit' ? 'opacity-0 translate-x-16' : ''}
      `}
      style={{ fontFamily: '"Press Start 2P", monospace' }}
    >
      <div className="flex items-start gap-2">
        <span className={`text-[10px] ${styles.labelColor} mt-0.5 shrink-0`}>{styles.icon}</span>
        <div className="min-w-0">
          {notification.label && (
            <div className={`text-[7px] ${styles.labelColor} uppercase tracking-wider mb-0.5`}>
              {notification.label}
            </div>
          )}
          <div className="text-[8px] text-gray-200 leading-relaxed">
            {notification.message}
          </div>
        </div>
      </div>
    </div>
  );
}
