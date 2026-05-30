// System tray icon + menu. Always created; minimizeToTray only gates hide-on-close.
import { app, Menu, nativeImage, Tray } from 'electron'
import trayIcon from '../../resources/tray/tray.png?asset'
import trayTemplateIcon from '../../resources/tray/trayTemplate.png?asset'
import type { AppContext } from './context'
import { setQuitting } from './lifecycle'
import { reloadSoundCloudView } from './soundcloud-view'

let tray: Tray | null = null

// Bring the host window to the foreground (restoring from tray/minimize).
function showWindow(ctx: AppContext): void {
  const win = ctx.getWindow()
  if (!win) return
  if (win.isMinimized()) win.restore()
  if (!win.isVisible()) win.show()
  win.focus()
}

// Quit for real: bypass close-to-tray, then ask the app to exit.
function quit(): void {
  setQuitting(true)
  app.quit()
}

// Build the tray's right-click menu.
function buildMenu(ctx: AppContext): Menu {
  return Menu.buildFromTemplate([
    { label: 'Show Y7SK', click: () => showWindow(ctx) },
    { label: 'Reload', click: () => reloadSoundCloudView() },
    { type: 'separator' },
    { label: 'Quit', click: quit }
  ])
}

// Create the tray (platform-appropriate icon) and wire its interactions.
export function createTray(ctx: AppContext): Tray {
  if (tray) return tray

  const isDarwin = process.platform === 'darwin'
  const image = nativeImage.createFromPath(isDarwin ? trayTemplateIcon : trayIcon)
  // Template images let macOS recolor for light/dark menu bars.
  if (isDarwin) image.setTemplateImage(true)

  tray = new Tray(image)
  tray.setToolTip('Y7SK')
  tray.setContextMenu(buildMenu(ctx))

  // Double-click reliably restores on Windows/macOS.
  tray.on('double-click', () => showWindow(ctx))
  // Linux double-click often doesn't fire; single click also restores there.
  if (process.platform === 'linux') {
    tray.on('click', () => showWindow(ctx))
  }

  return tray
}

// Current tray instance (or null before creation).
export function getTray(): Tray | null {
  return tray
}
