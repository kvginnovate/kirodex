import { memo, useState } from 'react'
import {
  ChevronDown, ChevronRight, Check, Loader2, X,
  FileText, FileEdit, Trash2, FolderSearch, Terminal, Brain,
  Globe, ArrowRightLeft, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react'
import type { ToolCall, ToolKind } from '@/types'
import { cn } from '@/lib/utils'
import { useDiffStore } from '@/stores/diffStore'

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

// ── Compact single-line tool call entry ──────────────────────

const ToolCallEntry = memo(function ToolCallEntry({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = getToolIcon(toolCall.kind, toolCall.title)
  const isRunning = toolCall.status === 'in_progress'
  const isFailed = toolCall.status === 'failed'

  const firstPath = toolCall.locations?.[0]?.path
  const shortPath = firstPath ? firstPath.split('/').slice(-2).join('/') : null

  const hasContent = !!(
    toolCall.content?.length ||
    toolCall.rawInput !== undefined ||
    toolCall.rawOutput !== undefined
  )

  const isFileOp = toolCall.kind === 'edit' || toolCall.kind === 'read' || toolCall.kind === 'delete'

  const handleClick = () => {
    if (isFileOp && firstPath) {
      useDiffStore.getState().openToFile(firstPath)
    } else if (hasContent) {
      setExpanded(!expanded)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1 text-[11px] text-left transition-colors',
          (hasContent || (isFileOp && firstPath)) && 'hover:bg-accent/10 cursor-pointer',
          !(hasContent || (isFileOp && firstPath)) && 'cursor-default',
        )}
      >
        <Icon className={cn(
          'size-3 shrink-0',
          isRunning ? 'text-primary' : isFailed ? 'text-red-400' : 'text-muted-foreground/40',
        )} />
        <span className={cn(
          'flex-1 truncate',
          isRunning ? 'text-foreground' : 'text-muted-foreground/70',
        )}>
          {toolCall.title}
        </span>
        {shortPath && (
          <span className="hidden sm:inline max-w-[140px] truncate font-mono text-[10px] text-muted-foreground/30">
            {shortPath}
          </span>
        )}
        {isRunning ? (
          <Loader2 className="size-2.5 shrink-0 animate-spin text-primary" />
        ) : isFailed ? (
          <X className="size-2.5 shrink-0 text-red-400" />
        ) : toolCall.status === 'completed' ? (
          <Check className="size-2.5 shrink-0 text-emerald-400/60" />
        ) : null}
      </button>

      {expanded && hasContent && (
        <div className="ml-5 mr-2 mb-1 mt-0.5 rounded-md border border-border/30 bg-background/50 px-2.5 py-2 text-xs space-y-2">
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

// ── Collapsible work group card ──────────────────────────────

const MAX_VISIBLE_DEFAULT = 6

interface ToolCallDisplayProps {
  toolCalls: ToolCall[]
}

export const ToolCallDisplay = memo(function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  const [expanded, setExpanded] = useState(true)
  const [showAll, setShowAll] = useState(false)

  if (!toolCalls.length) return null

  const completedCount = toolCalls.filter((tc) => tc.status === 'completed').length
  const runningCount = toolCalls.filter((tc) => tc.status === 'in_progress').length
  const failedCount = toolCalls.filter((tc) => tc.status === 'failed').length

  const visibleCalls = showAll ? toolCalls : toolCalls.slice(0, MAX_VISIBLE_DEFAULT)
  const hasMore = toolCalls.length > MAX_VISIBLE_DEFAULT

  return (
    <div className="rounded-lg border border-border/30 bg-card/20">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-accent/5"
      >
        {expanded ? (
          <ChevronDown className="size-3 shrink-0 text-muted-foreground/40" />
        ) : (
          <ChevronRight className="size-3 shrink-0 text-muted-foreground/40" />
        )}
        <Zap className="size-3 shrink-0 text-amber-400/60" />
        <span className="text-[11px] font-medium text-muted-foreground/60">
          Tool calls
        </span>
        <span className="text-[10px] tabular-nums text-muted-foreground/35">
          ({toolCalls.length})
        </span>

        {/* Status summary pills */}
        <div className="flex-1" />
        {runningCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-primary">
            <Loader2 className="size-2.5 animate-spin" />
            {runningCount}
          </span>
        )}
        {failedCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-red-400">
            <X className="size-2.5" />
            {failedCount}
          </span>
        )}
        {completedCount > 0 && runningCount === 0 && failedCount === 0 && (
          <Check className="size-3 text-emerald-400/50" />
        )}
      </button>

      {/* Expanded tool list */}
      {expanded && (
        <div className="border-t border-border/20 py-0.5">
          {visibleCalls.map((tc) => (
            <ToolCallEntry key={tc.toolCallId} toolCall={tc} />
          ))}
          {hasMore && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full px-2 py-1 text-[10px] text-muted-foreground/40 transition-colors hover:text-muted-foreground/60"
            >
              +{toolCalls.length - MAX_VISIBLE_DEFAULT} more
            </button>
          )}
        </div>
      )}
    </div>
  )
})
