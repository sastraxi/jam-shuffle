declare module 'midi-sounds-react' {

    export type MIDISoundPlayer = {
        playChordAt: (
            timeSec: number,
            instrument: number,
            midiNotes: Array<number | null>,
            durationSec: number,
        ) => void
        contextTime: () => number
        cancelQueue: () => void
        setEchoLevel: (percentageDecimal: number) => void
        setMasterVolume: (percentageDecimal: number) => void
        cacheInstrument: (instrument: number) => void
    }

    function MIDISounds(ref: any): any
    export = MIDISounds
}
