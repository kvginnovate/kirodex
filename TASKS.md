# TASKS.md — kantoku-electron

## Completed

- [x] Project scaffold (package.json, tsconfig, vite.config, tsdown.config, index.html, .gitignore)
- [x] Tailwind CSS theme with dark GitHub-style tokens
- [x] Electron main process (BrowserWindow, IPC handlers, app lifecycle)
- [x] Preload script with contextBridge (kantokuBridge)
- [x] ACP subprocess management (ACPConnection, ACPManager)
- [x] TypeScript types (TaskStatus, AgentTask, TaskMessage, ToolCall, PlanStep, AgentProfile, ActivityEntry, AppSettings)
- [x] Zustand stores (taskStore with activityFeed + connected state, settingsStore with agentProfiles + fontSize)
- [x] IPC wrapper (lib/ipc.ts) with getTaskDiff
- [x] Utility helpers (lib/utils.ts — cn)
- [x] UI primitives (Button with asChild/Slot, Input, Textarea, Dialog/Sheet, ScrollArea, Separator, Tooltip, Badge with dot prop)
- [x] Sidebar component (TaskSidebar with connection indicator)
- [x] Chat components (ChatPanel with code panel toggle, ChatInput, MessageList with virtualization, MessageItem, ChatMarkdown with GFM, ThinkingDisplay, ExecutionPlan, PermissionBanner, ContextUsageBar, ToolCallDisplay)
- [x] Dashboard components (Dashboard with activity feed, TaskCard with context usage bar)
- [x] Task creation (NewTaskSheet with agent profile select)
- [x] Settings panel (SettingsPanel with General/Agents/Appearance tabs)
- [x] Code panel (CodePanel with resize, DiffViewer with parsePatch, TerminalOutput, DebugLog)
- [x] Git diff IPC handler (kantoku:task-diff in main.ts)
- [x] React entry files (main.tsx, App.tsx with full layout integration)
- [x] Post-parallel-upgrade integration fix pass (tsconfig paths, missing types, Badge variant mapping, ChatPanel props)

## Remaining

- [ ] Code-splitting for bundle size optimization (currently 518KB)
- [ ] Light theme / System theme support
- [ ] End-to-end testing
