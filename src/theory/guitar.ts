import GuitarChords from './guitar.json'  // see README.md
import { VexChordDefinition } from 'vexchords'
import { transpose, Interval, } from 'tonal'
import { Note, NoteDisplayContext, displayAccidentals, normalizedNoteName, noteForDisplay } from './common'

type ChordLibraryEntry = {
  key: string,
  suffix: string,
  positions: Array<Fretting>
}

export type Fretting = {
  frets: number[],  // -1 for "x"
  fingers: number[],
  baseFret: number,
  capo?: boolean
  barres: number[]
}

export type Chord = string
export type ChordSuffix = string

export type ExplodedChord = {
  root: string
  suffix: ChordSuffix
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
export const getGuitarNotes = (
  chord: Chord | ExplodedChord,
  variant: number
): Array<Note> => {
  const frettings = getFrettings(chord)
  const { frets, baseFret } = frettings[variant % frettings.length]
  const notes = STANDARD_TUNING.map((stringRootNote, i) => {
    if (frets[i] === -1) return undefined
    if (frets[i] === 0) return stringRootNote
    return transpose(stringRootNote, Interval.fromSemitones(frets[i] + baseFret - 1))
  }).filter(x => x !== undefined) as Note[]
  return notes
}

export type ChordDefinition = VexChordDefinition & {
  notes: Note[],
}

export const frettingToVexChord = (
  f: Fretting,
  displayContext: NoteDisplayContext = {}
): ChordDefinition => {

  const notes = STANDARD_TUNING.map((stringRootNote, i) => {
    if (f.frets[i] === -1) return undefined
    if (f.frets[i] === 0) return stringRootNote
    return transpose(stringRootNote, Interval.fromSemitones(f.frets[i] + f.baseFret - 1))
  })

  return {
    chord: f.frets.map((n, fretIndex) => [6 - fretIndex, (n === -1 ? 'x' : n)]),
    position: f.baseFret,
    tuning: notes.map((note) => {
      if (note === undefined) return ''
      return noteForDisplay(note, displayContext)
    }),
    notes: notes.filter(x => x !== undefined) as Note[],
    // TODO: barres
  }
}

export const ALL_GUITAR_CHORDS: Array<ExplodedChord> = []
{
  Object.keys(GuitarChords.chords).forEach(lookupKey => {
    const rootNote = lookupKey.replace('sharp', '#')
    const allSuffixes: Array<ChordLibraryEntry> = (GuitarChords.chords as Record<string, any>)[lookupKey]
    allSuffixes.forEach(entry =>
      ALL_GUITAR_CHORDS.push({
        root: rootNote,
        suffix: entry.suffix
      })
    )
  })
}
