import React from 'react'
import './Category.css'
import IconButton from './IconButton'

const Category = ({
    onClickSettings,
    onClickShuffle,
    onClickUndo,
    onClickCategory,
    canUndo,
    category,
}: {
    onClickSettings?: () => unknown
    onClickShuffle?: () => unknown
    onClickUndo?: () => unknown
    onClickCategory?: () => unknown
    canUndo?: boolean
    category: string
}) => {
    return (
        <div className="categoryContainer">
            <h3>Category</h3>
            <h2>
                <IconButton type="undo" onClick={onClickUndo} disabled={!canUndo} />
                <span className="spacer" />
                <a className="category" onClick={onClickCategory}>
                    {category}
                </a>
                <span className="spacer" />
                <IconButton type="shuffle" onClick={onClickShuffle} />
            </h2>
        </div>
    )
}

export default Category
