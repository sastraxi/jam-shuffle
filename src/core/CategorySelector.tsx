import IconButton from '../components/IconButton'
import { useCategory, useGoToCategory, useHistoryGoBack, usePromptHistory } from '../state/app'
import { useCategories } from '../state/user-prefs'
import { createMakeChoice } from '../util'
import { Category } from '../prompts/types'
import Choice from '../components/Choice'
import ChoiceContainer from '../components/ChoiceContainer'

const CategorySelector = () => {
  const allCategories = useCategories()
  const category = useCategory()
  const goToCategory = useGoToCategory()
  const chooseNextCategory = createMakeChoice<Category>(allCategories)
  const history = usePromptHistory()
  const historyGoBack = useHistoryGoBack()

  const onShuffle = () => {
    const nextCategory = chooseNextCategory(category)
    goToCategory(nextCategory)
  }

  const buttons = (<>
    <IconButton type="shuffle" onClick={onShuffle} />
    <IconButton type="undo" disabled={history.length < 2} onClick={historyGoBack} />
  </>)

  return (
    <ChoiceContainer
      buttons={buttons}
      caption="Category"
    >
      <Choice
          current={category}
          displayTransform={category => category.displayName ?? category.type}
          allChoices={allCategories}
          setChoice={goToCategory}
        />
    </ChoiceContainer>
  )
}

export default CategorySelector
