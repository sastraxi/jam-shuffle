import React from 'react'
import IconButton from '../components/IconButton'
import './MenuContainer.css'

const MenuContainer = ({
    children,
}: {
    children: React.ReactNode
}) => {
    return (
        <div className="menuContainer">
            <div className="main">
                { children }
            </div>
        </div>
    )
}

export default MenuContainer
