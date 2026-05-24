import { create } from 'zustand'

const MIN = 12
const MAX = 32
const STEP = 2
const DEFAULT = 20

const stored = typeof window !== 'undefined' ? localStorage.getItem('editor-font-size') : null

export const useFontSizeStore = create((set) => ({
  size: stored ? Number(stored) : DEFAULT,
  increase: () =>
    set((state) => {
      const next = Math.min(state.size + STEP, MAX)
      localStorage.setItem('editor-font-size', String(next))
      return { size: next }
    }),
  decrease: () =>
    set((state) => {
      const next = Math.max(state.size - STEP, MIN)
      localStorage.setItem('editor-font-size', String(next))
      return { size: next }
    }),
  MIN,
  MAX,
}))
