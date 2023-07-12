import { useEffect, useState } from "react"
import MenuContainer from "./MenuContainer"
import PlaylistSelector from "./PlaylistSelector"
import './Settings.css'
import IconButton from "../components/IconButton"
import { useQuery } from "@tanstack/react-query"
import { SpotifyMe } from "../types/spotify"
import { useSession, useSetSession } from "../state/app"
import { signout, supabase } from "../core/supabase"
import LoginButton from "../core/LoginButton"

const Settings = () => {
    const [isActive, setActive] = useState<boolean>(false)
    const menuIcon = isActive ? 'close' : 'settings'
    const session = useSession()
    const setSession = useSetSession()
    
    // FIXME: why does app re-render (once) when we click somewhere?
    const { isLoading, error, data, isFetching, isError, refetch } = useQuery<SpotifyMe>({
        queryKey: ["userProfile"],
        enabled: !!session?.user,
        queryFn: async () => {
        if (!session) return null
        if (!session.provider_token) {
            // FIXME: are we supposed to save the provider_token / refresh token ourselves and re-add to session?
            signout()
            throw new Error("No provider_token in session")
        }
        const res = await fetch('https://api.spotify.com/v1/me', {
            headers: { "Authorization": `Bearer ${session.provider_token}` }
        })
        if (!res.ok) throw res.json()
        return res.json()
        },
    })

    // initial load effects
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })
        return () => subscription.unsubscribe()
    }, [])

    const onClickMenuButton = () => {
        if (!isActive) {
            setActive(true)
            return
        }
        setActive(false)
        // TODO: sync selected items back to supabase
    }

    return (
        <>
            <MenuContainer isOpen={isActive}>
                <h2>Shuffle prompts</h2>
                <p>Choose which built-in prompts can show up when you shuffle.</p>
                <h2>Spotify playlists</h2>
                {
                    session && <>
                        <p>Selected playlists will show up as prompt categories.</p>
                        <PlaylistSelector session={session} />
                    </>
                }
                {
                    !session && <>
                        <p>Sign in with Spotify to access your playlists and shuffle through your covers.</p>
                        <LoginButton />
                    </>
                }
            </MenuContainer>
            <div className="settingsContainer">
                {data && session && <span className="user">{data.display_name}</span>}
                {session && <IconButton type="logout" onClick={() => { signout(); setSession(null) }} />}
                <IconButton type="github" href="https://github.com/sastraxi/jam-shuffle" target="_blank" title="View project on Github" />
                <IconButton type={menuIcon} onClick={onClickMenuButton} />
            </div>
        </>
    )
}

export default Settings
