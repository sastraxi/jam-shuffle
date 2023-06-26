import { useEffect } from 'react'
import BasePrompt from '../core/BasePrompt'
import { createMakeChoice } from '../util'
import IconButton from '../components/IconButton'
import { CONTRAST_IDEAS } from '../ideas'
import { usePromptChoices, useSetPromptChoice } from '../state/app'
import Choice from '../components/Choice'

type ContrastPromptChoices = {
  first: string | undefined
  second: string | undefined
}

const makeChoice = createMakeChoice(CONTRAST_IDEAS)

const ContrastPrompt: React.FunctionComponent = () => {
  const { first, second } = usePromptChoices<ContrastPromptChoices>()
  const setPromptChoice = useSetPromptChoice<ContrastPromptChoices>()
  const nextIdea = (replace = false) => {
    const nextFirst = makeChoice(first)
    let nextSecond = nextFirst
    while (nextSecond === nextFirst) nextSecond = makeChoice()

    setPromptChoice({
      first: nextFirst,
      second: nextSecond,
    }, replace)
  }

  useEffect(() => {
    if (!first || !second) nextIdea(true)
  }, [first])

  return (
    <BasePrompt>
      <div className="big">
        <h1>
          <Choice
            current={first}
            allChoices={CONTRAST_IDEAS}
            setChoice={first => setPromptChoice({ first, second })}
            fullWidth
          />
        </h1>
        <h1 className="subtle">mixed with</h1>
        <h1>
          <Choice
            current={second}
            allChoices={CONTRAST_IDEAS}
            setChoice={second => setPromptChoice({ first, second })}
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

export default ContrastPrompt
