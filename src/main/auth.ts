// Cookie-based sign-in: import pasted cookies into the SoundCloud session, or log out.
import { type CookiesSetDetails, ipcMain, session } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { CookieImportResult } from '@shared/types'
import { reloadSoundCloudView } from './soundcloud-view'

const PARTITION = 'persist:soundcloud'

// Only import cookies for SoundCloud hosts (incl. subdomains) — ignore anything else in the paste.
const SC_HOST_RE = /(^|\.)soundcloud\.com$/i

type SameSite = 'unspecified' | 'no_restriction' | 'lax' | 'strict'

// Normalize the many sameSite spellings browser exports use to Electron's enum.
function normalizeSameSite(v: unknown): SameSite {
  const s = String(v ?? '').toLowerCase()
  if (s === 'no_restriction' || s === 'none') return 'no_restriction'
  if (s === 'lax') return 'lax'
  if (s === 'strict') return 'strict'
  return 'unspecified'
}

interface RawCookie {
  name?: unknown
  value?: unknown
  domain?: unknown
  path?: unknown
  secure?: unknown
  httpOnly?: unknown
  sameSite?: unknown
  expirationDate?: unknown
  session?: unknown
}

// Accept either a bare array or a { cookies: [...] } wrapper.
function extractCookies(parsed: unknown): RawCookie[] | null {
  if (Array.isArray(parsed)) return parsed as RawCookie[]
  if (parsed && typeof parsed === 'object') {
    const c = (parsed as { cookies?: unknown }).cookies
    if (Array.isArray(c)) return c as RawCookie[]
  }
  return null
}

async function importCookies(json: string): Promise<CookieImportResult> {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, error: 'Invalid JSON.' }
  }
  const list = extractCookies(parsed)
  if (!list) return { ok: false, error: 'Expected a JSON array of cookies (e.g. a Cookie-Editor export).' }

  const ses = session.fromPartition(PARTITION)
  let count = 0
  for (const c of list) {
    if (typeof c?.name !== 'string' || typeof c?.value !== 'string') continue
    const rawDomain = typeof c.domain === 'string' ? c.domain : ''
    const host = rawDomain.replace(/^\./, '')
    if (!host || !SC_HOST_RE.test(host)) continue
    const path = typeof c.path === 'string' && c.path ? c.path : '/'
    const details: CookiesSetDetails = {
      url: `https://${host}${path.startsWith('/') ? path : '/' + path}`,
      name: c.name,
      value: c.value,
      domain: rawDomain || undefined,
      path,
      secure: c.secure !== false, // SoundCloud cookies are secure unless explicitly false
      httpOnly: Boolean(c.httpOnly),
      sameSite: normalizeSameSite(c.sameSite)
    }
    if (typeof c.expirationDate === 'number' && c.session !== true) {
      details.expirationDate = c.expirationDate
    }
    try {
      await ses.cookies.set(details)
      count++
    } catch {
      // Skip a malformed cookie rather than failing the whole import.
    }
  }

  if (count === 0) return { ok: false, error: 'No valid SoundCloud cookies found.' }
  reloadSoundCloudView()
  return { ok: true, count }
}

async function logout(): Promise<void> {
  const ses = session.fromPartition(PARTITION)
  try {
    await ses.clearStorageData() // cookies + localStorage + IndexedDB + service workers
  } catch {
    // ignore
  }
  reloadSoundCloudView()
}

// Register the auth IPC handlers.
export function registerAuthIpc(): void {
  ipcMain.handle(IPC.AUTH_IMPORT_COOKIES, (_e, json: unknown): Promise<CookieImportResult> => {
    if (typeof json !== 'string') return Promise.resolve({ ok: false, error: 'No data.' })
    return importCookies(json)
  })
  ipcMain.handle(IPC.AUTH_LOGOUT, () => logout())
}
