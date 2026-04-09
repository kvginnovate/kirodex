import { memo, useState } from 'react'
import { Check, Circle, Loader2, ChevronDown, ChevronRight, ListChecks } from 'lucide-react'
import type { PlanStep } from '@/types'
import { cn } from '@/lib/utils'

interface ExecutionPlanProps {
  steps: PlanStep[]
}

const stepIcons = {
  pending: <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40" />,
  in_progress: <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-primary" />,
  completed: <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />,
} as const

const priorityDot: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-muted-foreground/30',
}

export const ExecutionPlan = memo(function ExecutionPlan({ steps }: ExecutionPlanProps) {
  const [expanded, setExpanded] = useState(true)
  const completed = steps.filter((s) => s.status === 'completed').length

  return (
    <div className="my-2 rounded-lg border border-border/60 bg-card/40">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-accent/10"
      >
        <ListChecks className="size-4 text-muted-foreground" />
        <span className="flex-1 text-xs font-medium text-muted-foreground">
          Plan ({completed}/{steps.length})
        </span>
        {expanded ? <ChevronDown className="size-3 text-muted-foreground" /> : <ChevronRight className="size-3 text-muted-foreground" />}
      </button>
      {expanded && (
        <ol className="border-t border-border/40 px-3 py-2 space-y-1">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              {stepIcons[step.status] ?? stepIcons.pending}
              <span className={cn(
                'flex-1 leading-relaxed',
                step.status === 'completed' && 'text-muted-foreground line-through',
                step.status === 'in_progress' && 'text-foreground',
                step.status === 'pending' && 'text-muted-foreground/70',
              )}>
                {step.content}
              </span>
              <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', priorityDot[step.priority] ?? priorityDot.low)} />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
})
