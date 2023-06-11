import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AuthSession } from '@supabase/supabase-js'
import { SpotifyMyPlaylists } from '../types/spotify'
import SelectionGrid, { GridItem } from './SelectionGrid'

type url = string

const PlaylistSelector = ({
  session,
  selectedIds,
  setSelectedIds,
}: {
  session: AuthSession,
  selectedIds: Set<string>,
  setSelectedIds: (selectedIds: Set<string>) => unknown
}) => {
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
      const newSelection = new Set(selectedIds)
      if (isNowSelected) {
        newSelection.add(item.id)
      } else {
        newSelection.delete(item.id)
      }
      setSelectedIds(newSelection)
    }

    return (
      <SelectionGrid
        items={playlists}
        selectedIds={selectedIds}
        onSelect={onSelectItem}
      />
    )
}

export default PlaylistSelector
