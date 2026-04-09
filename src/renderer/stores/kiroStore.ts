import { create } from 'zustand'
import type { KiroConfig, KiroMcpServer } from '@/types'
import { ipc } from '@/lib/ipc'

type McpStatus = KiroMcpServer['status']

interface KiroStore {
  config: KiroConfig
  loading: boolean
  loaded: boolean
  loadConfig: (projectPath?: string) => Promise<void>
  setMcpError: (serverName: string, error: string) => void
  updateMcpServer: (serverName: string, patch: Partial<{ status: McpStatus; error: string; oauthUrl: string }>) => void
}

const patchMcp = (config: KiroConfig, serverName: string, patch: object): KiroConfig => {
  const servers = config.mcpServers ?? []
  const idx = servers.findIndex((m) => m.name.toLowerCase() === serverName.toLowerCase())
  if (idx < 0) return config
  const updated = [...servers]
  updated[idx] = { ...updated[idx], ...patch }
  return { ...config, mcpServers: updated }
}

export const useKiroStore = create<KiroStore>((set, get) => {
  return {
    config: { agents: [], skills: [], steeringRules: [], mcpServers: [] },
    loading: false,
    loaded: false,

    loadConfig: async (projectPath?: string) => {
      if (get().loading) return
      set({ loading: true })
      try {
        const config = await ipc.getKiroConfig(projectPath)
        const safe: KiroConfig = {
          agents: (config.agents ?? []).filter((a) => a.filePath),
          skills: (config.skills ?? []).filter((s) => s.filePath),
          steeringRules: (config.steeringRules ?? []).filter((r) => r.filePath),
          mcpServers: config.mcpServers ?? [],
        }
        set({ config: safe, loaded: true })
      } catch {
        set({ loaded: true })
      } finally {
        set({ loading: false })
      }
    },

    setMcpError: (serverName, error) => set((s) => ({
      config: patchMcp(s.config, serverName, { error, status: 'error' as const }),
    })),

    updateMcpServer: (serverName, patch) => set((s) => ({
      config: patchMcp(s.config, serverName, patch),
    })),
  }
})

export function initKiroListeners(): () => void {
  const unsub1 = ipc.onMcpConnecting(() => {
    useKiroStore.setState((s) => ({
      config: {
        ...s.config,
        mcpServers: (s.config.mcpServers ?? []).map((m) =>
          m.enabled ? { ...m, status: 'connecting' as const, error: undefined, oauthUrl: undefined } : m
        ),
      },
    }))
  })

  const unsub2 = ipc.onMcpUpdate(({ serverName, status, error, oauthUrl }) => {
    useKiroStore.setState((s) => ({
      config: patchMcp(s.config, serverName, {
        status: status as McpStatus,
        ...(error !== undefined ? { error } : {}),
        ...(oauthUrl !== undefined ? { oauthUrl } : {}),
      }),
    }))
  })

  return () => { unsub1(); unsub2() }
}
