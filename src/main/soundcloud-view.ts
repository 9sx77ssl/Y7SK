// The SoundCloud content surface: a WebContentsView sized below the custom title bar.
import { join } from 'node:path'
import { type BrowserWindow, shell, WebContentsView } from 'electron'

// Height (px) reserved at the top for the frameless React title bar.
export const TITLE_BAR = 40

let view: WebContentsView | null = null

// SoundCloud's own hosts (incl. subdomains like secure./api-auth./m.) are navigated in-app.
const SC_HOST_RE = /(^|\.)soundcloud\.com$/i

// OAuth provider hosts that must open in the user's real browser, never embedded.
function isOAuthHost(host: string): boolean {
  return (
    host === 'accounts.google.com' ||
    host === 'appleid.apple.com' ||
    host === 'facebook.com' ||
    /(^|\.)facebook\.com$/i.test(host)
  )
}

// Parse a URL, returning null on anything malformed.
function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

// Dark, themed scrollbars injected into the SoundCloud page (replaces the default light one).
const SCROLLBAR_CSS = `
  html { scrollbar-color: #2b2b33 transparent; scrollbar-width: thin; }
  ::-webkit-scrollbar { width: 12px; height: 12px; }
  ::-webkit-scrollbar-track { background: #0f0f12; }
  ::-webkit-scrollbar-thumb {
    background: #2b2b33; border-radius: 8px;
    border: 3px solid #0f0f12; background-clip: padding-box;
  }
  ::-webkit-scrollbar-thumb:hover { background: #3a3a44; background-clip: padding-box; }
  ::-webkit-scrollbar-corner { background: #0f0f12; }
`

// Build the SoundCloud view (idempotent) and attach it under the host window.
export function createSoundCloudView(win: BrowserWindow): WebContentsView {
  if (view) return view

  view = new WebContentsView({
    webPreferences: {
      partition: 'persist:soundcloud',
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      backgroundThrottling: false, // keep audio + mediaSession polling alive while hidden/minimized
      preload: join(import.meta.dirname, '../preload/scbridge.js')
    }
  })

  win.contentView.addChildView(view)

  const wc = view.webContents

  // Re-inject the dark scrollbar on every document load (initial + reloads).
  wc.on('dom-ready', () => {
    void wc.insertCSS(SCROLLBAR_CSS)
  })

  // Popup policy: deny by default; route OAuth/other to the OS browser, allow SoundCloud popups.
  wc.setWindowOpenHandler(({ url }) => {
    const u = parseUrl(url)
    if (!u || (u.protocol !== 'https:' && u.protocol !== 'http:')) {
      return { action: 'deny' }
    }
    if (isOAuthHost(u.hostname)) {
      void shell.openExternal(url)
      return { action: 'deny' }
    }
    if (SC_HOST_RE.test(u.hostname)) {
      // Allow a SoundCloud child window; force explicit, isolated, sandboxed prefs (no spread).
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          webPreferences: {
            partition: 'persist:soundcloud',
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false
          }
        }
      }
    }
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  // Keep top-level navigation on SoundCloud; bounce anything else to the OS browser.
  wc.on('will-navigate', (event, url) => {
    const u = parseUrl(url)
    if (!u) return
    if (!SC_HOST_RE.test(u.hostname)) {
      event.preventDefault()
      void shell.openExternal(url)
    }
  })

  void wc.loadURL('https://soundcloud.com')

  return view
}

// Current view instance (or null before creation).
export function getSoundCloudView(): WebContentsView | null {
  return view
}

// Fit the view to the host content area below the title bar.
export function layoutSoundCloudView(win: BrowserWindow): void {
  if (!view) return
  const { width, height } = win.getContentBounds()
  view.setBounds({ x: 0, y: TITLE_BAR, width, height: Math.max(0, height - TITLE_BAR) })
}

// Show/hide the view (false reveals the settings panel beneath it).
export function setSoundCloudVisible(visible: boolean): void {
  view?.setVisible(visible)
}

// Reload the embedded SoundCloud page.
export function reloadSoundCloudView(): void {
  if (view && !view.webContents.isDestroyed()) view.webContents.reload()
}
