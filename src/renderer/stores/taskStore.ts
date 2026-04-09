import { create } from 'zustand'
import type { AgentTask, ActivityEntry, ToolCall, PlanStep } from '@/types'
import { ipc } from '@/lib/ipc'
import { useDebugStore } from './debugStore'
import { useSettingsStore } from './settingsStore'
import { useKiroStore } from './kiroStore'

interface TaskStore {
  tasks: Record<string, AgentTask>
  projects: string[]           // workspace paths
  selectedTaskId: string | null
  pendingWorkspace: string | null  // workspace for a new thread not yet created
  view: 'chat' | 'dashboard' | 'playground'
  isNewProjectOpen: boolean
  isSettingsOpen: boolean
  /** Accumulated text chunks for streaming display */
  streamingChunks: Record<string, string>
  /** Accumulated thinking chunks for live thinking display */
  thinkingChunks: Record<string, string>
  /** Live tool calls for the current turn (by taskId) */
  liveToolCalls: Record<string, ToolCall[]>
  activityFeed: ActivityEntry[]
  connected: boolean
  setSelectedTask: (id: string | null) => void
  setView: (view: 'chat' | 'dashboard' | 'playground') => void
  setNewProjectOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  addProject: (workspace: string) => void
  removeProject: (workspace: string) => void
  upsertTask: (task: AgentTask) => void
  removeTask: (id: string) => void
  appendChunk: (taskId: string, chunk: string) => void
  appendThinkingChunk: (taskId: string, chunk: string) => void
  upsertToolCall: (taskId: string, toolCall: ToolCall) => void
  updatePlan: (taskId: string, plan: PlanStep[]) => void
  updateUsage: (taskId: string, used: number, size: number) => void
  clearTurn: (taskId: string) => void
  createDraftThread: (workspace: string) => string
  setPendingWorkspace: (workspace: string | null) => void
  renameTask: (taskId: string, name: string) => void
  projectNames: Record<string, string>
  renameProject: (workspace: string, name: string) => void
  loadTasks: () => Promise<void>
  setConnected: (v: boolean) => void
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: {},
  projects: [],
  projectNames: {},
  selectedTaskId: null,
  pendingWorkspace: null,
  view: 'chat',
  isNewProjectOpen: false,
  isSettingsOpen: false,
  streamingChunks: {},
  thinkingChunks: {},
  liveToolCalls: {},
  activityFeed: [],
  connected: false,

  setSelectedTask: (id) => set({ selectedTaskId: id }),
  setView: (view) => set({ view }),
  setNewProjectOpen: (open) => set({ isNewProjectOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  addProject: (workspace) => set((s) => ({
    projects: s.projects.includes(workspace) ? s.projects : [...s.projects, workspace],
  })),

  removeProject: (workspace) => set((s) => {
    // Remove project and all its tasks
    const taskIds = Object.keys(s.tasks).filter((id) => s.tasks[id].workspace === workspace)
    const tasks = { ...s.tasks }
    taskIds.forEach((id) => { delete tasks[id] })
    // Also cancel via IPC (fire and forget)
    taskIds.forEach((id) => { void ipc.deleteTask(id) })
    const selectedTaskId = taskIds.includes(s.selectedTaskId ?? '') ? null : s.selectedTaskId
    return {
      projects: s.projects.filter((p) => p !== workspace),
      tasks,
      selectedTaskId,
      view: selectedTaskId === null && s.view === 'chat' ? 'dashboard' : s.view,
    }
  }),

  upsertTask: (task) =>
    set((state) => {
      const prev = state.tasks[task.id]
      const activity: ActivityEntry[] =
        !prev || prev.status !== task.status
          ? [
              {
                taskId: task.id,
                taskName: task.name,
                status: task.status,
                timestamp: new Date().toISOString(),
              },
              ...state.activityFeed,
            ].slice(0, 20)
          : state.activityFeed
      return {
        tasks: { ...state.tasks, [task.id]: task },
        activityFeed: activity,
      }
    }),

  removeTask: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.tasks
      const { [id]: _c, ...chunks } = state.streamingChunks
      const { [id]: _t, ...thinking } = state.thinkingChunks
      const { [id]: _tc, ...tools } = state.liveToolCalls
      return {
        tasks: rest,
        streamingChunks: chunks,
        thinkingChunks: thinking,
        liveToolCalls: tools,
        selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
      }
    }),

