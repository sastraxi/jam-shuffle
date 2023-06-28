import { useCallback, useEffect, useRef, useState } from 'react'
import './Choice.css'

type Props<T> = {
    current: T,
    displayTransform?: ((choice: T) => React.ReactNode),
    expandedDisplayTransform?: ((choice: T) => React.ReactNode),
    allChoices?: readonly T[],
    setChoice?: (newChoice: T) => void,
    fullWidth?: boolean
    alignItems?: 'start' | 'center' | 'end'
    help?: string
    /**
     * Should we immediately go to the next value on click?
     */
    tapToChange?: boolean
}

// FIXME: "end" is badly broken
const calculateTransform = (alignItems: 'start' | 'center' | 'end', offsetWidth: number) => {
    if (alignItems === 'center') return 'translate(-50%, -50%)'
    const multiplier = alignItems === 'end' ? 1 : 1
    return `translate(${-0.5 * multiplier * offsetWidth}px, -50%)`
}

const convertToString = <T,>(x: T) => `${x}`

function Choice<ChoiceType,>({
    current,
    allChoices,
    setChoice,
    help,
    tapToChange = false,
    displayTransform = convertToString,
    expandedDisplayTransform,
    fullWidth = false,
    alignItems = 'start',
}: Props<ChoiceType>) {
    
    const rootRef = useRef<HTMLDivElement>(null)
    const unexpandedAnchorRef = useRef<HTMLAnchorElement>(null)
    const [expanded, setExpanded] = useState<boolean>(false)
    const [screenPosition, setScreenPosition] = useState<Partial<React.CSSProperties>>({})

    const goToExpandedMode = useCallback(() => {
        if (expanded) return
        if (rootRef.current) {
            const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = rootRef.current 
            setScreenPosition({
                left: `${offsetLeft + (0.5 * offsetWidth)}px`,
                top: `${offsetTop + (0.5 * offsetHeight)}px`,
                width: fullWidth ? `${offsetWidth}px` : undefined,
                transform: calculateTransform(alignItems, offsetWidth),
            })
        }
        setExpanded(true)
    }, [expanded, alignItems, fullWidth])
    
    const [pendingChoice, setPendingChoice] = useState<ChoiceType>(current)
    const getRelativeChoice = useCallback((from: ChoiceType, delta: number) => {
        if (!allChoices) throw new Error("No choices to choose from!")
        
        const fromIndex = allChoices.indexOf(from)
        if (fromIndex === -1) {
            return allChoices[0]  // if we're out of the set, just pick the first (e.g. variant overflow)
        }

        let nextPendingChoiceIndex = (fromIndex + Math.round(delta)) % allChoices.length
        if (nextPendingChoiceIndex < 0) nextPendingChoiceIndex += allChoices.length
        return allChoices[nextPendingChoiceIndex]
    }, [allChoices, pendingChoice])

    const changePendingChoice = (delta: number) => {
        if (delta === 0) return
        if (!allChoices) return
        setPendingChoice(getRelativeChoice(pendingChoice, delta))
    }

    const onTap = useCallback(() => {
        if (expanded) return
        return tapToChange
            ? setChoice?.(getRelativeChoice(current, 1))
            : goToExpandedMode();
    }, [expanded, current, setChoice, getRelativeChoice, goToExpandedMode, tapToChange])

    const closeExpandedMode = useCallback((shouldCommit: boolean) => {
        if (shouldCommit && setChoice) {
            setChoice(pendingChoice)
        }
        setExpanded(false)
        unexpandedAnchorRef.current?.focus()
    }, [setExpanded, setChoice, pendingChoice])

    // document-level event listener: ESC closes expanded mode
    useEffect(() => {
        if (expanded) {
            const closeOnKey = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    closeExpandedMode(false)
                    e.stopPropagation()
                }
                if (e.key === "Enter") {
                    closeExpandedMode(true)
                    e.stopPropagation()
                }
            }
            document.addEventListener('keydown', closeOnKey, false)
            return () => document.removeEventListener('keydown', closeOnKey, false)   
        }
    }, [expanded, closeExpandedMode])

    // copy current -> pending when we get a new (controlled) value
    useEffect(() => {
        if (current === undefined) {
            // FIXME: why are we getting undefined pending?
            // console.log('current is undefined...')
            return
        }
        if (pendingChoice !== current) {
            setPendingChoice(current)
        }
    }, [current])

    const rootClassNames = [
        'choice',
        expanded && 'expanded',
        fullWidth && 'full-width'
    ].filter(x => x).join(' ')

    // TODO: global help tooltip
    const pendingDisplayTransform = expandedDisplayTransform ?? displayTransform
    return (
        <div
            className={rootClassNames}
            ref={rootRef} 
            onWheel={allChoices ? e => changePendingChoice(Math.sign(e.deltaY)) : undefined}
            title={help}
        >
            <a
                ref={unexpandedAnchorRef}
                className="balance-text current"
                onClick={allChoices ? onTap : undefined}
                onWheel={allChoices ? goToExpandedMode : undefined}
            >
                {displayTransform(current)}
            </a>      
            <div
                className="select-container"
                onClick={() => closeExpandedMode(false)}
            >
                <div className="positioner" style={screenPosition}>
                    <div className="choices before">

                    </div>
                    <a
                        className="balance-text current pending"
                        onClick={() => closeExpandedMode(true)}
                    >
                        {pendingDisplayTransform(pendingChoice)}
                    </a>
                    <div className="choices after">

                    </div>
                </div>
            </div>      
        </div>
    )
}

export default Choice
