import { create } from 'zustand'
import type { Settings, SettingKey } from '@shared/settings'

interface SettingsStore {
  settings: Settings | null
  /** Load settings from main and subscribe to external changes. Returns unsubscribe. */
  hydrate: () => () => void
  /** Optimistically apply a change locally, then persist via the main process. */
  set: <K extends SettingKey>(key: K, value: Settings[K]) => Promise<void>
}

export const useSettings = create<SettingsStore>((store, get) => ({
  settings: null,

  hydrate: () => {
    void window.y7sk.getSettings().then((settings) => store({ settings }))
    // Keep in sync with changes pushed from main (e.g. tray/menu actions).
    return window.y7sk.onSettings((settings) => store({ settings }))
  },

  set: async (key, value) => {
    const current = get().settings
    if (current) store({ settings: { ...current, [key]: value } }) // optimistic
    const next = await window.y7sk.setSetting(key, value)
    store({ settings: next }) // reconcile with authoritative result
  }
}))
