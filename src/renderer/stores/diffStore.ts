import { create } from 'zustand'
import { ipc } from '@/lib/ipc'

interface DiffStats {
  additions: number
  deletions: number
  fileCount: number
}

interface DiffStore {
  isOpen: boolean
  diff: string
  stats: DiffStats
  loading: boolean
  toggleOpen: () => void
  setOpen: (open: boolean) => void
  fetchDiff: (taskId: string) => Promise<void>
  clear: () => void
}

function computeStats(diff: string): DiffStats {
  let additions = 0
  let deletions = 0
  let fileCount = 0
  for (const line of diff.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) additions++
    else if (line.startsWith('-') && !line.startsWith('---')) deletions++
    else if (line.startsWith('diff --git')) fileCount++
  }
  return { additions, deletions, fileCount }
}

export const useDiffStore = create<DiffStore>((set) => ({
  isOpen: false,
  diff: '',
  stats: { additions: 0, deletions: 0, fileCount: 0 },
  loading: false,

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (open) => set({ isOpen: open }),

  fetchDiff: async (taskId: string) => {
    set({ loading: true })
    try {
      const diff = await ipc.getTaskDiff(taskId)
      set({ diff, stats: computeStats(diff), loading: false })
    } catch {
      set({ diff: '', stats: { additions: 0, deletions: 0, fileCount: 0 }, loading: false })
    }
  },

  clear: () => set({ diff: '', stats: { additions: 0, deletions: 0, fileCount: 0 } }),
}))
