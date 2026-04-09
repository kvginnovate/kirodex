<p align="center">
  <img src="src-tauri/icons/icon.png" width="80" height="80" alt="Kirodex" />
</p>

# Kirodex

A native macOS desktop client for AI coding agents, powered by [Kiro CLI](https://kiro.dev)

---

Kirodex is a desktop app for working with AI coding agents. Think of it as what [OpenAI Codex](https://openai.com/index/codex/) and [T3Code](https://t3.chat/code) do in the browser, but as a native macOS app with a Rust backend.

Instead of running `kiro-cli` in a terminal, you get a dedicated window with a chat UI, task management, syntax-highlighted diffs, an integrated terminal, and git operations.

Built with [Tauri v2](https://v2.tauri.app) (Rust) and React 19 (TypeScript).

## Features

- **Chat interface** for AI agents via the [Agent Client Protocol](https://crates.io/crates/agent-client-protocol) SDK
- **Slash commands** — `/clear`, `/model`, `/agent`, `/plan`, `/chat` with inline model picker and MCP server panels
- **Task management** — create, pause, resume, cancel, delete. Send button swaps to pause while the agent runs.
- **Code diffs** — syntax-highlighted inline and side-by-side views. Click a file operation in chat to jump to that file.
- **Integrated terminal** — PTY emulation with xterm.js
- **Git operations** — branch, stage, commit, push, revert, all through [git2](https://crates.io/crates/git2) (libgit2)
- **Collapsible sidebar** with ⌘B shortcut and skeleton empty state
- **Settings panel** for kiro-cli path, models, and per-project preferences
- **Native macOS** window with vibrancy effects and overlay title bar
- **Syntax highlighting** powered by [Shiki](https://shiki.style) with multiple themes

## Quick start

### Prerequisites

- macOS (uses macOS-specific window APIs)
- [Rust](https://rustup.rs) >= 1.78
- [Bun](https://bun.sh) >= 1.0 (or Node.js >= 20)
- [kiro-cli](https://kiro.dev) installed and in your PATH

### Install and run

```bash
# Clone
git clone https://github.com/thabti/kirodex.git
cd kirodex

# Install dependencies
bun install

# Start dev mode
bun run dev
```

This starts Vite on `localhost:5174`, compiles the Rust backend, and opens the Kirodex window.

> **First build takes a few minutes.** Cargo compiles ~430 crates including libgit2 and libssh2. Subsequent builds are incremental (~2s).

### Don't have Rust?

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

### Production build

```bash
bun run build
```

Produces `Kirodex.app` and `Kirodex_0.1.0_aarch64.dmg` in `src-tauri/target/release/bundle/`. The release binary is ~8 MB on arm64 thanks to LTO and symbol stripping.

> **Note:** The DMG is not code-signed. Recipients need to run `xattr -cr /path/to/Kirodex.app` before opening, or right-click → Open.

## Development

| Command | What it does |
|---------|-------------|
| `bun run dev` | Start dev mode (Vite + Tauri) |
| `bun run build` | Production build (.app + .dmg) |
| `bun run check:ts` | TypeScript type check |
| `bun run check:rust` | Rust type check (`cargo check`) |
| `bun run test:rust` | Run Rust tests |
| `bun run clean` | Remove build artifacts |

Frontend changes hot-reload instantly. Rust changes trigger an incremental recompile (~2s).

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│            React 19 + TypeScript                 │
│   Zustand stores ← invoke() / listen() → IPC    │
└────────────────────────┬────────────────────────┘
                         │ Tauri IPC
┌────────────────────────┴────────────────────────┐
│                    Backend                       │
│                 Rust (Tauri v2)                   │
│                                                  │
│  ┌──────────┐ ┌──────┐ ┌──────┐ ┌───────────┐   │
│  │   ACP    │ │  PTY │ │  Git │ │ Settings  │   │
│  │(kiro-cli)│ │      │ │(git2)│ │  (confy)  │   │
│  └──────────┘ └──────┘ └──────┘ └───────────┘   │
└─────────────────────────────────────────────────┘
```

| Module | What it does |
|--------|-------------|
| `acp.rs` | Spawns `kiro-cli acp` as a subprocess, implements the ACP `Client` trait. Each connection runs on a dedicated OS thread with a single-threaded tokio runtime (the SDK uses `!Send` futures). Communicates with the Tauri async runtime via `mpsc` channels. |
| `git.rs` | Git operations via [`git2`](https://crates.io/crates/git2) (libgit2 bindings). Branch, stage, commit, push, revert, diff — no shell commands. |
| `settings.rs` | Config persistence via [`confy`](https://crates.io/crates/confy). Handles XDG/macOS paths automatically. |
| `fs_ops.rs` | File operations, kiro-cli detection via [`which`](https://crates.io/crates/which), project file listing via git2 index. |
| `kiro_config.rs` | `.kiro/` config discovery. Parses agents, skills, steering rules, and MCP servers. Frontmatter parsed with [`serde_yaml`](https://crates.io/crates/serde_yaml). |
| `pty.rs` | Terminal emulation via [`portable-pty`](https://crates.io/crates/portable-pty). |
| `error.rs` | Shared `AppError` type via [`thiserror`](https://crates.io/crates/thiserror) with `From` impls for git2, IO, JSON, and confy errors. |

## Project structure

```
kirodex/
├── src/renderer/              # React frontend
│   ├── components/            # UI components (chat, sidebar, diff, settings, ...)
│   ├── stores/                # Zustand state (task, settings, diff, debug, kiro)
│   ├── hooks/                 # Custom hooks (useSlashAction)
│   ├── lib/                   # IPC bridge, timeline, utilities
│   ├── types/                 # TypeScript type definitions
│   ├── App.tsx                # Root layout
│   └── main.tsx               # Entry point
├── src-tauri/
│   ├── src/commands/          # Rust command modules (see Architecture)
│   ├── src/lib.rs             # Tauri app setup, command registration
│   ├── Cargo.toml             # Rust dependencies
│   ├── tauri.conf.json        # Window and build config
│   └── capabilities/          # Tauri v2 permissions
├── index.html                 # HTML shell with splash screen
├── vite.config.ts
└── package.json
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| Desktop | [Tauri v2](https://v2.tauri.app) |
| Backend | Rust 2021, git2, thiserror, confy, serde_yaml, which |
| Frontend | React 19, TypeScript 5, Vite 6 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 |
| UI | Radix UI, Lucide icons |
| Code | Shiki (syntax highlighting) |
| Terminal | xterm.js + portable-pty |
| Diff | @pierre/diffs |
| Markdown | react-markdown + remark-gfm |

## Configuration

On first launch, set the kiro-cli path in Settings. The app auto-detects:

1. `~/.local/bin/kiro-cli`
2. `/usr/local/bin/kiro-cli`
3. `~/.kiro/bin/kiro-cli`
4. `/opt/homebrew/bin/kiro-cli`

Falls back to `which kiro-cli` if none match.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Failed to spawn kiro-cli" | Check kiro-cli is installed. Run `kiro-cli --version`. |
| Rust compilation errors | Run `rustup update`. Requires Rust >= 1.78. |
| Frontend type errors | Run `bun install`, then `bun run check:ts`. |
| First build is slow | Normal. Initial `cargo build` compiles ~430 crates. |
| DMG says "damaged" | Run `xattr -cr /path/to/Kirodex.app` (unsigned app). |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Inspiration

Kirodex draws inspiration from [OpenAI Codex](https://openai.com/index/codex/) and [T3Code](https://t3.chat/code) — both pioneering tools for AI-assisted coding. Kirodex brings that experience to a native macOS app backed by the open [Agent Client Protocol](https://github.com/anthropics/agent-client-protocol).

Thank you to the Codex and T3Code teams for pushing the boundaries of what AI-assisted coding can look like. Your work inspired this project.

## Author

**Sabeur Thabti** — [thabti.sabeur@gmail.com](mailto:thabti.sabeur@gmail.com)

## License

MIT

© 2026 Kirodex. All rights reserved.
