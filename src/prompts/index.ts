import { AppState } from '../state/types'
import PlaylistPrompt, { PlaylistChoices } from './PlaylistPrompt'
import SingleIdea, { SINGLE_IDEAS, SingleIdeaChoices } from './SingleIdea'
import { PromptChoices, PromptState, PromptType } from './types'

type PromptChoicesByPrompt = {
    /* [K in PromptType]: PromptChoices */
    'single idea': SingleIdeaChoices
    'playlist': PlaylistChoices
}

type GetPromptComponentType = {
    [K in PromptType]: React.FunctionComponent<PromptState<PromptChoicesByPrompt[K]>>
}

export const getPromptComponent: GetPromptComponentType = {
    'single idea': SingleIdea,
    'playlist': PlaylistPrompt
}


type GetPromptChoicesType = {
    [K in PromptType]: (state: AppState, choiceKey: keyof PromptChoicesByPrompt[K]) => string[]
}

export const getPromptChoices: GetPromptChoicesType = {
    'single idea': (state: AppState) => SINGLE_IDEAS,
    'playlist': (state: AppState) => 
}