import { useEffect, useRef, useState } from 'react'
import './Choice.css'

const SIDES = ['front', 'top', 'back', 'bottom'] as const
type SideEnum = typeof SIDES[number];

const Choice = ({
    href,
    target,   
    children,
}: {
    href?: string,
    target?: string
    children?: React.ReactNode
}) => {
    const [expanded, setExpanded] = useState<boolean>(false)

    const cubeRef = useRef<HTMLDivElement>(null)
    const anchorRef = useRef<HTMLAnchorElement>(null)
    const [cubeSize, setCubeSize] = useState<{ width: number, height: number}>({ width: 0, height: 0 })
    useEffect(() => {
        if (anchorRef.current) {
            // setCubeSize({
            //     width: anchorRef.current.clientWidth,
            //     height: anchorRef.current.clientHeight,
            // })
            setCubeSize({ width: 300, height: 60 })
        }
    }, [anchorRef])

    // which side of the "triangular prism" is facing forward right now?
    // this is used for css transition (think of a cube; we are rotating between
    // each side except for the left/right sides which are perpendicular to the "eye")
    const [facingSide, setFacingSide] = useState<SideEnum>('front')

    // should we be doing a very fast spin animation?
    const [isShuffling, setShuffling] = useState<boolean>(false)

    const goToExpandedMode = () => {
        setExpanded(true)
        cubeRef.current?.focus()
    }

    const changeFacingSide = (delta: number) => {
        let nextSideIndex = (SIDES.indexOf(facingSide) + delta) % SIDES.length
        if (nextSideIndex < 0) nextSideIndex += SIDES.length
        setFacingSide(SIDES[nextSideIndex])
    }

    // SHUFFLE ANIMATION:
    // The cube is only for spinning really fast so probably should be parameterized
    // by the actual degree measure, like a total of 8 turns ease-in-out.
    // change the actual value halfway through
    // https://codepen.io/flyorboom/pen/jOELoqM

    // SELECT ANIMATION:
    // when we want the user to actually select, we'll show the prev / next 2 choices
    // above and below. the white bg becomes a "reticule" that transitions relatively
    // slowly to be the right size for the incoming option

    return (
        <div className={`choice ${expanded ? 'expanded' : ''}`}>
            <div className="shroud" />
            <div
                className={`cube facing-${facingSide}`}
                style={{
                    "--cube-width": `${cubeSize.width}px`,
                    "--cube-height": `${cubeSize.height}px`,
                } as React.CSSProperties}
                ref={cubeRef}
                onWheel={(e) => changeFacingSide(Math.sign(e.deltaY))}
                onClick={() => setExpanded(false)}
            >
                {SIDES.map(s => (
                    <a href="#" className={`side ${s}`}>{s}</a>
                ))}
            </div>

            <a
                href={href ?? '#'}
                target={target}
                className="balance-text"
                ref={anchorRef}
                onClick={goToExpandedMode}
                onWheel={goToExpandedMode}
            >
                {children}
            </a>            
        </div>
    )
}

export default Choice
