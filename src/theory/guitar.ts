// N.B. from https://github.com/tombatossals/chords-db/blob/master/lib/guitar.json
import GuitarChords from './guitar.json'
import { ChordDefinition } from 'vexchords'
import { transpose, Interval, Scale, PcSet } from 'tonal'
import { memoize, randomChoice } from '../util'
import { MAJOR_MODES_BY_DEGREE, MAJOR_SCALES, NoteDisplayContext, noteForDisplay } from './common'

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

const STANDARD_TUNING = ['E', 'A', 'D', 'G', 'B', 'E']

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

/**
 * Gets a root and a suffix for lookup in the guitar chords database.
 * @param chordName descriptive chord name, e.g. "A#minor"
 * @returns { root, suffix } e.g. { root: "Bb", suffix: "minor" }
 */
const getRootAndSuffix = (chordName: string) => {
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

/**
 * Looks up all guitar chords for a given chord name in chords-db.
 * @param chordName the chord name, e.g. C/D#, Emmaj7b5, F major
 * @returns 
 */
export const getFrettings = (chordName: string): Fretting[] => {
  const { root, suffix } = getRootAndSuffix(chordName)

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
 * Return all the notes in the first variant of the given guitar chord.
 * @param chordName the chord name, e.g. C/D#, Emmaj7b5, F major
 * @returns e.g. ["A", "C", "E"]
 */
export const getGuitarNotes = memoize((chordName: string): Set<string> => {
  const { frets, baseFret } = getFrettings(chordName)[0]
  const notes = STANDARD_TUNING.map((stringRootNote, i) => {
    // FIXME: dedupe with frettingToVexChord
    if (frets[i] === -1) return undefined
    if (frets[i] === 0) return stringRootNote
    return transpose(stringRootNote, Interval.fromSemitones(frets[i] + baseFret - 1))
  }).filter(x => x !== undefined) as string[]
  
  // FIXME: doesn't return octaves b/c STANDARD_TUNING doesn't have them. Maybe it should?
  return new Set(notes)
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
      if (f.frets[i] === 0) return stringRootNote
      // TODO: if we asked for Gb, show those enharmonic notes
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

type ChordSearchParams = {
  scaleNotes?: string[],  // FIXME: Note[]
  maxAccidentals?: number
}

export const chordsMatchingCondition = memoize(
  ({ 
    scaleNotes,
    maxAccidentals,
  }: ChordSearchParams) => {
    if (!scaleNotes) return ALL_GUITAR_CHORDS
    const inScale = PcSet.isNoteIncludedIn(scaleNotes)

    // FIXME: it's more important that the root note (in the name of the chord)
    // is in the scale, less important as we get to the extensions above.
    // So let's...    
    //   1. block chords that don't have the root note in the scale
    //   2. block over chords where the bass note is not in the scale
    //   3. return a "weirdness" score that is a sum of each accidental,
    //      weighted so that accidentals in higher octaves return lower scores

    // TODO: flavours can then be: { weirdnessExponent, types: { whitelist, blacklist } }
    // and we'll need a random function that can take weighting into consideration
    // types.blacklist: e.g. we might not want mmaj7 chords
    // types.whitelist: e.g. we might just want power chords

    const matchingChords: Array<string> = []
    for (const chordName of ALL_GUITAR_CHORDS) {
      const notes = getGuitarNotes(chordName)
      const accidentals = [...notes]
        .map(inScale)
        .reduce((sum, inScale) => sum + (inScale ? 0 : 1), 0)

      // move onto the next chord if there are too many accidentals;
      // i.e. notes that are not in the scale that we're looking at
      if (maxAccidentals !== undefined && accidentals > maxAccidentals) {
        console.log(`${chordName} (${[...notes]}) has ${accidentals} accidentals (max ${maxAccidentals}) in ${scaleNotes}`)      
        continue
      }

      matchingChords.push(chordName)
    }
    return matchingChords
  })
