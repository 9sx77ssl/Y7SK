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
  { key: 'minimizeToTray', label: 'Minimize to tray', desc: 'Closing the window keeps Y7SK running in the tray.' },
  { key: 'startMinimized', label: 'Start minimized', desc: 'Launch hidden instead of showing the window.' },
  { key: 'trackNotifications', label: 'Track notifications', desc: 'Show a desktop notification when the track changes.' },
  { key: 'hardwareAccel', label: 'Hardware acceleration', desc: 'Use the GPU for smoother rendering and playback.' }
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

  // Cookie-based sign-in / logout.
  const [cookieText, setCookieText] = useState('')
  const [authMsg, setAuthMsg] = useState<{ kind: 'ok' | 'err' | 'busy'; text: string } | null>(null)
  const busy = authMsg?.kind === 'busy'

  const handleImport = async (): Promise<void> => {
    if (!cookieText.trim()) {
      setAuthMsg({ kind: 'err', text: 'Paste your cookies JSON first.' })
      return
    }
    setAuthMsg({ kind: 'busy', text: 'Importing…' })
    const res = await window.y7sk.importCookies(cookieText)
    if (res.ok) {
      setAuthMsg({ kind: 'ok', text: `Imported ${res.count} cookies — signing in…` })
      window.setTimeout(onClose, 900)
    } else {
      setAuthMsg({ kind: 'err', text: res.error ?? 'Import failed.' })
    }
  }

  const handleLogout = async (): Promise<void> => {
    setAuthMsg({ kind: 'busy', text: 'Logging out…' })
    await window.y7sk.logout()
    setCookieText('')
    setAuthMsg({ kind: 'ok', text: 'Logged out — reloading…' })
    window.setTimeout(onClose, 700)
  }

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
        <section className="account">
          <div className="account__head">
            <h2 className="settings__section">Account</h2>
            <button className="btn btn--ghost" onClick={() => void handleLogout()} disabled={busy}>
              Log out
            </button>
          </div>
          <p className="account__hint">
            Sign in by pasting your SoundCloud cookies as JSON — e.g. an export from the Cookie-Editor browser
            extension.
          </p>
          <textarea
            className="account__input"
            spellCheck={false}
            placeholder={'[ { "name": "oauth_token", "value": "…", "domain": ".soundcloud.com", "path": "/", "secure": true }, … ]'}
            value={cookieText}
            onChange={(e) => setCookieText(e.target.value)}
          />
          <div className="account__actions">
            <button className="btn btn--accent" onClick={() => void handleImport()} disabled={busy}>
              Sign in with cookies
            </button>
            {authMsg && (
              <span className={'account__status account__status--' + authMsg.kind}>{authMsg.text}</span>
            )}
          </div>
        </section>

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
          <span className="np--empty" />
        )}

        <span className="settings__about">
          <b>Y7SK</b> · v{APP_VERSION}
        </span>
      </footer>
    </section>
  )
}
