import { create } from 'zustand'
import type { AppSettings, ProjectPrefs } from '@/types'
import { ipc } from '@/lib/ipc'

export interface ModelOption {
  modelId: string
  name: string
  description?: string | null
}

export interface ModeOption {
  id: string
  name: string
  description?: string | null
}

export interface SlashCommand {
  name: string
  description?: string
  inputType?: string
}

export interface LiveMcpServer {
  name: string
  status: string
  toolCount: number
}

interface SettingsStore {
  settings: AppSettings
  isLoaded: boolean
  availableModels: ModelOption[]
  currentModelId: string | null
  modelsLoading: boolean
  modelsError: string | null
  availableModes: ModeOption[]
  currentModeId: string | null
  activeWorkspace: string | null
  availableCommands: SlashCommand[]
  liveMcpServers: LiveMcpServer[]
  loadSettings: () => Promise<void>
  saveSettings: (settings: AppSettings) => Promise<void>
  fetchModels: (kiroBin?: string) => Promise<void>
  setActiveWorkspace: (workspace: string | null) => void
  setProjectPref: (workspace: string, patch: Partial<ProjectPrefs>) => void
}

const defaultSettings: AppSettings = {
  kiroBin: 'kiro-cli',
  agentProfiles: [],
  fontSize: 13,
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoaded: false,
  availableModels: [],
  currentModelId: null,
  modelsLoading: false,
  modelsError: null,
  availableModes: [],
  currentModeId: null,
  activeWorkspace: null,
  availableCommands: [],
  liveMcpServers: [],

  loadSettings: async () => {
    try {
      const settings = await ipc.getSettings()
      set({ settings: { ...defaultSettings, ...settings }, isLoaded: true })
    } catch {
      set({ isLoaded: true })
    }
  },

  saveSettings: async (settings) => {
    await ipc.saveSettings(settings)
    set({ settings })
  },

  fetchModels: async (kiroBin?: string) => {
    set({ modelsLoading: true, modelsError: null })
    try {
      const result = await ipc.listModels(kiroBin)
      set({
        availableModels: result.availableModels,
        currentModelId: result.currentModelId,
        modelsLoading: false,
      })
    } catch (err) {
      set({
        modelsLoading: false,
        modelsError: err instanceof Error ? err.message : 'Failed to fetch models',
      })
    }
  },

  setActiveWorkspace: (workspace) => {
    const { settings, currentModelId } = get()
    if (!workspace) { set({ activeWorkspace: null }); return }
    const prefs = settings.projectPrefs?.[workspace]
    const newModelId = prefs?.modelId !== undefined ? prefs.modelId : currentModelId
    // Only update if something actually changed
    const current = get()
    if (current.activeWorkspace === workspace && current.currentModelId === newModelId) return
    set({ activeWorkspace: workspace, currentModelId: newModelId ?? null })
  },

  setProjectPref: (workspace, patch) => {
    const { settings } = get()
    const existing = settings.projectPrefs?.[workspace] ?? {}
    const updated: AppSettings = {
      ...settings,
      projectPrefs: {
        ...settings.projectPrefs,
        [workspace]: { ...existing, ...patch },
      },
    }
    // Single set() to avoid two render cycles
    set({
      settings: updated,
      ...(patch.modelId !== undefined ? { currentModelId: patch.modelId } : {}),
    })
    ipc.saveSettings(updated).catch(() => {})
  },
}))
