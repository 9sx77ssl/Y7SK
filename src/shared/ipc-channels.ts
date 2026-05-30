// Single source of truth for IPC channel names. Imported by main, preload, renderer.

export const IPC = {
  // Window controls (renderer -> main, fire-and-forget)
  WIN_MINIMIZE: 'win:minimize',
  WIN_TOGGLE_MAXIMIZE: 'win:toggle-maximize',
  WIN_CLOSE: 'win:close',
  WIN_TITLEBAR_DBLCLICK: 'win:titlebar-dblclick',
  // Window state query (renderer -> main, invoke/handle)
  WIN_IS_MAXIMIZED: 'win:is-maximized',
  // Window state push (main -> renderer)
  WIN_MAXIMIZED: 'win:maximized',

  // SoundCloud native view visibility (renderer -> main)
  VIEW_SET_VISIBLE: 'view:set-visible',

  // Settings (renderer -> main invoke/handle, main -> renderer push)
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_CHANGED: 'settings:changed',

  // Now playing (scbridge -> main -> renderer)
  TRACK_CHANGED: 'track:changed',
  TRACK_PLAYBACK: 'track:playback'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
