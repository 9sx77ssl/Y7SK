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
    const offTrack = window.y7sk.onTrack(setTrack)
    const offPlayback = window.y7sk.onPlayback(setPlayback)
    return () => {
      offTrack()
      offPlayback()
    }
  }, [])

  return { track, playback }
}
