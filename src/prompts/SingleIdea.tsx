import React, { useState } from 'react'
import BasePrompt from '../core/BasePrompt'
import { createMakeChoice } from '../util'
import IconButton from '../components/IconButton'
import { PromptState } from './types'

export const SINGLE_IDEAS = [
    "Coordinated stops",
    "Something funky",
    "Smooth jazz feel",
    "Adolescent punk",
    "Beautiful and atmospheric",
    "Tension and release",
    "Something syncopated",
    "A love song",
    "12-bar blues",
    "A weird rhythm",
    "Palm-muted guitar",
    "Walking bassline",
    "Something your past self would love",
].sort()

export type SingleIdeaChoices = {
    idea: string
}

const makeChoice = createMakeChoice(SINGLE_IDEAS)

const SingleIdea: React.FunctionComponent<PromptState<SingleIdeaChoices>> = () => {
    const [lastIdea, setLastIdea] = useState<string | undefined>(undefined)
    const [idea, setIdea] = useState<string | undefined>(makeChoice())

    const swapIdea = () => {
        setIdea(lastIdea)
        setLastIdea(idea)
    }

    const shuffleIdea = () => {
        setIdea(makeChoice(idea))
        setLastIdea(idea)
    }

    return (
        <BasePrompt>
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
