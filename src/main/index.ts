// Y7SK main-process entry: lifecycle, single-instance, window/view/tray/IPC/media wiring.
import { app } from 'electron'
import { electronApp } from '@electron-toolkit/utils'
import type { AppContext } from './context'
import { registerIpc } from './ipc'
import { setQuitting } from './lifecycle'
import { initMedia } from './media'
import * as settings from './settings'
import { getSoundCloudView, layoutSoundCloudView } from './soundcloud-view'
import { createTray } from './tray'
import { createMainWindow, getMainWindow } from './window'

// Conditionally disable HW accel BEFORE app is ready (never unconditional).
if (settings.get('hardwareAccel') === false) {
  app.disableHardwareAcceleration()
}

// Single-instance lock: a second launch should focus the existing window, not spawn another.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = getMainWindow()
    if (!win) return
    if (win.isMinimized()) win.restore()
    if (!win.isVisible()) win.show()
    win.focus()
  })

  // Shared accessors handed to IPC/tray/media wiring.
  const ctx: AppContext = {
    getWindow: () => getMainWindow(),
    getView: () => getSoundCloudView()
  }

  app.whenReady().then(() => {
    // Windows notification/grouping identity.
    electronApp.setAppUserModelId('com.y7sk.app')

    const win = createMainWindow()

    // Apply live persisted settings (alwaysOnTop + login-item/autostart sync).
    settings.applyAll(win)

    // Tray is always present; minimizeToTray only governs close behavior.
    createTray(ctx)

    // Renderer<->main channels.
    registerIpc(ctx)

    // Now-playing forwarding, notifications, Windows thumbar.
    initMedia(ctx)
  })

  // Real quit requested: flip the flag so close-to-tray won't intercept.
  app.on('before-quit', () => {
    setQuitting(true)
  })

  // macOS: re-show (or recreate) on dock activate.
  app.on('activate', () => {
    const win = getMainWindow()
    if (win) {
      if (!win.isVisible()) win.show()
      win.focus()
      layoutSoundCloudView(win)
    } else {
      const fresh = createMainWindow()
      settings.applyAll(fresh)
    }
  })

  // Window-all-closed: keep alive on macOS; elsewhere only quit when not hiding to tray.
  app.on('window-all-closed', () => {
    if (process.platform === 'darwin') return
    // With close-to-tray active, the window hides (this rarely fires); otherwise exit.
    if (!settings.get('minimizeToTray')) app.quit()
  })
}
