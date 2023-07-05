// N.B. from https://github.com/tombatossals/chords-db/blob/master/lib/guitar.json
import GuitarChords from './guitar.json'
import { ChordDefinition } from 'vexchords'
import { transpose, Interval, PcSet } from 'tonal'
import { memoize } from '../util'
import {  Note, NoteDisplayContext, displayAccidentals, normalizedNoteName, noteForDisplay } from './common'

type ChordLibraryEntry = {
  key: string,
  suffix: string,
  positions: Array<Fretting>
}

type Fretting = {
  frets: number[],  // -1 for "x"
  fingers: number[],
  baseFret: number,
  capo?: boolean
  barres: number[]
}

export type Chord = string

export type ExplodedChord = {
  root: string
  suffix: string
}

const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']

/**
 * Normalize the root of a chord for lookup in the database.
 * This is based on the published "keys" in guitar.json
 */
const translateKeyMap: Record<string, string> = {
  'Db': 'C#',
  'D#': 'Eb',
  'Gb': 'F#',
  'G#': 'Ab',
  'A#': 'Bb',
}

// we sort the keys in order of descending length to match "Eb" before "E"
const allKeysInDescLength = [...GuitarChords.keys, ...Object.keys(translateKeyMap)]
allKeysInDescLength.sort((a, b) => b.length - a.length)

export const isOverChord = ({ suffix }: ExplodedChord) => suffix.includes('/')

/**
 * Gets a root and a suffix for lookup in the guitar chords database.
 * @param chordName descriptive chord name, e.g. "A#minor"
 * @returns { root, suffix } e.g. { root: "Bb", suffix: "minor" }
 */
export const explodeChord = (chordName: Chord): ExplodedChord => {
  let root, suffix
  for (const prefix of allKeysInDescLength) {
    if (chordName.startsWith(prefix)) {
      if (Object.prototype.hasOwnProperty.call(translateKeyMap, prefix)) {
        root = translateKeyMap[prefix]
      } else {
        root = prefix
      }
      suffix = chordName.substring(prefix.length).trim()
      return { root, suffix }
    }
  }
  throw new Error(`Could not find root for chord name: ${chordName}`)
}

export const combineChord = (chord: ExplodedChord): Chord => `${chord.root} ${chord.suffix}`

export const chordEquals = (a: ExplodedChord, b: ExplodedChord) =>
  normalizedNoteName(a.root) === normalizedNoteName(b.root) &&
  a.suffix === b.suffix

export const chordForDisplay = (chord: Chord | ExplodedChord, context: NoteDisplayContext = {}) => {
  const { root, suffix } = (typeof chord === 'string' ? explodeChord(chord) : chord)
  const space = suffix.startsWith('/') ? '' : ' '
  return `${noteForDisplay(root, context)}${space}${displayAccidentals(suffix)}`
}

/**
 * Looks up all guitar chords for a given chord name in chords-db.
 * @param chordName the chord name, e.g. C/D#, Emmaj7b5, F major
 * @returns 
 */
export const getFrettings = (chord: Chord | ExplodedChord): Fretting[] => {  
  const { root, suffix } = (typeof chord === 'string' ? explodeChord(chord) : chord)

  const lookupKey = root.replace("#", "sharp")  // who knows!
  const allSuffixes: Array<ChordLibraryEntry> = (GuitarChords.chords as Record<string, any>)[lookupKey]
  const frettings: Array<Fretting> | undefined = allSuffixes.find(x => x.suffix === suffix)?.positions
  if (!frettings) {
    console.log('Available suffixes:', allSuffixes.map(x => x.suffix))
    throw new Error(`Could not find ${root} frettings for ${suffix}`)
  }

  return frettings
}

/**
 * Return all the notes in the given guitar chord.
 * @param chord the chord, e.g. C/D#, Emmaj7b5, F major
 * @param variant which variation of the chord should we pick? Defaults to the first.
 * @returns e.g. ["A2", "C3", "E3"], from lowest-to-highest frequency
 */
