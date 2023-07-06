import { Interval, transpose } from "tonal"
import { Note } from "./common"
import { ALL_GUITAR_CHORDS, ChordSuffix, ExplodedChord } from "./guitar"

/**
 * Number of semitones in the two nonoverlapping sub-intervals that make up a triad.
 */
type Triad = Readonly<[number, number]>

const POWER_TRIAD: Triad = [0, 7]  // yes, it's not a triad. sue me
const SUS2_TRIAD: Triad = [2, 5]
const SUS4_TRIAD: Triad = [5, 2]
const MINOR_TRIAD: Triad = [3, 4]
const MAJOR_TRIAD: Triad = [4, 3]
const MAJOR_DIM_TRIAD: Triad = [4, 2]  // e.g. 9b5
const DIMINISHED_TRIAD: Triad = [3, 3]

/**
 * Return the three component notes of a given triad starting
 * on a given root note (with or without octave).
 */
const getTriadNotes = (rootNote: Note, triad: Triad): Note[] => ([
  rootNote,
  transpose(rootNote, Interval.fromSemitones(triad[0])),
  transpose(rootNote, Interval.fromSemitones(triad[1])),
])

const ALL_CHORD_SUFFIXES: Set<ChordSuffix> = new Set()
{
  ALL_GUITAR_CHORDS.forEach((value) => {
    ALL_CHORD_SUFFIXES.add(value.suffix)
  })
}

const SUFFIX_TO_TRIAD: Record<ChordSuffix, Triad> = {}
{
  let remainingSuffixes = [...ALL_CHORD_SUFFIXES]
  const mark = (triad: Triad, pred: (x: string) => boolean) => {
    remainingSuffixes.filter(pred).forEach(x => SUFFIX_TO_TRIAD[x] = triad)
    remainingSuffixes = remainingSuffixes.filter(x => !pred(x))
  }

  mark(DIMINISHED_TRIAD, x => x.startsWith('dim'))
  mark(MAJOR_TRIAD, x => x.startsWith('maj'))
  mark(MINOR_TRIAD, x => x.startsWith('min'))
  mark(MINOR_TRIAD, x => x.startsWith('m/'))
  mark(MINOR_TRIAD, x => x.startsWith('mmaj'))
  mark(SUS2_TRIAD, x => x.includes('sus2'))
  mark(SUS4_TRIAD, x => x.includes('sus4'))
  mark(MAJOR_TRIAD, x => x.startsWith('/'))
  mark(MAJOR_TRIAD, x => x === '69')
  mark(MINOR_TRIAD, x => x.startsWith('m'))
  mark(POWER_TRIAD, x => x === '5')
  mark(MAJOR_TRIAD, x => x === 'add9')
  mark(MAJOR_TRIAD, x => !isNaN(+x.charAt(0)) && !x.endsWith('b5')) 

  // the remaining suffixes ['alt', 'aug', '7b5', 'aug7', '9b5', 'aug9']
  // don't fit into any major scale, so we'll let'em stay where they are.
  // TODO: precompute this.
}

export const getChordTriad = (chord: ExplodedChord): Note[] => {
  const triad = SUFFIX_TO_TRIAD[chord.suffix]
  if (!triad) throw new Error(`${chord.root} ${chord.suffix} does not live in any major scale!`)
  return getTriadNotes(chord.root, triad)
}
