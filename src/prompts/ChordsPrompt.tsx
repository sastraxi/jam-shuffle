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
  keynameToNotes,
  keysIncludingChord,
  noteForDisplay,
} from '../theory/common'

import { Balanced, FLAVOUR_CHOICES } from '../theory/flavours'

///////////////////////////

const ALL_GUITAR_CHORDS_WITH_BLANK_ACCIDENTALS: Array<ChordAndAccidentals> =
  ALL_GUITAR_CHORDS.map(chordName => ({
    chord: explodeChord(chordName),
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
 * How many chords do we want to show?
 */
const NUM_CHORDS = 3

/**
 * What keys can we choose from based on the choices input by the user?
 */
const generateKeyChoices = memoize((
  chord?: ChordChoice,
) => {
  if (chord) {
    const guitarNotes = getGuitarNotes(chord.chord)
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

  /**
   * 
   * 
   * 
   * @param keyName 
   * @param previousChoices we need to know if the later chords were lockked
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
    const chords: Array<ChordChoice> = []

    const scaleNotes = keyName ? keynameToNotes(keyName) : undefined
    const candidateChords = !scaleNotes
      ? ALL_GUITAR_CHORDS_WITH_BLANK_ACCIDENTALS
      : chordsMatchingCondition({
        scaleNotes,
        maxAccidentals: 1,  // TODO: based on flavour
      })
    
    for (let i = from; i < to; ++i) {
      console.log(previous, i)
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
        // TODO: use getMakeFlavourChoice
        chord: randomChoice(candidateChords.map(c => c.chord)),
        locked: false,
        variant: previousChord?.variant ?? 0,
      })
    }

    return chords
  }

  const shuffle = (previous: ChordsPromptChoices) => {
    console.log('shuffle', previous)
    const flavour = FLAVOUR_CHOICES.find(f => f.name === previous.flavour) ?? Balanced

    let keyName: string | undefined = previous.keyLocked ? previous.keyName : undefined
    const firstChord = generateChords(0, 1, keyName, previous, true)[0]
    if (!keyName) {
      // key unlocked --> chord influences key
      // TODO: let the flavour weight the key selection
      keyName = randomChoice(generateKeyChoices(firstChord))
    } else {
      // key locked --> key influences chord (already happened)
    }

    setPromptChoice({
      ...previous,
      keyName,
      chords: [
        firstChord,
        ...generateChords(1, NUM_CHORDS, keyName, previous, true),
      ],
    })
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
    console.log('useEffect', current)
    // FIXME: why is undo making current === {}?
    if (!current.chords || current.chords.length === 0) {
      // we need to put in some nonsense to prevent having to make
      // everything optional in ChordsPromptChoices
      shuffle({
        flavour: "Balanced",
        keyLocked: false,
        chords: [],
        keyName: 'C major',
      })
    }
  })

  //////////////////////////////////////////////////////

  const { chords, flavour, keyLocked, keyName } = current
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
                current={combineChord(chords[chordIndex].chord)}
                displayTransform={chordForDisplay}
                allChoices={ALL_GUITAR_CHORDS}
                setChoice={name => modifyChord(chordIndex, { chord: explodeChord(name) })}
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
