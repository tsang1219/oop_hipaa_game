import Phaser from 'phaser';
import type { Room } from '@shared/schema';

// All known music track keys — used to clean up other tracks when changing rooms
const MUSIC_TRACK_KEYS = [
  'music_hub',
  'music_exploration',
  'music_breach',
  'music_demo_er',
  'music_demo_break_room',
  'music_demo_records_room',
] as const;

/**
 * MusicController — the one genuinely stateful audio object for ExplorationScene
 * (Round 6). Owns `bgMusic` + `activeMusicBaseVolume`; the scene keeps its
 * eventBridge subscriptions (REACT_SET_MUSIC_VOLUME, ACT_ADVANCE) and delegates.
 *
 * Moved verbatim from ExplorationScene:
 * - create()'s BGM start/reclaim block + handleWakeFromEncounter's BGM-restore
 *   block, merged into ONE `startRoomMusic()` (user-approved dedup — the two
 *   copies differed in fade duration: 1800ms on room create vs 800ms on wake;
 *   both durations preserved via the `fadeMs` parameter).
 * - onMusicVolume handler body → setUserVolume()
 * - onActAdvance crossfade logic → crossfadeTo() (incl. F-24 killTweensOf guard)
 * - handleDoorInteraction's music fade → fadeOutForDoor()
 * - onLaunchEncounter's music kill → killForEncounter()
 * - shutdown()'s ref-drop + 'unlocked' listener cleanup → release()
 *
 * Every async guard carried over verbatim: mute-then-unmute first-frame leak
 * guard, orphan-track reclaim (scene-restart) logic, shutdown-mid-crossfade
 * `scene.isActive()` guards, and the F-24 null-volume tween-kill guard.
 */
export class MusicController {
  // Background music
  private bgMusic?: Phaser.Sound.BaseSound;
  private readonly musicBaseVolume = 0.13;

  /** Current effective base volume — may differ from musicBaseVolume for Act 3 */
  private activeMusicBaseVolume = 0.25;

  constructor(private scene: Phaser.Scene) {}

  // ── Background music — room override > act default; crossfade if track changed ──
  startRoomMusic(room: Room, act: 1 | 2 | 3, fadeMs: number): void {
    const ACT_MUSIC: Record<number, { track: string; baseVol: number }> = {
      1: { track: 'music_hub', baseVol: this.musicBaseVolume },
      2: { track: 'music_exploration', baseVol: this.musicBaseVolume },
      3: { track: 'music_breach', baseVol: 0.15 },
    };
    const actCfg = ACT_MUSIC[act] ?? ACT_MUSIC[2];
    const roomTrack = (room as any).musicTrack as string | undefined;
    const roomBaseVol = (room as any).musicBaseVolume as number | undefined;
    const musicCfg = {
      track: roomTrack ?? actCfg.track,
      baseVol: roomBaseVol ?? actCfg.baseVol,
    };
    this.activeMusicBaseVolume = musicCfg.baseVol;
    try {
      const userVol = parseFloat(localStorage.getItem('music_volume') ?? '0.6');
      const targetVol = musicCfg.baseVol * userVol;

      // Same track survived from previous room — reclaim and fade up
      const existing = this.findPlayingTrack(musicCfg.track);
      if (existing) {
        this.bgMusic = existing;
        this.scene.tweens.add({ targets: this.bgMusic, volume: targetVol, duration: 600, ease: 'Sine.easeIn' });
      } else if (userVol > 0) {
        // Different track (or first load) — stop any other music tracks left
        // playing on the SoundManager, then fade in the new one from silence.
        for (const k of MUSIC_TRACK_KEYS) {
          if (k !== musicCfg.track) {
            this.scene.sound.getAll(k).forEach(s => { s.stop(); s.destroy(); });
          }
        }
        // Clean up orphans of the target key too
        this.scene.sound.getAll(musicCfg.track).forEach(s => { s.stop(); s.destroy(); });
        // Start muted to prevent any first-frame audio leak, then unmute at
        // volume 0 and tween up on the next tick.
        this.bgMusic = this.scene.sound.add(musicCfg.track, { loop: true, volume: 0, mute: true });
        const playMusic = () => {
          if (!this.bgMusic || !this.scene.scene.isActive()) return;
          this.bgMusic.play();
          this.scene.time.delayedCall(0, () => {
            if (!this.bgMusic || !this.scene.scene.isActive()) return;
            const ws = this.bgMusic as Phaser.Sound.WebAudioSound;
            ws.setMute(false);
            ws.volume = 0;
            this.scene.tweens.add({ targets: this.bgMusic, volume: targetVol, duration: fadeMs, ease: 'Sine.easeIn' });
          });
        };
        if (this.scene.sound.locked) {
          this.scene.sound.once('unlocked', playMusic);
        } else {
          this.scene.time.delayedCall(300, playMusic);
        }
      }
    } catch (e) {
      console.warn(`[ExplorationScene] ${musicCfg.track} not ready, skipping BGM:`, e);
    }
  }

