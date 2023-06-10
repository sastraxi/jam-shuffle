import React from 'react'
import './BasePrompt.css'

export type PropTypes = {
    children: React.ReactNode
}

const BasePrompt = (props: PropTypes) => {
    return (
        <section className="prompt-main">
            {props.children}
        </section>
    )
}

export default BasePrompt
