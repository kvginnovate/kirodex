import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center gap-1 rounded bg-muted px-1 font-medium font-sans text-muted-foreground text-xs [&_svg:not([class*=size-])]:size-3',
        className,
      )}
      data-slot="kbd"
      {...props}
    />
  )
}

export { Kbd }
