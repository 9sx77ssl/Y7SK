import { useEffect, useState } from 'react'
import type { TrackInfo, PlaybackState } from '@shared/types'

interface NowPlaying {
  track: TrackInfo | null
  playback: PlaybackState
}

/** Subscribes to MediaSession track/playback pushed from the SoundCloud view. */
export function useNowPlaying(): NowPlaying {
  const [track, setTrack] = useState<TrackInfo | null>(null)
  const [playback, setPlayback] = useState<PlaybackState>('none')

  useEffect(() => {
    // Seed with whatever is already playing, then keep in sync with live pushes.
    void window.y7sk.getNowPlaying().then(({ track: t, playback: p }) => {
      if (t) setTrack(t)
      setPlayback(p)
    })
    const offTrack = window.y7sk.onTrack(setTrack)
    const offPlayback = window.y7sk.onPlayback(setPlayback)
    return () => {
      offTrack()
      offPlayback()
    }
  }, [])

  return { track, playback }
}
