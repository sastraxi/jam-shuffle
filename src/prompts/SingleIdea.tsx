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

const REROLLS = ['idea'] as const

type RerollValues = typeof REROLLS[number];

const makeChoice = () => randomChoice(SINGLE_IDEAS) as RerollValues

const SingleIdea = ({ seed }: {
    seed?: number 
}) => {
    const [idea, setIdea] = useState<RerollValues | undefined>(makeChoice())
    const [storedSeed, setStoredSeed] = useState<number | undefined>(seed)
    useCallback(() => {
        if (seed != storedSeed) {
            setStoredSeed(seed)
            setIdea(makeChoice())
        }
    }, [seed, storedSeed])

    return (
        <BasePrompt name="Single idea">
            <h1>
                <a>{idea}</a>
            </h1>
            <IconButton type="shuffle" size="18px" onClick={() => setIdea(makeChoice())} />
        </BasePrompt>
    )
}

export default SingleIdea
