// Network-level ad/tracker blocking on the SoundCloud session via @ghostery/adblocker-electron.
// Page-level cosmetic cleanup + audio-ad skipping live in soundcloud-view.ts (DOM injection).
import { app, session } from 'electron'
import { ElectronBlocker } from '@ghostery/adblocker-electron'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { reloadSoundCloudView, setCleanupEnabled } from './soundcloud-view'

const PARTITION = 'persist:soundcloud'

// Safe SoundCloud telemetry/ad hosts layered on the prebuilt ads+tracking lists.
// NEVER block sndcdn.com / api-v2.soundcloud.com / secure. / api-auth. / *.datadome.co —
// those carry the actual audio, playback API, and login; blocking them breaks the app.
const SC_NET_RULES = ['||eventgateway.soundcloud.com^', '||telemetry.soundcloud.com^']

let blocker: ElectronBlocker | null = null
let enabled = false

// Build (and disk-cache) the blocking engine once. Falls back to an empty engine if offline.
async function getBlocker(): Promise<ElectronBlocker> {
  if (blocker) return blocker
  const enginePath = join(app.getPath('userData'), 'adblocker-engine.bin')
  try {
    blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, {
      path: enginePath,
      read: fs.readFile,
      write: fs.writeFile
    })
  } catch {
    // No network / corrupt cache — start empty so the app still works, just with our rules.
    blocker = ElectronBlocker.parse('')
  }
  try {
    blocker.updateFromDiff({ added: SC_NET_RULES, removed: [] })
  } catch {
    // ignore rule-parse issues
  }
  return blocker
}

// Toggle network blocking on the SoundCloud session.
async function setAdBlockNetwork(on: boolean): Promise<void> {
  const ses = session.fromPartition(PARTITION)
  if (on) {
    const b = await getBlocker()
    if (!enabled) {
      b.enableBlockingInSession(ses)
      enabled = true
    }
  } else if (blocker && enabled) {
    blocker.disableBlockingInSession(ses)
    enabled = false
  }
}

// Apply the full ad/clutter state: network engine + page cleanup. Reload to re-apply (toggle), not at startup.
export async function applyAdBlock(on: boolean, reload = false): Promise<void> {
  setCleanupEnabled(on) // set synchronously so the next dom-ready injects cleanup
  if (reload) reloadSoundCloudView()
  await setAdBlockNetwork(on)
}
