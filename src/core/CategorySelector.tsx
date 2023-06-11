import React from 'react'
import './CategorySelector.css'
import IconButton from '../components/IconButton'
import { useAppState, useCategory, useGoToCategory } from '../state/app'
import { useCategories } from '../state/user-prefs'
import { createMakeChoice } from '../util'
import { Category } from '../prompts/types'


const CategorySelector = () => {
    const allCategories = useCategories()
    const category = useCategory()
    const goToCategory = useGoToCategory()    
    const chooseNextCategory = createMakeChoice<Category>(allCategories)

    const onShuffle = () => {
        const nextCategory = chooseNextCategory(category)
        console.log('next category', nextCategory)
        goToCategory(nextCategory)
    }

    return (
        <div className="categoryContainer">
            <h3>Category</h3>
            <h2>
                <IconButton type="undo" disabled={true} />
                <span className="spacer" />
                <a className="category">
                    {category.displayName ?? category.type}
                </a>
                <span className="spacer" />
                <IconButton type="shuffle" onClick={onShuffle} />
            </h2>
        </div>
    )
}

export default CategorySelector
