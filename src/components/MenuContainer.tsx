import React from 'react'
import IconButton from './IconButton'
import './MenuContainer.css'

const MenuContainer = ({
    title,
    onClose,
    children,
}: {
    title: string
    onClose: () => unknown
    children: React.ReactNode
}) => {
    return (
        <div className="menuContainer">
            <div>
                <div className="titleArea">
                    <h2>{title}</h2>
                </div>
                <div className="main">
                    { children }
                </div>
                <div className="buttons">
                    <IconButton type="logout">Logout</IconButton>
                    <IconButton type="undo" onClick={onClose}>Close</IconButton>
                </div>
            </div>
        </div>
    )
}

export default MenuContainer
