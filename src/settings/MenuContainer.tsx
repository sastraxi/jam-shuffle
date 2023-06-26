import React, { useEffect, useState } from 'react'
import './MenuContainer.css'

const DISPLAY_NONE_TIMEOUT_SEC = 0.3

const MenuContainer = ({
    isOpen,
    children,
}: {
    isOpen: boolean
    children: React.ReactNode
}) => {
    const [isDisplayed, setDisplayed] = useState(false)

    useEffect(() => {
        if (!isOpen) {
            const timeout = setTimeout(() => setDisplayed(false), DISPLAY_NONE_TIMEOUT_SEC * 1000)
            return () => clearTimeout(timeout)
        } else {
            setDisplayed(true)
        }
    }, [isOpen])

    return (
        <div
            className={`menuContainer ${!isOpen ? "closed" : ""}`}
            style={{
                display: isDisplayed ? 'flex' : 'none',
                "--menu-transition-time": `${DISPLAY_NONE_TIMEOUT_SEC}s`,
            } as React.CSSProperties}
        >
            <div className="main" >
                { children }
            </div>
        </div>
    )
}

export default MenuContainer
