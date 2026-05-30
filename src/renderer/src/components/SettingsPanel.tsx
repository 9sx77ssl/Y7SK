import { useEffect, useMemo, useRef, useState } from 'react'
import type { SettingKey } from '@shared/settings'
import { RESTART_REQUIRED } from '@shared/settings'
import { useSettings } from '@renderer/store/useSettings'
import { useNowPlaying } from '@renderer/hooks/useNowPlaying'
import { Switch } from '@renderer/components/Switch'

// App version shown in the About line (mirrors package.json).
const APP_VERSION = '0.1.0'

interface RowDef {
  key: SettingKey
  label: string
  desc: string
}

const ROWS: RowDef[] = [
  { key: 'launchOnStartup', label: 'Launch on startup', desc: 'Open Y7SK automatically when you sign in.' },
  { key: 'alwaysOnTop', label: 'Always on top', desc: 'Keep the Y7SK window above all other windows.' },
  { key: 'hardwareAccel', label: 'Hardware acceleration', desc: 'Use the GPU for smoother rendering and playback.' },
  { key: 'startMinimized', label: 'Start minimized', desc: 'Launch hidden instead of showing the window.' },
  { key: 'minimizeToTray', label: 'Minimize to tray', desc: 'Closing the window keeps Y7SK running in the tray.' }
]

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps): React.JSX.Element {
  const settings = useSettings((s) => s.settings)
  const set = useSettings((s) => s.set)
  const { track, playback } = useNowPlaying()

  // Snapshot restart-sensitive values on first render to detect in-session changes.
  const baseline = useRef<Partial<Record<SettingKey, boolean>>>({})
  const [restartKeys, setRestartKeys] = useState<Set<SettingKey>>(new Set())

  useEffect(() => {
    if (settings && Object.keys(baseline.current).length === 0) {
      for (const k of RESTART_REQUIRED) baseline.current[k] = settings[k]
    }
  }, [settings])

  const handleToggle = (key: SettingKey, next: boolean): void => {
    void set(key, next)
    if (RESTART_REQUIRED.includes(key)) {
      setRestartKeys((prev) => {
        const updated = new Set(prev)
        const original = baseline.current[key]
        if (original === undefined || next === original) updated.delete(key)
        else updated.add(key)
        return updated
      })
    }
  }

  const ready = settings !== null
  const stateLabel = useMemo(
    () => (playback === 'playing' ? 'Playing' : playback === 'paused' ? 'Paused' : ''),
    [playback]
  )

  return (
    <section className="settings" role="region" aria-label="Settings">
      <div className="settings__header">
        <button className="settings__back" aria-label="Close settings" title="Back to SoundCloud" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5 L8 12 L15 19" />
          </svg>
        </button>
        <h1 className="settings__title">Settings</h1>
      </div>

      <div className="settings__body">
        <div className="settings__list">
          {ROWS.map((row) => {
            const value = ready ? settings[row.key] : false
            const showPill = restartKeys.has(row.key)
            return (
              <div className="srow" key={row.key}>
                <div className="srow__text">
                  <div className="srow__label">
                    <span>{row.label}</span>
                    {showPill && <span className="pill">Restart required</span>}
                  </div>
                  <div className="srow__desc">{row.desc}</div>
                </div>
                <Switch
                  label={row.label}
                  checked={value}
                  disabled={!ready}
                  onChange={(next) => handleToggle(row.key, next)}
                />
              </div>
            )
          })}
        </div>
      </div>

      <footer className="settings__footer">
        {track ? (
          <div className="np">
            {track.artwork ? (
              <img className="np__art" src={track.artwork} alt="" />
            ) : (
              <div className="np__art np__art--ph" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M9 18V6l10-2v12" />
                  <circle cx="6.5" cy="18" r="2.5" />
                  <circle cx="16.5" cy="16" r="2.5" />
                </svg>
              </div>
            )}
            <div className="np__meta">
              <span className="np__title">{track.title}</span>
              <span className="np__artist">{track.artist}</span>
            </div>
            {stateLabel && (
              <span className="np__state">
                <span className={'np__dot' + (playback === 'playing' ? ' np__dot--playing' : '')} />
                {stateLabel}
              </span>
            )}
          </div>
        ) : (
          <div className="np np--idle">Nothing playing</div>
        )}

        <span className="settings__about">
          <b>Y7SK</b> · v{APP_VERSION}
        </span>
      </footer>
    </section>
  )
}
