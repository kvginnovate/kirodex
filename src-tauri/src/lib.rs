mod commands;

use commands::{acp, fs_ops, git, kiro_config, pty, settings};
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .manage(settings::SettingsState::default())
        .manage(acp::AcpState::default())
        .manage(pty::PtyState::default())
        .setup(|app| {
            let window = app.get_webview_window("main")
                .ok_or_else(|| "main window not found".to_string())?;
            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                let _ = apply_vibrancy(&window, NSVisualEffectMaterial::Sidebar, None, None);
            }
            log::info!("Kirodex started");
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                log::info!("Window close requested, cleaning up");
                let app = window.app_handle();
                // Kill all ACP connections
                if let Some(acp_state) = app.try_state::<acp::AcpState>() {
                    let mut conns = acp_state.connections.lock().unwrap();
                    for (_, handle) in conns.drain() {
                        let _ = handle.cmd_tx.send(acp::AcpCommand::Kill);
                    }
                }
                // Kill all PTY sessions
                if let Some(pty_state) = app.try_state::<pty::PtyState>() {
                    let mut ptys = pty_state.0.lock().unwrap();
                    ptys.clear();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            // Settings
            settings::get_settings,
            settings::save_settings,
            // File ops
            fs_ops::detect_kiro_cli,
            fs_ops::read_text_file,
            fs_ops::pick_folder,
            fs_ops::open_in_editor,
            fs_ops::open_url,
            fs_ops::list_project_files,
            // Git
            git::git_detect,
            git::git_list_branches,
            git::git_checkout,
            git::git_create_branch,
            git::git_commit,
            git::git_push,
            git::git_stage,
            git::git_revert,
            git::task_diff,
            // ACP
            acp::task_create,
            acp::task_list,
            acp::task_send_message,
            acp::task_pause,
            acp::task_resume,
            acp::task_cancel,
            acp::task_delete,
            acp::task_allow_permission,
            acp::task_deny_permission,
            acp::set_mode,
            acp::list_models,
            acp::probe_capabilities,
            // PTY
            pty::pty_create,
            pty::pty_write,
            pty::pty_resize,
            pty::pty_kill,
            // Kiro config
            kiro_config::get_kiro_config,
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            eprintln!("Failed to start Kirodex: {e}");
            std::process::exit(1);
        });
}