  /** onMusicVolume handler body (REACT_SET_MUSIC_VOLUME) — scene delegates here. */
  setUserVolume(vol: number): void {
    if (!this.scene.scene.isActive()) return;
    if (this.bgMusic) {
      (this.bgMusic as Phaser.Sound.WebAudioSound).volume = this.activeMusicBaseVolume * vol;
    }
  }

  // ── Act-based music crossfade (Phase 14) ──────────────────────────

  /**
   * Fade out current music over 2s, then fade in new track over 2s.
   * Guards against scene shutdown mid-crossfade.
   */
  crossfadeTo(newTrackKey: string, baseVolumeOverride?: number): void {
    const effectiveBase = baseVolumeOverride ?? this.musicBaseVolume;
    this.activeMusicBaseVolume = effectiveBase;
    const userVol = parseFloat(localStorage.getItem('music_volume') ?? '0.6');
    const targetVol = effectiveBase * userVol;

    // Reclaim orphaned bgMusic ref (shutdown cleared it but sound still plays)
    if (!this.bgMusic) {
      const playing = this.scene.sound.getAll('music_hub')
        .concat(this.scene.sound.getAll('music_exploration'))
        .concat(this.scene.sound.getAll('music_breach'))
        .find(s => s.isPlaying);
      if (playing) this.bgMusic = playing;
    }

    if (this.bgMusic && (this.bgMusic as Phaser.Sound.BaseSound).isPlaying) {
      // F-24 fix (Run 07): kill any tween already targeting this sound before
      // fading. A duplicate crossfade (or a still-running fade-in) would keep
      // ticking after onComplete destroys the sound — "Cannot set properties
      // of null (setting 'volume')".
      try { this.scene.tweens.killTweensOf(this.bgMusic); } catch (_) {}
      // Fade out current track, then start new one
      this.scene.tweens.add({
        targets: this.bgMusic,
        volume: 0,
        duration: 2000,
        ease: 'Sine.easeOut',
        onComplete: () => {
          // Guard: scene may have shut down while fade was running
          if (!this.scene.scene || !this.scene.scene.isActive()) return;
          if (this.bgMusic) {
            this.bgMusic.stop();
            this.bgMusic.destroy();
            this.bgMusic = undefined;
          }
          this.startMusicTrack(newTrackKey, targetVol);
        },
      });
    } else {
      // No current track (or not playing) — start new track immediately
      if (this.bgMusic) {
        this.bgMusic.stop();
        this.bgMusic.destroy();
        this.bgMusic = undefined;
      }
      this.startMusicTrack(newTrackKey, targetVol);
    }
  }

  /** Find an already-playing sound instance on the global SoundManager by key. */
  private findPlayingTrack(key: string): Phaser.Sound.BaseSound | undefined {
    return this.scene.sound.getAll(key).find(s => s.isPlaying);
  }

  private startMusicTrack(key: string, targetVol: number): void {
    if (!this.scene.scene || !this.scene.scene.isActive()) return;
    try {
      this.bgMusic = this.scene.sound.add(key, { loop: true, volume: 0, mute: true });
      this.bgMusic.play();
      this.scene.time.delayedCall(0, () => {
        if (!this.bgMusic || !this.scene.scene.isActive()) return;
        const ws = this.bgMusic as Phaser.Sound.WebAudioSound;
        ws.setMute(false);
        ws.volume = 0;
        this.scene.tweens.add({ targets: this.bgMusic, volume: targetVol, duration: 2000, ease: 'Sine.easeIn' });
      });
    } catch (e) {
      console.warn(`[ExplorationScene] crossfade to ${key} failed:`, e);
    }
  }

  /** Door-transition fade (from handleDoorInteraction) — fade music out in
   *  sync with the camera fade so shutdown doesn't hard-stop it. */
  fadeOutForDoor(): void {
    if (this.bgMusic && (this.bgMusic as Phaser.Sound.BaseSound).isPlaying) {
      this.scene.tweens.add({ targets: this.bgMusic, volume: 0, duration: 300, ease: 'Sine.easeOut' });
    }
  }

  /** Encounter-launch music kill (from onLaunchEncounter) — kill any active
   *  music tweens before destroying to avoid null volume errors. */
  killForEncounter(): void {
    if (this.bgMusic) {
      try { this.scene.tweens.killTweensOf(this.bgMusic); } catch (_) {}
      try { this.bgMusic.stop(); } catch (_) {}
      try { this.bgMusic.destroy(); } catch (_) {}
      this.bgMusic = undefined;
    }
  }

  /** Scene shutdown (from shutdown()). Don't stop music — create() will reclaim
   *  it via startRoomMusic if the same track is needed, or crossfadeTo will
   *  clean it up if the act changed. */
  release(): void {
    this.bgMusic = undefined;
    // Clean up sound unlock listener
    try { this.scene.sound.off('unlocked'); } catch (_) {}
  }
}
