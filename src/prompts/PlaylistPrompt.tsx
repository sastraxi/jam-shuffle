import React, { useState } from 'react'
import BasePrompt from '../core/BasePrompt'
import { createMakeChoice } from '../util'
import IconButton from '../components/IconButton'
import { useQuery } from '@tanstack/react-query'
import { AuthSession } from '@supabase/supabase-js'
import { SpotifyMyPlaylists } from '../types/spotify'
import { PromptState } from './types'

const PlaylistPrompt: React.FunctionComponent = () => {

    const getPlaylist = async () => {
        const res = await fetch('https://api.spotify.com/v1/playlists/{playlist_id}', {
          headers: { "Authorization": `Bearer ${session.provider_token}` }
        })
        return res.json() as Promise<SpotifyMyPlaylists>
    }
    
    const q = useQuery({
      queryKey: ["userPlaylists", ],
      enabled: !!session.provider_token,
      queryFn: getUserPlaylists,
    })

    const [makeChoice, setMakeChoice] = useState<ReturnType<typeof createMakeChoice> | undefined>(undefined)

    const swapIdea = () => {
        setIdea(lastIdea)
        setLastIdea(idea)
    }

    const shuffleIdea = () => {
        setIdea(makeChoice(idea))
        setLastIdea(idea)
    }

    return (
        <BasePrompt>
            <h1>
                <a>{idea}</a>
            </h1>
            <div>
                <IconButton type="undo" size="18px" onClick={swapIdea} disabled={!lastIdea} />
                <IconButton type="shuffle" size="18px" onClick={shuffleIdea} />
            </div>
        </BasePrompt>
    )
}

export default PlaylistPrompt
