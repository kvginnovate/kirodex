import { memo } from 'react'

export const InlineDiff = memo(function InlineDiff({ diffText }: { diffText: string }) {
  const lines = diffText.split('\n')
  let added = 0
  let deleted = 0
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) added++
    else if (line.startsWith('-') && !line.startsWith('---')) deleted++
  }

  return (
    <div className="ml-5 mr-2 mb-1 mt-0.5 rounded-md border border-border/30 overflow-hidden">
      <div className="flex items-center gap-2 px-2.5 py-1 bg-muted/30 text-[10px] text-muted-foreground/60">
        <span>Changes</span>
        <span className="flex-1" />
        {added > 0 && <span className="text-emerald-400">+{added}</span>}
        {deleted > 0 && <span className="text-red-400">-{deleted}</span>}
      </div>
      <pre className="max-h-[200px] overflow-auto px-0 py-1 font-mono text-[11px] leading-[1.5]">
        {lines.map((line, i) => {
          if (line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('---') || line.startsWith('+++')) {
            return null
          }
          if (line.startsWith('@@')) {
            return (
              <div key={i} className="px-2.5 py-0.5 text-[10px] text-blue-400/60 bg-blue-500/5">
                {line}
              </div>
            )
          }
          if (line.startsWith('+')) {
            return (
              <div key={i} className="px-2.5 bg-emerald-500/8 text-emerald-400/80">
                {line}
              </div>
            )
          }
          if (line.startsWith('-')) {
            return (
              <div key={i} className="px-2.5 bg-red-500/8 text-red-400/80">
                {line}
              </div>
            )
          }
          return (
            <div key={i} className="px-2.5 text-foreground/40">
              {line || ' '}
            </div>
          )
        })}
      </pre>
    </div>
  )
})
