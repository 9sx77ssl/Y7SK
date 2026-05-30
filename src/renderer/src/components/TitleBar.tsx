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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <circle cx="12" cy="12" r="3.1" />
            <path d="M12 2.2v2.4M12 19.4v2.4M21.8 12h-2.4M4.6 12H2.2M18.9 5.1l-1.7 1.7M6.8 17.2l-1.7 1.7M18.9 18.9l-1.7-1.7M6.8 6.8 5.1 5.1" />
          </svg>
        </button>
        <WindowControls />
      </div>
    </header>
  )
}
