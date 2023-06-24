import React, { useMemo } from 'react'
import BasePrompt from '../core/BasePrompt'
import { createMakeChoice } from '../util'
import IconButton from '../components/IconButton'
import { useQuery } from '@tanstack/react-query'
import { SpotifyAudioFeatures, SpotifyGetPlaylist, Track } from '../types/spotify'
import { useCategory, usePromptChoices, useSession, useSetPromptChoice } from '../state/app'
import Spinner from '../components/Spinner'

import './PlaylistPrompt.css'
import Choice from '../components/Choice'

type PromptChoices = {
  songId: string | undefined
}

const PITCH_CLASS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const MODES = ['minor', 'major']

const PlaylistPrompt: React.FunctionComponent = () => {
  const session = useSession()
  const category = useCategory()
  const { songId } = usePromptChoices<PromptChoices>()
  const setPromptChoice = useSetPromptChoice<PromptChoices>()

  const playlist = useQuery({
    queryKey: ["playlist", category.subtype],
    enabled: !!session?.provider_token,
    queryFn: async ({ queryKey }) => {
      const [, playlistId] = queryKey
      if (!session) return null
      const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: { "Authorization": `Bearer ${session.provider_token}` }
      })
      return res.json() as Promise<SpotifyGetPlaylist>
    },
  })

  const audioFeatures = useQuery({
    queryKey: ["audio-features", songId],
    enabled: !!session?.provider_token && !!songId,
    queryFn: async ({ queryKey }) => {
      const [, songId] = queryKey
      if (!session) return null
      const res = await fetch(`https://api.spotify.com/v1/audio-features/${songId}`, {
        headers: { "Authorization": `Bearer ${session.provider_token}` }
      })
      return res.json() as Promise<SpotifyAudioFeatures>
    },
  })

  const { tracksById, tracks } = useMemo(() => {
    const nextTracks = playlist.data?.tracks.items.map(({ track }) => track) ?? []
    const nextTracksById: Record<string, Track> = {}
    nextTracks.forEach(track => nextTracksById[track.id] = track)
    return {
      tracksById: nextTracksById,
      tracks: nextTracks,
    }
  }, [playlist.data])

  const makeChoice = useMemo(() => {
    const songIds = Object.values(tracksById).map(track => track.id)
    if (songIds.length === 0) return undefined

    const nextMakeChoice = createMakeChoice(songIds)
    if (!songId || !songIds.includes(songId)) {
      setPromptChoice({ songId: nextMakeChoice() }, true)
    }    
  
    return nextMakeChoice
  }, [tracksById])

  if (!songId || !makeChoice) {
    return (<Spinner size="24px" />)
  }

  const track = tracksById[songId]
  const audioFeaturesElement = !audioFeatures.data
    ? <Spinner size="18px" />
    : (
      <div className="audioFeatures">
        <div>
          <h3>Time<br/>signature</h3>
          <h2>{audioFeatures.data.time_signature}/4</h2>
        </div>
        <div>
          <h3>Key</h3>
          <h2>{PITCH_CLASS[audioFeatures.data.key]} {MODES[audioFeatures.data.mode]}</h2>
        </div>
        <div>
          <h3>BPM</h3>
          <h2>{Math.round(audioFeatures.data.tempo)}</h2>
        </div>
        <div>
          <h3>Listen &amp;<br/>lyrics</h3>
          <IconButton
            type="external link"
            size="20px"
            href={track.external_urls.spotify}
            target="_blank"
          />
        </div>
      </div>
    )
    
  const shuffleTrack = () => setPromptChoice({ songId: makeChoice(songId) })
  const setTrack = (track: Track) => setPromptChoice({ songId: track.id })
  return (
    <BasePrompt>
      <h1>
        <Choice
          current={track}
          displayTransform={track => `${track.artists[0].name} - ${track.name}`}
          allChoices={tracks}
          setChoice={setTrack}
          fullWidth
        />
      </h1>
      {audioFeaturesElement}
      <div className="buttons">
        <IconButton type="shuffle" size="24px" onClick={shuffleTrack} />
      </div>
    </BasePrompt>
  )
}

export default PlaylistPrompt
