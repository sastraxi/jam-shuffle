import React, { useEffect, useMemo } from 'react'
import BasePrompt from '../core/BasePrompt'
import IconButton from '../components/IconButton'
import Choice from '../components/Choice'
import ChordDiagram from '../components/ChordDiagram'
import ChoiceContainer from '../components/ChoiceContainer'
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
  ExplodedChord,
  chordEquals,
} from '../theory/guitar'

import {
  KEY_NAMES_BASED_ON_MAJOR,
  keynameToNotes,
  keysIncludingChord,
  noteForDisplay,
} from '../theory/common'

import { Balanced, FLAVOUR_CHOICES, Flavour, getMakeFlavourChoice } from '../theory/flavours'

///////////////////////////

const ALL_GUITAR_CHORDS_WITH_BLANK_ACCIDENTALS: Array<ChordAndAccidentals> =
  ALL_GUITAR_CHORDS.map(chord => ({
    chord,
    accidentalScaleDegreesWithOctaves: [],
  }))

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

const keyLockingCaption = (keyLocked: boolean, firstChord: ChordChoice) => {
  if (!keyLocked) return 'All keys'
  if (firstChord.locked) {
    return `keys containing ${chordForDisplay(firstChord.chord)}`
  }
  return 'chosen key'  // locked to the current key
}

///////////////////////////

type ChordChoice = {
  chord: ExplodedChord,
  locked: boolean,
  variant: number,
}

type ChordsPromptChoices = {
  chords: Array<ChordChoice>
  flavour: string
  keyName: string

  /**
   * There are two overarching modes of operation. In the first, the key is unlocked.
   * We generate the first chord, 
   */
  keyLocked: boolean
}

/**
 * We need a starting point so that we don't have to throw in
 * a bunch of logic to deal with undefineds everywhere. Even though
 * each prompt is initialized with {} (see goToCategory) we will
 * quickly change it.
 */
const DEFAULT_PROMPT_CHOICES_CONTEXT: ChordsPromptChoices = {
  flavour: "Balanced",
  keyName: 'C major',
  keyLocked: false,
  chords: [],
}

/**
 * How many chords do we want to show?
 */
const NUM_CHORDS = 3

/**
 * Which keys can we choose from based on the choices input by the user?
 */
const generateKeyChoices = memoize((
  chord?: ChordChoice,
) => {
  if (chord) {
    const guitarNotes = getGuitarNotes(chord.chord, 0)
    const candidateKeys = keysIncludingChord(chord.chord.root, guitarNotes)
    console.log('key choices', chord.chord, guitarNotes, candidateKeys)
    return candidateKeys
  }
  return KEY_NAMES_BASED_ON_MAJOR
})

const generateChordChoices = memoize((
  flavour: Flavour,
  keyName: string | undefined,
) => {
  const scaleNotes = keyName ? keynameToNotes(keyName) : undefined
  const candidateChords = !scaleNotes
    ? ALL_GUITAR_CHORDS_WITH_BLANK_ACCIDENTALS
    : chordsMatchingCondition({ scaleNotes })
  
  return getMakeFlavourChoice(flavour, candidateChords)
})

///////////////////////////////

const dimmedIf = (exactlyMatches: string) =>
  (x: string) => <span className={x === exactlyMatches ? 'dimmed' : ''}>{x}</span>

