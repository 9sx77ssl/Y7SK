// Settings IPC: read all, validate-and-apply one (then broadcast + return updated).
import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { isSettingKey, type SettingKey, type Settings } from '@shared/settings'
import type { AppContext } from '../context'
import * as settings from '../settings'

// Register settings get/set channels.
export function registerSettingsIpc(ctx: AppContext): void {
  ipcMain.handle(IPC.SETTINGS_GET, () => settings.getAll())

  ipcMain.handle(IPC.SETTINGS_SET, (_e, key: unknown, value: unknown): Settings => {
    // Reject unknown keys; all settings are booleans, so coerce the value.
    if (!isSettingKey(key)) throw new Error(`Invalid setting key: ${String(key)}`)
    const k = key as SettingKey
    const v = Boolean(value) as Settings[SettingKey]

    const updated = settings.set(k, v)
    // Apply the live effect (launchOnStartup sync) immediately.
    settings.applySetting(ctx.getWindow(), k, v)
    // Broadcast the new full settings object to the renderer.
    ctx.getWindow()?.webContents.send(IPC.SETTINGS_CHANGED, updated)
    return updated
  })
}