  appendChunk: (taskId, chunk) =>
    set((state) => ({
      streamingChunks: {
        ...state.streamingChunks,
        [taskId]: (state.streamingChunks[taskId] ?? '') + chunk,
      },
    })),

  appendThinkingChunk: (taskId, chunk) =>
    set((state) => ({
      thinkingChunks: {
        ...state.thinkingChunks,
        [taskId]: (state.thinkingChunks[taskId] ?? '') + chunk,
      },
    })),

  upsertToolCall: (taskId, toolCall) =>
    set((state) => {
      const existing = state.liveToolCalls[taskId] ?? []
      const idx = existing.findIndex((tc) => tc.toolCallId === toolCall.toolCallId)
      const updated = idx >= 0
        ? existing.map((tc, i) => (i === idx ? toolCall : tc))
        : [...existing, toolCall]
      return {
        liveToolCalls: { ...state.liveToolCalls, [taskId]: updated },
      }
    }),

  updatePlan: (taskId, plan) =>
    set((state) => {
      const task = state.tasks[taskId]
      if (!task) return state
      return {
        tasks: { ...state.tasks, [taskId]: { ...task, plan } },
      }
    }),

  updateUsage: (taskId, used, size) =>
    set((state) => {
      const task = state.tasks[taskId]
      if (!task) return state
      return {
        tasks: { ...state.tasks, [taskId]: { ...task, contextUsage: { used, size } } },
      }
    }),

  /** Clear live turn state when turn ends */
  clearTurn: (taskId) =>
    set((state) => ({
      streamingChunks: { ...state.streamingChunks, [taskId]: '' },
      thinkingChunks: { ...state.thinkingChunks, [taskId]: '' },
      liveToolCalls: { ...state.liveToolCalls, [taskId]: [] },
    })),

