// The frameless host BrowserWindow that renders the React shell + hosts the SoundCloud view.
import { join } from 'node:path'
import { app, BrowserWindow, nativeImage } from 'electron'
import appIcon from '../../resources/icon.png?asset'
import { IPC } from '@shared/ipc-channels'
import { isQuitting } from './lifecycle'
import * as settings from './settings'
import {
  createSoundCloudView,
  getSoundCloudView,
  layoutSoundCloudView
} from './soundcloud-view'
import { getRestoreState, trackWindowState } from './window-state'

let mainWindow: BrowserWindow | null = null

// The single host window instance (or null before creation / after destroy).
export function getMainWindow(): BrowserWindow | null {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null
}

// Load the renderer: dev server URL when available, packaged HTML otherwise.
function loadRenderer(win: BrowserWindow): void {
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void win.loadFile(join(import.meta.dirname, '../renderer/index.html'))
  }
}

// Create the frameless host window, restore geometry, attach the SoundCloud view.
export function createMainWindow(): BrowserWindow {
  const state = getRestoreState()
  const isLinux = process.platform === 'linux'

  const win = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    resizable: true,
    show: false,
    backgroundColor: '#0f0f12',
    icon: nativeImage.createFromPath(appIcon),
    ...(isLinux ? { hasShadow: false } : {}),
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  mainWindow = win

  // Restore maximized state after construction so normal-bounds stay intact.
  if (state.maximized) win.maximize()

  // Persist size/position/maximized across sessions.
  trackWindowState(win)

  // Attach + size the SoundCloud view; keep it fitted on resize.
  const view = createSoundCloudView(win)
  layoutSoundCloudView(win)
  win.on('resize', () => layoutSoundCloudView(win))

  // Reactive maximize state push to the custom title bar.
  win.on('maximize', () => win.webContents.send(IPC.WIN_MAXIMIZED, true))
  win.on('unmaximize', () => win.webContents.send(IPC.WIN_MAXIMIZED, false))

  // Initial show, honoring startMinimized + minimizeToTray.
  win.once('ready-to-show', () => {
    if (settings.get('startMinimized')) {
      if (settings.get('minimizeToTray')) win.hide()
      else win.minimize()
    } else {
      win.show()
      win.focus()
    }
  })

  // Close-to-tray: hide instead of destroying unless a real quit is in progress.
  win.on('close', (e) => {
    if (!isQuitting() && settings.get('minimizeToTray')) {
      e.preventDefault()
      win.hide()
      return
    }
    // Real close: tear down the SoundCloud webContents BEFORE the window is destroyed.
    const scView = getSoundCloudView()
    if (scView && !scView.webContents.isDestroyed()) {
      try {
        win.contentView.removeChildView(scView)
      } catch {
        // View may already be detached; ignore.
      }
      scView.webContents.close()
    }
  })

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })

  loadRenderer(win)

  // Touch the view so tree-shaking never drops it; layout already used it above.
  void view

  return win
}
