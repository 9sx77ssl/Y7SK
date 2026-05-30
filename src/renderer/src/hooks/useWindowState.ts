import { useEffect, useState } from 'react'

/** Tracks the host window's maximized state via the y7sk bridge. */
export function useWindowState(): { maximized: boolean } {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    let alive = true
    void window.y7sk.isMaximized().then((m) => {
      if (alive) setMaximized(m)
    })
    const off = window.y7sk.onMaximized(setMaximized)
    return () => {
      alive = false
      off()
    }
  }, [])

  return { maximized }
}
