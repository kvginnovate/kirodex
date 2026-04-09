import { useEffect, useCallback, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppHeader } from '@/components/AppHeader'
import { TaskSidebar } from '@/components/sidebar/TaskSidebar'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { Playground } from '@/components/Playground'
import { PendingChat } from '@/components/chat/PendingChat'
import { NewProjectSheet } from '@/components/task/NewProjectSheet'
import { ipc } from '@/lib/ipc'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { CodePanel } from '@/components/code/CodePanel'
import { DebugPanel } from '@/components/debug/DebugPanel'
import { useTaskStore, initTaskListeners } from '@/stores/taskStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useDebugStore } from '@/stores/debugStore'
import { useKiroStore, initKiroListeners } from '@/stores/kiroStore'
import { useShallow } from 'zustand/react/shallow'

export function App() {
  const { view, selectedTaskId, pendingWorkspace } = useTaskStore(
    useShallow((s) => ({ view: s.view, selectedTaskId: s.selectedTaskId, pendingWorkspace: s.pendingWorkspace }))
  )
  const debugOpen = useDebugStore((s) => s.isOpen)
  // Sync active workspace → apply per-project model/autoApprove prefs
  useEffect(() => {
    const tasks = useTaskStore.getState().tasks
    const workspace = selectedTaskId ? tasks[selectedTaskId]?.workspace ?? null : null
    useSettingsStore.getState().setActiveWorkspace(workspace)
  }, [selectedTaskId])
  const [sidePanelOpen, setSidePanelOpen] = useState(false)

  useEffect(() => {
    useTaskStore.getState().loadTasks()
    useSettingsStore.getState().loadSettings()
    // Pre-warm ACP to get models/modes before user creates a thread
    ipc.probeCapabilities().catch(() => {})
    const cleanupTask = initTaskListeners()
    const cleanupKiro = initKiroListeners()
    return () => { cleanupTask(); cleanupKiro() }
  }, [])

  const toggleSidePanel = useCallback(() => setSidePanelOpen((o) => !o), [])
  const closeSidePanel = useCallback(() => setSidePanelOpen(false), [])

  const showPlayground = view === 'playground'

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen flex-col bg-background text-foreground">
        {/* Top-level breadcrumb header */}
        <ErrorBoundary>
          <AppHeader sidePanelOpen={sidePanelOpen} onToggleSidePanel={toggleSidePanel} />
        </ErrorBoundary>

        {/* Main area: sidebar + content + side panel */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <ErrorBoundary>
            <TaskSidebar />
          </ErrorBoundary>
          <main className="flex min-h-0 flex-1 overflow-hidden">
            <ErrorBoundary>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {showPlayground ? (
                  <Playground />
                ) : selectedTaskId ? (
                  <ChatPanel />
                ) : pendingWorkspace ? (
                  <PendingChat workspace={pendingWorkspace} />
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-sm text-muted-foreground/50 select-none">
                      Select a thread or create a new one to get started.
                    </p>
                  </div>
                )}
              </div>
            </ErrorBoundary>
            {sidePanelOpen && selectedTaskId && !showPlayground && (
              <ErrorBoundary>
                <CodePanel onClose={closeSidePanel} />
              </ErrorBoundary>
            )}
          </main>
        </div>

        {/* Bottom debug panel */}
        {debugOpen && (
          <ErrorBoundary>
            <DebugPanel />
          </ErrorBoundary>
        )}
      </div>
      <ErrorBoundary>
        <NewProjectSheet />
      </ErrorBoundary>
      <ErrorBoundary>
        <SettingsPanel />
      </ErrorBoundary>
      <Toaster position="bottom-right" toastOptions={{ duration: 8000 }} theme="system" />
    </TooltipProvider>
  )
}
