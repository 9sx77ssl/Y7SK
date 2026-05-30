// Host-shell preload: exposes the trusted `window.y7sk` API to the React renderer.
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { SettingKey, Settings } from '@shared/settings'
import type { NowPlaying, PlaybackState, TrackInfo, Y7skApi } from '@shared/types'

// Subscribe to a push channel, returning an unsubscribe that removes this exact listener.
function subscribe<T>(channel: string, cb: (payload: T) => void): () => void {
  const listener = (_e: IpcRendererEvent, payload: T): void => cb(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: Y7skApi = {
  // --- Window controls ---
  minimize: () => ipcRenderer.send(IPC.WIN_MINIMIZE),
  toggleMaximize: () => ipcRenderer.send(IPC.WIN_TOGGLE_MAXIMIZE),
  close: () => ipcRenderer.send(IPC.WIN_CLOSE),
  isMaximized: () => ipcRenderer.invoke(IPC.WIN_IS_MAXIMIZED) as Promise<boolean>,
  onMaximized: (cb) => subscribe<boolean>(IPC.WIN_MAXIMIZED, cb),
  titlebarDblClick: () => ipcRenderer.send(IPC.WIN_TITLEBAR_DBLCLICK),

  // --- SoundCloud native view ---
  showSoundCloud: (visible) => ipcRenderer.send(IPC.VIEW_SET_VISIBLE, visible),

  // --- Settings ---
  getSettings: () => ipcRenderer.invoke(IPC.SETTINGS_GET) as Promise<Settings>,
  setSetting: <K extends SettingKey>(key: K, value: Settings[K]) =>
    ipcRenderer.invoke(IPC.SETTINGS_SET, key, value) as Promise<Settings>,
  onSettings: (cb) => subscribe<Settings>(IPC.SETTINGS_CHANGED, cb),

  // --- Now playing ---
  getNowPlaying: () => ipcRenderer.invoke(IPC.TRACK_GET) as Promise<NowPlaying>,
  onTrack: (cb) => subscribe<TrackInfo>(IPC.TRACK_CHANGED, cb),
  onPlayback: (cb) => subscribe<PlaybackState>(IPC.TRACK_PLAYBACK, cb),

  // --- Environment ---
  platform: process.platform
}

// contextIsolation is on; bridge the API across the isolated world boundary.
contextBridge.exposeInMainWorld('y7sk', api)
