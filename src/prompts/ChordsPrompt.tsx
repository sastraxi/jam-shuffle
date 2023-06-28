import React, { useEffect, useMemo } from 'react'
import BasePrompt from '../core/BasePrompt'
import IconButton from '../components/IconButton'
import Choice from '../components/Choice'
import ChordDiagram from '../components/ChordDiagram'
import './ChordsPrompt.css'

import { usePromptChoices, useSetPromptChoice } from '../state/app'
import { createMakeChoice, memoize } from '../util'
import { ALL_GUITAR_CHORDS, frettingToVexChord, getFrettings } from '../theory/guitar'
import { noteForDisplay } from '../theory/common'
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

const chooseGuitarChord = createMakeChoice(ALL_GUITAR_CHORDS)
const chooseFlavour = createMakeChoice(FLAVOUR_CHOICES)

const VARIANT_NUMBERS = "①②③④⑤⑥⑦⑧⑨⑩"
const SOURCE_SET_CHOICES = [
  '✨', '🎷', '🔑'
] as const
type SourceSetChoices = typeof SOURCE_SET_CHOICES[number]

const getMaxOutOfKeyNotes = (sourceSet: SourceSetChoices) => {
  if (sourceSet === '✨') return 9999
  if (sourceSet === '🎷') return 1
  return 0
}

const withReplacement = <T,>(array: Array<T>, index: number, replacement: T) =>
  [...array.slice(0, index), replacement, ...array.slice(index + 1)]


const firstNDigits = memoize((n: number) => [...Array(n).keys()])

type ChordChoice = {
  name: string,
  locked: boolean,
  sourceSet?: SourceSetChoices,
  variant: number,
}

type ChordsPromptChoices = {
  chords: Array<ChordChoice>
  flavour: typeof FLAVOUR_CHOICES[number]
}

const dimmedIf = (exactlyMatches: string) =>
  (x: string) => <span className={x === exactlyMatches ? 'dimmed' : '' }>{x}</span>

const ChordsPrompt: React.FunctionComponent = () => {
  const current = usePromptChoices<ChordsPromptChoices>()
  const setPromptChoice = useSetPromptChoice<ChordsPromptChoices>()

  const shuffleAll = ({ 
    overrides = {},
    replace = false
  }: {
    overrides?: Partial<ChordsPromptChoices>,
    replace?: boolean
  } = {}) => {
    const nextChords: Array<ChordChoice> = []

    for (let i = 0; i < 3; ++i) {
      nextChords.push({
        name: chooseGuitarChord(...nextChords.map(c => c.name)),
        locked: current.chords?.[i]?.locked ?? false,
        variant: current.chords?.[i]?.variant ?? 0,
        // first chord can't be locked to the current key
        sourceSet: i === 0 ? undefined : (current.chords?.[i]?.sourceSet ?? '🎷'),
      })
    }

    setPromptChoice({
      chords: nextChords,
      flavour: chooseFlavour(current.flavour),
      ...overrides,
    }, replace)
  }

  // TODO: generate fewer undo moves
  const modifyChord = (chordIndex: number, changes: Partial<ChordChoice>) =>
    setPromptChoice({
      chords: withReplacement(chords, chordIndex, {
        ...chords[chordIndex],
        ...changes,
      }),
    }, true)
  
  //////////////////////////////////////////////////////
  // initial set

  useEffect(() => {
    if (!current.chords || current.chords.length === 0) {
      shuffleAll({
        replace: true,
        overrides: {
          flavour: "Not weird"
        },
      })
    }
  })

  //////////////////////////////////////////////////////

  const { chords, flavour } = current
  const frettingsByChordIndex = useMemo(
    () => chords?.map(chord => getFrettings(chord.name)),
    [chords]
  )


  return (
    <BasePrompt>
      <div className="chords">
        {frettingsByChordIndex?.map((frettings, chordIndex) => (
          <div key={chords[chordIndex].name}>
            <div className="buttons">
              <Choice
                help="Locked? (prevents shuffle)"
                setChoice={icon => modifyChord(chordIndex, { locked: icon === '🔒' })}
                alignItems="center"
                current={chords[chordIndex].locked ? '🔒' : '🔓'}
                allChoices={['🔓', '🔒']}
                displayTransform={dimmedIf('🔓')}
                tapToChange
              />
              {chords[chordIndex].sourceSet && 
                <Choice
                  help="Source set (restrict to key?)"
                  setChoice={sourceSet => modifyChord(chordIndex, { sourceSet })}
                  alignItems="center"
                  current={chords[chordIndex].sourceSet ?? '✨'}
                  allChoices={SOURCE_SET_CHOICES}
                  displayTransform={dimmedIf('✨')}
                  tapToChange
                />
              }
              <Choice
                help="Variant (ascending fretboard order)"
                setChoice={variant => modifyChord(chordIndex, { variant })}
                alignItems="center"
                current={Math.min(chords[chordIndex].variant, frettings.length - 1)}
                allChoices={firstNDigits(frettings.length)}
                displayTransform={x => VARIANT_NUMBERS[x]}
                tapToChange
              />
            </div>
            <ChordDiagram
              width={320}
              height={400}
              {...frettingToVexChord(frettings[chords[chordIndex].variant % frettings.length], noteForDisplay)}
            />
            <h2>
              <Choice
                alignItems="center"
                current={chords[chordIndex].name}
                displayTransform={noteForDisplay}
                allChoices={ALL_GUITAR_CHORDS.filter(chord =>
                  chord === chords[chordIndex].name ||
                  !chords.map(c => c.name).includes(chord)
                )}
                setChoice={name => modifyChord(chordIndex, { name })}
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
        <IconButton type="shuffle" size="24px" onClick={() => shuffleAll()} />
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
