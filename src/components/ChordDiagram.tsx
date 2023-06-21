import { draw, type DrawOptions } from 'vexchords';
import './ChordDiagram.css'
import { useEffect, useRef } from 'react';

type PropTypes = DrawOptions & {
    label?: string,
    width: number,
    height: number,
}

/**
 * Component to render a vexchords diagram.
 */
const ChordDiagram = ({ label, width, height, ...drawOptions }: PropTypes) => {
    const chordRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!chordRef.current) return
        const container = chordRef.current

        draw(container, drawOptions, {
            width,
            height,
            defaultColor: 'white',
            labelColor: 'black',
            // See the docs for more available options.
            // https://github.com/0xfe/vexchords
        });

        // when we dismount, clear the container
        return () => container.replaceChildren()
    });

    return (
        <div className="chord-diagram">
            <div ref={chordRef}></div>
            { label ? <h3>{label}</h3> : null }
        </div>
    );
}

export default ChordDiagram
