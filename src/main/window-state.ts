// Persist window size/position/maximized in electron-store, with on-screen sanity restore.
import { type BrowserWindow, screen } from 'electron'
import Store from 'electron-store'
import { DEFAULT_WINDOW_STATE, type WindowState } from '@shared/settings'

type WindowStateStore = { windowState: WindowState }

// Window geometry lives in its own store file, separate from user settings.
const store = new Store<WindowStateStore>({
  name: 'window-state',
  defaults: { windowState: DEFAULT_WINDOW_STATE }
})

// True if the rect meaningfully overlaps some connected display's work area.
function isVisibleOnScreen(state: WindowState): boolean {
  if (typeof state.x !== 'number' || typeof state.y !== 'number') return false
  const bounds = { x: state.x, y: state.y, width: state.width, height: state.height }
  const display = screen.getDisplayMatching(bounds)
  const wa = display.workArea
  // Require a real overlap region between the saved rect and the display work area.
  const overlapX = Math.max(0, Math.min(bounds.x + bounds.width, wa.x + wa.width) - Math.max(bounds.x, wa.x))
  const overlapY = Math.max(0, Math.min(bounds.y + bounds.height, wa.y + wa.height) - Math.max(bounds.y, wa.y))
  return overlapX > 50 && overlapY > 50
}

// Read the restore state, falling back to defaults if off-screen or unset.
export function getRestoreState(): WindowState {
  const saved = { ...DEFAULT_WINDOW_STATE, ...store.get('windowState') }
  if (saved.maximized) {
    // Maximized: keep stored size as the un-maximize fallback, drop possibly-stale position.
    return { ...saved, x: undefined, y: undefined }
  }
  if (!isVisibleOnScreen(saved)) {
    return { ...DEFAULT_WINDOW_STATE }
  }
  return saved
}

let saveTimer: NodeJS.Timeout | null = null

// Persist current normal-bounds + maximized flag (debounced via caller).
function persist(win: BrowserWindow): void {
  if (win.isDestroyed()) return
  const maximized = win.isMaximized()
  // getNormalBounds() reports the un-maximized rect even while maximized.
  const b = win.getNormalBounds()
  const next: WindowState = {
    width: b.width,
    height: b.height,
    x: b.x,
    y: b.y,
    maximized
  }
  store.set('windowState', next)
}

// Attach debounced persistence to resize/move and immediate flag updates on maximize state.
export function trackWindowState(win: BrowserWindow): void {
  const scheduleSave = (): void => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = null
      persist(win)
    }, 400)
  }

  win.on('resize', scheduleSave)
  win.on('move', scheduleSave)
  win.on('maximize', () => persist(win))
  win.on('unmaximize', () => persist(win))

  // Flush any pending debounced save before the window goes away.
  win.on('close', () => {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    persist(win)
  })
}
