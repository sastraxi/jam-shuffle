import { PromptState } from "../prompts/types"

/**
 * A playlist saved to our app state.
 * Check id for equality!
 */
export type SavedPlaylist = {
    id: string
    name: string
}
