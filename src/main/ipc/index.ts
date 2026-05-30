// Aggregate IPC registration for the host shell.
import { registerAuthIpc } from '../auth'
import type { AppContext } from '../context'
import { registerSettingsIpc } from './settings.ipc'
import { registerViewIpc } from './view.ipc'
import { registerWindowIpc } from './window.ipc'

// Wire all renderer<->main channels. Call once after the window/view exist.
export function registerIpc(ctx: AppContext): void {
  registerWindowIpc(ctx)
  registerViewIpc(ctx)
  registerSettingsIpc(ctx)
  registerAuthIpc()
}
