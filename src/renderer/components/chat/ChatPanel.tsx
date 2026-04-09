import { memo, useCallback } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { PermissionBanner } from './PermissionBanner'
import { ExecutionPlan } from './ExecutionPlan'
import { ipc } from '@/lib/ipc'
import type { ToolCall } from '@/types'

const EMPTY_TOOL_CALLS: ToolCall[] = []

export const ChatPanel = memo(function ChatPanel() {
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId)
  const taskStatus = useTaskStore((s) => selectedTaskId ? s.tasks[selectedTaskId]?.status : null)
  const taskPlan = useTaskStore((s) => selectedTaskId ? s.tasks[selectedTaskId]?.plan : null)
  const taskMessages = useTaskStore((s) => selectedTaskId ? s.tasks[selectedTaskId]?.messages : undefined)
  const pendingPermission = useTaskStore((s) => selectedTaskId ? s.tasks[selectedTaskId]?.pendingPermission : null)
  const contextUsage = useTaskStore((s) => selectedTaskId ? s.tasks[selectedTaskId]?.contextUsage : null)
  const taskWorkspace = useTaskStore((s) => selectedTaskId ? s.tasks[selectedTaskId]?.workspace : null)
  const streamingChunk = useTaskStore((s) => selectedTaskId ? s.streamingChunks[selectedTaskId] ?? '' : '')
  const liveToolCalls = useTaskStore((s) => selectedTaskId ? s.liveToolCalls[selectedTaskId] ?? EMPTY_TOOL_CALLS : EMPTY_TOOL_CALLS)
  const liveThinking = useTaskStore((s) => selectedTaskId ? s.thinkingChunks[selectedTaskId] ?? '' : '')

  const handleSendMessage = useCallback(async (msg: string) => {
    const state = useTaskStore.getState()
    const id = state.selectedTaskId
    const task = id ? state.tasks[id] : null
    if (!task) return
    const isDraft = task.messages.length === 0 && task.status === 'paused'

    const userMsg = { role: 'user' as const, content: msg, timestamp: new Date().toISOString() }
    state.upsertTask({ ...task, status: 'running', messages: [...task.messages, userMsg] })
    state.clearTurn(task.id)

    if (isDraft) {
      const { settings } = useSettingsStore.getState()
      const projectPrefs = task.workspace ? settings.projectPrefs?.[task.workspace] : undefined
      const autoApprove = projectPrefs?.autoApprove !== undefined ? projectPrefs.autoApprove : settings.autoApprove
      const created = await ipc.createTask({ name: task.name, workspace: task.workspace, prompt: msg, autoApprove })
      state.upsertTask({ ...created, id: task.id })
      state.upsertTask(created)
      state.setSelectedTask(created.id)
    } else {
      ipc.sendMessage(task.id, msg)
    }
  }, [])

  const handlePermissionSelect = useCallback((optionId: string) => {
    const state = useTaskStore.getState()
    const id = state.selectedTaskId
    const task = id ? state.tasks[id] : null
    if (task?.pendingPermission) {
      ipc.selectPermissionOption(task.id, task.pendingPermission.requestId, optionId)
    }
  }, [])

  if (!taskStatus) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Kirodex</EmptyTitle>
          <EmptyDescription>Select a task or create a new one to get started.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const inputDisabled = taskStatus === 'cancelled'

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {taskPlan && taskPlan.length > 0 && (
          <div className="shrink-0 px-4 pt-2">
            <ExecutionPlan steps={taskPlan} />
          </div>
        )}
        <MessageList
          messages={taskMessages ?? []}
          streamingChunk={streamingChunk}
          liveToolCalls={liveToolCalls}
          liveThinking={liveThinking}
          isRunning={taskStatus === 'running'}
        />

        {pendingPermission && selectedTaskId && (
          <PermissionBanner
            taskId={selectedTaskId}
            toolName={pendingPermission.toolName}
            description={pendingPermission.description}
            options={pendingPermission.options ?? []}
            onSelect={handlePermissionSelect}
          />
        )}

        <ChatInput
          disabled={inputDisabled}
          contextUsage={contextUsage}
          onSendMessage={handleSendMessage}
          workspace={taskWorkspace}
        />
      </div>
    </div>
  )
})
