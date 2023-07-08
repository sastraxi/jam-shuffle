import { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import './Choice.css'

type Props<T> = {
    current: T
    searchTransform?: ((choice: T) => string)
    displayTransform?: ((choice: T) => React.ReactNode)
    expandedDisplayTransform?: ((choice: T) => React.ReactNode)
    allChoices?: readonly T[]
    setChoice?: (newChoice: T) => void
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

const cumulativeOffset = (element: HTMLElement) => {
    let top = 0, left = 0
    let currentEl: HTMLElement | null = element

    do {
        top += currentEl.offsetTop || 0;
        left += currentEl.offsetLeft || 0;
        currentEl = (currentEl.offsetParent as HTMLElement)
    } while(currentEl)

    return { top, left }
};

function Choice<ChoiceType,>({
    current,
    allChoices,
    setChoice,
    help,
    tapToChange = false,
    searchTransform,
    displayTransform = convertToString,
    expandedDisplayTransform,
    fullWidth = false,
    alignItems = 'start',
}: Props<ChoiceType>) {
    const rootRef = useRef<HTMLDivElement>(null)
    const unexpandedAnchorRef = useRef<HTMLButtonElement>(null)
    const expandedInputRef = useRef<HTMLInputElement>(null)
    const [expanded, setExpanded] = useState<boolean>(false)
    const [screenPosition, setScreenPosition] = useState<Partial<React.CSSProperties>>({})
    const [expandedQuery, setExpandedQuery] = useState<string>('')
    const [expandedSearchResults, setExpandedSearchResults] = useState<Array<ChoiceType> | undefined>()

    const goToExpandedMode = useCallback(() => {
        if (expanded) return
        if (rootRef.current) {
            const { offsetWidth, offsetHeight } = rootRef.current 
            const { top, left } = cumulativeOffset(rootRef.current)
            setExpandedQuery('')
            setScreenPosition({
                left: `${left + (0.5 * offsetWidth)}px`,
                top: `${top + (0.5 * offsetHeight)}px`,
                width: fullWidth ? `${offsetWidth}px` : undefined,
                transform: calculateTransform(alignItems, offsetWidth),
            })
            setTimeout(() => expandedInputRef.current?.focus(), 0)
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
    }, [allChoices])

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

    const onExpandedInputReceived: FormEventHandler<HTMLInputElement> = (e) => {        
        if (!searchTransform) return
        
        const value = e.currentTarget.value.replace(' ', '').toLowerCase()
        let found = false
        for (const choice of allChoices ?? []) {
            const x = searchTransform(choice).toLowerCase()
            if (x.startsWith(value)) {
                setPendingChoice(choice)
                found = true
                break
            }
        }

        setExpandedQuery(found ? value : '')
    }

    // TODO: non-expanded key up / key down

    const closeExpandedMode = useCallback((shouldCommit: boolean) => {
        if (setChoice) {
            if (shouldCommit) {
                setChoice(pendingChoice)
            } else {
                setPendingChoice(current)  // abandon
            }
        }
        setTimeout(() => unexpandedAnchorRef.current?.focus(), 0)
        setExpanded(false)
    }, [setExpanded, setChoice, pendingChoice])
    

    // document-level event listener: ESC closes expanded mode
    useEffect(() => {
        if (expanded) {
            const expandedKeyListener = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    closeExpandedMode(false)
                    e.stopPropagation()
                } else if (e.key === "Enter") {
                    closeExpandedMode(true)
                    e.stopPropagation()
                } else if (e.key === "ArrowUp") {
                    changePendingChoice(-1)
                    e.stopPropagation()
                } else if (e.key === "ArrowDown") {
                    changePendingChoice(1)
                    e.stopPropagation()
                }
            }
            document.addEventListener('keydown', expandedKeyListener, false)
            return () => document.removeEventListener('keydown', expandedKeyListener)   
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
            <button
                ref={unexpandedAnchorRef}
                className="choice-button balance-text current"
                onClick={allChoices ? onTap : undefined}
                onWheel={allChoices ? goToExpandedMode : undefined}
                tabIndex={1}
            >
                {displayTransform(current)}
            </button>
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
                    <input
                        type="text"
                        ref={expandedInputRef}
                        value={expandedQuery}
                        onChange={onExpandedInputReceived}
                    />
                    <div className="choices after">

                    </div>
                </div>
            </div>      
        </div>
    )
}

export default Choice
