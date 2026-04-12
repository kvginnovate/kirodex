# Kirodex Tauri Activity Log

## 2026-04-12 16:00 GST (Dubai)

### Chat: Full message area UX overhaul — typography, spacing & visual polish

Overhauled the entire chat message area for a more spacious, polished feel inspired by modern AI coding interfaces. Body text bumped from 13px to 15px, secondary text from 11px to 13px, micro labels from 10px to 11px. Line height increased to 1.7 for prose. Generous vertical breathing room added between messages. Tool calls, question cards, thinking display, permission banners, completion cards, inline diffs, and changed files summary all received proportional size and spacing increases.

**Modified:** `src/tailwind.css`, `src/renderer/components/chat/ChatMarkdown.tsx`, `src/renderer/components/chat/UserMessageRow.tsx`, `src/renderer/components/chat/AssistantTextRow.tsx`, `src/renderer/components/chat/WorkGroupRow.tsx`, `src/renderer/components/chat/ToolCallDisplay.tsx`, `src/renderer/components/chat/ToolCallEntry.tsx`, `src/renderer/components/chat/QuestionCards.tsx`, `src/renderer/components/chat/CollapsedAnswers.tsx`, `src/renderer/components/chat/ThinkingDisplay.tsx`, `src/renderer/components/chat/WorkingRow.tsx`, `src/renderer/components/chat/SystemMessageRow.tsx`, `src/renderer/components/chat/PermissionBanner.tsx`, `src/renderer/components/chat/TaskCompletionCard.tsx`, `src/renderer/components/chat/TaskListDisplay.tsx`, `src/renderer/components/chat/InlineDiff.tsx`, `src/renderer/components/chat/ChangedFilesSummary.tsx`, `src/renderer/components/chat/MessageList.tsx`

## 2026-04-12 02:19 (Dubai)

Removed macOS private API usage and custom title bar styling. Switched to standard window decorations with HudWindow vibrancy and 12px corner radius.

Changes made:
- `src-tauri/tauri.conf.json`: Removed `macOSPrivateApi: true`, `titleBarStyle: "Overlay"`, and `hiddenTitle: true` from window config
- `src-tauri/Cargo.toml`: Confirmed `tauri` features already empty (`[]`); removed `cocoa = "0.26.1"` macOS dependency
- `src-tauri/src/lib.rs`: Replaced Sidebar vibrancy + cocoa NSColor background hack with single `HudWindow` vibrancy call (corner radius 12.0)
- `src/tailwind.css`: Changed `#root` from `height: calc(100% - 28px)` to `100vh`/`100vw` with `border-radius: 12px`, `background: var(--background)`, and `border: 0.5px solid var(--border)`
