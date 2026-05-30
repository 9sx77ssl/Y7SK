// App lifecycle flag: gates close-to-tray so an explicit Quit truly exits.
let quitting = false

// True once a real quit has been requested (tray Quit, before-quit, etc.).
export function isQuitting(): boolean {
  return quitting
}

// Mark that the app is genuinely quitting (bypasses close-to-tray).
export function setQuitting(value: boolean): void {
  quitting = value
}
