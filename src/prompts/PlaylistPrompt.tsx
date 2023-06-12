import React, { useMemo } from 'react'
import BasePrompt from '../core/BasePrompt'
import { createMakeChoice } from '../util'
import IconButton from '../components/IconButton'
import { useQuery } from '@tanstack/react-query'
import { SpotifyGetPlaylist, Track } from '../types/spotify'
import { useCategory, usePromptChoices, useSession, useSetPromptChoice } from '../state/app'
import Spinner from '../components/Spinner'

type PromptChoices = {
  songId: string | undefined
}

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

  const tracksById = useMemo(() => {
    const nextTracksById: Record<string, Track> = {}
    playlist.data?.tracks.items.forEach(
      ({ track }) => nextTracksById[track.id] = track
    )
    return nextTracksById
  }, [playlist.data])

  const makeChoice = useMemo(() => {
    const songIds = Object.values(tracksById).map(track => track.id)
    if (songIds.length === 0) return undefined

    const nextMakeChoice = createMakeChoice(songIds)
    if (!songId || !songIds.includes(songId)) {
      setPromptChoice('songId', nextMakeChoice(), true)
    }    
  
    return nextMakeChoice
  }, [tracksById])

  if (!songId || !makeChoice) {
    return (<Spinner size="24px" />)
  }

  const track = tracksById[songId]
  const shuffleIdea = () => setPromptChoice('songId', makeChoice(songId))
  return (
    <BasePrompt>
      <h1>
        <a>{track.artists[0].name} - {track.name}</a>
      </h1>
      <div className="buttons">
        <IconButton type="shuffle" size="24px" onClick={shuffleIdea} />
      </div>
    </BasePrompt>
  )
}

export default PlaylistPrompt
