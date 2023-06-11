import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AuthSession } from '@supabase/supabase-js'
import { SpotifyMyPlaylists } from '../types/spotify'
import SelectionGrid, { GridItem } from './SelectionGrid'
import { useUserPreferences } from '../state/user-prefs'

const PlaylistSelector = ({
  session,
}: {
  session: AuthSession,
}) => {
    const { playlistIds, addPlaylistId, removePlaylistId } = useUserPreferences()

    const getUserPlaylists = async () => {
        const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
          headers: { "Authorization": `Bearer ${session.provider_token}` }
        })
        return res.json() as Promise<SpotifyMyPlaylists>
    }
    
    const { data, isFetching } = useQuery({
      queryKey: ["userPlaylists"],
      enabled: !!session.provider_token,
      queryFn: getUserPlaylists,
    })

    if (!data) return null;
    
    const playlists: Array<GridItem> = data.items.map(playlist => ({
      id: playlist.id,
      caption: playlist.name,
      imageUrl: playlist.images[0].url,
    }))

    const onSelectItem = (item: GridItem, isNowSelected: boolean) => {
      if (isNowSelected) {
        addPlaylistId(item.id)
      } else {
        removePlaylistId(item.id)
      }
    }

    return (
      <SelectionGrid
        items={playlists}
        selectedIds={playlistIds}
        onSelect={onSelectItem}
      />
    )
}

export default PlaylistSelector
