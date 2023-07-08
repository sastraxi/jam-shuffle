import { transpose, Scale, Interval, Note as TonalNote } from 'tonal'

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
  const simplifiedNoteName = TonalNote.simplify(noteName)
  for (const [needle, replacement] of Object.entries(ENHARMONIC_NORMALIZE_MAP)) {
    if (simplifiedNoteName.startsWith(needle)) {
      return `${replacement}${simplifiedNoteName.substring(needle.length)}`
    }
  }
  return simplifiedNoteName
}

export const noteNameEquals = (a: Note, b: Note, ignoreOctave = true) => {
  if (!ignoreOctave) return normalizedNoteName(a) === normalizedNoteName(b)
  return normalizedNoteName(explodeNote(a).name) === normalizedNoteName(explodeNote(b).name)
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
  Scale.get(keyName).notes.map(TonalNote.simplify)

export const ROOT_NOTES: Array<Note> = []
for (let i = 0; i < 12; ++i) {
  ROOT_NOTES.push(normalizedNoteName(transpose("C", Interval.fromSemitones(i))))
}

export const DEFAULT_RESTRICTED_MODES = ["locrian"]

/**
 * e.g. MAJOR_SCALES["C"] = ["C", "D", "E", ...]
 */
export const MAJOR_SCALES: Record<Note, Note[]> = {}

/**
 * Circle of fifths, baby!
 */
export const MAJOR_KEY_NAMES: Array<string> = [
  "C major",
  "G major",
  "D major",
  "A major",
  "E major",
  "B major",
  "Gb major",  // chosen over F# major for reasons: https://music.stackexchange.com/a/23170
  "Db major",
  "Ab major",
  "Eb major",
  "Bb major",
  "F major",
]

export const KEY_NAMES_BASED_ON_MAJOR: Array<string> = []

MAJOR_KEY_NAMES.forEach((keyName) => {
  const [rootNote, ] = keyName.split(' ')
  MAJOR_SCALES[rootNote] = keynameToNotes(keyName)
  MAJOR_SCALES[rootNote].forEach((note, degree) => {
    const mode = MAJOR_MODES_BY_DEGREE[degree]
    if (!DEFAULT_RESTRICTED_MODES.includes(mode)) {
      KEY_NAMES_BASED_ON_MAJOR.push(`${note} ${mode}`)
    }
  })
})

/**
 * In a given key, provide a mapping that lets us run note names through it
 * and quickly convert enharmonics to the right name for that key.
 * Accidentals are just passed through as is from ROOT_NOTES, but we could
 * probably consider double-sharps / double-flats as well...
 */
export const ENHARMONIC_DISPLAY_FOR_KEYNAME: Record<string, Record<Note, Note>> = {}
{
  const CONSIDERED_NOTE_NAMES = [
    'Ab', 'A', 'A#', 'Bb', 'B', 'B#', 'Cb', 'C', 'C#',
    'Db', 'D', 'D#', 'Eb', 'E', 'E#', 'Fb', 'F', 'F#',
    'Gb', 'G', 'G#',
  ]

  KEY_NAMES_BASED_ON_MAJOR.forEach((keyName) => {
    const mapping: Record<Note, Note> = {}

    const keyNotes = keynameToNotes(keyName)
    const keyChromas = keyNotes.map(TonalNote.chroma)

    CONSIDERED_NOTE_NAMES.forEach((noteName) => {
      const noteChroma = TonalNote.chroma(noteName)
      const foundIndex = keyChromas.indexOf(noteChroma)
      if (foundIndex === -1) {
        // out-of-key; mapping is identity
        // TODO: should we let it fail and deal with it outside?
        mapping[noteName] = noteName
      } else {
        // in key; map to the "official" name for this note in this key
        mapping[noteName] = keyNotes[foundIndex]
      }
    })

    ENHARMONIC_DISPLAY_FOR_KEYNAME[keyName] = mapping
  })

  // TODO: precompute?
}

/**
 * Replaces # and b with the actual sharp / flat unicode symbols.
 */
export const displayAccidentals = (s: string) =>
  s.replace('#', '♯').replace('b', '♭')

export const untransformAccidentals = (s: string) =>
  s.replace('♯', '#').replace('♭', 'b')


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

export const stripOctave = (note: Note | ExplodedNote) => {
  const explodedNote = (typeof note === 'string' ? explodeNote(note) : note)
  return explodedNote.name
}

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
export type ScaleName = string