const ChordsPrompt: React.FunctionComponent = () => {
  const current = usePromptChoices<ChordsPromptChoices>()
  const setPromptChoice = useSetPromptChoice<ChordsPromptChoices>()
  const flavour = FLAVOUR_CHOICES.find(f => f.name === current.flavour) ?? Balanced

  /**
   * 
   * 
   * @param from
   * @param to
   * @param keyName 
   * @param previous we need to know if the later chords were lockked
   * @param shuffle should we change existing chords even if they still work?
   * @returns the chords after the first one
   */
  const generateChords = (
    from: number,
    to: number,
    keyName: string | undefined,
    previous: ChordsPromptChoices,
    shuffle: boolean,
  ): Array<ChordChoice> => {
    if (to - from <= 0) throw new Error("Must generate at least one chord")

    const chords: Array<ChordChoice> = []
    const { chooseChord, candidateChords } = generateChordChoices(flavour, keyName)

    for (let i = from; i < to; ++i) {
      const previousChord: ChordChoice | undefined = previous.chords[i]

      if (previousChord?.locked) {
        chords.push(previousChord)
        continue
      }

      if (!shuffle && previousChord !== undefined) {
        // we can keep the previous chord in this position if it's compatible with the new key
        if (candidateChords.some(({ chord }) => chordEquals(chord, previousChord.chord))) {
          chords.push(previousChord)
          continue
        }
      }

      // generate a new chord
      chords.push({
        chord: chooseChord(),
        locked: false,
        variant: previousChord?.variant ?? 0,
      })
    }

    return chords
  }

  const shuffle = (previous?: ChordsPromptChoices) => {
    const context = previous ?? DEFAULT_PROMPT_CHOICES_CONTEXT

    let firstChord: ChordChoice
    let keyName: string | undefined = undefined
    if (!context.keyLocked) {
      // key unlocked --> chord chosen, then key that fits
      // some (guitar) chords do not have a base triad that fits neatly
      // into a key. TODO: fix this by looking up idealized triad based
      // on exploded chord name, rather than depending on guitar chord
      // as the fingering can cause the triad to be spread / under-represented
      // for now, we just keep loopin' until we find a chord that does fit
      while (!keyName) {
        firstChord = generateChords(0, 1, undefined, context, true)[0]
        keyName = randomChoice(generateKeyChoices(firstChord))
      }
    } else {
      // key locked --> key chosen, then chord that fits
      keyName = context.keyName
      firstChord = generateChords(0, 1, keyName, context, true)[0]
    }

    const shouldReplace = previous === undefined
    setPromptChoice({
      ...context,
      keyName,
      chords: [
        firstChord!,  // XXX: it can't figure out this will always be set
        ...generateChords(1, NUM_CHORDS, keyName, context, true),
      ],
    }, shouldReplace)
  }

  /**
   * Modifies a chord in the current prompt choice. If the first chord is
   * changed while it is influencing the key, we also modify the subsequent
   * chords.
   */
  const modifyChord = (chordIndex: number, changes: Partial<ChordChoice>) => {
    let newKeyName: string
    let newChords: Array<ChordChoice>

    // avoid triggering re-generation if the chord is identical
    if (current.chords[chordIndex]) {
      if (changes.chord && chordEquals(current.chords[chordIndex].chord, changes.chord)) {
        delete changes['chord']
      }
    }

    if ('chord' in changes && chordIndex === 0 && !current.keyLocked) {
      // we are changing the chord which determines the key, which,
      // in turn, changes the set of potential chords after the first.
      // as such we potentially need to re-generate the chords after this one
      const firstChord: ChordChoice = { ...chords[0], ...changes }
      const keyChoices = generateKeyChoices(firstChord)
      newKeyName = randomChoice(keyChoices)
      newChords = [
        firstChord,
        ...generateChords(1, NUM_CHORDS, newKeyName, current, false),
      ]
    } else {
      // changing this chord does not affect the other chords
      newKeyName = current.keyName
      newChords = withReplacement(chords, chordIndex, {
        ...chords[chordIndex],
        ...changes,
      })
    }

    // TODO: instead of replace, have "commit" and "isCommitted" in the app state
    const shouldReplace = !('chord' in changes)
    setPromptChoice({
      keyName: newKeyName,
      chords: newChords,
    }, shouldReplace)
  }

  /**
   * Modifies the key. We need to ensure that the chords that are dependent
   * on our key choice are re-generated if they are no longer in-key.
   */
  const setKey = (keyName: string) => {
    if (keyName === current.keyName) return
    if (current.keyLocked) {
      // key influences all chords
      setPromptChoice({
        keyName,
        chords: generateChords(0, NUM_CHORDS, keyName, current, false),
      })
    } else {
      // set of keys user chose from already set based on first chord;
      // only need to re-generate the chords after the first one
      setPromptChoice({
        keyName,
        chords: [
          current.chords[0],
          ...generateChords(1, NUM_CHORDS, keyName, current, false),
        ],
      })
    }
  }

  //////////////////////////////////////////////////////
  // initial setting

  useEffect(() => {
    if (Object.keys(current).length === 0) {
      shuffle()
    }
  })

  //////////////////////////////////////////////////////

  const { chords, keyLocked, keyName } = current
  const frettingsByChordIndex = useMemo(
    () => chords?.map(chord => getFrettings(chord.chord)),
    [chords]
  )
  const possibleKeys = useMemo(
    () => generateKeyChoices(keyLocked ? chords?.[0] : undefined),
    [chords, keyLocked]
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
                current={chords[chordIndex].chord}
                displayTransform={chordForDisplay}
                allChoices={ALL_GUITAR_CHORDS}
                setChoice={chord => modifyChord(chordIndex, { chord })}
              />
            </h2>
          </div>
        ))}
      </div>

      <div className="buttons">
        <ChoiceContainer caption={keyLockingCaption(keyLocked, chords[0])}>
          {current.keyName &&
            <Choice
              current={keyName}
              allChoices={possibleKeys}
              setChoice={(keyName) => setKey(keyName)}
            />
          }
          {/* FIXME: better way to space these out */}
          &nbsp;&nbsp;
          <Choice
            help="Key locking options"
            setChoice={choice => setPromptChoice({ keyLocked: choice == '🔒' })}
            current={current.keyLocked ? '🔒' : '✨'}
            allChoices={KEY_LOCKING_CHOICES}
            expandedDisplayTransform={keyLockingExpandedTransform}
            tapToChange
          />
        </ChoiceContainer>
        <IconButton type="shuffle" size="24px" onClick={() => shuffle(current)} />
        <ChoiceContainer caption="flavour" alignItems="end">
          <Choice
            current={flavour}
            alignItems="center"
            allChoices={FLAVOUR_CHOICES}
            displayTransform={f => f.name}
            setChoice={({ name }) => setPromptChoice({ flavour: name })}
          />
        </ChoiceContainer>
      </div>
    </BasePrompt>
  )
}

export default ChordsPrompt
