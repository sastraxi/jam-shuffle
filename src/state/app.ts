import { create } from 'zustand'
import { AppState } from './types'
import { PromptChoices, PromptIdentifier, PromptState } from '../prompts/types'

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

    goToPrompt: (nextPrompt: PromptIdentifier) => {
        
    }

}


export const useAppState = create<AppStateAndMutators>()((set) => ({

}))

const usePromptChoices = <T extends PromptChoices>() => {
    return useAppState((state) => state.current.choices as T)
}
