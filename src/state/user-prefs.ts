import { create } from 'zustand'
// TODO: create our own storage layer: https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md

export type UserPreferences = {
    playlistIds: Set<string>,
    addPlaylistId: (playlistId: string) => void
    removePlaylistId: (playlistId: string) => void
}

export const useUserPreferences = create<UserPreferences>()((set) => ({

    playlistIds: new Set(),
    addPlaylistId: (playlistId: string) => set((state) => ({
        playlistIds: new Set(state.playlistIds).add(playlistId)
    })),
    removePlaylistId: (playlistId: string) => set((state) => {
        const playlistIds = new Set(state.playlistIds)
        playlistIds.delete(playlistId)
        return { playlistIds }
    }),

}))
