import { upperBound } from "../util"
import { ChordSuffix, isOverChord } from "./guitar"
import { ChordAndAccidentals } from "./keys"

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
    whitelist?: Readonly<Set<ChordSuffix>>

    /**
     * e.g. we might just want power chords
     */
    blacklist?: Readonly<Set<ChordSuffix>>
  }
}

//////////////////////////////////////////////////////////

const MaxPower: Flavour = {
  name: "MAX POWER!",
  suffixes: {
    whitelist: new Set(['5']),
  }
}

const Basic: Flavour = {
  name: "Basic stuff",
  suffixes: {
    whitelist: new Set(['major', 'minor', 'sus4', 'maj7']),
  }
}

export const Balanced: Flavour = {
  name: "Balanced",
  chordWeightingFunc: ({ chord, accidentalScaleDegreesWithOctaves }) => {
    if (chord.suffix === 'major' || chord.suffix === 'minor') return 5000
    return Math.pow(Math.max(1, 3 - accidentalScaleDegreesWithOctaves.length), 5)
      + (isOverChord(chord) ? 8 : 0)
  },
  suffixes: {
    blacklist: new Set(['5', 'sus2sus4', 'aug', 'aug9', 'maj7b5', 'maj7#5', 'mmaj7b5', '9#11', 'm7b5', 'alt']),
  }
}

const ExtremelyWeird: Flavour = {
  name: "Extremely weird",
  chordWeightingFunc: ({ accidentalScaleDegreesWithOctaves }) => {
    // more accidentals --> more likely to be selected
    return Math.pow(1 + accidentalScaleDegreesWithOctaves.length, 2)
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
  
  // apply whitelist / blacklist
  let candidates: Array<ChordAndAccidentals>
  if (flavour.suffixes?.whitelist) {
    candidates = chords.filter(x => flavour.suffixes?.whitelist?.has(x.chord.suffix))
  } else if (flavour.suffixes?.blacklist) {
    candidates = chords.filter(x => !flavour.suffixes?.blacklist?.has(x.chord.suffix))
  } else {
    candidates = chords
  }

  if (candidates.length === 0) {
    throw new Error("No chords!")
  }
  
  // calculate each chord weight; maintain a cumulative weight array
  // alongside the candidate chords
  const cumulativeWeight: Array<number> = []
  for (let i = 0; i < candidates.length; ++i) {
    const lastWeight = i === 0 ? 0 : cumulativeWeight[i - 1]
    const thisWeight = weightingFunc(candidates[i])
    cumulativeWeight.push(lastWeight + thisWeight)
  }
  const max = cumulativeWeight[cumulativeWeight.length - 1]

  return {
    candidateChords: candidates,
    chooseChord: () => {
      const needle = Math.random() * max
      const i = upperBound(cumulativeWeight, needle)  // binary search the weight
      return candidates[i].chord
    },
  }
}
