// N.B. from https://github.com/tombatossals/chords-db/blob/master/lib/guitar.json
import GuitarChords from './guitar.json'
import { ChordDefinition } from 'vexchords'
import { transpose, Interval } from 'tonal'

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

export const frettingToVexChord = (
  f: Fretting,
  noteForDisplay: (note: string) => string
): ChordDefinition => {
  return {
    chord: f.frets.map((n, fretIndex) => [6 - fretIndex, (n === -1 ? 'x' : n)]),
    position: f.baseFret,
    tuning: STANDARD_TUNING.map((stringRootNote, i) => {
      if (f.frets[i] === -1) return ''
      if (f.frets[i] === 0) return stringRootNote
      // TODO: if we asked for Gb, show those enharmonic notes
      return noteForDisplay(transpose(stringRootNote, Interval.fromSemitones(f.frets[i] + f.baseFret - 1)))
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


/**
 * Return chords that are "compatible" wih the one given.
 * @param chord e.g. "E sus2sus4", "Bb 9", "Ab major"
 */
export const compatibleChords = (_chord: string): Array<string> => {
  const FOUND_CHORDS: Array<string> = []

  // TODO: discover scales that this chord lives in
  // TODO: discover other chords in that scale and return them

  return FOUND_CHORDS
}
