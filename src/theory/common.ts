import { transpose, Scale, Interval, Note as TonalNote, PcSet } from 'tonal'
import { memoize } from '../util'

/**
 * e.g. C, E2, D#, Eb4
 */
export type Note = string

export type NoteDisplayContext = {
  keyName?: string
  scale?: Note[]
  showOctave?: boolean
}

export type ExplodedNote = {
  name: string,
  octave?: number
}

/**
 * Ensures that string comparison === note comparison (w/enharmonic equivalents).
 * Doesn't matter what we pick; here we're just always choosing sharps.
 */
const ENHARMONIC_NORMALIZE_MAP = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
}

/**
 * Ensures that every enharmonic note is given the same name.
 * Later, we can put the note back "into context" of the key.
 */
export const normalizedNoteName = (noteName: Note) => {
  for (const [needle, replacement] of Object.entries(ENHARMONIC_NORMALIZE_MAP)) {
    if (noteName.includes(needle)) return noteName.replace(needle, replacement)
  }
  return noteName
}

export const MAJOR_MODES_BY_DEGREE = [
  "major",
  "dorian",
  "phrygian",
  "lydian",
  "mixolydian",
  "minor",
  "locrian",
]

export const keynameToNotes = (keyName: string): Array<Note> =>
  Scale.get(keyName).notes

export const ROOT_NOTES: Array<Note> = []
for (let i = 0; i < 12; ++i) {
  ROOT_NOTES.push(normalizedNoteName(transpose("C", Interval.fromSemitones(i))))
}

/**
 * e.g. MAJOR_SCALES["C"] = ["C", "D", "E", ...]
 */
export const MAJOR_SCALES: Record<Note, Note[]> = {}
ROOT_NOTES.forEach(rootNote => {
  MAJOR_SCALES[rootNote] = keynameToNotes(`${rootNote} major`)
})

/**
 * In a given key, provide a mapping that lets us run note names through it
 * and quickly convert enharmonics to the right name for that key.
 * Accidentals are just passed through as is from ROOT_NOTES, but we could
 * probably consider double-sharps / double-flats as well...
 */
export const ENHARMONIC_DISPLAY_FOR_KEYNAME: Record<string, Record<Note, Note>> = {}
// TODO: ROOT_NOTES.forEach(...)
// FIXME: What about the enharmonic equivalents of key names...
//        How should we support e.g. Bb Major vs A# Major?

/**
 * Replaces # and b with the actual sharp / flat unicode symbols.
 */
export const displayAccidentals = (s: string) =>
  s.replace('#', '♯').replace('b', '♭')

/**
 * We require notes to be uppercase, and they can have an ocatve.
 */
const NOTE_REGEX = /([ABCDEFG][#b]?)(\d+)?/

/**
 * "Explodes" a note from string representation into { note, octave? }
 */
export const explodeNote = (note: Note): ExplodedNote => {
  const match = NOTE_REGEX.exec(note)
  if (match?.length === 3) {
    const [, name, octave] = match
    return { name, octave: octave === undefined ? undefined : parseInt(octave, 10) }
  }
  throw new Error(`Unrecognized note: ${note}`)
}

export const combineNote = ({ name, octave }: ExplodedNote): Note => `${name}${octave ?? ''}`

export const noteForDisplay = (
  note: Note | ExplodedNote,
  { keyName, scale, showOctave }: NoteDisplayContext = {},
) => {
  const explodedNote = (typeof note === 'string' ? explodeNote(note) : note)
  const { name, octave } = explodedNote

  let noteNameInContext
  if (keyName) {
    noteNameInContext = ENHARMONIC_DISPLAY_FOR_KEYNAME[keyName][name]
  } else if (scale) {
    noteNameInContext = scale.find(scaleNoteName =>
      TonalNote.get(scaleNoteName).chroma === TonalNote.get(name).chroma
    )
    if (!noteNameInContext) {
      throw new Error(`Bad scale; cannot find enharmonic of ${name} in ${scale}!`)
    }
  } else {
    noteNameInContext = name
  }

  const shouldShowOctave = showOctave ?? false
  const displayedOctave = shouldShowOctave ? (octave ?? '') : ''
  return `${displayAccidentals(noteNameInContext)}${displayedOctave}`
}

/**
 * e.g. C major, F lydian
 */
type ScaleName = string

/**
 * N.B. only does keys based on the major scales right now.
 */
export const keysIncludingChord = (
  notes: Array<Note>,
  maxAccidentals = 0,
  restrictedModes: Array<string> = ["locrian"],
) => {
  const matchingScales: Array<ScaleName> = []
  for (const scale of Object.values(MAJOR_SCALES)) {
    const inScale = PcSet.isNoteIncludedIn(scale)
    const accidentals = notes
      .map(inScale)

    const numAccidents = accidentals
      .reduce((sum, inScale) => sum + (inScale ? 0 : 1), 0)

    if (numAccidents <= maxAccidentals) {
      scale.forEach((note, degree) => {
        const mode = MAJOR_MODES_BY_DEGREE[degree]
        if (!restrictedModes.includes(mode)) {
          matchingScales.push(`${note} ${mode}`)
        }
      })
    }
  }

  console.log(notes, 'contained in', matchingScales)
  return matchingScales
}