export const getGuitarNotes = memoize((chord: Chord | ExplodedChord, variant = 0): Array<Note> => {
  const frettings = getFrettings(chord)
  const { frets, baseFret } = frettings[variant % frettings.length]
  const notes = STANDARD_TUNING.map((stringRootNote, i) => {
    if (frets[i] === -1) return undefined
    if (frets[i] === 0) return stringRootNote
    return transpose(stringRootNote, Interval.fromSemitones(frets[i] + baseFret - 1))
  }).filter(x => x !== undefined) as Note[]
  return notes
})

export const frettingToVexChord = (
  f: Fretting,
  displayContext: NoteDisplayContext = {}
): ChordDefinition => {
  return {
    chord: f.frets.map((n, fretIndex) => [6 - fretIndex, (n === -1 ? 'x' : n)]),
    position: f.baseFret,
    tuning: STANDARD_TUNING.map((stringRootNote, i) => {
      if (f.frets[i] === -1) return ''
      if (f.frets[i] === 0) return noteForDisplay(stringRootNote, displayContext)
      return noteForDisplay(
        transpose(stringRootNote, Interval.fromSemitones(f.frets[i] + f.baseFret - 1)),
        displayContext,
      )
    })
    // TODO: barres
  }
} 

export const ALL_GUITAR_CHORDS: Array<string> = []
{
  Object.keys(GuitarChords.chords).forEach(lookupKey => {
    const rootNote = lookupKey.replace('sharp', '#')
    const allSuffixes: Array<ChordLibraryEntry> = (GuitarChords.chords as Record<string, any>)[lookupKey]
    allSuffixes.forEach(entry =>
      ALL_GUITAR_CHORDS.push(`${rootNote} ${entry.suffix}`)
    )
  })
}

export type ChordSearchParams = {
  /**
   * The notes of the scale, without octaves.
   */
  scaleNotes: string[],
  maxAccidentals?: number
}

export type ChordAndAccidentals = {
  chord: ExplodedChord
  accidentalScaleDegreesWithOctaves: number[]
}

/**
 * How many semitones are between the two given notes?
 * The result is not well-defined if octaves are not given.
 */
const semitoneDistance = (from: Note, to: Note): number => {
  const semitones = Interval.semitones(Interval.distance(from, to))
  if (semitones === undefined) throw new Error(`semitone distance from ${from} to ${to} is undefined`)
  return semitones
}

/**
 * Which chords are inside of the scale we're interested in?
 */
export const chordsMatchingCondition = memoize(
  ({ 
    scaleNotes,
    maxAccidentals,
  }: ChordSearchParams): Array<ChordAndAccidentals> => {
    const inScale = PcSet.isNoteIncludedIn(scaleNotes)
    // TODO: confirm PcSet is working as expected with enharmonics
  
    const matchingChords: Array<ChordAndAccidentals> = []
    for (const chordName of ALL_GUITAR_CHORDS) {
      const chord = explodeChord(chordName)
      const notes = getGuitarNotes(chordName, 0)
      
      // skip chords that don't have the root and bass note in scale
      const bassNote = notes[0]
      const rootNote = isOverChord(chord) ? notes[1] : notes[0]
      if (!inScale(bassNote) || !inScale(rootNote)) {
        // console.warn(
        //   `${chordName} (${notes}): out-of-scale root/bass note in ${scaleNotes}.`
        // )
        continue
      }

      const accidentals = notes
        .filter(note => !inScale(note))
        .map(note => semitoneDistance(rootNote, note))

      // move onto the next chord if there are too many accidentals;
      // i.e. notes that are not in the scale that we're looking at
      // TODO: we might want to remove this altogether and just have
      // the flavour have this logic
      if (maxAccidentals !== undefined && accidentals.length > maxAccidentals) {        
        // console.warn(
        //   `${chordName} (${notes}): ${accidentals.length} accidentals (max ${maxAccidentals}) in ${scaleNotes}`
        // )
        continue
      }

      matchingChords.push({
        chord: explodeChord(chordName),
        accidentalScaleDegreesWithOctaves: accidentals,
      })
    }
    return matchingChords
  })
