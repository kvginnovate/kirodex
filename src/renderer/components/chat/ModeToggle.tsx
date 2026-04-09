import { memo, useCallback } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTaskStore } from '@/stores/taskStore'
import { ipc } from '@/lib/ipc'
import { cn } from '@/lib/utils'

const ChatBubbleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
  </svg>
)
const PlanIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 7h8" /><path d="M8 12h8" /><path d="M8 17h4" />
  </svg>
)

export const ModeToggle = memo(function ModeToggle() {
  const modes = useSettingsStore((s) => s.availableModes)
  const currentModeId = useSettingsStore((s) => s.currentModeId)

  const coreModes = modes.filter((m) => m.id === 'kiro_default' || m.id === 'kiro_planner')

  const handleSetMode = useCallback((modeId: string) => {
    useSettingsStore.setState({ currentModeId: modeId })
    const taskId = useTaskStore.getState().selectedTaskId
    if (taskId) ipc.setMode(taskId, modeId)
  }, [])

  if (coreModes.length < 2) return (
    <div className="flex items-center gap-px">
      <div className="h-2.5 w-8 animate-pulse rounded bg-muted-foreground/15 mx-2" />
      <div className="h-2.5 w-8 animate-pulse rounded bg-muted-foreground/15 mx-2" />
    </div>
  )

  return (
    <div data-testid="mode-toggle" className="flex items-center gap-px">
      {coreModes.map((mode) => {
        const isActive = mode.id === currentModeId
        const label = mode.id === 'kiro_default' ? 'Chat' : 'Plan'
        const Icon = mode.id === 'kiro_default' ? ChatBubbleIcon : PlanIcon
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => handleSetMode(mode.id)}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground/40 hover:text-muted-foreground/70',
            )}
          >
            <Icon />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
})
