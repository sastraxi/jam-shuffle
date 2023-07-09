import React, { useEffect, useMemo, useRef } from 'react'
import BasePrompt from '../core/BasePrompt'
import IconButton from '../components/IconButton'
import Choice from '../components/Choice'
import ChoiceContainer from '../components/ChoiceContainer'
import ChordInput, { ChordChoice, SOURCE_SET_CHOICES, SourceSetChoices } from './ChordInput'
import './ChordsPrompt.css'

import { usePromptChoices, useSetPromptChoice } from '../state/app'
import { memoize, randomChoice, withReplacement } from '../util'

import {
  chordsMatchingCondition,
  ChordAndAccidentals,
  keysIncludingChord,
} from '../theory/keys'

import {
  ALL_GUITAR_CHORDS,
  getGuitarNotes,
  chordForDisplay,
  chordEquals,
  ExplodedChord,
} from '../theory/guitar'

import {
  KEY_NAMES_BASED_ON_MAJOR,
  keynameToNotes,
  untransformAccidentals,
} from '../theory/common'

import { Balanced, FLAVOUR_CHOICES, Flavour, getMakeFlavourChoice } from '../theory/flavours'
import MIDISounds, { MIDISoundPlayer } from 'midi-sounds-react'
import { getRomanNumeral } from '../theory/triads'


///////////////////////////

const SUFFIXES_WE_CANT_MAKE_KEYS_FROM = ['aug', 'aug7', 'aug9']

const GUITAR_CHORDS_IN_MAJOR_KEYS =
  ALL_GUITAR_CHORDS
    .filter(x => !SUFFIXES_WE_CANT_MAKE_KEYS_FROM.includes(x.suffix))

const ALL_GUITAR_CHORDS_WITH_BLANK_ACCIDENTALS: Array<ChordAndAccidentals> =
  GUITAR_CHORDS_IN_MAJOR_KEYS.map(chord => ({
    chord,
    accidentalScaleDegreesWithOctaves: [],
  }))

///////////////////////////

const KEY_LOCKING_CHOICES = [
  '✨', '🔒'
] as const
type KeyLockingChoices = typeof KEY_LOCKING_CHOICES[number]

const keyLockingExpandedTransform = (keyLocking: KeyLockingChoices) => {
  if (keyLocking === '✨') return '✨ All keys'
  return '🔒 Locked to key'
}

const keyLockingCaption = (keyName: string, keyLocked: boolean, firstChord: ChordChoice) => {
  if (!keyLocked) {
    if (firstChord.locked) {
      return `keys containing ${chordForDisplay(firstChord.chord, { keyName })}`
    }
    return 'all keys'
  }
  return 'chosen key'  // locked to the current key
}

///////////////////////////

type ChordsPromptChoices = {
  chords: Array<ChordChoice>
  flavour: Flavour
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
 * quickly change it. TODO: allow prompts to set a default in some registry.
 */
const DEFAULT_PROMPT_CHOICES_CONTEXT: ChordsPromptChoices = {
  flavour: Balanced,
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
    const candidateKeys = keysIncludingChord(chord.chord, guitarNotes)
    return candidateKeys
  }
  return KEY_NAMES_BASED_ON_MAJOR
})

const generateChordChoices = memoize((
  flavour: Flavour,
  {
    keyName,
    sameBaseTriadAs,
  }: {
    keyName?: string
    /**
     * Only return chords that have the same base triad?
     */
    sameBaseTriadAs?: ExplodedChord
  }
) => {
  // TODO: could parameterize differently once we have a richer way of expressing
  // chords. It's OK to want all "C major"-y chords and not have a key when we want
  // to just explore different extensions for the same base triad.
  // for now, we ignore the key when generating candidates so we can be sure to have
  // some that are of the same degree in the candidate chords before we filter down
  // the logic is a little awkward, which is why this is a note.

  const scaleNotes = (keyName && !sameBaseTriadAs) ? keynameToNotes(keyName) : undefined
  let candidateChords = !scaleNotes
    ? ALL_GUITAR_CHORDS_WITH_BLANK_ACCIDENTALS
    : chordsMatchingCondition({ scaleNotes })

  if (sameBaseTriadAs) {
    // XXX: need a key name as we compare in context of a key, but it doesn't matter what we choose
    const workingKeyName = keyName ?? 'C major'
    const romanNumeral = getRomanNumeral(workingKeyName, sameBaseTriadAs)
    const sameNumeralChords = candidateChords.filter(c =>
        romanNumeral === getRomanNumeral(workingKeyName, c.chord))

    if (sameNumeralChords.length === 0) {
      // FIXME: is this because the numerals are expressed differently? Only affects aug chords right now.
      console.warn(
        `Could not find any chords for ${romanNumeral} in
        ${workingKeyName}. Quietly dropping constraint.`
      )
    } else {
      candidateChords = sameNumeralChords
    }
  }

  return getMakeFlavourChoice(flavour, candidateChords)
})

