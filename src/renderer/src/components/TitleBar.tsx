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
          {/* viewBox padded (-2..26) so the outer teeth/strokes never clip at the icon edge. */}
          <svg viewBox="-2 -2 28 28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V15z" />
          </svg>
        </button>
        <WindowControls />
      </div>
    </header>
  )
}
