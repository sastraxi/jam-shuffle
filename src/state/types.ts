import { PromptState } from "../prompts/types"

/**
 * A playlist saved to our app state.
 * Check id for equality!
 */
export type SavedPlaylist = {
    id: string
    name: string
}

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

}
