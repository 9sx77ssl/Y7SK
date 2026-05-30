import { useWindowState } from '@renderer/hooks/useWindowState'

/** Minimize / maximize-restore / close — frameless window controls. */
export function WindowControls(): React.JSX.Element {
  const { maximized } = useWindowState()

  return (
    <div className="wc no-drag">
      <button
        className="wc__btn"
        aria-label="Minimize"
        title="Minimize"
        onClick={() => window.y7sk.minimize()}
      >
        <svg viewBox="0 0 11 11" aria-hidden="true">
          <rect x="1" y="5" width="9" height="1" fill="currentColor" />
        </svg>
      </button>

      <button
        className="wc__btn"
        aria-label={maximized ? 'Restore' : 'Maximize'}
        title={maximized ? 'Restore' : 'Maximize'}
        onClick={() => window.y7sk.toggleMaximize()}
      >
        {maximized ? (
          <svg viewBox="0 0 11 11" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="2.5" y="0.5" width="8" height="8" rx="0.5" />
            <rect x="0.5" y="2.5" width="8" height="8" rx="0.5" fill="var(--bg-2)" />
          </svg>
        ) : (
          <svg viewBox="0 0 11 11" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="0.5" y="0.5" width="10" height="10" rx="0.5" />
          </svg>
        )}
      </button>

      <button
        className="wc__btn wc__btn--close"
        aria-label="Close"
        title="Close"
        onClick={() => window.y7sk.close()}
      >
        <svg viewBox="0 0 11 11" aria-hidden="true" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
          <path d="M1 1 L10 10 M10 1 L1 10" />
        </svg>
      </button>
    </div>
  )
}
