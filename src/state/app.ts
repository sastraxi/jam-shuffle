import { create } from 'zustand'
import { PromptChoices, Category, PromptState } from '../prompts/types'
import { AuthSession } from '@supabase/supabase-js'

const PROMPT_HISTORY_MAX = 10

/**
 * Can be thought of as the top-level state of the app.
 */
export type AppState = {
    current: PromptState

    /**
     * The last PROMPT_HISTORY_MAX prompt states.
     * promptHistory[0] === current
     */
    promptHistory: Array<PromptState>

    session: AuthSession | null,
}

type AdvanceToOptions = {
    /**
     * Should a new history item be created, or should we replace the existing one?
     */
    replace?: boolean
}

const advanceTo = (
    state: AppState,
    to: PromptState,
    { replace }: AdvanceToOptions = {},
): Partial<AppState> => {
    if (replace && state.promptHistory.length === 0) {
        throw new Error("Cannot replace history when there is no current prompt!")
    }

    const keptHistory = replace ? state.promptHistory.slice(1) : state.promptHistory

    const promptHistory = [to, ...keptHistory]
    if (promptHistory.length > PROMPT_HISTORY_MAX) {
        promptHistory.length = PROMPT_HISTORY_MAX // drop everything past the max
    }
    return {
        promptHistory,
        current: promptHistory[0],
    }
}

type AppStateAndMutators = AppState & {
    setSession: (session: AuthSession | null) => unknown
    goToCategory: (nextCategory: Category) => unknown
    setPromptChoice: (changes: Record<string, string | undefined>, replace?: boolean) => unknown
    goBack: () => unknown
}

const INITIAL_PROMPT: PromptState = {
    category: { type: "chords", displayName: "Chords" },
    choices: {},
}

export const useAppState = create<AppStateAndMutators>()((set) => ({
    current: INITIAL_PROMPT,

    /**
     * The last PROMPT_HISTORY_MAX prompt states.
     * promptHistory[0] === current
     */
    promptHistory: [INITIAL_PROMPT],
    goBack: () => set((state) => {
        if (state.promptHistory.length < 2) return {}
        const [, ...newHistory] = state.promptHistory
        return {
            current: state.promptHistory[1],
            promptHistory: newHistory,
        }
    }),

    goToCategory: (category: Category) =>
        set((state) => advanceTo(state, {
            category,
            choices: {},
        })),

    setPromptChoice: (changes: Record<string, string | undefined>, replace = false) =>
        set((state) => {
            // FIXME: we should be able to define "replace" based on an empty
            // state.current.choices, but re-renders are killing us here
            return advanceTo(state, {
                category: state.current.category,
                choices: { ...state.current.choices, ...changes }
            }, { replace })
        }),

    session: null,
    setSession: (session: AuthSession | null) => set(() => ({ session }))
}))

export const usePromptHistory = () => useAppState(state => state.promptHistory)
export const useHistoryGoBack = () => useAppState(state => state.goBack)

export const usePromptChoices = <T extends PromptChoices>() =>
    useAppState(state => state.current.choices as T)

export const useSetPromptChoice = <T extends PromptChoices>() =>    
    useAppState(state => state.setPromptChoice) as
        (changes: Partial<T>, replace?: boolean) => unknown

export const useCategory = () => useAppState(state => state.current.category)
export const useGoToCategory = () => useAppState(state => state.goToCategory)

export const useSession = () => useAppState(state => state.session)
export const useSetSession = () => useAppState(state => state.setSession)
