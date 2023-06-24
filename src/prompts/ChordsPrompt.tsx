import React, { useEffect } from 'react'
import BasePrompt from '../core/BasePrompt'
import IconButton from '../components/IconButton'
import Choice from '../components/Choice'
import ChordDiagram from '../components/ChordDiagram'
import './ChordsPrompt.css'

import { usePromptChoices, useSetPromptChoice } from '../state/app'
import { createMakeChoice } from '../util'
import { ALL_CHORDS, frettingToVexChord, getFretting, noteForDisplay } from '../theory/guitar'

const makeChoice = createMakeChoice(ALL_CHORDS)

const withReplacement = <T,>(array: Array<T>, index: number, replacement: T) =>
  [...array.slice(0, index), replacement, ...array.slice(index + 1)]

type ChordsPromptChoices = {
  chords: Array<string>,
}

const ChordsPrompt: React.FunctionComponent = () => {
  const { chords } = usePromptChoices<ChordsPromptChoices>()
  const setPromptChoice = useSetPromptChoice<ChordsPromptChoices>()
  const shuffleAll = (replace = false) => {
    const nextChords: Array<string> = []
    while (nextChords.length < 3) {
      nextChords.push(makeChoice(...nextChords))
    }

    setPromptChoice({
      chords: nextChords,
    }, replace)
  }

  useEffect(() => {
    if (!chords || chords.length === 0) shuffleAll(true)
  }, [chords])

  const frettings = chords?.map(chord => getFretting(chord))

  return (
    <BasePrompt>
      <div className="chords">
        {frettings?.map((f, chordIndex) => (
          <div key={chords[chordIndex]}>
            <ChordDiagram
              width={320}
              height={400}
              {...frettingToVexChord(f)}
            />
            <h2>
              <Choice
                current={chords[chordIndex]}
                displayTransform={noteForDisplay}
                allChoices={ALL_CHORDS.filter(chord =>
                  chord === chords[chordIndex] ||
                  !chords.includes(chord)
                )}
                setChoice={pendingChord => setPromptChoice({
                  chords: withReplacement(chords, chordIndex, pendingChord),
                })}
              />
            </h2>
          </div>
        ))}
      </div>

      <div className="buttons">
        <IconButton type="shuffle" size="24px" onClick={() => shuffleAll(false)} />
      </div>
    </BasePrompt>
  )
}

export default ChordsPrompt
