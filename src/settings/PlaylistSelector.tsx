import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AuthSession } from '@supabase/supabase-js'
import { SpotifyMyPlaylists } from '../types/spotify'
import SelectionGrid, { GridItem } from './SelectionGrid'
import { useUserPreferences } from '../state/user-prefs'
import { SavedPlaylist } from '../state/types'

const PlaylistSelector = ({
  session,
}: {
  session: AuthSession,
}) => {
    const { playlists, addPlaylist, removePlaylist } = useUserPreferences()

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

    if (!data) return null
    
    const allPlaylists: Array<GridItem> = data.items.map(playlist => ({
      id: playlist.id,
      caption: playlist.name,
      imageUrl: playlist.images[0].url,
    }))

    const onSelectItem = (item: GridItem, isNowSelected: boolean) => {
      const playlist: SavedPlaylist = { id: item.id, name: item.caption }
      if (isNowSelected) {
        addPlaylist(playlist)
      } else {
        removePlaylist(playlist)
      }
    }

    return (
      <SelectionGrid
        items={allPlaylists}
        selectedIds={new Set(Array.from(playlists).map(p => p.id))}
        onSelect={onSelectItem}
      />
    )
}

export default PlaylistSelector
