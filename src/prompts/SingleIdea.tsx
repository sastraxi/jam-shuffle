import React, { useEffect } from 'react'
import BasePrompt from '../core/BasePrompt'
import { createMakeChoice } from '../util'
import IconButton from '../components/IconButton'
import { SINGLE_IDEAS } from '../ideas'
import { usePromptChoices, useSetPromptChoice } from '../state/app'
import Choice from '../components/Choice'

type SingleIdeaChoices = {
  idea: string | undefined
}

const makeChoice = createMakeChoice(SINGLE_IDEAS)

const SingleIdea: React.FunctionComponent = () => {
  const { idea } = usePromptChoices<SingleIdeaChoices>()
  const setPromptChoice = useSetPromptChoice<SingleIdeaChoices>()
  const nextIdea = (replace = false) => setPromptChoice({ idea: makeChoice(idea) }, replace)

  useEffect(() => {
    // FIXME: in strictmode, runs twice, hence the guard
    // figure out a better way to only set it once so our undo history is nice
    if (!idea) nextIdea(true)
  }, [idea])

  return (
    <BasePrompt>
      <div className="big">
        <h1>
          <Choice
            current={idea}
            allChoices={SINGLE_IDEAS}
            setChoice={idea => setPromptChoice({ idea })}
            fullWidth
          />
        </h1>
      </div>
      <div className="buttons">
        <IconButton type="shuffle" size="24px" onClick={() => nextIdea(false)} />
      </div>
    </BasePrompt>
  )
}

export default SingleIdea
