import { create } from 'zustand'
import { Category } from '../prompts/types'
import { SavedPlaylist } from './types'
// TODO: create our own storage layer: https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md

export type UserPreferences = {
    playlists: Array<SavedPlaylist>,
}

type UserPreferencesAndMutators = UserPreferences & {
    addPlaylist: (playlist: SavedPlaylist) => void
    removePlaylist: (playlist: SavedPlaylist) => void
}

const playlistEquals = (a: SavedPlaylist, b: SavedPlaylist) => a.id === b.id

const selectCategories = (state: UserPreferences): Array<Category> => {
    const categories: Array<Category> = [
        { type: "single idea", displayName: "Single idea" },
        { type: "contrast", displayName: "Contrast" },
        { type: "chords", displayName: "Chords" },
    ]
    state.playlists.forEach((playlist) => 
        categories.push({
            type: "playlist",
            subtype: playlist.id,
            displayName: playlist.name,
        }))
    return categories
}

export const useUserPreferences = create<UserPreferencesAndMutators>()((set) => ({
    playlists: [],
    addPlaylist: (playlist: SavedPlaylist) => set((state) => {
        if (state.playlists.find(p => playlistEquals(p, playlist))) return {}
        return {
            playlists: [...state.playlists, playlist],
        }
    }),
    removePlaylist: (playlist: SavedPlaylist) => set((state) => {
        const index = state.playlists.findIndex(p => playlistEquals(p, playlist))
        if (index === -1) return {}
        return {
            playlists: [
                ...state.playlists.slice(0, index),
                ...state.playlists.slice(index + 1),
            ]
        }
    }),
}))

export const useCategories = () => useUserPreferences(selectCategories)
