// Linux autostart: write/remove ~/.config/autostart/y7sk.desktop. No-op elsewhere.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const DESKTOP_FILE = 'y7sk.desktop'

// Resolve the autostart directory (respects XDG_CONFIG_HOME).
function autostartDir(): string {
  const base = process.env.XDG_CONFIG_HOME?.trim() || join(homedir(), '.config')
  return join(base, 'autostart')
}

// Exec target: the AppImage when packaged as such, otherwise the running binary.
function execTarget(): string {
  return process.env.APPIMAGE ?? process.execPath
}

// Build a freedesktop .desktop autostart entry for Y7SK.
function desktopEntry(): string {
  return [
    '[Desktop Entry]',
    'Type=Application',
    'Name=Y7SK',
    'Comment=Modern desktop client for SoundCloud',
    `Exec=${execTarget()}`,
    'Terminal=false',
    'X-GNOME-Autostart-enabled=true',
    'StartupWMClass=Y7SK',
    ''
  ].join('\n')
}

// Enable or disable Linux login autostart by managing the .desktop file.
export function setLinuxAutostart(enabled: boolean): void {
  if (process.platform !== 'linux') return
  const dir = autostartDir()
  const file = join(dir, DESKTOP_FILE)
  try {
    if (enabled) {
      mkdirSync(dir, { recursive: true })
      writeFileSync(file, desktopEntry(), { encoding: 'utf8', mode: 0o644 })
    } else {
      rmSync(file, { force: true })
    }
  } catch {
    // Best-effort: never crash the app over an autostart write failure.
  }
}
