import React from 'react'
import './IconButton.css'
import shuffleIcon from '../assets/noun-shuffle-607259.svg'
import undoIcon from '../assets/noun-undo-1246701.svg'
import settingsIcon from '../assets/noun-settings-1191027.svg'
import logoutIcon from '../assets/noun-logout-1312069.svg'
import closeIcon from '../assets/noun-close-1028422.svg'
import externalLinkIcon from '../assets/noun-external-link-2863113.svg'
import volumeIcon from '../assets/noun-volume-1333338.svg'
import githubIcon from '../assets/noun-github-4289652.svg'
import goIcon from '../assets/noun-go-1851808.svg'

type IconType = 'shuffle' | 'undo' | 'settings' | 'logout' | 'close' | 'external link' | 'volume' | 'go' | 'github'

const iconFromType = (t: IconType) => {
    if (t === 'shuffle') return shuffleIcon
    if (t === 'undo') return undoIcon
    if (t === 'logout') return logoutIcon
    if (t === 'settings') return settingsIcon
    if (t === 'close') return closeIcon
    if (t === 'external link') return externalLinkIcon
    if (t === 'volume') return volumeIcon
    if (t === 'github') return githubIcon
    if (t === 'go') return goIcon
    throw new Error(`Unknown icon type: ${t}`);
} 

const IconButton = ({
    onClick = undefined,
    href = undefined,
    type,
    size = "12px",
    disabled = false,
    active = false,
    children,
    target = undefined,
    title = undefined
}: {
    onClick?: () => unknown,
    href?: string,
    type: IconType,
    size?: string,
    disabled?: boolean
    active?: boolean
    children?: React.ReactNode
    target?: string
    title?: string
}) => {
    const buttonChildren = [
        <div key="circle" className="circle"></div>,
        <img key="icon" src={iconFromType(type)} />,
        children ? <span key="children">{children}</span> : null,
    ]

    const classNames = ['iconButton']
    if (disabled) classNames.push('disabled')
    if (active) classNames.push('active')

    return (
        <div className={classNames.join(' ')}>
            { href &&
                <a className="impl" href={disabled ? '#' : href} style={{ fontSize: size }} target={target} title={title}>
                    {buttonChildren}
                </a>
            }
            { !href && 
                <button className="impl" disabled={disabled} onClick={onClick} style={{ fontSize: size }} title={title}>
                    {buttonChildren}
                </button>
            }
        </div>
    )
}

export default IconButton
