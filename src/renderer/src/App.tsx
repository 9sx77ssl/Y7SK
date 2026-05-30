import { useCallback, useEffect, useState } from 'react'
import { TitleBar } from '@renderer/components/TitleBar'
import { SettingsPanel } from '@renderer/components/SettingsPanel'
import { useSettings } from '@renderer/store/useSettings'

export function App(): React.JSX.Element {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const hydrate = useSettings((s) => s.hydrate)

  // Load settings + subscribe to external changes for the app lifetime.
  useEffect(() => hydrate(), [hydrate])

  const openSettings = useCallback((): void => {
    setSettingsOpen(true)
    window.y7sk.showSoundCloud(false) // hide native view -> reveal panel
  }, [])

  const closeSettings = useCallback((): void => {
    setSettingsOpen(false)
    window.y7sk.showSoundCloud(true) // restore native view
  }, [])

  const toggleSettings = useCallback((): void => {
    if (settingsOpen) closeSettings()
    else openSettings()
  }, [settingsOpen, openSettings, closeSettings])

  // Esc closes the settings panel.
  useEffect(() => {
    if (!settingsOpen) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closeSettings()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settingsOpen, closeSettings])

  return (
    <div className="app">
      <TitleBar settingsOpen={settingsOpen} onToggleSettings={toggleSettings} />
      <main className="app__main">{settingsOpen && <SettingsPanel onClose={closeSettings} />}</main>
    </div>
  )
}
