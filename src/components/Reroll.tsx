import React from 'react'
import './Reroll.css'
import shuffleIcon from '../assets/noun-shuffle-607259.svg'
import undoIcon from '../assets/noun-undo-1246701.svg'

const Reroll = ({
    onReroll,
    children,
    disabled = false
}: {
    onReroll: () => unknown,
    children?: React.ReactNode
    disabled?: boolean
}) => {
    return (
        <button className="reroll" disabled={disabled} onClick={onReroll}>
            <img src={undoIcon} />
            Re-roll {children || ''}
            <img src={shuffleIcon} />
        </button>
    )
}

export default Reroll
