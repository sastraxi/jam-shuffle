import { useMemo } from 'react'
import Choice from '../components/Choice'
import ChordDiagram from '../components/ChordDiagram'
import './ChordInput.css'

import { firstNDigits } from '../util'
import { ExplodedChord, chordForDisplay, frettingToVexChord, getFrettings } from '../theory/guitar'
import { getRomanNumeral } from '../theory/triads'
import { untransformAccidentals } from '../theory/common'
import PlayButton from '../audio/PlayButton'

///////////////////////////

const VARIANT_NUMBERS = "①②③④⑤⑥⑦⑧⑨⑩"

///////////////////////////

const SOURCE_SET_CHOICES = [
  '✨', '🔑'
] as const
type SourceSetChoices = typeof SOURCE_SET_CHOICES[number]

const sourceSetExpandedTransform = (keyName: string) => (sourceSet: SourceSetChoices) => {
  if (sourceSet === '✨') return '✨ All chords'
  return `🔑 Chords in ${keyName}`
}

///////////////////////////

export type ChordChoice = {
    chord: ExplodedChord,
    locked: boolean,
    variant: number,
    sourceSet?: SourceSetChoices,
}  

type Props = {
    keyName: string
    choice: ChordChoice
    selectableChords: ExplodedChord[]
    modifyChord: (changes: Partial<ChordChoice>) => void
    showSourceSet: boolean
    showPlayButton?: boolean
}

const dimmedIf = (exactlyMatches: string) =>
  (x: string) => <span className={x === exactlyMatches ? 'dimmed' : ''}>{x}</span>

const ChordInput = ({
    keyName,
    choice,
    showSourceSet,
    selectableChords,
    modifyChord,
    showPlayButton = true
}: Props) => {

    const frettings = useMemo(() => getFrettings(choice.chord), [choice])
    const vexChord = useMemo(() => frettingToVexChord(
        frettings[Math.min(choice.variant, frettings.length - 1)],
        {
            showOctave: false,
            keyName,
        }
    ), [keyName, choice, frettings])

    console.log(vexChord?.notes)

    return (
        <div className="chord">
            <div className="buttons">
                <Choice
                    help="Locked? (prevents shuffle)"
                    setChoice={icon => modifyChord({ locked: icon === '🔒' })}
                    current={choice.locked ? '🔒' : '🔓'}
                    allChoices={['🔓', '🔒']}
                    displayTransform={dimmedIf('🔓')}
                    tapToChange
                />
                { showSourceSet && 
                <Choice
                        help="Restrict to key?"
                        setChoice={sourceSet => modifyChord({ sourceSet })}
                        current={choice.sourceSet!}
                        allChoices={SOURCE_SET_CHOICES}
                        expandedDisplayTransform={sourceSetExpandedTransform(keyName)}
                        tapToChange
                    />
                }
                <Choice
                    help="Variant"
                    setChoice={variant => modifyChord({ variant })}
                    current={Math.min(choice.variant, frettings.length - 1)}
                    allChoices={firstNDigits(frettings.length)}
                    displayTransform={x => VARIANT_NUMBERS[x]}
                    tapToChange
                />
            </div>
            <ChordDiagram
                width={320}
                height={400}
                {...vexChord}
            />
            <h2>
                {showPlayButton && vexChord.tuning && (
                    <PlayButton
                        instrument={276}
                        notes={vexChord.notes}
                        strumDurationMs={500}
                        strumDown={true}
                        activeDurationMs={1500}
                    />
                )}

                {/* TODO: playbutton */}
                <Choice
                    alignItems="center"
                    current={choice.chord}
                    displayTransform={chord => chordForDisplay(chord, { keyName })}
                    allChoices={selectableChords}
                    setChoice={chord => modifyChord({ chord })}
                    searchTransform={chord => untransformAccidentals(`${chord.root}${chord.suffix}`)}
                />
                <span className="numeral">
                    {getRomanNumeral(keyName, choice.chord)}
                </span>
            </h2>
        </div>
    )
}

export default ChordInput
