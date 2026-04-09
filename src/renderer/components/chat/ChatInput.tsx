import { memo, useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react'
import { ChevronDown, ShieldCheck, ShieldOff } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useSettingsStore, type ModelOption } from '@/stores/settingsStore'
import { useDebugStore } from '@/stores/debugStore'
import { useTaskStore } from '@/stores/taskStore'
import { ipc } from '@/lib/ipc'
import { SlashCommandPicker } from './SlashCommandPicker'
import { BranchSelector } from './BranchSelector'

// ── Inline SVG icons for modes ──────────────────────────────────────
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

// ── Context ring ────────────────────────────────────────────────────
const ContextRing = memo(function ContextRing({ used, size }: { used: number; size: number }) {
  const isPercentage = size === 100 && used <= 100
  const pct = isPercentage ? Math.round(used) : size > 0 ? Math.round((used / size) * 100) : 0
  const r = 9.75
  const circ = 2 * Math.PI * r
  const offset = circ - (circ * Math.min(pct, 100)) / 100

  const strokeColor =
    pct < 50 ? 'var(--color-muted-foreground)' :
    pct < 80 ? 'var(--color-amber-500, #f59e0b)' :
    'var(--color-red-500, #ef4444)'

  const textColor =
    pct < 50 ? 'text-muted-foreground' :
    pct < 80 ? 'text-amber-500' :
    'text-red-500'

  const tooltipText = isPercentage
    ? `Context window ${pct}% used`
    : `Context: ${pct}% (${Math.round(used / 1000)}k / ${Math.round(size / 1000)}k tokens)`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative flex h-7 w-7 cursor-default items-center justify-center">
          <svg viewBox="0 0 24 24" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="12" cy="12" r={r} fill="none" stroke="color-mix(in oklab, var(--color-muted) 70%, transparent)" strokeWidth="2.5" />
            <circle
              cx="12" cy="12" r={r} fill="none"
              stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-500 ease-out"
            />
          </svg>
          <span className={cn('relative text-[8px] font-semibold tabular-nums', textColor)}>
            {pct}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[11px]">{tooltipText}</TooltipContent>
    </Tooltip>
  )
})

