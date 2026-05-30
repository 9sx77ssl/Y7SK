# Y7SK

**Modern desktop client for SoundCloud** — a lightweight, cross-platform Electron shell around [soundcloud.com](https://soundcloud.com) that behaves like a native app (custom frameless window, system tray, OS media integration, persistent login).

> Personal/local use. No backend, no telemetry, no cloud.

![Electron](https://img.shields.io/badge/Electron-42-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![bun](https://img.shields.io/badge/bun-runtime-000?logo=bun&logoColor=white)

## Features

- 🎵 Full SoundCloud experience in a native `WebContentsView` — login & playback persist across restarts.
- 🪟 Custom frameless title bar, identical on Windows / Linux / macOS (no native chrome).
- 🎛️ OS media keys & now-playing (Windows SMTC · Linux MPRIS · macOS Now Playing) via the page's MediaSession.
- 🔔 Desktop notifications on track / playback changes.
- 📦 System tray — close-to-tray, Open / Show / Reload / Quit, single-instance.
- ⚙️ Settings: launch on startup · always on top · hardware acceleration · start minimized · minimize to tray.
- 🔒 Secure by default: `contextIsolation` + `sandbox` + `nodeIntegration:false`, contextBridge IPC.

## Tech

Electron · TypeScript · electron-vite · React · Zustand · electron-store · electron-builder. Toolchain runs on **bun**.

## Development

```bash
bun install            # installs deps (Electron binary auto-downloads via trustedDependencies)
bun run dev            # vite HMR for the UI + main/preload rebuild-and-restart
```

Other scripts:

```bash
bun run typecheck      # tsc for node + web contexts
bun run build          # production build into out/
bun run icons          # regenerate the icon set from assets/*.svg
```

## Build (when you want installers)

```bash
bun run dist:linux     # AppImage + deb
bun run dist:win       # NSIS installer + portable   (run on Windows)
bun run dist:mac       # DMG                          (run on macOS)
```

## Architecture

```
BrowserWindow (frame:false)
├─ webContents  → React title-bar shell (src/renderer)   ← the only HTML chrome
└─ contentView
   └─ WebContentsView → soundcloud.com (inset below the 40px title bar)
```

The SoundCloud view is a native child view layered **above** the host HTML, so the settings panel is shown by **hiding** the view (`setVisible(false)`) rather than overlaying it.

```
src/
├─ main/        # window, soundcloud-view, tray, settings, media, ipc, window-state
├─ preload/     # index.ts (window.y7sk bridge) · scbridge.ts (MediaSession observer)
├─ renderer/    # React title bar + settings (Zustand)
└─ shared/      # IPC channel + settings + type contract (single source of truth)
```

Design notes & decisions: [`docs/superpowers/specs/2026-05-30-y7sk-design.md`](docs/superpowers/specs/2026-05-30-y7sk-design.md).

## License

MIT
