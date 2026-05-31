// The SoundCloud content surface: a WebContentsView sized below the custom title bar.
import { join } from 'node:path'
import { type BrowserWindow, shell, WebContentsView } from 'electron'
import { blockDevtoolsShortcuts } from './util/devtools'

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

// Cosmetic cleanup: hide upsell/promo/ad blocks + junk menu items (verified SoundCloud selectors).
// :has() is supported by Electron 42's Chromium. The overflow menu itself is kept — only junk
// items inside it are hidden (so Settings / Sign out / Keyboard shortcuts stay).
const CLEANUP_CSS = `
  div.banner.m-promotion, .l-product-banners,
  div.banner:has(a.nextProAnnualPromotionBanner__link),
  div.banner:has(a.nextProTrial__link),
  a.nextProTrial__link, a.nextProAnnualPromotionBanner__link,
  a.header__goUpsell_side_by_side_experience,
  a.header__proUpsell_side_by_side_experience,
  a.creatorSubscriptionsButton, .header__upsell, .header__upsellWrapper,
  .playControls__panel.m-upsell-styling, .playControlsPanel.m-upsell-styling,
  .m-upsell-styling, .m-promotion, .m-highlight, .streamHTUpsell,
  .mobileApps, .l-front-mobile-teaser,
  div.adContainer, .ad-region, .adswizz-banner,
  li:has(> a[href*="checkout.soundcloud.com"]),
  li:has(> a[href="/download"]),
  li:has(> a[href*="/pages/membership"]),
  li:has(> a[href*="/settings/subscription"]),
  li:has(> a[href*="/distribution"]),
  li:has(> a[href*="/benefits"]),
  li:has(> a.m-highlight),
  li:has(> a.creatorSubscriptionsButton),
  a[href*="checkout.soundcloud.com"] { display: none !important; }
`

// Page-cleanup script: removes junk menu items (by text, scoped to menus) + skips audio ads
// (badge title turns to "Advertisement" → mute all media + click the real next button).
const CLEANUP_JS = `
(function () {
  'use strict';
  if (window.__y7skCleanup) return; window.__y7skCleanup = true;

  var JUNK = ['try artist pro','try next pro','benefits','distribute','get soundcloud go+',
    'soundcloud go+','mobile apps','artist membership','subscription','upgrade now',
    'start free trial'];
  var MENUS = '.dropdownMenu, .moreMenu, .headerMenu, [role="menu"], ul.dropdown__list';
  function norm(s){ return (s||'').replace(/\\s+/g,' ').trim().toLowerCase(); }
  function hide(el){ var li = (el.closest && el.closest('li')) || el; if (li && li.style) li.style.setProperty('display','none','important'); }
  function cleanMenus(){
    try {
      var nodes = document.querySelectorAll('a, button');
      for (var i=0;i<nodes.length;i++){ var el=nodes[i];
        var t=norm(el.textContent);
        if (t && JUNK.indexOf(t)!==-1 && el.closest && el.closest(MENUS)) hide(el);
      }
    } catch(e){}
  }

  var AD_RE = /\\bAdvertisement\\b/i, lastSkip = 0;
  function isAd(){
    try {
      var t=document.querySelector('.playbackSoundBadge__titleLink');
      if (t && AD_RE.test((t.getAttribute('title')||t.textContent||''))) return true;
      var a=document.querySelector('.playbackSoundBadge__avatar .image__lightOutline span');
      if (a && AD_RE.test(a.getAttribute('aria-label')||'')) return true;
      if (AD_RE.test(document.title||'')) return true;
    } catch(e){}
    return false;
  }
  function eachMedia(fn){ try{ var m=document.querySelectorAll('audio,video'); for(var i=0;i<m.length;i++){ try{fn(m[i]);}catch(e){} } }catch(e){} }
  function mute(){ eachMedia(function(m){ if(!m.muted) m.muted=true; }); }
  function unmute(){ eachMedia(function(m){ if(m.muted) m.muted=false; }); }
  function skip(){
    var now=Date.now(); if(now-lastSkip<1500) return; lastSkip=now;
    var n=document.querySelector('.skipControl__next'); if(n){ n.click(); return; }
    eachMedia(function(m){ if(isFinite(m.duration)&&m.duration>0&&m.currentTime<m.duration-0.5) m.currentTime=m.duration; });
  }
  function adTick(){ try{ if(isAd()){ mute(); skip(); } else { unmute(); } }catch(e){} }

  try {
    var obs=new MutationObserver(function(){ adTick(); });
    obs.observe(document.body||document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['title','aria-label','class']});
  } catch(e){}
  setInterval(function(){ cleanMenus(); adTick(); }, 1000);
  try{ cleanMenus(); adTick(); }catch(e){}
})();
`

let cleanupEnabled = false

// Toggle the page-cleanup (cosmetic CSS + menu/junk removal + audio-ad skip). A reload re-applies it.
export function setCleanupEnabled(on: boolean): void {
  cleanupEnabled = on
}

// Inject the cleanup CSS + script into the SoundCloud page (idempotent via the script's own guard).
function injectCleanup(wc: Electron.WebContents): void {
  void wc.insertCSS(CLEANUP_CSS)
  void wc.executeJavaScript(CLEANUP_JS).catch(() => {
    /* page navigated mid-inject; ignore */
  })
}

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
      devTools: false, // DevTools fully disabled on the SoundCloud view too
      preload: join(import.meta.dirname, '../preload/scbridge.js')
    }
  })

  win.contentView.addChildView(view)

  const wc = view.webContents
  blockDevtoolsShortcuts(wc)

  // Re-apply injections on every document load (initial + reloads + SPA full loads).
  wc.on('dom-ready', () => {
    void wc.insertCSS(SCROLLBAR_CSS)
    if (cleanupEnabled) injectCleanup(wc)
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
