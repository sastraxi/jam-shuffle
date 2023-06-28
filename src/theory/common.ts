
/**
 * e.g. C, E2, D#, Eb4
 */
type Note = string

type Chord = Array<Note>

export const noteForDisplay = (note: string) => note.replace('#', '♯').replace('b', '♭')

// relativeMode(chord, ...)


// export const keyForChord(, )