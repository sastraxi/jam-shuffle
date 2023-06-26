import { useCallback, useEffect, useRef, useState } from 'react'
import './Choice.css'

type Props<T> = {
    current: T,
    displayTransform?: ((choice: T) => React.ReactNode),
    allChoices?: T[],
    setChoice?: (newChoice: T) => void,
    fullWidth?: boolean
    alignItems?: 'start' | 'center' | 'end'
}

const calculateTransform = (alignItems: 'start' | 'center' | 'end', offsetWidth: number) => {
    if (alignItems === 'center') return 'translate(-50%, -50%)'
    const sign = alignItems === 'end' ? 1 : -1
    return `translate(${0.5 * sign * offsetWidth}px, -50%)`
}

const convertToString = <T,>(x: T) => `${x}`

function Choice<ChoiceType,>({
    current,
    displayTransform = convertToString,
    allChoices,
    setChoice,
    fullWidth = false,
    alignItems = 'start'
}: Props<ChoiceType>) {
    
    const rootRef = useRef<HTMLDivElement>(null)
    const unexpandedAnchorRef = useRef<HTMLAnchorElement>(null)
    const [expanded, setExpanded] = useState<boolean>(false)
    const [screenPosition, setScreenPosition] = useState<Partial<React.CSSProperties>>({})

    const goToExpandedMode = () => {
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
    }

    const [pendingChoice, setPendingChoice] = useState<ChoiceType>(current)
    const changePendingChoice = (delta: number) => {
        if (delta === 0) return
        if (!allChoices) return

        let nextPendingChoiceIndex = (allChoices.indexOf(pendingChoice) + Math.round(delta)) % allChoices.length
        if (nextPendingChoiceIndex < 0) nextPendingChoiceIndex += allChoices.length
        setPendingChoice(allChoices[nextPendingChoiceIndex])
    }

    const closeExpandedMode = useCallback((shouldSetChoice: boolean) => {
        if (shouldSetChoice && setChoice) {
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

    return (
        <div
            className={rootClassNames}
            ref={rootRef} 
            onWheel={allChoices ? e => changePendingChoice(Math.sign(e.deltaY)) : undefined}
        >
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
                        {displayTransform(pendingChoice)}
                    </a>
                    <div className="choices after">

                    </div>
                </div>
            </div>
            <a
                ref={unexpandedAnchorRef}
                className="balance-text current"
                onClick={allChoices ? goToExpandedMode : undefined}
                onWheel={allChoices ? goToExpandedMode : undefined}
            >
                {displayTransform(current)}
            </a>            
        </div>
    )
}

export default Choice
