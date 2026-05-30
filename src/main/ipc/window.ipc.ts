// Window-control IPC: minimize / maximize / close / title-bar double-click.
import { ipcMain, systemPreferences } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { AppContext } from '../context'

// Resolve the macOS "double-click on title bar" preference, mapping to an action.
function darwinDblClickAction(): 'Maximize' | 'Minimize' | 'None' {
  try {
    const pref = systemPreferences.getUserDefault('AppleActionOnDoubleClick', 'string') as
      | string
      | null
    if (pref === 'Minimize') return 'Minimize'
    if (pref === 'None') return 'None'
    // Default (incl. 'Maximize' and unset/null) is to zoom/maximize.
    return 'Maximize'
  } catch {
    return 'Maximize'
  }
}

// Register window-control channels (all fire-and-forget except the maximized query).
export function registerWindowIpc(ctx: AppContext): void {
  ipcMain.on(IPC.WIN_MINIMIZE, () => {
    ctx.getWindow()?.minimize()
  })

  ipcMain.on(IPC.WIN_TOGGLE_MAXIMIZE, () => {
    const win = ctx.getWindow()
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })

  ipcMain.on(IPC.WIN_CLOSE, () => {
    ctx.getWindow()?.close()
  })

  ipcMain.on(IPC.WIN_TITLEBAR_DBLCLICK, () => {
    const win = ctx.getWindow()
    if (!win) return
    if (process.platform === 'darwin') {
      const action = darwinDblClickAction()
      if (action === 'Minimize') win.minimize()
      else if (action === 'Maximize') {
        if (win.isMaximized()) win.unmaximize()
        else win.maximize()
      }
      // 'None' -> do nothing.
      return
    }
    // Non-darwin: title-bar double-click toggles maximize.
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })

  ipcMain.handle(IPC.WIN_IS_MAXIMIZED, () => ctx.getWindow()?.isMaximized() ?? false)
}
