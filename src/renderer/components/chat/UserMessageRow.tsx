import { memo, useState, useRef, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CollapsedAnswers } from './CollapsedAnswers'
import type { UserMessageRow as UserMessageRowData } from '@/lib/timeline'

export const UserMessageRow = memo(function UserMessageRow({ row }: { row: UserMessageRowData }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(row.content).then(() => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setCopied(true)
      timerRef.current = setTimeout(() => setCopied(false), 1200)
    })
  }, [row.content])

  const timeStr = row.timestamp
    ? new Date(row.timestamp).toLocaleTimeString()
    : ''

  return (
    <div data-testid="user-message-row" className="pb-3" data-timeline-row-kind="user-message">
      <div className="flex justify-end">
        <div className="group relative max-w-[75%]">
          <div className="rounded-2xl rounded-br-md bg-primary/10 px-3.5 py-2 dark:bg-primary/[0.08]">
            {row.questionAnswers?.length ? (
              <CollapsedAnswers questionAnswers={row.questionAnswers} />
            ) : (
              <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground">
                {row.content}
              </p>
            )}
          </div>
          <div className="mt-1 flex items-center justify-end gap-1.5 px-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-md p-0.5 text-muted-foreground/0 transition-all group-hover:text-muted-foreground/50 hover:!text-foreground"
                >
                  {copied ? (
                    <Check className="size-3" aria-hidden />
                  ) : (
                    <Copy className="size-3" aria-hidden />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {copied ? 'Copied!' : 'Copy message'}
              </TooltipContent>
            </Tooltip>
            <span className="text-[10px] tabular-nums text-muted-foreground/30">
              {timeStr}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})
