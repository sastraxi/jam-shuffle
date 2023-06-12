import React, { useEffect } from 'react'
import BasePrompt from '../core/BasePrompt'
import { createMakeChoice } from '../util'
import IconButton from '../components/IconButton'
import { SINGLE_IDEAS } from '../ideas'
import { usePromptChoices, useSetPromptChoice } from '../state/app'

type SingleIdeaChoices = {
  idea: string | undefined
}

const makeChoice = createMakeChoice(SINGLE_IDEAS)

const SingleIdea: React.FunctionComponent = () => {
  const { idea } = usePromptChoices<SingleIdeaChoices>()
  const setPromptChoice = useSetPromptChoice<SingleIdeaChoices>()
  const nextIdea = (replace = false) => setPromptChoice('idea', makeChoice(idea), replace)

  useEffect(() => {
    // FIXME: why does this initially run twice w/ undefined? :/
    if (!idea) nextIdea(true)
  }, [idea])

  return (
    <BasePrompt>
      <h1>
        <a>{idea}</a>
      </h1>
      <div className="buttons">
        <IconButton type="shuffle" size="24px" onClick={() => nextIdea(false)} />
      </div>
    </BasePrompt>
  )
}

export default SingleIdea
