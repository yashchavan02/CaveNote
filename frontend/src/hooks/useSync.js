import { create } from 'zustand'

export const useSyncStore = create((set) => ({
  syncing: false,
  setSyncing: (syncing) => set({ syncing }),
}))