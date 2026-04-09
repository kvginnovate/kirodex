use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub fn detect_kiro_cli() -> Option<String> {
    let candidates = [
        dirs::home_dir().map(|h| h.join(".local/bin/kiro-cli")),
        Some(PathBuf::from("/usr/local/bin/kiro-cli")),
        dirs::home_dir().map(|h| h.join(".kiro/bin/kiro-cli")),
        Some(PathBuf::from("/opt/homebrew/bin/kiro-cli")),
    ];
    for candidate in candidates.into_iter().flatten() {
        if candidate.exists() {
            return Some(candidate.to_string_lossy().to_string());
        }
    }
    Command::new("which")
        .arg("kiro-cli")
        .output()
        .ok()
        .filter(|o| o.status.success())
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .filter(|s| !s.is_empty())
}

#[tauri::command]
pub fn read_text_file(path: String) -> Option<String> {
    fs::read_to_string(path).ok()
}

#[tauri::command]
pub async fn pick_folder(app: tauri::AppHandle) -> Option<String> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog().file().pick_folder(move |folder| {
        let _ = tx.send(folder.map(|f| f.to_string()));
    });
    rx.await.ok().flatten()
}

#[tauri::command]
pub fn open_in_editor(path: String, editor: String) -> Result<(), String> {
    Command::new(&editor)
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Failed to open editor '{}': {}", editor, e))?;
    Ok(())
}
