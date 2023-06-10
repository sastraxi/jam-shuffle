import React, { useState } from "react"
import { AuthSession } from "@supabase/supabase-js"
import MenuContainer from "../components/MenuContainer"
import PlaylistSelector from "../settings/PlaylistSelector"
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
    return (
        <div className="settingsContainer">
            {name && <span className="user">{name}</span>}
            {name && <IconButton type="logout" onClick={onLogout} />}
            <IconButton type="settings" onClick={() => setActive(true)} />
            {isActive &&
                <MenuContainer title="Settings" onClose={() => setActive(false)}>
                    <PlaylistSelector session={session} />
                </MenuContainer>}
        </div>
    )
}

export default Settings
