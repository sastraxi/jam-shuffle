export type Category = {
    type: PromptType

    /**
     * Automatically created from the prompt type otherwise
     */
    displayName?: string

    /**
     * Some prompts have secondary identifiers. We do this when we want to
     * create multiple entries in the category list, rather than have these
     * parameters considered "choices" inside the prompt. 
     * 
     * For example, the playlist prompt has a subtype with the spotify id
     * of the playlist we should pull songs from.
     */
    subtype?: string
}

/**
 * Each prompt will have its own choices,
 * e.g. { "first idea": "a" | "b" | "c", "second idea": "d" | "e" }
 */
export type PromptChoices = Record<
    string,    
    | string
    | boolean
    | Array<string>
    | Record<string, unknown>
    | Array<Record<string, unknown>>
    | undefined
>

export type PromptState<C extends PromptChoices = Record<string, string | undefined>> = {
    category: Category,
    choices: C,
}

export type PromptType =
    | 'playlist'
    | 'single idea'
    | 'contrast'
    | 'chords'
