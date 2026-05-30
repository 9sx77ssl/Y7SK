import type { Settings, SettingKey } from './settings'

/** Portable OS platform union (avoids depending on Node types in the renderer). */
export type Platform =
  | 'aix'
  | 'android'
  | 'darwin'
  | 'freebsd'
  | 'haiku'
  | 'linux'
  | 'openbsd'
  | 'sunos'
  | 'win32'
  | 'cygwin'
  | 'netbsd'

export type PlaybackState = 'playing' | 'paused' | 'none'

/** Now-playing metadata observed from the SoundCloud page's MediaSession. */
export interface TrackInfo {
  title: string
  artist: string
  album?: string
  artwork?: string
}

/**
 * The API surface exposed on `window.y7sk` by `src/preload/index.ts`
 * (the trusted host-shell preload). The renderer consumes this; the preload
 * implements it. All `on*` subscribers return an unsubscribe function.
 */
export interface Y7skApi {
  // --- Window controls ---
  minimize(): void
  toggleMaximize(): void
  close(): void
  isMaximized(): Promise<boolean>
  onMaximized(cb: (maximized: boolean) => void): () => void
  titlebarDblClick(): void

  // --- SoundCloud native view ---
  /** Hide (false) the SoundCloud view to reveal the settings panel, or show (true) it. */
  showSoundCloud(visible: boolean): void

  // --- Settings ---
  getSettings(): Promise<Settings>
  setSetting<K extends SettingKey>(key: K, value: Settings[K]): Promise<Settings>
  onSettings(cb: (settings: Settings) => void): () => void

  // --- Now playing ---
  onTrack(cb: (track: TrackInfo) => void): () => void
  onPlayback(cb: (state: PlaybackState) => void): () => void

  // --- Environment ---
  platform: Platform
}
