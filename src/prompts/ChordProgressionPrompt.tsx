import React, { useEffect } from 'react'
import BasePrompt from '../core/BasePrompt'
import IconButton from '../components/IconButton'
import Choice from '../components/Choice'
import ChordDiagram from '../components/ChordDiagram'

// N.B. from https://github.com/tombatossals/chords-db/blob/master/lib/guitar.json
import GuitarChords from '../theory/guitar.json'
import { ChordDefinition } from 'vexchords'

import './ChordProgressionPrompt.css'

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
 * Looks up a guitar chord based on chord name in chords-db.
 * @param chordName the chord name, e.g. C/D#, Emmaj7b5, F major
 * @param variant 
 * @returns 
 */
const getFretting = (chordName: string, variant?: number): Fretting => {
  const { root, suffix } = getRootAndSuffix(chordName)

  const lookupKey = root.replace("#", "sharp")  // who knows!
  const allSuffixes: Array<ChordLibraryEntry> = (GuitarChords.chords as Record<string, any>)[lookupKey]
  const frettings: Array<Fretting> | undefined = allSuffixes.find(x => x.suffix === suffix)?.positions
  if (!frettings) {
    console.log('Available suffixes:', allSuffixes.map(x => x.suffix))
    throw new Error(`Could not find ${root} frettings for ${suffix}`)
  }

  return frettings[(variant ?? 0) % frettings.length]
}

const frettingToVexChord = (f: Fretting): ChordDefinition => {
  return {
    chord: f.frets.map((n, fretIndex) => [6 - fretIndex, (n === -1 ? 'x' : n)]),
    position: f.baseFret,
    // TODO: barres
  }
} 

const ChordProgressionPrompt: React.FunctionComponent = () => {

  const CHORDS = [
    "B minor",
    "C major",
    "D major",
    "Gb m7b5"
  ]

  const frettings = CHORDS.map(chord => getFretting(chord))

  return (
    <BasePrompt>
      <div className="chords">
        {frettings.map((f, chordIndex) => (
          <ChordDiagram
            label={CHORDS[chordIndex]}
            key={CHORDS[chordIndex]}
            width={320}
            height={400}
            {...frettingToVexChord(f)}
          />
        ))}
      </div>

      <div className="buttons">
        <IconButton type="shuffle" size="24px" />
      </div>
    </BasePrompt>
  )
}

export default ChordProgressionPrompt
