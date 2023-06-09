import React from 'react'
import './IconButton.css'
import shuffleIcon from '../assets/noun-shuffle-607259.svg'
import undoIcon from '../assets/noun-undo-1246701.svg'
import settingsIcon from '../assets/noun-settings-1191027.svg'
import logoutIcon from '../assets/noun-logout-1312069.svg'

type IconType = 'shuffle' | 'undo' | 'settings' | 'logout'

const iconFromType = (t: IconType) => {
    if (t === 'shuffle') return shuffleIcon
    if (t === 'undo') return undoIcon
    if (t === 'logout') return logoutIcon
    if (t === 'settings') return settingsIcon
    throw new Error(`Unknown icon type: ${t}`);
} 

const IconButton = ({
    onClick,
    type,
    size = "12px",
    disabled = false
}: {
    onClick?: () => unknown,
    type: IconType,
    size?: string,
    disabled?: boolean
}) => {
    return (
        <button className="iconButton" disabled={disabled} onClick={onClick} style={{ fontSize: size }}>
            <img src={iconFromType(type)} />
        </button>
    )
}

export default IconButton