///////////////////////////////
// Next steps...
///////////////////////////////
// - help text for key choice is current roman numerals (e.g. I ii iii iV V vi vii*)
// - add 3rd type of key locking: "same scale" (order: mode) (e.g. "KEYS BASED ON D MAJOR")
// - constrain to first locked chord, not just the first one IF locked
// - finish the "when we change source set we re-roll if it's no longer valid" logic
// - add piano mode + instrument
// - figure out UI of having a 4th chord on the screen
// - fix the flavour <Choice> having wonky visuals in expanded mode
// - add a play button for all chords
// - "movement" source sets
///////////////////////////////

const ChordsPrompt: React.FunctionComponent = () => {
  const current = usePromptChoices<ChordsPromptChoices>()
  const setPromptChoice = useSetPromptChoice<ChordsPromptChoices>()

  /**
   * Generate chords for the [from, to) indexes of our chords array.
   * @param from lower index, inclusive
   * @param to upper index, exclusive
   * @param keyName the key to restrict chords to, or undefined for any
   * @param previous we need to know if the previous chords were locked, among other things
   * @param shuffle should we change existing chords even if they still work?
   * @returns an array of chords that can be spliced into our chords array
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
    for (let i = from; i < to; ++i) {
      const previousChord: ChordChoice | undefined = previous.chords[i]

      if (previousChord?.locked) {
        chords.push(previousChord)
        continue
      }

      // how should we restrict the set of chords?
      const ignoreKey = (i > 0 && previousChord?.sourceSet === '✨')
      const sameBaseTriadAs = (previousChord?.sourceSet === '🧲'
        ? previousChord.chord
        : undefined)

      // actually generate some chords
      const { chooseChord, candidateChords } = generateChordChoices(
        previous.flavour,
        {
          keyName: ignoreKey ? undefined : keyName,
          sameBaseTriadAs,
        },
      )

      if (!shuffle && previousChord !== undefined) {
        // we can keep the previous chord in this position if it's compatible with the new key
        if (candidateChords.some(({ chord }) => chordEquals(chord, previousChord.chord))) {
          chords.push(previousChord)
          continue
        }
      }

      // generate a new chord
      const defaultSourceSet = i === 0 && !previous.keyLocked ? '✨' : '🔑'  // see "fix up choices" below.
      chords.push({
        chord: chooseChord(),
        locked: false,
        variant: previousChord?.variant ?? 0,
        sourceSet: previousChord?.sourceSet ?? defaultSourceSet,
      })
    }

    return chords
  }

  /**
   * Shuffle all of our non-locked choices.
   */
  const shuffle = (previous?: ChordsPromptChoices) => {
    const context = previous ?? DEFAULT_PROMPT_CHOICES_CONTEXT

    let firstChord: ChordChoice
    let keyName: string | undefined = undefined
    if (!context.keyLocked) {
      // key unlocked --> chord chosen, then key that fits.
      // N.B. some (guitar) chords do not have a base triad that fits neatly
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

  //////////////////////////////////////////////////////

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

    // re-roll this chord if we are changing the source set
    // and our new set doesn't include this chord
    // if (changes.sourceSet === '🔑') {
    //   const modifiedChord = { 
    //     ...(chords[chordIndex] ?? {}),
    //     ...changes,
    //   }
    //   console.log('bruhaha')
    //   if (!inKeyChords.find(x => modifiedChord.chord.root === x.root && modifiedChord.chord.suffix === x.suffix)) {
    //     console.log('yadda yadda yadda')
    //     changes['chord'] = generateChords(1, NUM_CHORDS, current.keyName, current, false)[0].chord
    //   }
    // }

    if ('chord' in changes && chordIndex === 0 && !current.keyLocked) {
      // we are changing the chord which determines the key, which,
      // in turn, changes the set of potential chords after the first.
      // as such we potentially need to re-generate the chords after this one
      const firstChord: ChordChoice = { ...current.chords[0], ...changes }
      const keyChoices = generateKeyChoices(firstChord)
      newKeyName = keyChoices.includes(current.keyName) ? current.keyName : randomChoice(keyChoices)
      newChords = [
        firstChord,
        ...generateChords(1, NUM_CHORDS, newKeyName, current, false),
      ]
    } else {
      // changing this chord does not affect the other chords
      // console.log('setting new chords')
      newKeyName = current.keyName
      newChords = withReplacement(current.chords, chordIndex, {
        ...current.chords[chordIndex],
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

  const setFlavour = (flavour: Flavour) => {
    if (flavour.name === current.flavour.name) return
    shuffle({
      ...current,
      flavour,
    })
  }

  //////////////////////////////////////////////////////
  // initial setting

  useEffect(() => {
    if (Object.keys(current).length === 0) {
      shuffle()
    }
  })

  //////////////////////////////////////////////////////
  // fix up choices that become illegal when things change,
  // rather than having to make these fixes imperatively everywhere.
  // TODO: find all the other fix-up code and centralize here

  useEffect(() => {
    if (!current.keyLocked && current?.chords?.[0]?.sourceSet === '🔑') {
      // when the key is unlocked, the first chord is generated and then the key
      // is set based on it. So it is impossible to choose from the key in this case
      // as the direction of causality is opposite
      modifyChord(0, { sourceSet: '✨' })
    }
  }, [current])

  //////////////////////////////////////////////////////

  const { chords, keyLocked, keyName, flavour } = current

  const possibleKeys = useMemo(
    () => generateKeyChoices(keyLocked ? chords?.[0] : undefined),
    [chords, keyLocked]
  )
  const inKeyChords = useMemo(
    () => flavour ? generateChordChoices(flavour, { keyName }).candidateChords.map(c => c.chord) : [],
    [flavour, keyName]
  )

  const midiSounds = useRef<MIDISoundPlayer>()

  if (!chords) return null

  return (
    <BasePrompt>
      <div style={{ display: "none" }}>
        <MIDISounds ref={midiSounds} />
      </div>

      <div className="chords">
        {chords.map((chord, chordIndex) => {
          let sourceSetOptions: Array<SourceSetChoices>
          if (chordIndex === 0 && !keyLocked) {
            sourceSetOptions = ['✨', '🧲']
          } else {
            sourceSetOptions = [...SOURCE_SET_CHOICES]
          }

          return (
            <ChordInput
              key={chordIndex}
              keyName={keyName}
              selectableChords={chordIndex === 0
                ? (keyLocked ? inKeyChords : GUITAR_CHORDS_IN_MAJOR_KEYS)
                : (chords[chordIndex].sourceSet === '🔑' ? inKeyChords : ALL_GUITAR_CHORDS)
              }
              choice={chord}
              sourceSetOptions={sourceSetOptions}
              modifyChord={changes => modifyChord(chordIndex, changes)}
              player={midiSounds.current}
            />
          )
        })}
      </div>

      <div className="buttons fixed">
        <ChoiceContainer caption={keyLockingCaption(keyName, keyLocked, chords[0])}>
          {current.keyName &&
            <Choice
              current={keyName}
              allChoices={possibleKeys}
              setChoice={(keyName) => setKey(keyName)}
              searchTransform={keyName => untransformAccidentals(keyName.replace(' ', ''))}
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
            setChoice={setFlavour}
          />
        </ChoiceContainer>
      </div>
    </BasePrompt>
  )
}

export default ChordsPrompt
