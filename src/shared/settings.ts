// User settings contract — shared by main (electron-store) and renderer (UI).

export interface Settings {
  /** Launch Y7SK automatically on system login. */
  launchOnStartup: boolean
  /** Hardware acceleration (applied at startup; toggling needs a restart). */
  hardwareAccel: boolean
  /** Start hidden/minimized on launch. */
  startMinimized: boolean
  /** Closing/minimizing hides to the tray instead of quitting. */
  minimizeToTray: boolean
  /** Show a desktop notification when the track changes. */
  trackNotifications: boolean
}

export type SettingKey = keyof Settings

export const DEFAULT_SETTINGS: Settings = {
  launchOnStartup: false,
  hardwareAccel: true,
  startMinimized: false,
  minimizeToTray: true,
  trackNotifications: true
}

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[]

/** Settings that only take effect after an app restart. */
export const RESTART_REQUIRED: SettingKey[] = ['hardwareAccel']

/** electron-store JSON schema for the settings store (all booleans). */
export const SETTINGS_SCHEMA = {
  launchOnStartup: { type: 'boolean', default: false },
  hardwareAccel: { type: 'boolean', default: true },
  startMinimized: { type: 'boolean', default: false },
  minimizeToTray: { type: 'boolean', default: true },
  trackNotifications: { type: 'boolean', default: true }
} as const

/** Type guard: is `k` a valid, settable settings key. */
export function isSettingKey(k: unknown): k is SettingKey {
  return typeof k === 'string' && (SETTING_KEYS as string[]).includes(k)
}

// --- Persisted window geometry (separate store key, not user-facing) ---
export interface WindowState {
  width: number
  height: number
  x?: number
  y?: number
  maximized: boolean
}

export const DEFAULT_WINDOW_STATE: WindowState = {
  width: 1180,
  height: 800,
  maximized: false
}
