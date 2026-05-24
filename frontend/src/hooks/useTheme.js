import { create } from 'zustand'

const stored = typeof window !== 'undefined' ? localStorage.getItem('dark-mode') : null
const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

export const useThemeStore = create((set) => ({
  dark: stored !== null ? stored === 'true' : prefersDark,
  toggle: () =>
    set((state) => {
      const next = !state.dark
      localStorage.setItem('dark-mode', String(next))
      return { dark: next }
    }),
}))
