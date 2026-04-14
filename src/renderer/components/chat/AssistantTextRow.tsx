import { memo } from 'react'
import ChatMarkdown from './ChatMarkdown'
import { ThinkingDisplay } from './ThinkingDisplay'
import { isPlanHandoff, PlanHandoffCard } from './PlanHandoffCard'
import type { AssistantTextRow as AssistantTextRowData } from '@/lib/timeline'

export const AssistantTextRow = memo(function AssistantTextRow({ row }: { row: AssistantTextRowData }) {
  const showHandoff = !row.isStreaming && isPlanHandoff(row.content)

  return (
    <div data-testid="assistant-text-row" className={row.squashed ? 'pb-1.5' : 'pb-4'} data-timeline-row-kind="assistant-text">
      {row.thinking && (
        <ThinkingDisplay text={row.thinking} isActive={row.isStreaming} />
      )}
      {row.content ? (
        <ChatMarkdown text={row.content} isStreaming={row.isStreaming} />
      ) : null}
      {showHandoff && <PlanHandoffCard />}
    </div>
  )
})
