// SoundCloud view visibility IPC.
import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { AppContext } from '../context'
import { setSoundCloudVisible } from '../soundcloud-view'

// Register the view-visibility toggle (false reveals settings, true shows SoundCloud).
export function registerViewIpc(_ctx: AppContext): void {
  ipcMain.on(IPC.VIEW_SET_VISIBLE, (_e, visible: unknown) => {
    setSoundCloudVisible(Boolean(visible))
  })
}
