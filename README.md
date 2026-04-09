# Kirodex (Tauri)

A macOS desktop client for interacting with AI coding agents through the Kiro CLI, built with Tauri v2 + React + TypeScript.

## Prerequisites

- **Rust** >= 1.78 + **Cargo** (install via [rustup](https://rustup.rs))
- **Node.js** >= 20 or **Bun** >= 1.0
- **kiro-cli** installed and in your PATH (the app auto-detects common locations)
- **macOS** (the app uses macOS-specific window APIs)

## Installing Rust and Cargo

Rust and Cargo (Rust's package manager) are installed together via [rustup](https://rustup.rs), the official Rust toolchain installer.

### macOS / Linux

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Follow the prompts and select option 1 (default installation). When it finishes, load the environment in your current shell:

```bash
source "$HOME/.cargo/env"
```

This line is also added to your shell profile (`~/.zshrc` or `~/.bashrc`) automatically, so new terminals pick it up.

### Verify the installation

```bash
rustc --version    # e.g. rustc 1.94.1
cargo --version    # e.g. cargo 1.94.1
```

Both commands should print a version >= 1.78.

### Updating Rust

```bash
rustup update
```

### Uninstalling

```bash
rustup self uninstall
```

## Setup

```bash
# Clone and switch to the tauri-migration branch
git clone <repo-url> kantoku-tauri
cd kantoku-tauri
git checkout tauri-migration

# Install frontend dependencies
bun install    # or: npm install

# Fetch Rust dependencies (optional, happens automatically on first build)
cd src-tauri && cargo fetch && cd ..
```

## Development

```bash
# Start the app in dev mode (hot-reload for frontend, auto-rebuild for Rust)
bun run dev
```

This runs `cargo tauri dev` which:
1. Starts the Vite dev server on `http://localhost:5173`
2. Compiles the Rust backend
3. Opens the Kirodex window pointing at the dev server

Changes to `src/renderer/**` hot-reload instantly. Changes to `src-tauri/src/**` trigger a Rust recompile (takes a few seconds after the first build).

## Build

```bash
# Production build (release binary)
bun run build
```

This runs `cargo tauri build` which:
1. Builds the frontend with `vite build` into `dist/`
2. Compiles the Rust backend in release mode (optimized, stripped)
3. Outputs the binary at `src-tauri/target/release/kirodex`

The release binary is ~8.4 MB (arm64 macOS).

### Build individual layers

```bash
# Frontend only
bun run build:renderer

# Rust only (debug)
cd src-tauri && cargo build

# Rust only (release)
cd src-tauri && cargo build --release

# Type check frontend
npx tsc --noEmit

# Check Rust compiles without building
cd src-tauri && cargo check
```

## Project structure

```
kantoku-tauri/
├── src/
│   ├── renderer/           # React frontend (same as Electron version)
│   │   ├── components/     # UI components (chat, sidebar, settings, etc.)
│   │   ├── stores/         # Zustand state stores
│   │   ├── lib/
│   │   │   ├── ipc.ts      # Tauri invoke/listen bridge (replaces Electron preload)
│   │   │   └── utils.ts
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── tailwind.css
├── src-tauri/
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── lib.rs          # Tauri app setup, command registration
│   │   └── commands/
│   │       ├── acp.rs      # ACP protocol (kiro-cli subprocess, Client trait)
│   │       ├── settings.rs # JSON settings store
│   │       ├── git.rs      # Git operations
│   │       ├── fs_ops.rs   # File ops, kiro-cli detection, editor launch
│   │       ├── pty.rs      # Terminal (portable-pty)
│   │       └── kiro_config.rs  # .kiro/ config discovery
│   ├── Cargo.toml
│   ├── tauri.conf.json     # Window config, plugins, build settings
│   ├── capabilities/       # Tauri v2 permission capabilities
│   └── build.rs
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## Architecture

The app has two layers:

**Frontend** (React + TypeScript): Identical component tree to the Electron version. Communicates with the backend via `@tauri-apps/api` `invoke()` for commands and `listen()` for events.

**Backend** (Rust): Replaces Electron's Node.js main process. Key modules:

- **acp.rs**: Spawns `kiro-cli acp` as a subprocess, implements the ACP `Client` trait using the [`agent-client-protocol`](https://crates.io/crates/agent-client-protocol) crate. Each connection runs on a dedicated OS thread with a single-threaded tokio runtime (required because the ACP SDK uses `!Send` futures). Communicates with the Tauri async runtime via `mpsc` channels.

- **settings.rs**: Persists settings to `~/Library/Application Support/kantoku/kantoku-store.json`.

- **git.rs**: All git operations via `std::process::Command`.

- **pty.rs**: Terminal emulation via `portable-pty`.

## Configuration

On first launch, go to Settings and set the kiro-cli path. The app checks these locations automatically:

1. `~/.local/bin/kiro-cli`
2. `/usr/local/bin/kiro-cli`
3. `~/.kiro/bin/kiro-cli`
4. `/opt/homebrew/bin/kiro-cli`

Falls back to `which kiro-cli` if none are found.

## Troubleshooting

**"Failed to spawn kiro-cli"**: Make sure kiro-cli is installed and the path in Settings is correct. Run `kiro-cli --version` in your terminal to verify.

**Rust compilation errors**: Run `rustup update` to get the latest Rust toolchain. The ACP SDK requires Rust >= 1.78.

**Frontend type errors**: Run `bun install` to ensure dependencies are up to date, then `npx tsc --noEmit` to check.

**First build is slow**: The initial `cargo build` downloads and compiles ~400 crates. Subsequent builds are incremental and take seconds.
