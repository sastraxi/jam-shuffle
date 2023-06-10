import React, { useState } from 'react'
import IconButton from '../components/IconButton'
import { useQuery } from '@tanstack/react-query'
import { AuthSession } from '@supabase/supabase-js'
import { SpotifyMyPlaylists } from '../types/spotify'

type url = string

const PlaylistSelector = ({
  session
}: {
  session: AuthSession
}) => {
    const getUserPlaylists = async () => {
        const res = await fetch('https://api.spotify.com/v1/me/playlists', {
          headers: { "Authorization": `Bearer ${session.provider_token}` }
        })
        return res.json() as Promise<SpotifyMyPlaylists>
    }
    
    const { data, isFetching } = useQuery({
      queryKey: ["userPlaylists"],
      enabled: !!session.provider_token,
      queryFn: getUserPlaylists,
    })

    return (
      <ul>
        { data && data.items.map(playlist =>
            <li key={playlist.id}>{playlist.name}</li>) }
      </ul>
    )
}

export default PlaylistSelector
