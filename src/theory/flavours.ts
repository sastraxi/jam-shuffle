import { memoize, upperBound } from "../util"
import { ChordAndAccidentals, ExplodedChord, isOverChord } from "./guitar"

type ChordSuffix = string

export type Flavour = {
  name: string

  /**
   * An optional weighting function, allowing the flavour to bias
   * random chord generation towards certain types of chords. If
   * omitted, each chord is given a weighting of 1.
   * 
   * @param candidate the candidate chord (w/ suffix & accidentals)
   *                  to consider
   * 
   * @returns a number representing the weight of the given chord
   *          when we are randomly choosing a chord. If the result
   *          is less than or equal to 0, the chord in question will
   *          never be selected.
   */
  chordWeightingFunc?: (candidate: ChordAndAccidentals) => number

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
  chordWeightingFunc: ({ chord, accidentalScaleDegreesWithOctaves }) => {
    return Math.max(1, 5 - accidentalScaleDegreesWithOctaves.length)
      + (isOverChord(chord) ? 2 : 0)
  },
  suffixes: {
    blacklist: ['sus2sus4', 'aug9', 'maj7b5', 'maj7#5', 'mmaj7b5', 'dim', 'dim7', '9#11', 'm7b5', 'alt']
  }
}

const ExtremelyWeird: Flavour = {
  name: "Extremely weird",
  chordWeightingFunc: ({ accidentalScaleDegreesWithOctaves }) => {
    // more accidentals --> more likely to be selected
    return 1 + accidentalScaleDegreesWithOctaves.length
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

export const getMakeFlavourChoice = (
  flavour: Flavour,
  chords: Array<ChordAndAccidentals>,
) => {
  const weightingFunc = flavour.chordWeightingFunc ?? (() => 1)
  const cumulativeWeight: Array<number> = []
  for (let i = 0; i < chords.length; ++i) {
    const lastWeight = i === 0 ? 0 : cumulativeWeight[i - 1]
    const thisWeight = weightingFunc(chords[i])
    cumulativeWeight.push(lastWeight + thisWeight)
  }
  const max = cumulativeWeight[cumulativeWeight.length - 1]
  return () => {
    const needle = Math.random() * max
    const i = upperBound(cumulativeWeight, needle)
    return chords[i].chord
  }
}
