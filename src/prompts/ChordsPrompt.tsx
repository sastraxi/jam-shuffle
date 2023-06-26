import React, { useEffect } from 'react'
import BasePrompt from '../core/BasePrompt'
import IconButton from '../components/IconButton'
import Choice from '../components/Choice'
import ChordDiagram from '../components/ChordDiagram'
import './ChordsPrompt.css'

import { usePromptChoices, useSetPromptChoice } from '../state/app'
import { createMakeChoice } from '../util'
import { ALL_CHORDS, frettingToVexChord, getFretting, noteForDisplay } from '../theory/guitar'
import ChoiceContainer from '../components/ChoiceContainer'

const FLAVOUR_CHOICES = [
  'MAX POWER!',
  'Basic b****',
  'Not weird',
  'Kinda weird',
  'Jazzy extensions',
  'Extremely weird',
]
// FIXME: why can't I "as const" here?

const chooseChord = createMakeChoice(ALL_CHORDS)
const chooseFlavour = createMakeChoice(FLAVOUR_CHOICES)

const withReplacement = <T,>(array: Array<T>, index: number, replacement: T) =>
  [...array.slice(0, index), replacement, ...array.slice(index + 1)]

type ChordChoice = {
  name: string,
  locked: boolean,
  fromKey?: boolean,
}

type ChordsPromptChoices = {
  chords: Array<ChordChoice>
  flavour: typeof FLAVOUR_CHOICES[number]
}

const ChordsPrompt: React.FunctionComponent = () => {
  const { chords, flavour } = usePromptChoices<ChordsPromptChoices>()
  const setPromptChoice = useSetPromptChoice<ChordsPromptChoices>()
  const shuffleAll = (replace = false) => {
    const nextChords: Array<ChordChoice> = []
    for (let i = 0; i < 3; ++i) {
      nextChords.push({
        name: chooseChord(...nextChords.map(c => c.name)),
        locked: chords?.[i]?.locked ?? false,
        // first chord can't be locked to the current key
        fromKey: i === 0 ? undefined : (chords?.[i]?.fromKey ?? true),
      })
    }

    setPromptChoice({
      chords: nextChords,
    }, replace)
  }

  useEffect(() => {
    if (!chords || chords.length === 0) {
      setPromptChoice({
        flavour: 'Not weird',
      })
      shuffleAll(true)
    }
  }, [chords])

  const frettings = chords?.map(chord => getFretting(chord.name))

  return (
    <BasePrompt>
      <div className="chords">
        {frettings?.map((f, chordIndex) => (
          <div key={chords[chordIndex].name}>
            <ChordDiagram
              width={320}
              height={400}
              {...frettingToVexChord(f)}
            />
            <h2>
              <Choice
                alignItems="center"
                current={chords[chordIndex].name}
                displayTransform={noteForDisplay}
                allChoices={ALL_CHORDS.filter(chord =>
                  chord === chords[chordIndex].name ||
                  !chords.map(c => c.name).includes(chord)
                )}
                setChoice={pendingChordName => setPromptChoice({
                  chords: withReplacement(chords, chordIndex, {
                    ...chords[chordIndex],
                    name: pendingChordName,
                  }),
                })}
              />
            </h2>
          </div>
        ))}
      </div>

      <div className="buttons">
        <ChoiceContainer caption="key options (3)">
          <Choice
            current="A minor"
          />
        </ChoiceContainer>
        <IconButton type="shuffle" size="24px" onClick={() => shuffleAll(false)} />
        <ChoiceContainer caption="flavour" alignItems="end">
          <Choice
            current={flavour}
            alignItems="center"
            allChoices={FLAVOUR_CHOICES}
            setChoice={pendingFlavour => setPromptChoice({ flavour: pendingFlavour })}
          />
        </ChoiceContainer>
      </div>
    </BasePrompt>
  )
}

export default ChordsPrompt