// ── Model picker ────────────────────────────────────────────────────
const ModelPicker = memo(function ModelPicker() {
  const models = useSettingsStore((s) => s.availableModels)
  const currentId = useSettingsStore((s) => s.currentModelId)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = models.find((m) => m.modelId === currentId)
  const label = current?.name ?? currentId ?? 'Model'

  if (models.length === 0) return (
    <div className="flex items-center gap-1.5 px-1.5 py-1">
      <div className="h-2.5 w-16 animate-pulse rounded bg-muted-foreground/15" />
    </div>
  )

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-medium text-muted-foreground/70 transition-colors hover:text-foreground"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <span className="max-w-[8rem] truncate">{label}</span>
        <ChevronDown className="size-3 shrink-0 opacity-50" aria-hidden />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-[200] mb-2 min-w-[200px] rounded-xl border border-border bg-popover py-1.5 shadow-xl">
          {models.map((m) => (
            <button
              key={m.modelId}
              type="button"
              onMouseDown={(e) => {
                e.stopPropagation()
                const { activeWorkspace, setProjectPref } = useSettingsStore.getState()
                if (activeWorkspace) {
                  setProjectPref(activeWorkspace, { modelId: m.modelId })
                } else {
                  useSettingsStore.setState({ currentModelId: m.modelId })
                }
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-accent',
                m.modelId === currentId ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}
            >
              {m.modelId === currentId && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
              {m.modelId !== currentId && <span className="size-1.5 shrink-0" />}
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

// ── Separator ───────────────────────────────────────────────────────
const Sep = () => <span className="mx-1.5 h-3.5 w-px shrink-0 bg-border/60" aria-hidden />

// ── Auto-approve toggle ─────────────────────────────────────────────
const selectAutoApprove = (s: ReturnType<typeof useSettingsStore.getState>) => {
  const ws = s.activeWorkspace
  const projectPref = ws ? s.settings.projectPrefs?.[ws]?.autoApprove : undefined
  return projectPref !== undefined ? projectPref : (s.settings.autoApprove ?? false)
}

const AutoApproveToggle = memo(function AutoApproveToggle() {
  const active = useSettingsStore(selectAutoApprove)

  const toggle = useCallback(() => {
    const { settings, activeWorkspace, setProjectPref, saveSettings } = useSettingsStore.getState()
    const current = activeWorkspace
      ? (settings.projectPrefs?.[activeWorkspace]?.autoApprove ?? settings.autoApprove ?? false)
      : (settings.autoApprove ?? false)
    if (activeWorkspace) {
      setProjectPref(activeWorkspace, { autoApprove: !current })
    } else {
      saveSettings({ ...settings, autoApprove: !current })
    }
  }, [])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggle}
          className={cn(
            'flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-medium transition-colors',
            active
              ? 'text-foreground/70 hover:text-foreground'
              : 'text-muted-foreground/50 hover:text-muted-foreground/70',
          )}
        >
          {active ? <ShieldCheck className="size-3.5" /> : <ShieldOff className="size-3.5" />}
          <span>{active ? 'Full access' : 'Ask'}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{active ? 'Auto-approve all tools \u2014 click to require confirmation' : 'Ask before running tools \u2014 click to auto-approve'}</TooltipContent>
    </Tooltip>
  )
})

// ── Log button ──────────────────────────────────────────────────────
const LogButton = memo(function LogButton() {
  const toggleDebug = useDebugStore((s) => s.toggleOpen)
  const isOpen = useDebugStore((s) => s.isOpen)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleDebug}
          className={cn(
            'flex items-center rounded-lg px-1.5 py-1 transition-colors',
            isOpen
              ? 'text-foreground/70 hover:bg-accent'
              : 'text-muted-foreground/40 hover:bg-accent hover:text-muted-foreground',
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 9l3 3l-3 3" />
            <line x1="13" y1="15" x2="16" y2="15" />
            <rect x="3" y="4" width="18" height="16" rx="2" />
          </svg>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">Debug log</TooltipContent>
    </Tooltip>
  )
})

// ── Mode toggle (Chat / Plan) ───────────────────────────────────────
const ModeToggle = memo(function ModeToggle() {
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
    <div className="flex items-center gap-px">
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

// ── ChatInput ───────────────────────────────────────────────────────
interface ChatInputProps {
  disabled?: boolean
  contextUsage?: { used: number; size: number } | null
  onSendMessage: (message: string) => void
  workspace?: string | null
}

export const ChatInput = memo(function ChatInput({ disabled, contextUsage, onSendMessage, workspace }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [slashIndex, setSlashIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const commands = useSettingsStore((s) => s.availableCommands)

  const isSlash = value.startsWith('/')
  const slashQuery = isSlash ? value.slice(1) : ''
  const filteredCmds = isSlash
    ? (slashQuery ? commands.filter((c) => c.name.toLowerCase().startsWith(slashQuery.toLowerCase())) : commands)
    : []
  const showPicker = isSlash && filteredCmds.length > 0

  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    setValue('')
    setSlashIndex(0)
    onSendMessage(trimmed)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    textareaRef.current?.focus()
  }, [value, disabled, onSendMessage])

  const handleSelectCommand = useCallback((cmd: { name: string }) => {
    setValue(`/${cmd.name} `)
    setSlashIndex(0)
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (showPicker) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex((i) => i + 1); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIndex((i) => Math.max(0, i - 1)); return }
      if (e.key === 'Tab' || (e.key === 'Enter' && filteredCmds.length > 0)) {
        e.preventDefault()
        const cmd = filteredCmds[slashIndex % filteredCmds.length]
        if (cmd) handleSelectCommand(cmd)
        return
      }
      if (e.key === 'Escape') { e.preventDefault(); setValue(''); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [showPicker, filteredCmds, slashIndex, handleSend, handleSelectCommand])

  const canSend = !disabled && value.trim().length > 0

  return (
    <div className="px-3 pt-1.5 pb-3 sm:px-5 sm:pt-2 sm:pb-4">
      <div className="mx-auto w-full min-w-0 max-w-3xl">
        <div className={cn(
          'rounded-[20px] border bg-card transition-colors duration-200',
          'focus-within:border-ring/45 border-border',
        )}>
          {/* Text area */}
          <div className="relative px-3 pb-2 pt-3.5 sm:px-4 sm:pt-4" style={{ isolation: 'isolate' }}>
            {showPicker && (
              <SlashCommandPicker
                query={slashQuery}
                commands={commands}
                onSelect={handleSelectCommand}
                onDismiss={() => setValue('')}
                activeIndex={slashIndex}
              />
            )}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => { setValue(e.target.value); resize() }}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, or press / for commands"
              disabled={disabled}
              rows={1}
              className="block max-h-[200px] min-h-[70px] w-full resize-none bg-transparent text-[14px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/35"
              style={{ overflow: 'auto' }}
            />
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between gap-1.5 px-3 pb-3 sm:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-0 overflow-visible">
              <ModelPicker />
              <Sep />
              <ModeToggle />
              <Sep />
              <AutoApproveToggle />
              <LogButton />
              {disabled && (
                <span className="ml-2 text-[11px] text-muted-foreground/40">Task ended</span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {contextUsage && contextUsage.size > 0 && (
                <ContextRing used={contextUsage.used} size={contextUsage.size} />
              )}
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send message"
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150',
                  'bg-primary/90 text-primary-foreground hover:bg-primary hover:scale-105',
                  'disabled:pointer-events-none disabled:opacity-30 disabled:hover:scale-100',
                )}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M7 11.5V2.5M7 2.5L3 6.5M7 2.5L11 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <BranchSelector workspace={workspace ?? null} />
      </div>
    </div>
  )
})
