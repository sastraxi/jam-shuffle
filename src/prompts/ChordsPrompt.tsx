import React, { useEffect, useMemo } from 'react'
import BasePrompt from '../core/BasePrompt'
import IconButton from '../components/IconButton'
import Choice from '../components/Choice'
import ChordDiagram from '../components/ChordDiagram'
import './ChordsPrompt.css'

import { usePromptChoices, useSetPromptChoice } from '../state/app'
import { memoize, randomChoice } from '../util'

import {
  ALL_GUITAR_CHORDS,
  frettingToVexChord,
  getFrettings,
  chordsMatchingCondition,
  getGuitarNotes,
  chordForDisplay,
} from '../theory/guitar'

import {
  keynameToNotes,
  keysIncludingChord,
  noteForDisplay,
} from '../theory/common'

import { Balanced, FLAVOUR_CHOICES } from '../theory/flavours'

import ChoiceContainer from '../components/ChoiceContainer'

///////////////////////////

const keys = keysIncludingChord(new Set(["A", "C#", "E"]))
keys.forEach((keyName) => {
  console.log(keyName, keynameToNotes(keyName))
})

///////////////////////////

const VARIANT_NUMBERS = "①②③④⑤⑥⑦⑧⑨⑩"
const SOURCE_SET_CHOICES = [
  '🔑', '🌶️', '✨',
] as const
type SourceSetChoices = typeof SOURCE_SET_CHOICES[number]
const DEFAULT_SOURCE_SET: SourceSetChoices = '🌶️'

const sourceSetExpandedTransform = (sourceSet: SourceSetChoices) => {
  if (sourceSet === '✨') return '✨ All chords'
  if (sourceSet === '🌶️') return '🌶️ Max. 1 accidental'
  return '🔑 Strictly in-key'
}

const getMaxAccidentals = (sourceSet: SourceSetChoices) => {
  if (sourceSet === '✨') return 9999
  if (sourceSet === '🌶️') return 1
  return 0
}

const withReplacement = <T,>(array: Array<T>, index: number, replacement: T) =>
  [...array.slice(0, index), replacement, ...array.slice(index + 1)]

// memoized so we don't thrash renders / recompute useCallbacks in <Choice />
const firstNDigits = memoize((n: number) => [...Array(n).keys()])

type ChordChoice = {
  name: string,
  locked: boolean,
  sourceSet?: SourceSetChoices,
  variant: number,
}

