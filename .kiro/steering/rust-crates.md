---
alwaysApply: true
---

# Rust crate preferences

When implementing Rust backend features:

- Use `git2` for all git operations, not `Command::new("git")`
- Use `which::which()` for binary detection, not `Command::new("which")`
- Use `confy` for config persistence, not hand-rolled JSON file I/O
- Use `serde_yaml` for YAML parsing, not string matching
- Use `thiserror` for error types; return `Result<T, AppError>` from Tauri commands
- Exception: `acp.rs` uses `Result<T, String>` due to ACP SDK constraints
- Never `unwrap()` in command handlers; use `?` with proper `From` impls
