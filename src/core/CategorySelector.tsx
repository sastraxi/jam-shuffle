import './CategorySelector.css'
import IconButton from '../components/IconButton'
import { useCategory, useGoToCategory, useHistoryGoBack, usePromptHistory } from '../state/app'
import { useCategories } from '../state/user-prefs'
import { createMakeChoice } from '../util'
import { Category } from '../prompts/types'
import Choice from '../components/Choice'


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

  return (
    <div className="categoryContainer">
      <h3>Category</h3>
      <h2>
        <div className="buttons">
          <IconButton type="undo" disabled={history.length < 2} onClick={historyGoBack} />
        </div>
        <Choice>
          {category.displayName ?? category.type}
        </Choice>
        <div className="buttons">
          <IconButton type="shuffle" onClick={onShuffle} />
        </div>
      </h2>
    </div>
  )
}

export default CategorySelector