  /** Create a local draft thread in a single atomic state update */
  createDraftThread: (workspace) => {
    const id = crypto.randomUUID()
    const name = `Thread ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    const draft: AgentTask = {
      id,
      name,
      workspace,
      status: 'paused',
      createdAt: new Date().toISOString(),
      messages: [],
    }
    set((state) => ({
      tasks: { ...state.tasks, [id]: draft },
      selectedTaskId: id,
      view: 'chat' as const,
      activityFeed: [
        { taskId: id, taskName: name, status: 'paused' as const, timestamp: draft.createdAt },
        ...state.activityFeed,
      ].slice(0, 20),
    }))
    return id
  },

  setPendingWorkspace: (workspace) => set({
    pendingWorkspace: workspace,
    selectedTaskId: null,
    view: 'chat' as const,
  }),

  renameTask: (taskId, name) =>
    set((state) => {
      const task = state.tasks[taskId]
      if (!task) return state
      return { tasks: { ...state.tasks, [taskId]: { ...task, name } } }
    }),

  renameProject: (workspace, name) =>
    set((state) => ({
      projectNames: { ...state.projectNames, [workspace]: name },
    })),

  loadTasks: async () => {
    try {
      const list = await ipc.listTasks()
      const tasks = Object.fromEntries(list.map((t) => [t.id, t]))
      const projects = [...new Set(list.map((t) => t.workspace))]
      set({ tasks, projects, connected: true })
    } catch {
      set({ connected: false })
    }
  },

  setConnected: (v) => set({ connected: v }),
}))

export function initTaskListeners(): () => void {
  useTaskStore.getState().setConnected(true)

  const unsub1 = ipc.onTaskUpdate((task) => {
    useTaskStore.getState().upsertTask(task)
  })

  // Batch streaming chunks with rAF to reduce state updates
  let chunkBuf: Record<string, string> = {}
  let chunkRaf: number | null = null
  const flushChunks = () => {
    const buf = chunkBuf; chunkBuf = {}; chunkRaf = null
    useTaskStore.setState((s) => {
      const next = { ...s.streamingChunks }
      for (const [id, text] of Object.entries(buf)) next[id] = (next[id] ?? '') + text
      return { streamingChunks: next }
    })
  }
  const unsub2 = ipc.onMessageChunk(({ taskId, chunk }) => {
    chunkBuf[taskId] = (chunkBuf[taskId] ?? '') + chunk
    if (!chunkRaf) chunkRaf = requestAnimationFrame(flushChunks)
  })

  let thinkBuf: Record<string, string> = {}
  let thinkRaf: number | null = null
  const flushThinking = () => {
    const buf = thinkBuf; thinkBuf = {}; thinkRaf = null
    useTaskStore.setState((s) => {
      const next = { ...s.thinkingChunks }
      for (const [id, text] of Object.entries(buf)) next[id] = (next[id] ?? '') + text
      return { thinkingChunks: next }
    })
  }
  const unsub3 = ipc.onThinkingChunk(({ taskId, chunk }) => {
    thinkBuf[taskId] = (thinkBuf[taskId] ?? '') + chunk
    if (!thinkRaf) thinkRaf = requestAnimationFrame(flushThinking)
  })

  const unsub4 = ipc.onToolCall(({ taskId, toolCall }) => {
    useTaskStore.getState().upsertToolCall(taskId, toolCall)
  })

  const unsub5 = ipc.onToolCallUpdate(({ taskId, toolCall }) => {
    useTaskStore.getState().upsertToolCall(taskId, toolCall)
  })

  const unsub6 = ipc.onPlanUpdate(({ taskId, plan }) => {
    useTaskStore.getState().updatePlan(taskId, plan)
  })

  const unsub7 = ipc.onUsageUpdate(({ taskId, used, size }) => {
    useTaskStore.getState().updateUsage(taskId, used, size)
  })

  const unsub8 = ipc.onTurnEnd(({ taskId }) => {
    useTaskStore.getState().clearTurn(taskId)
  })

  const unsub9 = ipc.onDebugLog((entry) => {
    useDebugStore.getState().addEntry(entry)
    if (entry.category === 'stderr') {
      const text = typeof entry.payload === 'string' ? entry.payload : JSON.stringify(entry.payload)
      if (text.includes('Dynamic registration failed') || text.includes('invalid_redirect_uri')) {
        // Use the server name tracked from the preceding server_initialized notification
        const knownServers = ['slack', 'figma', 'github', 'notion', 'linear', 'jira', 'atlassian']
        const serverName = entry.mcpServerName
          ?? knownServers.find((s) => text.toLowerCase().includes(s))
          ?? 'unknown'
        useKiroStore.getState().setMcpError(serverName, 'OAuth setup needed — add http://127.0.0.1 as a redirect URI in your OAuth app, or disable in ~/.kiro/settings/mcp.json')
      }
    }
  })

  const unsub10 = ipc.onSessionInit(({ models, modes }) => {
    // Update settings store with models from the live ACP session
    if (models && typeof models === 'object') {
      const m = models as { availableModels?: Array<{ modelId: string; name: string; description?: string | null }>; currentModelId?: string }
      if (m.availableModels) {
        useSettingsStore.setState({
          availableModels: m.availableModels,
          currentModelId: m.currentModelId ?? null,
        })
      }
    }
    // Update settings store with modes from the live ACP session
    if (modes && typeof modes === 'object') {
      const md = modes as { availableModes?: Array<{ id: string; name: string; description?: string | null }>; currentModeId?: string }
      if (md.availableModes) {
        useSettingsStore.setState({
          availableModes: md.availableModes,
          currentModeId: md.currentModeId ?? null,
        })
      }
    }
  })

  const unsub11 = ipc.onCommandsUpdate(({ commands }) => {
    useSettingsStore.setState({ availableCommands: commands })
  })

  const unsub12 = ipc.onTaskError(({ taskId, message }) => {
    const state = useTaskStore.getState()
    const task = state.tasks[taskId]
    if (!task) return
    const errorMsg: import('@/types').TaskMessage = {
      role: 'system' as const,
      content: `\u26a0\ufe0f ${message}`,
      timestamp: new Date().toISOString(),
    }
    state.upsertTask({ ...task, messages: [...task.messages, errorMsg], status: 'error' })
    state.clearTurn(taskId)
  })

  return () => {
    unsub1(); unsub2(); unsub3(); unsub4(); unsub5()
    unsub6(); unsub7(); unsub8(); unsub9(); unsub10(); unsub11(); unsub12()
  }
}
