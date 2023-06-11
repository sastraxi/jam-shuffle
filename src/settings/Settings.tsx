import React, { useState } from "react"
import { AuthSession } from "@supabase/supabase-js"
import MenuContainer from "./MenuContainer"
import PlaylistSelector from "./PlaylistSelector"
import './Settings.css'
import IconButton from "../components/IconButton"

const Settings = ({
    onLogout,
    name,
    session
}: {
    onLogout?: () => unknown
    name?: string
    session: AuthSession
}) => {
    const [isActive, setActive] = useState<boolean>(false)
    const menuIcon = isActive ? 'close' : 'settings'

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
            {isActive &&
                <MenuContainer>
                    <h2>Shuffle prompts</h2>
                    <p>Choose which built-in prompts can show up when you shuffle.</p>
                    <h2>Spotify playlists</h2>
                    <p>Selected playlists will show up as prompt categories.</p>
                    <PlaylistSelector
                        session={session}
                    />
                </MenuContainer>}
            <div className="settingsContainer">
                {name && <span className="user">{name}</span>}
                <IconButton type="logout" onClick={onLogout} />
                <IconButton type={menuIcon} onClick={onClickMenuButton} />
            </div>
        </>
    )
}

export default Settings
