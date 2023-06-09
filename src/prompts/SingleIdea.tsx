import React, { useState } from 'react'
import BasePrompt from './BasePrompt'
import { createMakeChoice } from '../util'
import IconButton from '../components/IconButton'

const SINGLE_IDEAS = [
    "Everyone does coordinated stops",
    "Something funky",
    "Smooth jazz vibes",
    "Adolescent punk",
    "Beautiful and atmospheric",
    "Tension and release"
]

type RerollValues = typeof SINGLE_IDEAS[number];

const makeChoice = createMakeChoice(SINGLE_IDEAS)

const SingleIdea = () => {
    const [lastIdea, setLastIdea] = useState<RerollValues | undefined>(undefined)
    const [idea, setIdea] = useState<RerollValues | undefined>(makeChoice())

    const swapIdea = () => {
        setIdea(lastIdea)
        setLastIdea(idea)
    }

    const shuffleIdea = () => {
        setIdea(makeChoice(idea))
        setLastIdea(idea)
    }

    return (
        <BasePrompt name="Single idea">
            <h1>
                <a>{idea}</a>
            </h1>
            <div>
                <IconButton type="undo" size="18px" onClick={swapIdea} disabled={!lastIdea} />
                <IconButton type="shuffle" size="18px" onClick={shuffleIdea} />
            </div>
        </BasePrompt>
    )
}

export default SingleIdea
