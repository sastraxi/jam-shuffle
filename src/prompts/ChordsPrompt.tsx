import React, { useEffect, useMemo } from 'react'
import BasePrompt from '../core/BasePrompt'
import IconButton from '../components/IconButton'
import Choice from '../components/Choice'
import ChordDiagram from '../components/ChordDiagram'
import './ChordsPrompt.css'

import { usePromptChoices, useSetPromptChoice } from '../state/app'
import { firstNDigits, memoize, randomChoice, withReplacement } from '../util'

import {
  ALL_GUITAR_CHORDS,
  frettingToVexChord,
  getFrettings,
  chordsMatchingCondition,
  getGuitarNotes,
  chordForDisplay,
  explodeChord,
  ChordAndAccidentals,
  combineChord,
} from '../theory/guitar'

import {
  keynameToNotes,
  keysIncludingChord,
  noteForDisplay,
} from '../theory/common'

import { Balanced, FLAVOUR_CHOICES } from '../theory/flavours'

import ChoiceContainer from '../components/ChoiceContainer'
import { PcSet } from 'tonal'

const ALL_GUITAR_CHORDS_WITH_BLANK_ACCIDENTALS: Array<ChordAndAccidentals> =
  ALL_GUITAR_CHORDS.map(chordName => ({
    chord: explodeChord(chordName),
    accidentalScaleDegreesWithOctaves: [],
  }))

///////////////////////////

{
  const inScale = PcSet.isNoteIncludedIn(["E", "F#", "G#", "A", "B", "C#", "D#"])
  const myNotes = ["Eb", "Ab", "B", "E"]
  for (const note of myNotes) {
    console.log(note, inScale(note))
  }
}

///////////////////////////

const VARIANT_NUMBERS = "①②③④⑤⑥⑦⑧⑨⑩"

///////////////////////////

const KEY_LOCKING_CHOICES = [
  '✨', '🔒'
] as const
type KeyLockingChoices = typeof KEY_LOCKING_CHOICES[number]

const keyLockingExpandedTransform = (keyLocking: KeyLockingChoices) => {
  if (keyLocking === '✨') return '✨ All keys'
  return '🔒 Locked to key'
}

const keyLockingCaption = (keyLocking: KeyLockingChoices, firstChord: ChordChoice) => {
  if (keyLocking === '✨') return 'All keys'
  if (firstChord.locked) {
    return `keys containing ${chordForDisplay(firstChord.name)}`
  }
  return 'chosen key'  // locked to the current key
}

///////////////////////////

type ChordChoice = {
  name: string,
  locked: boolean,
  variant: number,
}

type ChordsPromptChoices = {
  chords: Array<ChordChoice>
  flavour: string
  keyName: string
  keyLocking: KeyLockingChoices
}

/**
 * What keys can we choose from based on the choices input by the user?
 */
const generateKeyChoices = memoize((
  chord?: ChordChoice,
) => {
  if (chord) {
    const guitarNotes = getGuitarNotes(chord.name)
    return keysIncludingChord(guitarNotes)
  }
  return keysIncludingChord([])
})

///////////////////////////////

const dimmedIf = (exactlyMatches: string) =>
  (x: string) => <span className={x === exactlyMatches ? 'dimmed' : '' }>{x}</span>

