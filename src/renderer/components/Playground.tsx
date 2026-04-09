import { useState, useCallback } from 'react'
import { ipc } from '@/lib/ipc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LogEntry {
  id: number
  ts: string
  label: string
  ok: boolean
  result: string
}

let seq = 0
const ts = () => new Date().toISOString().slice(11, 23)

export function Playground() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [editorPath, setEditorPath] = useState('')
  const [editorApp, setEditorApp] = useState('zed')

  const log = useCallback((label: string, ok: boolean, result: unknown) => {
    setLogs((p) => [
      { id: ++seq, ts: ts(), label, ok, result: typeof result === 'string' ? result : JSON.stringify(result, null, 2) },
      ...p.slice(0, 99),
    ])
  }, [])

  const run = useCallback(async (label: string, fn: () => Promise<unknown>) => {
    try {
      const r = await fn()
      log(label, true, r ?? 'ok')
    } catch (e) {
      log(label, false, e instanceof Error ? e.message : String(e))
    }
  }, [log])

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-6">
      <h2 className="text-sm font-semibold text-foreground">IPC Playground</h2>

      {/* IPC Tests */}
      <section className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Core IPC</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => run('task-list', () => ipc.listTasks())}>
            task-list
          </Button>
          <Button size="sm" variant="outline" onClick={() => run('get-settings', () => ipc.getSettings())}>
            get-settings
          </Button>
          <Button size="sm" variant="outline" onClick={() => run('pick-folder', () => ipc.pickFolder())}>
            pick-folder
          </Button>
          <Button size="sm" variant="outline" onClick={() => run('list-models', () => ipc.listModels())}>
            list-models
          </Button>
          <Button size="sm" variant="outline" onClick={() => run('kiro-config', () => ipc.getKiroConfig())}>
            kiro-config
          </Button>
        </div>
      </section>

      {/* Open in Editor */}
      <section className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open in Editor</p>
        <div className="flex gap-2">
          <Input
            className="h-7 text-xs"
            placeholder="/path/to/project"
            value={editorPath}
            onChange={(e) => setEditorPath(e.target.value)}
          />
          <select
            className="h-7 rounded-md border border-input bg-background px-2 text-xs"
            value={editorApp}
            onChange={(e) => setEditorApp(e.target.value)}
          >
            {['zed', 'vscode', 'cursor', 'vscode-insiders', 'vscodium', 'idea', 'file-manager'].map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => run(`open-in-editor(${editorApp})`, () => ipc.openInEditor(editorPath || process.cwd?.() || '/', editorApp))}
          >
            Open
          </Button>
        </div>
      </section>

      {/* PTY Test */}
      <section className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">PTY</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={async () => {
            const id = `test-pty-${Date.now()}`
            await run(`pty-create(${id})`, () => ipc.ptyCreate(id, process.env.HOME ?? '/'))
            await run(`pty-write(${id}, echo hi)`, () => ipc.ptyWrite(id, 'echo hi\n'))
            setTimeout(() => run(`pty-kill(${id})`, () => ipc.ptyKill(id)), 500)
          }}>
            pty create→write→kill
          </Button>
        </div>
      </section>

      {/* Log */}
      <section className="flex min-h-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Log</p>
          <Button size="sm" variant="ghost" className="h-5 text-xs" onClick={() => setLogs([])}>Clear</Button>
        </div>
        <ScrollArea className="flex-1 rounded-md border border-border bg-card/30">
          <div className="p-2 space-y-1 font-mono text-[11px]">
            {logs.length === 0 && <p className="text-muted-foreground/50 p-2">Run a test above…</p>}
            {logs.map((l) => (
              <div key={l.id} className="flex gap-2">
                <span className="shrink-0 text-muted-foreground/40">{l.ts}</span>
                <span className={l.ok ? 'text-emerald-400 shrink-0' : 'text-red-400 shrink-0'}>{l.ok ? '✓' : '✗'}</span>
                <span className="shrink-0 text-foreground/70">{l.label}</span>
                <span className="text-muted-foreground/60 truncate">{l.result}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </section>
    </div>
  )
}
