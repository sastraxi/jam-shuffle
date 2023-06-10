import React from 'react'
import './SelectionGrid.css'

export type GridItem = {
  id: string
  imageUrl?: string
  caption: string
}

type PropTypes = {
  items: Array<GridItem>
  selectedIds: Set<string>
  onSelect: (item: GridItem, isNowSelected: boolean) => unknown
}

const SelectionGrid = ({
  items,
  selectedIds,
  onSelect,
}: PropTypes) => {
  return (
    <div className="selectionGrid">
      {items.map((item) => {
        const isSelected = selectedIds.has(item.id)
        const itemStyle = item.imageUrl
          ? { backgroundImage: `url(${item.imageUrl})` }
          : {}
        return (
          <div
            className={`gridItem ${isSelected ? 'selected' : ''}`}
            style={itemStyle}
            onClick={() => onSelect(item, !isSelected)}
            key={item.id}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(item, e.target.checked)}
            />
            {item.caption !== "" && <span>{item.caption}</span>}
          </div>
        )
      })}
    </div>
  )
}

export default SelectionGrid

