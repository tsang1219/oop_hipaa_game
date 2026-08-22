import Phaser from 'phaser';
import type { Room } from '@shared/schema';
import { getAudioDev } from './audioConfig';

// All known music track keys — used to clean up other tracks when changing rooms
const MUSIC_TRACK_KEYS = [
  'music_hub',
  'music_exploration',
  'music_breach',
  'music_demo_er',
  'music_demo_records_room',
] as const;

/**
 * AUD-01 (Run 12) — per-room music so no content room shares a track with
 * the room you just left. Only five unique tracks exist on disk (the sixth,
 * music_demo_break_room, was a byte-identical copy of music_exploration and
 * is gone), so this is a seating plan, not a library: the expansion to 8–10
 * tracks needs new CC0 files (download list in RUN_REPORT-12.md).
 *
 * Hallways have no entry here: with hallwayMusic = 'inherit' (audioConfig)
 * the track you were just hearing simply keeps playing through the corridor,
 * so walking reception → hallway → break room hears exploration → exploration
 * → hub (different from the room you just left, no restart in the hallway).
 *
 * Acts 1–2 only. Act 3 keeps its existing "everything is music_breach"
 * escalation (LOOP-06 is out of Run 12's scope — don't regress it).
 */
const ROOM_TRACKS: Record<string, string> = {
  hospital_entrance: 'music_hub',
  reception: 'music_exploration',
  break_room: 'music_hub',
  lab: 'music_exploration',
  records_room: 'music_demo_records_room',
  it_office: 'music_breach',
  er: 'music_demo_er',
  supply_closet: 'none', // the secret room is quiet: lamp hum and a purring cat
};

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

  /** AUD-05 — ducking multiplier applied on top of activeMusicBaseVolume *
   *  userVolume. 1 = no duck (full volume), <1 = ducked under dialogue/stingers. */
  private duckFactor = 1;

  constructor(private scene: Phaser.Scene) {}

  // ── Background music — room override > act default; crossfade if track changed ──
  startRoomMusic(room: Room, act: 1 | 2 | 3, fadeMs: number): void {
    this.duckFactor = 1; // fresh room — never carry a duck across a room transition
    const ACT_MUSIC: Record<number, { track: string; baseVol: number }> = {
      1: { track: 'music_hub', baseVol: this.musicBaseVolume },
      2: { track: 'music_exploration', baseVol: this.musicBaseVolume },
      3: { track: 'music_breach', baseVol: 0.15 },
    };
    const actCfg = ACT_MUSIC[act] ?? ACT_MUSIC[2];
    let roomTrack = (room as any).musicTrack as string | undefined;
    const roomBaseVol = (room as any).musicBaseVolume as number | undefined;
    // Run 12 seating plan (acts 1–2); data overrides in roomData.json still win.
    if (!roomTrack && act < 3 && ROOM_TRACKS[room.id]) roomTrack = ROOM_TRACKS[room.id];
    // Hallways inherit whatever was playing (see ROOM_TRACKS note).
    if (!roomTrack && room.id.startsWith('hallway_') && getAudioDev().hallwayMusic === 'inherit') {
      const playing = this.findAnyPlayingTrack();
      if (playing) roomTrack = playing;
    }
    if (roomTrack === 'none') {
      // Silence: fade out whatever is still playing and stop.
      for (const k of MUSIC_TRACK_KEYS) {
        this.scene.sound.getAll(k).forEach(s => {
          try { this.scene.tweens.killTweensOf(s); } catch (_) {}
          this.scene.tweens.add({ targets: s, volume: 0, duration: 900, onComplete: () => { try { s.stop(); s.destroy(); } catch (_) {} } });
        });
      }
      this.bgMusic = undefined;
      return;
    }
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
      (this.bgMusic as Phaser.Sound.WebAudioSound).volume = this.activeMusicBaseVolume * vol * this.duckFactor;
    }
  }

  /** AUD-05 — duck (or restore) music under dialogue/stingers. `factor` is a
   *  multiplier on top of the normal base*user volume (1 = full, e.g. 0.45 =
   *  ducked to 45%). Tweens smoothly so it never pops. */
  duckTo(factor: number, durationMs: number): void {
    this.duckFactor = Phaser.Math.Clamp(factor, 0, 1);
    if (!this.bgMusic || !this.scene.scene.isActive()) return;
    const userVol = parseFloat(localStorage.getItem('music_volume') ?? '0.6');
    const target = this.activeMusicBaseVolume * userVol * this.duckFactor;
    try { this.scene.tweens.killTweensOf(this.bgMusic); } catch (_) {}
    this.scene.tweens.add({ targets: this.bgMusic, volume: target, duration: durationMs, ease: 'Sine.easeInOut' });
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

  /** Key of whichever music track survived the last room transition, if any. */
  private findAnyPlayingTrack(): string | undefined {
    for (const k of MUSIC_TRACK_KEYS) {
      if (this.scene.sound.getAll(k).some(s => s.isPlaying)) return k;
    }
    return undefined;
  }

  /** Exposed for the QA audio map. */
  static roomTrackFor(roomId: string, act: 1 | 2 | 3): string {
    if (act >= 3) return roomId === 'er' ? 'music_demo_er' : roomId === 'records_room' ? 'music_demo_records_room' : 'music_breach';
    return ROOM_TRACKS[roomId] ?? (roomId.startsWith('hallway_') ? '(inherit)' : act === 1 ? 'music_hub' : 'music_exploration');
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
