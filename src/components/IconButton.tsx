import React from 'react'
import './IconButton.css'
import shuffleIcon from '../assets/noun-shuffle-607259.svg'
import undoIcon from '../assets/noun-undo-1246701.svg'
import settingsIcon from '../assets/noun-settings-1191027.svg'
import logoutIcon from '../assets/noun-logout-1312069.svg'
import closeIcon from '../assets/noun-close-1028422.svg'

type IconType = 'shuffle' | 'undo' | 'settings' | 'logout' | 'close'

const iconFromType = (t: IconType) => {
    if (t === 'shuffle') return shuffleIcon
    if (t === 'undo') return undoIcon
    if (t === 'logout') return logoutIcon
    if (t === 'settings') return settingsIcon
    if (t === 'close') return closeIcon
    throw new Error(`Unknown icon type: ${t}`);
} 

const IconButton = ({
    onClick,
    type,
    size = "12px",
    disabled = false,
    children
}: {
    onClick?: () => unknown,
    type: IconType,
    size?: string,
    disabled?: boolean
    children?: React.ReactNode
}) => {
    return (
        <div className={`iconButton ${disabled ? 'disabled' : ''}`}>
            <button disabled={disabled} onClick={onClick} style={{ fontSize: size }}>
                <div className="circle"></div>
                <img src={iconFromType(type)} />
                {children && <span>{children}</span>}
            </button>
        </div>
    )
}

export default IconButton
