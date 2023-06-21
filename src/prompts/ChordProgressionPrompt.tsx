import React, { useEffect } from 'react'
import BasePrompt from '../core/BasePrompt'
import IconButton from '../components/IconButton'
import Choice from '../components/Choice'
import ChordDiagram from '../components/ChordDiagram'

import './ChordProgressionPrompt.css'

const ChordProgressionPrompt: React.FunctionComponent = () => {

  return (
    <BasePrompt>
      <div className="chords">
        <ChordDiagram
          width={320}
          height={400}
          chord={[
            [1, 0],
            [2, 1, "1"],
            [3, 2, "2"],
            [4, 0],
            [5, 3, "3"],
            [6, "x"],
          ]}
        />
        <ChordDiagram
          width={320}
          height={400}
          chord={[
            [1, 0],
            [2, 1, "1"],
            [3, 2, "2"],
            [4, 0],
            [5, 3, "3"],
            [6, "x"],
          ]}
        />
        <ChordDiagram
          width={320}
          height={400}
          chord={[
            [1, 0],
            [2, 1, "1"],
            [3, 2, "2"],
            [4, 0],
            [5, 3, "3"],
            [6, "x"],
          ]}
        />
      </div>

      <div className="buttons">
        <IconButton type="shuffle" size="24px" />
      </div>
    </BasePrompt>
  )
}

export default ChordProgressionPrompt
