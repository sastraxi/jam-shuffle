import React from 'react'
import './MenuContainer.css'

const MenuContainer = ({
    isOpen,
    children,
}: {
    isOpen: boolean
    children: React.ReactNode
}) => {
    return (
        <div className={`menuContainer ${!isOpen ? "closed" : ""}`}>
            <div className="main">
                { children }
            </div>
        </div>
    )
}

export default MenuContainer