const ChordsPrompt: React.FunctionComponent = () => {
  const current = usePromptChoices<ChordsPromptChoices>()
  const setPromptChoice = useSetPromptChoice<ChordsPromptChoices>()

  const shuffleAll = (previous: ChordsPromptChoices = current) => {
    /*
      The key name option is weird. We have a few different modes of operation:

      Informational (all keys).
        We just want to know what keys work for these chords. We should support
        having no accidental restrictions and thus potentially creating a
        list of chords that does not work with any (major-based) scale.
      
      Set after first chord.
        The default options should always ensure three distinct chords can be
        generated and still follow the rules we've set out. It should be possible
        to change the first chord to something out of the selected key, which
        would trigger changing the key, which _might_ trigger changing other
        chords if they are restricted based on the key (and not locked).
      
      Set outright (locked).
        We should *also* support changing the key as the first thing. This is
        challenging because it means that Choice needs to be able to pick from
        every single key at all times, and is at odds with the "Informational"
        use case where we want to see which keys are.
    */

    // TODO: we need to do three things to make this work:
    // - restrict the set of chords we can select for first chord to only be
    //   those whose notes have a matching scale that contains them all (OR
    //   maybe with a maxAccidentals of 1... that's probably better).
    // - pick the keyChoices *after* the first chord is picked, i.e.
    //   using the newly-generated first chord, when it's just been generated
    // - "locked to first chord" should be implicit based on key is not locked
    //   and first chord is locked.

    let keyName: string | undefined = (
      previous.keyLocking === '🔒' ? previous.keyName : undefined
    )  // otherwise we'll have the key after we pick the first chord    

    const flavour = FLAVOUR_CHOICES.find(f => f.name === previous.flavour) ?? Balanced

    // generate up to three chords
    const nextChords: Array<ChordChoice> = []
    for (let i = 0; i < 3; ++i) {
      const currentChord = previous.chords?.[i]

      if (currentChord?.locked) {
        // keep this chord as-is
        nextChords.push(previous.chords[i])
      } else {
        // generate a new chord based on key + restrictions
        const scaleNotes = keyName ? keynameToNotes(keyName) : undefined
        const candidateChords = !scaleNotes
          ? ALL_GUITAR_CHORDS_WITH_BLANK_ACCIDENTALS
          : chordsMatchingCondition({
            scaleNotes,
            maxAccidentals: 1,  // TODO: based on flavour
          })

        const generatedChord: ChordChoice = {
          // TODO: use getMakeFlavourChoice
          name: randomChoice(candidateChords.map(c => combineChord(c.chord))),
          locked: currentChord?.locked ?? false,
          variant: currentChord?.variant ?? 0,
        }

        nextChords.push(generatedChord)

        // after the first chord, we will always have a key
        if (!keyName) {
          const keyChoices = generateKeyChoices(generatedChord)
          keyName = randomChoice(keyChoices)
        }
      }
    }

    setPromptChoice({
      ...previous,
      chords: nextChords,
      keyName,
    })
  }

  /**
   * Modifies a chord in the current prompt choice. If the first chord is
   * changed, we run a fix-up 
   */
  const modifyChord = (chordIndex: number, changes: Partial<ChordChoice>) => {
    const newChords = withReplacement(chords, chordIndex, {
      ...chords[chordIndex],
      ...changes,
    })

    let newKeyName = current.keyName
    if ('name' in changes && chordIndex === 0 && keyLocking === '🔒' && newChords[0].locked) {
      // changing the actual chord when we are in "locked to first chord" mode
      // means that we need to validate the currently-selected key contains this chord
      // if not, we need to select a new key, then validate that all the rest of the
      // chords are in that new key. If not, we'll have to change those too (unless
      // they fit inside the new scale already)
    }

    // TODO: instead of replace, have "commit" and "isCommitted" in the app state
    setPromptChoice({
      chords: newChords,
      keyName: newKeyName,
    }, true)
  }

  const setKey = (keyName: string) => {
    // if we
  }
  
  //////////////////////////////////////////////////////
  // initial setting

  useEffect(() => {
    if (!current.chords || current.chords.length === 0) {
      // we need to put in some nonsense to prevent having to make
      // everything optional in ChordsPromptChoices
      shuffleAll({
        flavour: "Balanced",
        keyLocking: '✨',
        chords: [],
        keyName: 'C major',
      })
    }
  })

  //////////////////////////////////////////////////////

  const { chords, flavour, keyLocking, keyName } = current
  const frettingsByChordIndex = useMemo(
    () => chords?.map(chord => getFrettings(chord.name)),
    [chords]
  )
  const possibleKeys = useMemo(
    () => generateKeyChoices(keyLocking === '🔒' ? chords?.[0] : undefined),
    [chords, keyLocking]
  )

  if (!chords) return []

  return (
    <BasePrompt>
      <div className="chords">
        {/* TODO: de-dupe some things in here by making each chord its own component */}
        {frettingsByChordIndex?.map((frettings, chordIndex) => (
          <div key={chordIndex}>
            <div className="buttons">
              <Choice
                help="Locked? (prevents shuffle)"
                setChoice={icon => modifyChord(chordIndex, { locked: icon === '🔒' })}
                current={chords[chordIndex].locked ? '🔒' : '🔓'}
                allChoices={['🔓', '🔒']}
                displayTransform={dimmedIf('🔓')}
                tapToChange
              />
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
                { showOctave: false }
                /* { keyName: current.keyName } */
              )}
            />
            <h2>
              {/* TODO: restrict set of chords */}
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
        <ChoiceContainer caption={keyLockingCaption(keyLocking, chords[0])}>
          {current.keyName && 
            <Choice
              current={keyName}
              allChoices={possibleKeys}
              setChoice={(keyName) => {
                if (keyLocking === '🔒') {
                  // 
                } else {
                  // we are picking from a bunch of keys that work
                  setPromptChoice({ keyName })
                }
              }}
            />
          }
          {/* FIXME: better way to space these out */}
          &nbsp;&nbsp;
          <Choice
            help="Key locking options"
            setChoice={keyLocking => setPromptChoice({ keyLocking })}
            current={current.keyLocking}
            allChoices={KEY_LOCKING_CHOICES}
            expandedDisplayTransform={keyLockingExpandedTransform}
            tapToChange
          />
        </ChoiceContainer>
        <IconButton type="shuffle" size="24px" onClick={shuffleAll} />
        <ChoiceContainer caption="flavour" alignItems="end">
          <Choice
            current={FLAVOUR_CHOICES.find(f => f.name === flavour)!}
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
