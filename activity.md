# Activity Log

## 2026-04-15 12:31 GST (Dubai)

### Commits: Review and split unstaged changes into 4 logical commits

Reviewed all 60 unstaged files and created 4 separate commits:

1. `style(theme)`: CSS token updates in both tailwind.css files; darkened light-mode semantic colors, brightened dark-mode primary (#6366f1 → #818cf8)
2. `feat(onboarding)`: Onboarding v2 with hasOnboarded → hasOnboardedV2 rename, analytics default changed to true (opt-out), and new privacy toggle in onboarding flow. 6 files across Rust backend, types, stores, and components.
3. `refactor(settings)`: Removed RecentlyDeleted sidebar component + tests, added DeletedThreadsRestore inline in SettingsPanel under Advanced section. 3 files changed.
4. `style(ui)`: Light mode contrast fixes and dark mode color variants across 51 component files. Removed /opacity suffixes from muted-foreground/border classes, added explicit dark: variants for colored elements.

TypeScript check passes with zero errors after all commits.

**Modified:** src/tailwind.css, tailwind.css, settings.rs, App.tsx, Onboarding.tsx, SettingsPanel.tsx, taskStore.ts, types/index.ts, RecentlyDeleted.tsx (deleted), RecentlyDeleted.test.tsx (deleted), + 49 component files

## 2026-04-15 12:45 GST (Dubai)

### UI: Dark mode WCAG AA contrast audit and fix

Full dark mode contrast audit across the entire application. Fixed ~175 WCAG AA violations across ~37 component files. Key change: bumped dark mode `--primary` from #6366f1 (3.8:1, fails AA) to #818cf8 (indigo-400, 5.0:1, passes AA). Removed low-opacity text-muted-foreground on all text content (labels, descriptions, timestamps, counts, placeholders); kept /70 only on decorative icons (chevrons, spinners) which pass the 3:1 UI component threshold. Fixed text-foreground/40→/60 and /50→/70. Removed all text-primary opacity modifiers. Fixed UI primitive placeholders in input.tsx and textarea.tsx.

**Modified:** src/tailwind.css, tailwind.css, App.tsx, input.tsx, textarea.tsx, Onboarding.tsx, AppHeader.tsx, SlashPanels.tsx, QuestionCards.tsx, SearchBar.tsx, TaskCompletionCard.tsx, CollapsedAnswers.tsx, ToolCallDisplay.tsx, ToolCallEntry.tsx, TaskListDisplay.tsx, ExecutionPlan.tsx, ChatMarkdown.tsx, GitActionsGroup.tsx, ChatInput.tsx, FileMentionPicker.tsx, DragOverlay.tsx, BranchSelector.tsx, MessageItem.tsx, AttachmentPreview.tsx, EmptyThreadSplash.tsx, PendingChat.tsx, PermissionBanner.tsx, SettingsPanel.tsx, AboutDialog.tsx, ThemeSelector.tsx, KiroConfigPanel.tsx, ThreadItem.tsx, TaskSidebar.tsx, KiroFileViewer.tsx, DebugPanel.tsx, DiffPanel.tsx, DiffViewer.tsx

## 2026-04-15 12:24 (Dubai, GMT+4)

### Dark mode contrast fixes - Batch 5

Fixed low-contrast text opacity issues across 9 component files:

1. **AppHeader.tsx** - Fixed breadcrumb separator (`/50` → full), account type label (`text-foreground/50` → `/70`). Kept `/70` on decorative git/terminal icons.
2. **debug/DebugPanel.tsx** - Fixed timestamps, task ID, entry type, count display, empty state text. Kept `/70` on chevron/copy/clear/close action icons. Fixed `text-primary/70` → `text-primary`.
3. **diff/DiffPanel.tsx** - Fixed file count text, "no workspace" text, empty state text. Kept `/70` on toggle button icons.
4. **code/DiffViewer.tsx** - Fixed collapse toggle (`/60` → full). Kept `/70` on toggle button icons and decorative file icons.
5. **Onboarding.tsx** - Fixed "Other install methods" button, placeholder text, helper text, region label, LoginMethod text (`/80` → full). Fixed link text (`text-primary/60` → `text-primary`).
6. **chat/PendingChat.tsx** - Fixed auth required text (`/80` → full).
7. **chat/PermissionBanner.tsx** - Fixed reject_always button (`/60` → full).
8. **chat/ReadOutput.tsx** - No changes needed (no remaining opacity issues).
9. **App.tsx** - Fixed hint text (`/70` → full), LoginBanner subtitle (`dark:text-amber-200/50` → `dark:text-amber-400`).
