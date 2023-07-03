import { memoize, upperBound } from "../util"

type ChordSuffix = string

export type Flavour = {
  name: string

  /**
   * An optional weighting function, allowing the flavour to bias
   * random chord generation towards certain types of chords. If
   * omitted, each chord is given a weighting of 1.
   * 
   * @param suffix e.g. mmaj7
   * @param accidentalScaleDegreesWithOctaves e.g. [2, 7, 11]
   * @returns a number representing the weight of the given chord
   *          when we are randomly choosing a chord. If the result
   *          is less than or equal to 0, the chord in question will
   *          never be selected.
   */
  chordWeightingFunc?: (
    suffix: ChordSuffix,
    accidentalScaleDegreesWithOctaves: number[],
  ) => number

  suffixes?: {
    /**
     * e.g. we might not want mmaj7 chords
     */
    whitelist?: Readonly<ChordSuffix[]>

    /**
     * e.g. we might just want power chords
     */
    blacklist?: Readonly<ChordSuffix[]>
  }
}

//////////////////////////////////////////////////////////

const isOverChord = (suffix: ChordSuffix) => suffix.includes('/')

//////////////////////////////////////////////////////////

const MaxPower: Flavour = {
  name: "MAX POWER!",
  suffixes: {
    whitelist: ['5'],
  }
}

const Basic: Flavour = {
  name: "Basic b****",
  suffixes: {
    whitelist: ['5', 'major', 'minor', 'sus4', 'maj7'],
  }
}

export const Balanced: Flavour = {
  name: "Balanced",
  chordWeightingFunc: (suffix, degrees) => {
    return Math.max(1, 5 - degrees.length) + (isOverChord(suffix) ? 2 : 0)
  },
  suffixes: {
    blacklist: ['sus2sus4', 'aug9', 'maj7b5', 'maj7#5', 'mmaj7b5', 'dim', 'dim7', '9#11', 'm7b5', 'alt']
  }
}

const ExtremelyWeird: Flavour = {
  name: "Extremely weird",
  chordWeightingFunc: (_suffix, degrees) => {
    return 1 + degrees.length
  }
}

//////////////////////////////////////////////////////////

export const FLAVOUR_CHOICES: Readonly<Array<Flavour>> = [
  MaxPower,
  Basic,
  Balanced,
  // 'Not weird',
  // 'Kinda weird',
  // 'Jazzy extensions',
  ExtremelyWeird,
] as const

// TODO: guitar.ts needs to generate these in chordsMatchingCondition
type ChordAndAccidentals = {
  chordRootNote: string
  chordSuffix: string
  accidentalScaleDegreesWithOctaves: number[]
}

export const getMakeFlavourChoice = memoize((flavour: Flavour, chords: Array<ChordAndAccidentals>) => {
  const weightingFunc = flavour.chordWeightingFunc ?? (() => 1)
  const cumulativeWeight: Array<number> = []
  for (let i = 0; i < chords.length; ++i) {
    const lastWeight = i === 0 ? 0 : cumulativeWeight[0]
    cumulativeWeight.push(lastWeight + weightingFunc(
      chords[i].chordSuffix,
      chords[i].accidentalScaleDegreesWithOctaves
    ))
  }
  const max = cumulativeWeight[cumulativeWeight.length - 1]
  return () => {
    const needle = Math.random() * max
    const i = upperBound(cumulativeWeight, needle)
    return `${chords[i].chordRootNote} ${chords[i].chordSuffix}`
  }
})
