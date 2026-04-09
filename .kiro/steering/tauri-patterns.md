---
alwaysApply: true
---

# Tauri v2 patterns

- CSP blocks inline `onclick` and `<script>` tags. Use `addEventListener` from bundled JS.
- Use `app.try_state::<T>()` to access managed state from closures, never clone state.
- Use `emit()` (global) not `emit_to("main", ...)` for single-window apps.
- Kill ACP connections and PTY sessions in `on_window_event(CloseRequested)`.
- Guard `probe_capabilities` with `AtomicBool` to prevent concurrent calls.
- Use hex colors in CSS, not `oklch()` — older WebKit in Tauri may not support it.
- Add `class="dark"` to `<html>` in `index.html` to prevent white flash before JS loads.
