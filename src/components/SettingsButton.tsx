import React from 'react'
import './SettingsButton.css'
import IconButton from './IconButton'

const SettingsButton = ({
    onClick,
}: {
    onClick?: () => unknown
}) => {
    return (
        <div className="settingsContainer">
            <IconButton type="settings" onClick={onClick} />
        </div>
    )
}

export default SettingsButton