type ChordsPromptChoices = {
  chords: Array<ChordChoice>
  flavour: string
  keyName?: string
  possibleKeys?: Array<string>
  keyIsLocked: boolean
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
    /*
      The key name option is weird. We have a few different modes of operation:

      Informational.
        We just want to know what keys work for these chords. We should support
        having no accidental restrictions and thus potentially creating a
        list of chords that does not work with any (major-based) scale.
      
      Set after first chord.
        The default options should always ensure three distinct chords can be
        generated and still follow the rules we've set out. It should be possible
        to change the first chord to something out of the selected key, which
        would trigger changing the key, which _might_ trigger changing other
        chords if they are restricted based on the key (and not locked).
      
      Set outright.
        We should *also* support changing the key as the first thing. This is
        challenging because it means that Choice needs to be able to pick from
        every single key at all times, and is at odds with the "Informational"
        use case where we want to see which keys are.

      It seems like the solution is to add another 🔒 choice next to the key.

        🔒 Locked to first chord.
          The caption above the key choice becomes "Keys containing <chord 0>".
          The source set choice for chord 0 goes away, as by definition it is
          now locked to "🔑 Strictly in-key".

        🔓 All keys. [DEFAULT]
          The caption above the key choice becomes "All keys". You can now
          choose the source set for the chord 0. If its source set becomes "🔑
          Strictly in-key", functionality is _similar_ to 🔒 Locked to first
          chord mode, but with the important difference that you can still
          change to any key you want.
    */

    // TODO: if a chord is locked and goes out-of-key, we should update its
    // source set in the prompt choices state to a less restrictive one that
    // includes the currently-chosen chord.

    // TODO: if a chord is unlocked, it should *always* be regenerated to
    // facilitate the Unlocked mode described

    // Set after first chord. 

    let keyName: string | undefined = undefined
    let possibleKeys = current.possibleKeys ?? undefined
    const flavour = FLAVOUR_CHOICES.find(f => f.name === current.flavour) ?? Balanced

    // generate up to three chords
    for (let i = 0; i < 3; ++i) {
      const currentChord = current.chords?.[i]

      if (currentChord?.locked) {
        // keep this chord as-is
        nextChords.push(current.chords[i])
      } else {
        // generate a new chord based on key + restrictions
        const scaleNotes = keyName ? keynameToNotes(keyName) : undefined
        const sourceSet = currentChord?.sourceSet ?? DEFAULT_SOURCE_SET
        const candidateChords = !scaleNotes
          ? ALL_GUITAR_CHORDS
          : chordsMatchingCondition({
            scaleNotes,
            maxAccidentals: getMaxAccidentals(sourceSet),
          })

        nextChords.push({
          // TODO: use getMakeFlavourChoice
          name: randomChoice(candidateChords),
          locked: currentChord?.locked ?? false,
          variant: currentChord?.variant ?? 0,
          sourceSet,
        })
      }

      // after picking the first chord, if we don't already have a key from last
      // time we'll have to pick one that works with our new chord. If we had one
      // from before, we already generated the first chord in that
      if (!keyName) {
        const chordNoteSet = getGuitarNotes(nextChords[0].name)
        possibleKeys = keysIncludingChord(chordNoteSet)
        // FIXME: pick the first scale that has the same root note
        keyName = possibleKeys[0]
      }
    }

    setPromptChoice({
      chords: nextChords,
      keyName,
      possibleKeys,
      ...overrides,
    }, replace)
  }

  // XXX: is "replace = true" the right way to generate fewer undo moves?
  const modifyChord = (chordIndex: number, changes: Partial<ChordChoice>) =>
    setPromptChoice({
      chords: withReplacement(chords, chordIndex, {
        ...chords[chordIndex],
        ...changes,
      }),
    }, true)
  
  //////////////////////////////////////////////////////
  // initial setting

  useEffect(() => {
    if (!current.chords || current.chords.length === 0) {
      shuffleAll({
        replace: true,
        overrides: {
          flavour: "Balanced",
          keyIsLocked: false,
        },
      })
    }
  })

  //////////////////////////////////////////////////////

  const { chords, flavour, keyIsLocked } = current
  const frettingsByChordIndex = useMemo(
    () => chords?.map(chord => getFrettings(chord.name)),
    [chords]
  )

  return (
    <BasePrompt>
      <div className="chords">
        {/* TODO: de-dupe some things in here by making each chord its own component */}
        {frettingsByChordIndex?.map((frettings, chordIndex) => (
          <div key={chords[chordIndex].name}>
            <div className="buttons">
              <Choice
                help="Locked? (prevents shuffle)"
                setChoice={icon => modifyChord(chordIndex, { locked: icon === '🔒' })}
                current={chords[chordIndex].locked ? '🔒' : '🔓'}
                allChoices={['🔓', '🔒']}
                displayTransform={dimmedIf('🔓')}
                tapToChange
              />
              {/* first chord determines key if "isKeyLocked"; in this case the
                  key depends on the chord and as such there is no source set */}
              {chords[chordIndex].sourceSet && (chordIndex !== 0 || !keyIsLocked) && 
                <Choice
                  help="Which chords can we choose from?"
                  alignItems="center"
                  setChoice={sourceSet => modifyChord(chordIndex, { sourceSet })}
                  current={chords[chordIndex].sourceSet ?? '✨'}
                  allChoices={SOURCE_SET_CHOICES}
                  expandedDisplayTransform={sourceSetExpandedTransform}
                  tapToChange
                />
              }
              <Choice
                help="Variant"
                setChoice={variant => modifyChord(chordIndex, { variant })}
                current={Math.min(chords[chordIndex].variant, frettings.length - 1)}
                allChoices={firstNDigits(frettings.length)}
                displayTransform={x => VARIANT_NUMBERS[x]}
                tapToChange
              />
            </div>
            <ChordDiagram
              width={320}
              height={400}
              {...frettingToVexChord(
                frettings[Math.min(chords[chordIndex].variant, frettings.length - 1)],
                /* TODO: populate ENHARMONIC_DISPLAY_FOR_KEYNAME */
                /* { keyName: current.keyName } */
              )}
            />
            <h2>
              <Choice
                alignItems="center"
                current={chords[chordIndex].name}
                displayTransform={chordForDisplay}
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
        <ChoiceContainer
          caption={keyIsLocked ? `keys containing ${chords[0].name}` : "all keys"}
        >
          {current.keyName && 
            <Choice
              current={current.keyName}
              allChoices={current.possibleKeys}
              setChoice={keyName => setPromptChoice({ keyName })}
            />
          }
          &nbsp;&nbsp;
          <Choice
            help="Locked to first chord?"
            setChoice={icon => setPromptChoice({ keyIsLocked: icon === '🔒' })}
            current={keyIsLocked ? '🔒' : '🔓'}
            allChoices={['🔓', '🔒']}
            displayTransform={dimmedIf('🔓')}
            tapToChange
          />
        </ChoiceContainer>
        <IconButton type="shuffle" size="24px" onClick={() => shuffleAll()} />
        <ChoiceContainer caption="flavour" alignItems="end">
          <Choice
            current={FLAVOUR_CHOICES.find(f => f.name === flavour) ?? Balanced}
            alignItems="center"
            allChoices={FLAVOUR_CHOICES}
            displayTransform={f => f.name}
            setChoice={flavour => setPromptChoice({ flavour: flavour.name })}
          />
        </ChoiceContainer>
      </div>
    </BasePrompt>
  )
}

export default ChordsPrompt
