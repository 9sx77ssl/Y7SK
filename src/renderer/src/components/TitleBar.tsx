import { WindowControls } from '@renderer/components/WindowControls'

interface TitleBarProps {
  settingsOpen: boolean
  onToggleSettings: () => void
}

/** Frameless 40px drag surface: brand left, gear + window controls right. */
export function TitleBar({ settingsOpen, onToggleSettings }: TitleBarProps): React.JSX.Element {
  // Only react to genuine double-clicks on the bare drag surface.
  const handleDblClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) window.y7sk.titlebarDblClick()
  }

  return (
    <header className="titlebar drag" onDoubleClick={handleDblClick}>
      <div className="titlebar__brand">
        <svg className="titlebar__logo" viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <linearGradient id="y7grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff7733" />
              <stop offset="1" stopColor="#ff5500" />
            </linearGradient>
          </defs>
          {/* Stylized equalizer mark. */}
          <rect x="3" y="10" width="2.6" height="6" rx="1.3" fill="url(#y7grad)" />
          <rect x="7.4" y="6" width="2.6" height="12" rx="1.3" fill="url(#y7grad)" />
          <rect x="11.8" y="3" width="2.6" height="18" rx="1.3" fill="url(#y7grad)" />
          <rect x="16.2" y="7.5" width="2.6" height="9" rx="1.3" fill="url(#y7grad)" />
          <rect x="20.6" y="11" width="2.6" height="4" rx="1.3" fill="url(#y7grad)" />
        </svg>
        <span className="titlebar__wordmark">
          <b>Y7</b>SK
        </span>
      </div>

      <div className="titlebar__spacer drag" onDoubleClick={handleDblClick} />

      <div className="titlebar__actions no-drag">
        <button
          className="titlebar__gear"
          data-active={settingsOpen}
          aria-label="Settings"
          aria-pressed={settingsOpen}
          title="Settings"
          onClick={onToggleSettings}
        >
          {/* Symmetric, perfectly-round cog (filled — no stroke overflow, never clips). */}
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>
        <WindowControls />
      </div>
    </header>
  )
}
