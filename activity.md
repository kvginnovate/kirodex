# Kirodex Tauri Activity Log

## 2026-04-12 02:43 GST (Dubai)

### Docs: Sync AGENTS.md with CLAUDE.md

Copied CLAUDE.md to AGENTS.md so both files have identical content. AGENTS.md was missing the project overview, tech stack, structure, conventions, and engineering learnings sections.

**Modified:** AGENTS.md

## 2026-04-12 02:16 (Dubai)

**Task:** Switch Kirodex from native titlebar overlay to custom traffic lights (Option B)

**Changes made:**
- **tauri.conf.json:** Removed `titleBarStyle: "Overlay"`, `hiddenTitle: true`, `macOSPrivateApi: true`
- **Cargo.toml:** Removed `cocoa` dependency and `macos-private-api` feature from tauri
- **lib.rs:** Replaced Sidebar vibrancy + cocoa NSColor hack with simple `HudWindow` vibrancy + 12px corner radius
- **tailwind.css:** Fixed `#root` to `100vh` with `border-radius: 12px`, added macOS traffic light CSS styles
- **Created 7 components** in `unified-title-bar/`: TrafficLights, WindowsControls, TitleBarToolbar, UnifiedTitleBarMacOS/Windows/Linux, index
- **AppHeader.tsx:** Removed `pl-[90px]` hack, wrapped content in `UnifiedTitleBar`
- **cargo check:** Passed cleanly

## 2026-04-12 02:19 (Dubai)

Removed macOS private API usage and custom title bar styling. Switched to standard window decorations with HudWindow vibrancy and 12px corner radius.

Changes made:
- `src-tauri/tauri.conf.json`: Removed `macOSPrivateApi: true`, `titleBarStyle: "Overlay"`, and `hiddenTitle: true` from window config
- `src-tauri/Cargo.toml`: Confirmed `tauri` features already empty (`[]`); removed `cocoa = "0.26.1"` macOS dependency
- `src-tauri/src/lib.rs`: Replaced Sidebar vibrancy + cocoa NSColor background hack with single `HudWindow` vibrancy call (corner radius 12.0)
- `src/tailwind.css`: Changed `#root` from `height: calc(100% - 28px)` to `100vh`/`100vw` with `border-radius: 12px`, `background: var(--background)`, and `border: 0.5px solid var(--border)`
