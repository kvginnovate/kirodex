import { memo, useState, useRef, useEffect } from 'react'
import { Circle, Key } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useKiroStore } from '@/stores/kiroStore'

const LOADING_WORDS = [
  'Thinking',
  'Reasoning',
  'Analyzing',
  'Planning',
  'Processing',
  'Reflecting',
  'Considering',
  'Evaluating',
  'Synthesizing',
  'Crafting',
]

const McpStatusLines = memo(function McpStatusLines() {
  const mcpServers = useKiroStore((s) => s.config.mcpServers ?? [])
  const active = mcpServers.filter((m) => m.enabled && m.status)

  if (active.length === 0) return null

  const needsAction = active.filter(
    (m) => m.status === 'needs-auth' || m.status === 'error',
  )
  const others = active.filter(
    (m) => m.status !== 'needs-auth' && m.status !== 'error',
  )

  return (
    <div className="mt-2 space-y-1.5">
      {needsAction.map((m) => (
        <McpActionBanner key={m.name} server={m} />
      ))}

      {others.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {others.map((m) => {
            const isReady = m.status === 'ready'
            const isConnecting = m.status === 'connecting'
            return (
              <span
                key={m.name}
                className="flex items-center gap-1 text-[10px] text-muted-foreground/40"
              >
                {isConnecting ? (
                  <span className="size-1.5 shrink-0 rounded-full border border-sky-400 border-t-transparent animate-spin" />
                ) : (
                  <Circle
                    className={cn(
                      'size-1.5 shrink-0 fill-current',
                      isReady ? 'text-emerald-400' : 'text-muted-foreground/30',
                    )}
                  />
                )}
                {isConnecting ? `${m.name}\u2026` : m.name}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
})

const McpActionBanner = memo(function McpActionBanner({
  server,
}: {
  server: { name: string; status?: string; error?: string; oauthUrl?: string }
}) {
  const needsAuth = server.status === 'needs-auth'
  const hasError = server.status === 'error'

  if (needsAuth) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-2.5 py-1.5">
        <Key className="size-3 shrink-0 text-amber-500" />
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium text-foreground">
            {server.name}
          </span>
          <span className="ml-1 text-[10px] text-muted-foreground">
            — OAuth setup needed. Configure in <code className="rounded bg-muted px-1 text-[10px]">~/.kiro/settings/mcp.json</code>
          </span>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.04] px-2.5 py-1.5">
        <Circle className="size-2 shrink-0 fill-current text-red-400" />
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium text-foreground">
            {server.name}
          </span>
          <span className="ml-1 text-[10px] text-red-400/70">
            failed to connect
          </span>
          {server.error && (
            <p className="mt-0.5 truncate text-[9px] font-mono text-red-400/50">
              {server.error}
            </p>
          )}
        </div>
      </div>
    )
  }

  return null
})

export const WorkingRow = memo(function WorkingRow() {
  const [idx, setIdx] = useState(() =>
    Math.floor(Math.random() * LOADING_WORDS.length),
  )
  const [visible, setVisible] = useState(true)
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const cycle = () => {
      setVisible(false)
      fadeRef.current = setTimeout(() => {
        setIdx((i) => (i + 1) % LOADING_WORDS.length)
        setVisible(true)
      }, 300)
    }
    const t = setInterval(cycle, 2200)
    return () => {
      clearInterval(t)
      if (fadeRef.current) clearTimeout(fadeRef.current)
    }
  }, [])

  return (
    <div className="py-1 select-none" data-timeline-row-kind="working">
      <div className="flex items-center gap-2">
        <span
          className="text-xs text-muted-foreground/50 transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {LOADING_WORDS[idx]}&hellip;
        </span>
      </div>
      <McpStatusLines />
    </div>
  )
})
