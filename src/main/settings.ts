// electron-store wrapper for user settings + per-setting apply logic.
import { app, type BrowserWindow } from 'electron'
import Store from 'electron-store'
import {
  DEFAULT_SETTINGS,
  isSettingKey,
  type SettingKey,
  type Settings,
  SETTINGS_SCHEMA
} from '@shared/settings'
import { setLinuxAutostart } from './util/autostart-linux'

// Single persisted settings store (file: settings.json in userData).
const store = new Store<Settings>({
  name: 'settings',
  schema: SETTINGS_SCHEMA as never,
  defaults: DEFAULT_SETTINGS
})

// Read one typed setting.
export function get<K extends SettingKey>(key: K): Settings[K] {
  return store.get(key)
}

// Read the full settings object.
export function getAll(): Settings {
  // Spread over defaults so any missing key is filled deterministically.
  return { ...DEFAULT_SETTINGS, ...(store.store as Partial<Settings>) }
}

// Persist one setting. Rejects unknown keys; coerces values to boolean (all settings are boolean).
export function set<K extends SettingKey>(key: K, value: Settings[K]): Settings {
  if (!isSettingKey(key)) throw new Error(`Unknown setting key: ${String(key)}`)
  store.set(key, Boolean(value))
  return getAll()
}

// Apply the live (runtime) effect of a single setting change.
export function applySetting<K extends SettingKey>(
  win: BrowserWindow | null,
  key: K,
  value: Settings[K]
): void {
  const on = Boolean(value)
  switch (key) {
    case 'launchOnStartup':
      // Win/mac use the OS login-item API; Linux uses an autostart .desktop file.
      if (process.platform === 'win32' || process.platform === 'darwin') {
        app.setLoginItemSettings({ openAtLogin: on })
      } else if (process.platform === 'linux') {
        setLinuxAutostart(on)
      }
      break
    case 'alwaysOnTop':
      win?.setAlwaysOnTop(on)
      break
    case 'hardwareAccel':
      // Startup-only: handled before app.whenReady; no live effect (UI shows restart-required).
      break
    case 'startMinimized':
      // Startup-only: affects next launch's initial visibility.
      break
    case 'minimizeToTray':
      // Stored only; gates the close-to-tray handler live (read at close time).
      break
  }
}

// Apply all live settings at startup (idempotent sync for OS-level state).
export function applyAll(win: BrowserWindow): void {
  const s = getAll()
  win.setAlwaysOnTop(s.alwaysOnTop)
  // Keep the OS login-item / autostart entry in sync with the stored preference.
  applySetting(win, 'launchOnStartup', s.launchOnStartup)
}
