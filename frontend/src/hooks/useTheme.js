import { create } from 'zustand'

const stored = typeof window !== 'undefined' ? localStorage.getItem('dark-mode') : null

export const useThemeStore = create((set) => ({
  dark: stored !== null ? stored === 'true' : true,
  toggle: () =>
    set((state) => {
      const next = !state.dark
      localStorage.setItem('dark-mode', String(next))
      return { dark: next }
    }),
}))
