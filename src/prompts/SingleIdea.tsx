import React, { useCallback, useMemo, useState } from 'react'
import BasePrompt from './BasePrompt'
import { randomChoice } from '../util'
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

// TODO: turn into template
const makeChoice = (lastChoice: RerollValues | undefined = undefined) => {
    if (SINGLE_IDEAS.length === 1) return SINGLE_IDEAS[0]
    let nextChoice: RerollValues | undefined = lastChoice
    while (nextChoice === lastChoice) {
        nextChoice = randomChoice(SINGLE_IDEAS) as RerollValues
    }
    return nextChoice
}

const SingleIdea = ({ seed }: {
    seed?: number 
}) => {
    const [idea, setIdea] = useState<RerollValues | undefined>(makeChoice())
    const [storedSeed, setStoredSeed] = useState<number | undefined>(seed)
    useCallback(() => {
        if (seed != storedSeed) {
            setStoredSeed(seed)
            setIdea(makeChoice(idea))
        }
    }, [seed, storedSeed, idea])

    return (
        <BasePrompt name="Single idea">
            <h1>
                <a>{idea}</a>
            </h1>
            <div>
                <IconButton type="undo" size="18px" disabled />
                <IconButton type="shuffle" size="18px" onClick={() => setIdea(makeChoice(idea))} />
            </div>
        </BasePrompt>
    )
}

export default SingleIdea
