import { create } from 'zustand'
import type { DebugLogEntry, DebugCategory } from '@/types'

const MAX_ENTRIES = 2000

interface DebugStore {
  entries: DebugLogEntry[]
  isOpen: boolean
  filter: {
    search: string
    category: DebugCategory | 'all'
    errorsOnly: boolean
  }
  addEntry: (entry: DebugLogEntry) => void
  clear: () => void
  toggleOpen: () => void
  setOpen: (open: boolean) => void
  setFilter: (filter: Partial<DebugStore['filter']>) => void
}

export const useDebugStore = create<DebugStore>((set) => ({
  entries: [],
  isOpen: false,
  filter: {
    search: '',
    category: 'all',
    errorsOnly: false,
  },

  addEntry: (entry) =>
    set((state) => ({
      entries: state.entries.length >= MAX_ENTRIES
        ? [...state.entries.slice(-MAX_ENTRIES + 1), entry]
        : [...state.entries, entry],
    })),

  clear: () => set({ entries: [] }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
  setFilter: (partial) =>
    set((s) => ({ filter: { ...s.filter, ...partial } })),
}))
