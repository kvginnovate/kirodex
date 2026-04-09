import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowDown } from 'lucide-react'
import type { TaskMessage, ToolCall } from '@/types'
import { MessageItem } from './MessageItem'

const AUTO_SCROLL_THRESHOLD = 150

interface MessageListProps {
  messages: TaskMessage[]
  streamingChunk?: string
  liveToolCalls?: ToolCall[]
  liveThinking?: string
  isRunning?: boolean
}

export const MessageList = memo(function MessageList({
  messages,
  streamingChunk,
  liveToolCalls,
  liveThinking,
  isRunning,
}: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const isNearBottomRef = useRef(true)

  const displayMessages = useMemo(() => {
    const msgs: Array<TaskMessage & { _streaming?: boolean }> = [...messages]
    const hasLiveActivity = !!streamingChunk || (liveToolCalls && liveToolCalls.length > 0) || !!liveThinking
    const lastMsg = messages[messages.length - 1]
    const waitingForResponse = isRunning && !hasLiveActivity && lastMsg?.role === 'user'
    if (hasLiveActivity || waitingForResponse) {
      msgs.push({
        role: 'assistant',
        content: streamingChunk ?? '',
        timestamp: '',
        _streaming: true,
      } as TaskMessage & { _streaming?: boolean })
    }
    return msgs
  }, [messages, streamingChunk, liveToolCalls, liveThinking, isRunning])

  const virtualizer = useVirtualizer({
    count: displayMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  })

  const scrollToBottom = useCallback(() => {
    if (!parentRef.current) return
    parentRef.current.scrollTop = parentRef.current.scrollHeight
  }, [])

  useEffect(() => {
    const el = parentRef.current
    if (!el) return
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      const nearBottom = distFromBottom < AUTO_SCROLL_THRESHOLD
      isNearBottomRef.current = nearBottom
      setShowScrollBtn(!nearBottom)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (isNearBottomRef.current) {
      requestAnimationFrame(scrollToBottom)
    }
  }, [displayMessages.length, streamingChunk, liveToolCalls, liveThinking, scrollToBottom])

  if (!displayMessages.length) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <p className="text-sm">Send a message to start the conversation.</p>
      </div>
    )
  }

  return (
    <div ref={parentRef} className="relative flex-1 overflow-auto overscroll-y-contain px-0 py-3 sm:py-4">
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const msg = displayMessages[virtualRow.index]
          if (!msg) return null
          const isStreaming = '_streaming' in msg && (msg as { _streaming?: boolean })._streaming
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <div className="mx-auto w-full min-w-0 max-w-3xl overflow-x-hidden px-3 sm:px-5">
                <MessageItem
                  message={msg}
                  streaming={!!isStreaming}
                  liveToolCalls={isStreaming ? liveToolCalls : undefined}
                  liveThinking={isStreaming ? liveThinking : undefined}
                />
              </div>
            </div>
          )
        })}
      </div>

      {showScrollBtn && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-lg transition-colors hover:bg-secondary"
        >
          <ArrowDown className="size-3" />
          Scroll to bottom
        </button>
      )}
    </div>
  )
})
