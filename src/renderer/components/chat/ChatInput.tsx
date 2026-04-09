import { memo, useMemo, useState, useRef, useCallback, useEffect, type KeyboardEvent, type ChangeEvent } from 'react'
import { Paperclip } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settingsStore'
import { SlashCommandPicker } from './SlashCommandPicker'
import { SlashActionPanel } from './SlashPanels'
import { BranchSelector } from './BranchSelector'
import { FileMentionPicker, FileMentionPill } from './FileMentionPicker'
import { AttachmentPreview } from './AttachmentPreview'
import { DragOverlay } from './DragOverlay'
import { useSlashAction } from '@/hooks/useSlashAction'
import type { ProjectFile, Attachment } from '@/types'

import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

import { ContextRing } from './ContextRing'
import { ModelPicker } from './ModelPicker'
import { ModeToggle } from './ModeToggle'
import { AutoApproveToggle } from './AutoApproveToggle'
import { processDroppedFile, processNativePath, buildAttachmentMessage } from './attachment-utils'

// ── Separator ───────────────────────────────────────────────────────
const Sep = () => <span className="mx-1.5 h-3.5 w-px shrink-0 bg-border/60" aria-hidden />

// ── ChatInput ───────────────────────────────────────────────────────
interface ChatInputProps {
  disabled?: boolean
  contextUsage?: { used: number; size: number } | null
  messageCount?: number
  isRunning?: boolean
  onSendMessage: (message: string) => void
  onPause?: () => void
  workspace?: string | null
}

