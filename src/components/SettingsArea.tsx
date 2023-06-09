import React from 'react'
import './SettingsArea.css'
import IconButton from './IconButton'

const SettingsArea = ({
    onClick,
    onLogout,
    name,
}: {
    onClick?: () => unknown
    onLogout?: () => unknown
    name?: string
}) => {
    return (
        <div className="settingsContainer">
            { name && <IconButton type="logout" onClick={onLogout} /> }
            { name && <span className="user">{name}</span> }
            <IconButton type="settings" onClick={onClick} />
        </div>
    )
}

export default SettingsArea
