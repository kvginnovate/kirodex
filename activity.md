# Activity Log

## 2026-04-11 19:22 (Dubai)
- Removed `xattr -cr` unsigned build reference from `.github/workflows/release.yml` release notes template
- Fixed delete button background bleed-through in `ThreadItem.tsx` — increased gradient opacity from 0.55 to 0.85 (active state) and tightened gradient stop from 40% to 35%

## 2026-04-11 19:30 (Dubai)
- Replaced violet/purple colors with brand blue across chat components (kept purple only on agent IconRobot)
  - `ChatPanel.tsx`: ArchivedBanner zigzag SVGs, history icon, and label text — violet → blue
  - `FileMentionPicker.tsx`: SVG file type badge — violet → blue
  - `FileMentionPicker.tsx`: Agent badge background in picker list — purple → blue
  - Preserved `text-purple-400` on `IconRobot` (line 206) as the agent icon color

## 2026-04-11 19:32 (Dubai)
- Reverted agent badge background in `FileMentionPicker.tsx` (line 366) back to `bg-purple-500/20 text-purple-400` — purple/violet stays for all agent icon elements

## 2026-04-11 19:34 (Dubai)
- Added thread name and project name filter dropdowns to the debug panel
  - `debugStore.ts`: Added `threadName` and `projectName` fields to filter state
  - `DebugPanel.tsx`: Imported `useTaskStore`, cross-references `entry.taskId` with tasks to derive unique thread/project names, added two conditional `<select>` dropdowns (only visible when threads/projects exist)
  - Filtering logic applies threadName and projectName alongside existing search, category, and errorsOnly filters — copy all and count reflect combined filtered results
  - `debugStore.test.ts`: Updated initial state to include new filter fields
  - TypeScript compiles clean

## 2026-04-11 19:40 (Dubai)
- Fixed inaccurate +/- line counts in `ChangedFilesSummary.tsx`
  - `computeLineDelta` was counting total lines in old/new text as deletions/additions (e.g., changing 1 line in a 100-line file showed +100/-100)
  - Replaced with line-level diff: splits both texts into lines, computes symmetric difference to count only actual additions and deletions
  - Removed unused `countLines` helper

## 2026-04-11 23:40 (Dubai)
- Added visual archive icon indicator for view-only/old threads in the sidebar
  - `useSidebarTasks.ts`: Added `isArchived` to `SidebarTask` interface, included it in structural sharing comparison and field mapping
  - `ThreadItem.tsx`: Imported `IconArchive`, renders a small archive icon to the right of the thread name when `task.isArchived` is true
  - TypeScript compiles clean