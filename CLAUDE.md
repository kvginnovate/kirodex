# CLAUDE.md — kirodex-electron

## Project overview

Kirodex is an Electron desktop app that provides a GUI for managing AI agent tasks via the Agent Client Protocol (ACP). It features a chat interface, task management sidebar, diff viewer, terminal integration, and settings panel.

## Tech stack

- **Runtime**: Electron 33 + Node.js
- **Frontend**: React 19, TypeScript 5, Vite 6
- **Styling**: Tailwind CSS 4 (utility-first, dark theme)
- **UI components**: Shadcn/UI pattern with Radix UI primitives, Lucide icons, Tabler icons
- **State management**: Zustand 5 (stores in `src/renderer/stores/`)
- **Markdown**: react-markdown + remark-gfm
- **Virtualization**: @tanstack/react-virtual
- **Diffing**: diff + @pierre/diffs
- **Terminal**: xterm + @xterm/addon-fit + node-pty
- **Build**: tsdown (main process), Vite (renderer), bun as package manager
- **Protocol**: @agentclientprotocol/sdk for ACP subprocess management

## Project structure

```
src/
├── main/                    # Electron main process
│   ├── main.ts              # BrowserWindow, IPC handlers, app lifecycle
│   ├── preload.ts           # contextBridge (kirodexBridge)
│   └── acp/                 # ACP subprocess management
│       ├── ACPConnection.ts
│       └── ACPManager.ts
├── renderer/                # React frontend
│   ├── main.tsx             # React entry
│   ├── App.tsx              # Root layout
│   ├── env.d.ts             # Window type augmentation
│   ├── types/index.ts       # Shared types (TaskStatus, AgentTask, etc.)
│   ├── lib/
│   │   ├── ipc.ts           # IPC wrapper functions
│   │   └── utils.ts         # cn() helper
│   ├── stores/
│   │   ├── taskStore.ts     # Tasks, activity feed, connection state
│   │   ├── settingsStore.ts # Agent profiles, font size, appearance
│   │   ├── kiroStore.ts     # Kiro-specific state
│   │   ├── diffStore.ts     # Diff viewer state
│   │   └── debugStore.ts    # Debug panel state
│   └── components/
│       ├── ui/              # Shadcn-style primitives (button, input, dialog, etc.)
│       ├── chat/            # ChatPanel, MessageList, MessageItem, ChatInput, etc.
│       ├── sidebar/         # TaskSidebar, KiroConfigPanel, KiroFileViewer
│       ├── code/            # CodePanel, DiffViewer, TerminalOutput, DebugLog
│       ├── dashboard/       # Dashboard, TaskCard
│       ├── settings/        # SettingsPanel (General/Agents/Appearance tabs)
│       ├── diff/            # DiffPanel
│       ├── debug/           # DebugPanel
│       ├── task/            # NewProjectSheet
│       ├── AppHeader.tsx
│       ├── ErrorBoundary.tsx
│       └── Playground.tsx
└── tailwind.css             # Tailwind theme with dark GitHub-style tokens
```

## Commands

```bash
bun run dev           # Start dev (main + renderer in parallel)
bun run dev:main      # Watch-build main process with tsdown
bun run dev:renderer  # Start Vite dev server
bun run electron      # Launch Electron pointing at dev server
bun run build         # Production build (main + renderer)
npx tsc --noEmit      # Type check (must pass before marking tasks done)
npx vite build        # Renderer build validation
```

## Architecture decisions

- **IPC bridge**: All main↔renderer communication goes through `preload.ts` contextBridge (`window.kirodexBridge`). Never use `ipcRenderer` directly in renderer code.
- **State**: Zustand stores are the single source of truth. No Redux, no Context for global state.
- **Styling**: Tailwind utility classes only. No custom CSS files for components. Theme tokens defined in `src/tailwind.css`.
- **Components**: Follow Shadcn/UI patterns with `class-variance-authority` for variants, `clsx` + `tailwind-merge` via `cn()` helper.
- **Path aliases**: `@/*` maps to `./src/renderer/*` (configured in tsconfig.json and vite.config.ts).

## Conventions

- Use `const` arrow functions for components and handlers
- Prefix event handlers with `handle` (e.g., `handleClick`, `handleKeyDown`)
- Prefix boolean variables with verbs (`isLoading`, `hasError`, `canSubmit`)
- Use kebab-case for file names, PascalCase for components, camelCase for variables/functions
- One export per file for components
- Early returns for readability
- Accessibility: semantic HTML, ARIA attributes, keyboard navigation on interactive elements
- Conventional Commits for git messages (`feat:`, `fix:`, `chore:`, etc.)

## Build validation

A task is not done until both pass with zero errors:

```bash
npx tsc --noEmit
npx vite build
```

## Critical rules

- Never revert, discard, or `git checkout --` changes without explicit user confirmation
- Never run destructive git operations without being told to
- Always use Tailwind classes for styling; no inline CSS or `<style>` tags
- Keep the activity log updated in `activity.md`
