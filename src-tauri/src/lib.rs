mod commands;

use commands::{acp, fs_ops, git, kiro_config, pty, settings};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .manage(settings::SettingsState::default())
        .manage(acp::AcpState::default())
        .manage(pty::PtyState::default())
        .invoke_handler(tauri::generate_handler![
            // Settings
            settings::get_settings,
            settings::save_settings,
            // File ops
            fs_ops::detect_kiro_cli,
            fs_ops::read_text_file,
            fs_ops::pick_folder,
            fs_ops::open_in_editor,
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
        .expect("error while running tauri application");
}
