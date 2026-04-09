import { memo, useState } from 'react'
import {
  ChevronDown, ChevronRight, Check, Loader2, X, AlertCircle,
  FileText, FileEdit, Trash2, FolderSearch, Terminal, Brain,
  Globe, ArrowRightLeft, Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { ToolCall, ToolKind } from '@/types'
import { cn } from '@/lib/utils'

const kindIcons: Record<ToolKind, LucideIcon> = {
  read: FileText,
  edit: FileEdit,
  delete: Trash2,
  move: ArrowRightLeft,
  search: FolderSearch,
  execute: Terminal,
  think: Brain,
  fetch: Globe,
  switch_mode: ArrowRightLeft,
  other: Wrench,
}

function getToolIcon(kind?: ToolKind, title?: string): LucideIcon {
  if (kind && kindIcons[kind]) return kindIcons[kind]
  const t = (title ?? '').toLowerCase()
  if (t.includes('bash') || t.includes('command') || t.includes('exec') || t.includes('shell')) return Terminal
  if (t.includes('read') || t.includes('cat') || t.includes('view')) return FileText
  if (t.includes('write') || t.includes('edit') || t.includes('patch')) return FileEdit
  if (t.includes('search') || t.includes('grep') || t.includes('find') || t.includes('glob')) return FolderSearch
  if (t.includes('fetch') || t.includes('web') || t.includes('http')) return Globe
  if (t.includes('think')) return Brain
  return Wrench
}

const statusMeta: Record<string, { icon: LucideIcon; className: string; label: string }> = {
  pending: { icon: Loader2, className: 'text-muted-foreground/50', label: 'Pending' },
  in_progress: { icon: Loader2, className: 'animate-spin text-primary', label: 'Running' },
  completed: { icon: Check, className: 'text-emerald-400', label: 'Done' },
  failed: { icon: X, className: 'text-red-400', label: 'Failed' },
}

const ToolCallItem = memo(function ToolCallItem({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = getToolIcon(toolCall.kind, toolCall.title)
  const status = statusMeta[toolCall.status] ?? statusMeta.pending
  const StatusIcon = status.icon
  const isRunning = toolCall.status === 'in_progress'

  const firstPath = toolCall.locations?.[0]?.path
  const shortPath = firstPath ? firstPath.split('/').slice(-2).join('/') : null

  const hasContent = !!(
    toolCall.content?.length ||
    toolCall.rawInput !== undefined ||
    toolCall.rawOutput !== undefined
  )

  return (
    <div className={cn(
      'rounded-lg border transition-colors',
      toolCall.status === 'failed'
        ? 'border-red-500/20 bg-red-500/5'
        : isRunning
          ? 'border-primary/20 bg-primary/5'
          : 'border-border/50 bg-card/30',
    )}>
      <button
        onClick={() => hasContent && setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors',
          hasContent && 'hover:bg-accent/10 cursor-pointer',
          !hasContent && 'cursor-default',
        )}
      >
        {hasContent ? (
          expanded ? <ChevronDown className="size-3 shrink-0 text-muted-foreground/50" /> : <ChevronRight className="size-3 shrink-0 text-muted-foreground/50" />
        ) : (
          <span className="size-3 shrink-0" />
        )}
        <Icon className={cn('size-3.5 shrink-0', isRunning ? 'text-primary' : 'text-muted-foreground/60')} />
        <span className={cn('flex-1 truncate font-medium', isRunning && 'text-foreground')}>{toolCall.title}</span>
        {shortPath && (
          <span className="hidden sm:inline max-w-[120px] truncate text-[10px] font-mono text-muted-foreground/40">{shortPath}</span>
        )}
        <StatusIcon className={cn('size-3 shrink-0', status.className)} />
      </button>

      {expanded && hasContent && (
        <div className="border-t border-border/30 px-3 py-2 text-xs space-y-2">
          {toolCall.content?.map((item, i) => (
            <div key={i}>
              {item.type === 'diff' && item.path && (
                <div>
                  <p className="mb-1 flex items-center gap-1 text-muted-foreground">
                    <FileEdit className="size-3" />
                    <span className="font-mono">{item.path}</span>
                  </p>
                  {item.newText && (
                    <pre className="max-h-48 overflow-auto rounded-md bg-muted/50 p-2 font-mono text-[11px] leading-relaxed text-foreground/70">
                      {item.newText.slice(0, 2000)}{item.newText.length > 2000 ? '\n...(truncated)' : ''}
                    </pre>
                  )}
                </div>
              )}
              {item.type === 'terminal' && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Terminal className="size-3" />
                  <span className="font-mono">Terminal: {item.terminalId}</span>
                </div>
              )}
              {item.type === 'content' && item.text && (
                <pre className="max-h-48 overflow-auto rounded-md bg-background p-2 font-mono text-[11px] leading-relaxed">
                  {item.text.slice(0, 2000)}{item.text.length > 2000 ? '\n...(truncated)' : ''}
                </pre>
              )}
            </div>
          ))}

          {toolCall.rawInput !== undefined && (
            <div>
              <p className="mb-1 text-muted-foreground/60">Input</p>
              <pre className="max-h-32 overflow-auto rounded-md bg-background p-2 font-mono text-[11px] leading-relaxed">
                {typeof toolCall.rawInput === 'string'
                  ? toolCall.rawInput.slice(0, 1500)
                  : JSON.stringify(toolCall.rawInput, null, 2)?.slice(0, 1500)}
              </pre>
            </div>
          )}

          {toolCall.rawOutput !== undefined && (
            <div>
              <p className="mb-1 text-muted-foreground/60">Output</p>
              <pre className="max-h-32 overflow-auto rounded-md bg-background p-2 font-mono text-[11px] leading-relaxed">
                {typeof toolCall.rawOutput === 'string'
                  ? toolCall.rawOutput.slice(0, 1500)
                  : JSON.stringify(toolCall.rawOutput, null, 2)?.slice(0, 1500)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

interface ToolCallDisplayProps {
  toolCalls: ToolCall[]
}

export const ToolCallDisplay = memo(function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  if (!toolCalls.length) return null
  return (
    <div className="my-2 space-y-1">
      {toolCalls.map((tc) => <ToolCallItem key={tc.toolCallId} toolCall={tc} />)}
    </div>
  )
})
