import type { WebContents } from 'electron'

// Swallow the devtools-opening shortcuts (F12, Ctrl/Cmd+Shift+I/J/C) so they never fire.
// Paired with webPreferences.devTools:false, which also blocks programmatic opening.
export function blockDevtoolsShortcuts(wc: WebContents): void {
  wc.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    const key = (input.key || '').toLowerCase()
    const ctrlShift = input.control && input.shift
    const cmdAlt = input.meta && input.alt // macOS variant
    if (
      key === 'f12' ||
      (ctrlShift && (key === 'i' || key === 'j' || key === 'c')) ||
      (cmdAlt && (key === 'i' || key === 'j' || key === 'c'))
    ) {
      event.preventDefault()
    }
  })
}
