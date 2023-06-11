import { create } from 'zustand'
import { AppState } from './types'
import { PromptChoices, Category, PromptState } from '../prompts/types'

const PROMPT_HISTORY_MAX = 10


const advanceTo = (state: AppState, to: PromptState): Partial<AppState> => {
    const promptHistory = [to, ...state.promptHistory]
    if (promptHistory.length > PROMPT_HISTORY_MAX) {
        promptHistory.length = PROMPT_HISTORY_MAX // drop everything past the max
    }
    return {
        promptHistory,
        current: promptHistory[0],
    }
}

type AppStateAndMutators = AppState & {

    goToCategory: (nextCategory: Category) => unknown

}

const INITIAL_PROMPT: PromptState = { category: { type: "single idea"} }

export const useAppState = create<AppStateAndMutators>()((set) => ({
    current: INITIAL_PROMPT,

    /**
     * The last PROMPT_HISTORY_MAX prompt states.
     * promptHistory[0] === current
     */
    promptHistory: [INITIAL_PROMPT],

    goToCategory: (category: Category) =>
        set((state) => advanceTo(state, { category })),
}))

export const usePromptChoices = <T extends PromptChoices>() => {
    return useAppState(state => state.current.choices as T)
}

export const useCategory = () => useAppState(state => state.current.category)

export const useGoToCategory = () => useAppState(state => state.goToCategory)
