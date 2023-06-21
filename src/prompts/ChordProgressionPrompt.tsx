import React, { useEffect } from 'react'
import BasePrompt from '../core/BasePrompt'
import IconButton from '../components/IconButton'
import Choice from '../components/Choice'
import ChordDiagram from '../components/ChordDiagram'

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

// N.B. from https://github.com/tombatossals/chords-db/blob/master/lib/guitar.json
import GuitarChords from '../theory/guitar.json'
import { ChordDefinition, GuitarString } from 'vexchords'

/**
 * Looks up a guitar chord based on chord name in chords-db.
 * @param chord the chord name, e.g. C/D#, Emmaj7b5, F major
 * @param variant 
 * @returns 
 */
const getFretting = (chord: string, variant?: number): Fretting => {
  const root = GuitarChords.keys.find(k => chord.startsWith(k))
  if (!root) {
    throw new Error(`Could not find root for chord name: ${chord}`)
  }
  const suffix = chord.substring(root.length).trim()
  const allSuffixes: Array<ChordLibraryEntry> = (GuitarChords.chords as Record<string, any>)[root]
  const frettings: Array<Fretting> | undefined = allSuffixes.find(x => x.suffix === suffix)?.positions
  if (!frettings) {
    console.log('Available suffixes:', allSuffixes.map(x => x.suffix))
    throw new Error(`Could not find frettings for ${chord}`)
  }

  return frettings[(variant ?? 0) % frettings.length]
}

const frettingToVexChord = (f: Fretting): ChordDefinition => {
  return {
    chord: f.frets.map((n, fretIndex) => [6 - fretIndex, (n === -1 ? 'x' : n)]),
    position: f.baseFret,
  }
} 

const ChordProgressionPrompt: React.FunctionComponent = () => {

  const CHORDS = [
    "B minor",
    "C major",
    "D major",
    "G maj7"
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
