/**
 * DEV-ONLY validation overlay.
 * Renders a floating checklist panel that monitors EventBridge events and
 * Phaser state to confirm key systems are healthy after each code change.
 * Only active when import.meta.env.DEV === true.
 * 
 * Usage: mount <ValidationOverlay game={gameRef.current} /> anywhere inside
 * PrivacyQuestPage. It is rendered only in dev mode.
 */
import { useEffect, useRef, useState, RefObject } from 'react';
import Phaser from 'phaser';
import { eventBridge, BRIDGE_EVENTS } from '../phaser/EventBridge';

interface CheckResult {
  id: string;
  label: string;
  status: 'pending' | 'pass' | 'fail' | 'skip';
  detail?: string;
}

function makeChecks(): CheckResult[] {
  return [
    { id: 'textures',   label: 'Sprite textures loaded',       status: 'pending' },
    { id: 'keyboard',   label: 'Keyboard works post-dialogue', status: 'pending' },
    { id: 'dialogue',   label: 'Dialogue complete event fires', status: 'pending' },
    { id: 'sfx',        label: 'SFX event fires',              status: 'pending' },
    { id: 'music',      label: 'BGM started',                  status: 'pending' },
    { id: 'overlay',    label: 'Overlay contained in canvas',  status: 'pending' },
  ];
}

interface Props {
  gameRef: RefObject<Phaser.Game | null>;
}

export function ValidationOverlay({ gameRef }: Props) {
  const [checks, setChecks] = useState<CheckResult[]>(makeChecks());
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(true);
  const dialogueCompleteFired = useRef(false);
  const sfxFired = useRef(false);

  const update = (id: string, status: CheckResult['status'], detail?: string) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, status, detail } : c));
  };

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    setVisible(true);

    // ── Check: overlay containment (static code check approximation) ──
    // We look at all overlay elements inside the canvas container.
    const checkOverlayContainment = () => {
      const fixedEls = document.querySelectorAll('[class*="fixed inset-0"]');
      const allowed = ['PatientStoryReveal', 'EndScreen', 'NotificationToast'];
      let violation = false;
      fixedEls.forEach(el => {
        const id = (el as HTMLElement).dataset.testid ?? '';
        if (!allowed.some(a => id.includes(a))) violation = true;
      });
      update('overlay', violation ? 'fail' : 'pass',
        violation ? 'Found fixed inset-0 outside allowed list' : 'No violations');
    };
    const overlayTimer = setTimeout(checkOverlayContainment, 500);

    // ── Check: EventBridge dialogue complete ──
    const onDialogueComplete = () => {
      dialogueCompleteFired.current = true;
      update('dialogue', 'pass', 'REACT_DIALOGUE_COMPLETE received');
      // Check keyboard focus 350ms after dialogue closes (same delay as fix)
      setTimeout(() => {
        const canvas = gameRef.current?.canvas;
        if (canvas && document.activeElement === canvas) {
          update('keyboard', 'pass', 'Canvas has focus after dialogue');
        } else {
          update('keyboard', 'fail', `Active: ${document.activeElement?.tagName ?? 'none'}`);
        }
      }, 350);
    };
    eventBridge.on(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE, onDialogueComplete);

    // ── Check: SFX event ──
    const onSfx = (data: { key: string }) => {
      sfxFired.current = true;
      update('sfx', 'pass', `Last: ${data.key}`);
    };
    eventBridge.on(BRIDGE_EVENTS.REACT_PLAY_SFX, onSfx);

    // ── Check: Scene READY → textures + music ──
    const onSceneReady = (sceneKey: string) => {
      if (sceneKey !== 'Exploration') return;
      // Give the 100ms texture refresh time to run, then check
      setTimeout(() => {
        const g = gameRef.current;
        if (!g) return;
        const textureKeys = ['player_sheet', 'npc_receptionist_sheet', 'npc_nurse_sheet'];
        const missing = textureKeys.filter(k => !g.textures.exists(k));
        if (missing.length === 0) {
          update('textures', 'pass', 'All spritesheet keys present in cache');
        } else {
          update('textures', 'fail', `Missing: ${missing.join(', ')}`);
        }

        // Music check: look for active sound with key music_exploration
        const sounds = (g.sound as any).sounds as Phaser.Sound.BaseSound[] | undefined;
        const bgmPlaying = sounds?.some(s => s.key === 'music_exploration' && (s as any).isPlaying);
        update('music', bgmPlaying ? 'pass' : 'fail',
          bgmPlaying ? 'music_exploration playing' : 'Not playing (may be muted or decode error)');
      }, 200);
    };
    eventBridge.on(BRIDGE_EVENTS.SCENE_READY, onSceneReady);

    return () => {
      clearTimeout(overlayTimer);
      eventBridge.off(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE, onDialogueComplete);
      eventBridge.off(BRIDGE_EVENTS.REACT_PLAY_SFX, onSfx);
      eventBridge.off(BRIDGE_EVENTS.SCENE_READY, onSceneReady);
    };
  }, []);

  if (!import.meta.env.DEV || !visible) return null;

  const pass = checks.filter(c => c.status === 'pass').length;
  const fail = checks.filter(c => c.status === 'fail').length;

  const statusColor: Record<CheckResult['status'], string> = {
    pending: '#888',
    pass:    '#2ecc71',
    fail:    '#e74c3c',
    skip:    '#f39c12',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 9999,
        fontFamily: 'monospace',
        fontSize: '11px',
        background: 'rgba(0,0,0,0.85)',
        border: `2px solid ${fail > 0 ? '#e74c3c' : pass === checks.length ? '#2ecc71' : '#888'}`,
        borderRadius: 4,
        minWidth: 240,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        userSelect: 'none',
      }}
    >
      <div
        style={{ padding: '4px 8px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.08)' }}
        onClick={() => setMinimized(m => !m)}
      >
        <span style={{ color: '#aaa' }}>
          DEV CHECKS{' '}
          <span style={{ color: '#2ecc71' }}>{pass}✓</span>
          {fail > 0 && <span style={{ color: '#e74c3c' }}> {fail}✗</span>}
        </span>
        <span style={{ color: '#888' }}>{minimized ? '▲' : '▼'}</span>
      </div>

      {!minimized && (
        <div style={{ padding: '6px 8px' }}>
          {checks.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 6, marginBottom: 3, alignItems: 'flex-start' }}>
              <span style={{ color: statusColor[c.status], minWidth: 14 }}>
                {c.status === 'pass' ? '✓' : c.status === 'fail' ? '✗' : c.status === 'skip' ? '–' : '○'}
              </span>
              <div>
                <span style={{ color: '#ddd' }}>{c.label}</span>
                {c.detail && <div style={{ color: '#888', fontSize: 9 }}>{c.detail}</div>}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 6, borderTop: '1px solid #333', paddingTop: 4, color: '#555', fontSize: 9 }}>
            Interact with an NPC to run dialogue checks
          </div>
        </div>
      )}
    </div>
  );
}
