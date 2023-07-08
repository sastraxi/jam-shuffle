import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Midi } from "tonal";
import MIDISounds, { type MIDISoundPlayer } from 'midi-sounds-react';
import './PlayButton.css';
import IconButton from '../components/IconButton';

type Props = {
	/**
	 * Which MIDI instrument bank should we use?
	 */
	instrument: number

	/**
	 * Anything that can be converted to MIDI by tonal
	 */
	notes: Array<string>

	strumDurationMs?: number
	strumDown?: boolean
	activeDurationMs?: number
	noteDurationMs?: number
}

const MS_TO_SEC = 0.001

const PlayButton = ({
	instrument,
	notes,
	activeDurationMs = 1000,
	strumDown = true,
	strumDurationMs = 300,
	noteDurationMs = 500,
}: Props) => {
	const midiSounds = useRef<MIDISoundPlayer>()
	const [isPlaying, setIsPlaying] = useState(false)

	useEffect(() => {
		const player = midiSounds.current
		if (player) {
			player.setEchoLevel(0.1)
			player.setMasterVolume(0.3)
			player.cacheInstrument(instrument)
		}
	}, [midiSounds, instrument])

	const playSound = useCallback(() => {
		const player = midiSounds?.current
		console.log('playng', notes, notes.map(Midi.toMidi))
		if (!player) return

		const offsetSec = MS_TO_SEC * (strumDurationMs / notes.length)
		notes.forEach((note, index) => {
			const order = strumDown ? index : (notes.length - 1 - index)
			player.playChordAt(
				player.contextTime() + offsetSec * order,
				instrument,
				[Midi.toMidi(note)],
				MS_TO_SEC * noteDurationMs,
			);
		})

		setTimeout(() => setIsPlaying(false), activeDurationMs)
	}, [instrument, noteDurationMs, strumDown, strumDurationMs, midiSounds, notes, activeDurationMs])

	useEffect(() => {
		if (isPlaying) {
			playSound()
			return () => midiSounds.current?.cancelQueue()
		}
	}, [isPlaying, playSound])

	return (<>
		<div style={{ display: "none "}}>
			<MIDISounds ref={midiSounds} />
		</div>
		<IconButton
			type="external link"
			onClick={() => setIsPlaying(!isPlaying)}
		/>
	</>)
}

export default PlayButton
