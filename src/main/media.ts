// Now-playing wiring: scbridge -> main -> renderer, OS notifications, Windows thumbar.
import { ipcMain, nativeImage, Notification } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { NowPlaying, PlaybackState, TrackInfo } from '@shared/types'
import type { AppContext } from './context'

// Cached current now-playing so the renderer can pull it on mount (not only on change).
let lastTrack: TrackInfo | null = null
let lastPlayback: PlaybackState = 'none'

// Best-effort validation of an incoming TrackInfo payload from the sandboxed bridge.
function isTrackInfo(v: unknown): v is TrackInfo {
  if (typeof v !== 'object' || v === null) return false
  const t = v as Record<string, unknown>
  return typeof t.title === 'string' && typeof t.artist === 'string'
}

// Validate a playback-state string against the known enum.
function isPlaybackState(v: unknown): v is PlaybackState {
  return v === 'playing' || v === 'paused' || v === 'none'
}

// Dispatch a navigator.mediaSession action inside the SoundCloud page (Windows thumbar use).
function dispatchMediaAction(ctx: AppContext, action: 'previoustrack' | 'play' | 'pause' | 'nexttrack'): void {
  const view = ctx.getView()
  if (!view || view.webContents.isDestroyed()) return
  // executeJavaScript is best-effort; the page may not have the handler registered.
  view.webContents
    .executeJavaScript(
      `(() => { try {
         const ms = navigator.mediaSession;
         if (!ms) return false;
         const ah = ms.__y7skHandlers && ms.__y7skHandlers[${JSON.stringify(action)}];
         if (typeof ah === 'function') { ah(); return true; }
         return false;
       } catch { return false; } })()`,
      true
    )
    .catch(() => {
      /* swallow: page navigated or handler absent */
    })
}

// Windows-only taskbar thumbnail toolbar (prev / play-pause / next).
function setupThumbarButtons(ctx: AppContext): void {
  if (process.platform !== 'win32') return
  const win = ctx.getWindow()
  if (!win) return
  try {
    // Empty icons are tolerated by Electron; we skip bundling per-button art.
    const blank = nativeImage.createEmpty()
    win.setThumbarButtons([
      {
        tooltip: 'Previous',
        icon: blank,
        click: () => dispatchMediaAction(ctx, 'previoustrack')
      },
      {
        tooltip: 'Play/Pause',
        icon: blank,
        click: () => dispatchMediaAction(ctx, 'play')
      },
      {
        tooltip: 'Next',
        icon: blank,
        click: () => dispatchMediaAction(ctx, 'nexttrack')
      }
    ])
  } catch {
    // Thumbar is non-essential; never let it break startup.
  }
}

// Register media IPC listeners + platform integrations.
export function initMedia(ctx: AppContext): void {
  // Renderer pulls the current snapshot on mount so an already-playing track shows immediately.
  ipcMain.handle(IPC.TRACK_GET, (): NowPlaying => ({ track: lastTrack, playback: lastPlayback }))

  ipcMain.on(IPC.TRACK_CHANGED, (_e, track: unknown) => {
    if (!isTrackInfo(track)) return
    lastTrack = track
    const win = ctx.getWindow()
    win?.webContents.send(IPC.TRACK_CHANGED, track)
    // Surface a quiet desktop notification on track change.
    if (Notification.isSupported()) {
      try {
        new Notification({
          title: track.title,
          body: track.artist,
          silent: true,
          ...(track.artwork ? { icon: nativeImage.createFromDataURL(track.artwork) } : {})
        }).show()
      } catch {
        // Some artwork URLs aren't data URLs; notify without an icon as a fallback.
        try {
          new Notification({ title: track.title, body: track.artist, silent: true }).show()
        } catch {
          /* notifications unavailable */
        }
      }
    }
  })

  ipcMain.on(IPC.TRACK_PLAYBACK, (_e, state: unknown) => {
    if (!isPlaybackState(state)) return
    lastPlayback = state
    const win = ctx.getWindow()
    win?.webContents.send(IPC.TRACK_PLAYBACK, state)
  })

  setupThumbarButtons(ctx)
}
