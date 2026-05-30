// Shared runtime context passed to IPC/tray/media wiring. Avoids ad-hoc globals.
import type { BrowserWindow, WebContentsView } from 'electron'

export interface AppContext {
  // Accessor for the live host window (may be null while hidden/recreating).
  getWindow: () => BrowserWindow | null
  // Accessor for the SoundCloud content view (may be null before creation).
  getView: () => WebContentsView | null
}
