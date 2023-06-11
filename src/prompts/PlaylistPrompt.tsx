import React, { useState } from 'react'
import BasePrompt from '../core/BasePrompt'
import { createMakeChoice } from '../util'
import IconButton from '../components/IconButton'
import { useQuery } from '@tanstack/react-query'
import { AuthSession } from '@supabase/supabase-js'
import { SpotifyMyPlaylists } from '../types/spotify'
import { PromptState } from './types'

export type PlaylistChoices = {
  songId: string
}

const PlaylistPrompt: React.FunctionComponent<PromptState<PlaylistChoices>> = ({
  prompt: { subtype },
  choices: { songId },
}) => {

    const getUserPlaylists = async () => {
        const res = await fetch('https://api.spotify.com/v1/me/playlists', {
          headers: { "Authorization": `Bearer ${session.provider_token}` }
        })
        return res.json() as Promise<SpotifyMyPlaylists>
    }
    
    const q = useQuery({
      queryKey: ["userPlaylists"],
      enabled: !!session.provider_token,
      queryFn: getUserPlaylists,
    })

    const [makeChoice, setMakeChoice] = useState<ReturnType<typeof createMakeChoice> | undefined>(undefined)

    const [lastIdea, setLastIdea] = useState<RerollValues | undefined>(undefined)
    const [idea, setIdea] = useState<RerollValues | undefined>(makeChoice())

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
