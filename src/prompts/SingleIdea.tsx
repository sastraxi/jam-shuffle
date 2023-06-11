import React, { useState } from 'react'
import BasePrompt from '../core/BasePrompt'
import { createMakeChoice } from '../util'
import IconButton from '../components/IconButton'
import { SINGLE_IDEAS } from '../ideas'

export type SingleIdeaChoices = {
    idea: string
}

const makeChoice = createMakeChoice(SINGLE_IDEAS)

const SingleIdea: React.FunctionComponent = () => {
    const [lastIdea, setLastIdea] = useState<string | undefined>(undefined)
    const [idea, setIdea] = useState<string | undefined>(makeChoice())

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
                <IconButton type="shuffle" size="24px" onClick={shuffleIdea} />
            </div>
        </BasePrompt>
    )
}

export default SingleIdea