export const ChatInput = memo(function ChatInput({ disabled, contextUsage, messageCount = 0, isRunning, onSendMessage, onPause, workspace }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [slashIndex, setSlashIndex] = useState(0)
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionTrigger, setMentionTrigger] = useState<{ start: number; query: string } | null>(null)
  const [mentionedFiles, setMentionedFiles] = useState<ProjectFile[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const backendCommands = useSettingsStore((s) => s.availableCommands)
  const { panel, dismissPanel, execute } = useSlashAction()

  // Merge backend commands with client-handled commands (always available, even before ACP connects)
  const commands = useMemo(() => {
    const clientCommands: Array<{ name: string; description?: string }> = [
      { name: 'settings', description: 'Open application settings' },
      { name: 'clear', description: 'Clear the current conversation' },
      { name: 'model', description: 'Switch the active AI model' },
      { name: 'agent', description: 'Switch between agents or list available ones' },
      { name: 'plan', description: 'Start the planning agent to design before building' },
      { name: 'chat', description: 'Switch to chat mode' },
    ]
    const names = new Set(backendCommands.map((c) => c.name.replace(/^\/+/, '')))
    return [
      ...backendCommands,
      ...clientCommands.filter((c) => !names.has(c.name)),
    ]
  }, [backendCommands])

  const isSlash = value.startsWith('/')
  const slashQuery = isSlash ? value.slice(1) : ''
  const filteredCmds = isSlash
    ? (slashQuery ? commands.filter((c) => c.name.replace(/^\/+/, '').toLowerCase().startsWith(slashQuery.toLowerCase())) : commands)
    : []
  const showPicker = isSlash && filteredCmds.length > 0 && !panel
  const showFilePicker = mentionTrigger !== null && !showPicker && !panel

  // Detect @ trigger from cursor position
  const detectMentionTrigger = useCallback((text: string, cursorPos: number) => {
    let i = cursorPos - 1
    while (i >= 0 && text[i] !== '@' && text[i] !== '\n') {
      i--
    }
    if (i >= 0 && text[i] === '@') {
      if (i === 0 || /\s/.test(text[i - 1])) {
        const query = text.slice(i + 1, cursorPos)
        if (!query.includes(' ')) {
          setMentionTrigger({ start: i, query })
          setMentionIndex(0)
          return
        }
      }
    }
    setMentionTrigger(null)
  }, [])

  // ── Attachment handlers ─────────────────────────────────────────
  const addAttachments = useCallback(async (files: File[]) => {
    const results = await Promise.all(files.map(processDroppedFile))
    const valid = results.filter((a): a is Attachment => a !== null)
    if (valid.length > 0) setAttachments((prev) => [...prev, ...valid])
  }, [])

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  // Tauri intercepts drag-drop at the native level; browser onDrop never fires.
  // Use onDragDropEvent to get file paths directly from the OS.
  useEffect(() => {
    let cancelled = false
    const appWindow = getCurrentWebviewWindow()
    const unlistenPromise = appWindow.onDragDropEvent(async (event) => {
      if (cancelled) return
      if (event.payload.type === 'over') {
        setIsDragOver(true)
      } else if (event.payload.type === 'drop') {
        setIsDragOver(false)
        const paths = event.payload.paths ?? []
        const results = await Promise.all(paths.map((p) => processNativePath(p)))
        const valid = results.filter((a): a is Attachment => a !== null)
        if (valid.length > 0 && !cancelled) setAttachments((prev) => [...prev, ...valid])
      } else {
        // cancelled
        setIsDragOver(false)
      }
    })
    return () => {
      cancelled = true
      unlistenPromise.then((fn) => fn())
    }
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItems = items.filter((item) => item.type.startsWith('image/'))
    if (imageItems.length === 0) return
    e.preventDefault()
    const files = imageItems.map((item) => item.getAsFile()).filter((f): f is File => f !== null)
    if (files.length > 0) addAttachments(files)
  }, [addAttachments])

  const handleFilePickerClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) addAttachments(files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [addAttachments])

  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    resize()
    detectMentionTrigger(newValue, e.target.selectionStart ?? newValue.length)
  }, [resize, detectMentionTrigger])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    const hasAttachments = attachments.length > 0
    if ((!trimmed && !hasAttachments) || disabled) return
    dismissPanel()
    let message = trimmed
    if (mentionedFiles.length > 0) {
      const missingRefs = mentionedFiles.filter((f) => !message.includes(`@${f.path}`))
      if (missingRefs.length > 0) {
        message = missingRefs.map((f) => `@${f.path}`).join(' ') + ' ' + message
      }
    }
    if (hasAttachments) {
      const attachmentBlock = buildAttachmentMessage(attachments)
      message = message ? `${message}\n\n${attachmentBlock}` : attachmentBlock
    }
    setValue('')
    setSlashIndex(0)
    setMentionTrigger(null)
    setMentionedFiles([])
    setAttachments([])
    onSendMessage(message)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    textareaRef.current?.focus()
  }, [value, disabled, onSendMessage, dismissPanel, mentionedFiles, attachments])

  const handleSelectCommand = useCallback((cmd: { name: string }) => {
    if (execute(cmd.name)) {
      setValue('')
      setSlashIndex(0)
      textareaRef.current?.focus()
      return
    }
    setValue(`/${cmd.name} `)
    setSlashIndex(0)
    textareaRef.current?.focus()
  }, [execute])

  const handleSelectFile = useCallback((file: ProjectFile) => {
    if (!mentionTrigger) return
    const before = value.slice(0, mentionTrigger.start)
    const after = value.slice(mentionTrigger.start + 1 + mentionTrigger.query.length)
    const newValue = `${before}@${file.path} ${after}`
    setValue(newValue)
    setMentionTrigger(null)
    setMentionIndex(0)
    setMentionedFiles((prev) =>
      prev.some((f) => f.path === file.path) ? prev : [...prev, file]
    )
    textareaRef.current?.focus()
    const cursorPos = before.length + 1 + file.path.length + 1
    requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(cursorPos, cursorPos)
    })
  }, [mentionTrigger, value])

  const handleRemoveMention = useCallback((path: string) => {
    setMentionedFiles((prev) => prev.filter((f) => f.path !== path))
    setValue((v) => v.replace(new RegExp(`@${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s?`, 'g'), ''))
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (panel && e.key === 'Escape') { e.preventDefault(); dismissPanel(); return }
    if (showFilePicker) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex((i) => i + 1); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex((i) => Math.max(0, i - 1)); return }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        const event = new CustomEvent('file-mention-select', { detail: { index: mentionIndex } })
        document.dispatchEvent(event)
        return
      }
      if (e.key === 'Escape') { e.preventDefault(); setMentionTrigger(null); return }
    }
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
  }, [panel, dismissPanel, showFilePicker, mentionIndex, showPicker, filteredCmds, slashIndex, handleSend, handleSelectCommand])

  const handleSelect = useCallback(() => {
    if (showPicker || showFilePicker) return
    const el = textareaRef.current
    if (!el) return
    detectMentionTrigger(el.value, el.selectionStart ?? el.value.length)
  }, [showPicker, showFilePicker, detectMentionTrigger])

  const canSend = !disabled && (value.trim().length > 0 || attachments.length > 0)

  return (
    <div data-testid="chat-input" className="px-4 pt-1.5 pb-3 sm:px-6 sm:pt-2 sm:pb-4">
      <div className="mx-auto w-full min-w-0 max-w-2xl lg:max-w-3xl xl:max-w-4xl">
        <div className={cn(
          'relative rounded-[20px] border bg-card transition-colors duration-200',
          'focus-within:border-ring/45 border-border',
          isDragOver && 'border-primary/50',
        )}>
          {isDragOver && <DragOverlay />}

          {/* Context usage — top right */}
          {(contextUsage && contextUsage.size > 0) ? (
            <div className="absolute right-3 top-2.5 z-10">
              <ContextRing used={contextUsage.used} size={contextUsage.size} />
            </div>
          ) : messageCount > 0 ? (
            <div className="absolute right-3 top-2.5 z-10">
              <ContextRing used={Math.min(messageCount * 3, 95)} size={100} />
            </div>
          ) : null}

          {/* Mentioned files pills */}
          {mentionedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-3 sm:px-4">
              {mentionedFiles.map((f) => (
                <FileMentionPill
                  key={f.path}
                  path={f.path}
                  onRemove={() => handleRemoveMention(f.path)}
                />
              ))}
            </div>
          )}

          {/* Attachment previews */}
          <AttachmentPreview
            attachments={attachments}
            onRemove={handleRemoveAttachment}
          />

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
            {showFilePicker && (
              <FileMentionPicker
                query={mentionTrigger?.query ?? ''}
                workspace={workspace ?? null}
                onSelect={handleSelectFile}
                onDismiss={() => setMentionTrigger(null)}
                activeIndex={mentionIndex}
              />
            )}
            {panel && <SlashActionPanel panel={panel} onDismiss={dismissPanel} />}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onSelect={handleSelect}
              onPaste={handlePaste}
              placeholder="Ask anything, @ to mention files, / for commands"
              disabled={disabled}
              rows={1}
              className="block max-h-[200px] min-h-[70px] w-full resize-none bg-transparent text-[14px] leading-[1.6] text-foreground outline-none placeholder:text-muted-foreground/35"
              style={{ overflow: 'auto', fontFamily: 'inherit', caretColor: 'var(--foreground)' }}
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
              <Sep />
              <BranchSelector workspace={workspace ?? null} />
              {disabled && (
                <span className="ml-2 text-[11px] text-muted-foreground/40">Task ended</span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleFilePickerClick}
                    aria-label="Attach files"
                    className="flex items-center justify-center rounded-lg p-1 text-muted-foreground/40 transition-colors hover:text-muted-foreground/70"
                  >
                    <Paperclip className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[11px]">Attach files or images</TooltipContent>
              </Tooltip>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
                tabIndex={-1}
                aria-hidden
              />
              {isRunning ? (
                <button
                  type="button"
                  onClick={onPause}
                  aria-label="Pause agent"
                  data-testid="pause-button"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transition-all duration-150 hover:bg-primary hover:scale-105"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                    <rect x="1.5" y="1" width="3" height="10" rx="1" />
                    <rect x="7.5" y="1" width="3" height="10" rx="1" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  aria-label="Send message"
                  data-testid="send-button"
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
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
})
