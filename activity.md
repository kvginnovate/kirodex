# Activity Log

## 2026-04-09 03:27 GST (Dubai, UTC+4)

### Added README.md with build/run guide

- Full setup, dev, and build instructions
- Project structure documentation
- Architecture overview (ACP !Send bridge, per-connection threads)
- Troubleshooting section
- Test build verified: `cargo tauri build` produced 8.4 MB arm64 release binary

## 2026-04-09 03:16 GST (Dubai, UTC+4)

### Full ACP protocol implementation with agent-client-protocol Rust SDK

Replaced stub ACP commands with real implementation using `agent-client-protocol` v0.10.4 crate.

**Architecture:**
- Each ACP connection runs on a dedicated OS thread with single-threaded tokio runtime + LocalSet (required because SDK futures are !Send)
- Main thread communicates via mpsc channels (AcpCommand enum: Prompt, Cancel, SetMode, Kill)
- Permission requests bridge from !Send ACP thread to Tauri async runtime via oneshot channels

**KantokuClient (Client trait impl):**
- `session_notification`: Parses sessionUpdate type and emits matching frontend events (message_chunk, thinking_chunk, tool_call, tool_call_update, plan_update, usage_update)
- `request_permission`: Auto-approve logic (allow_once > allow_always > first option), falls back to UI prompt via permission_resolvers
- `ext_notification`: MCP server tracking (_kiro.dev/mcp/server_initialized, _kiro.dev/mcp/oauth_request)
- `read_text_file` / `write_text_file`: Direct filesystem access

**Tauri commands (12 total):**
- task_create, task_list, task_send_message, task_pause, task_resume, task_cancel, task_delete
- task_allow_permission, task_deny_permission (with option resolution matching Electron)
- set_mode, list_models (temp connection), probe_capabilities

**Frontend ipc.ts updated:**
- Added: detectKiroCli, gitListBranches, gitCheckout, gitCreateBranch, gitStage, gitRevert
- Added: setMode, listModels, probeCapabilities, selectPermissionOption
- Added: onMcpUpdate, onMcpConnecting event listeners
- All functions now have full feature parity with Electron version

**Build status:** cargo check ✅ (0 errors, 0 warnings), tsc ✅, vite build ✅

## 2026-04-09 02:56 GST (Dubai, UTC+4)

### Tauri v2 migration complete

Migrated kantoku-electron to Tauri v2 in an isolated git worktree (`tauri-migration` branch).

**What was done:**
1. Created git worktree at `/Users/sabeur/Documents/work/GitHub/personal/kantoku-tauri`
2. Installed Rust 1.94.1 and tauri-cli 2.10.1
3. Initialized Tauri v2 project structure (Cargo.toml, tauri.conf.json, capabilities)
4. Created 6 Rust command modules (settings, fs_ops, git, acp stubs, pty, kiro_config)
5. Updated package.json: removed Electron/node-pty/tsdown, added @tauri-apps/api and @tauri-apps/cli
6. Updated vite.config.ts for Tauri (strictPort, envPrefix, clearScreen)
7. Rewrote ipc.ts: replaced Electron preload bridge with Tauri invoke/listen
8. Cleaned index.html (removed Electron CSP)
9. Deleted all Electron files (main.ts, preload.ts, ACPConnection.ts, ACPManager.ts, tsdown.config.ts)
10. Updated .gitignore for src-tauri/target

**Build status:** cargo check ✅, tsc --noEmit ✅, vite build ✅

**Known limitations:**
- ACP commands are stubs; real kiro-cli subprocess protocol needs Rust implementation
- PTY uses portable-pty (needs runtime testing)
- Event emission from Rust backend not yet wired for streaming (message chunks, thinking, tool calls)

## 2026-04-08 23:05 (Dubai)

### Created all 6 Tauri v2 backend command files

Created the following files in `src-tauri/src/commands/`:

| File | Lines | Description |
|------|-------|-------------|
| `settings.rs` | 71 | JsonStore port: `get_settings`, `save_settings` with `Mutex<StoreData>` managed state. Persists to `kantoku-store.json` in app data dir. |
| `fs_ops.rs` | 49 | `detect_kiro_cli` (multi-path + `which` fallback), `read_text_file`, `pick_folder` (tauri_plugin_dialog), `open_in_editor` |
| `git.rs` | 89 | Full git IPC port: `git_detect`, `git_list_branches`, `git_checkout`, `git_create_branch`, `git_commit`, `git_push`, `git_stage`, `git_revert`, `task_diff` |
| `acp.rs` | 145 | Stub ACP commands with in-memory `Mutex<HashMap>` task store: `task_create`, `task_list`, `task_send_message`, `task_pause`, `task_resume`, `task_cancel`, `task_delete`, `task_allow_permission`, `task_deny_permission` |
| `pty.rs` | 100 | PTY terminal via `portable-pty`: `pty_create` (spawns shell + reader thread emitting `pty-data-{id}` events), `pty_write`, `pty_resize`, `pty_kill` |
| `kiro_config.rs` | 177 | Kiro config discovery: scans `~/.kiro/` (global) and `project/.kiro/` (local) for agents, skills, steering rules, MCP servers. Parses frontmatter. |

Also fixed:
- Added `macOSPrivateApi: true` to `tauri.conf.json` to match `macos-private-api` Cargo feature
- Created placeholder `icons/icon.png` for build to pass

Build status: `cargo check` passes with zero errors and zero warnings.
