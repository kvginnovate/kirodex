use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BranchInfo {
    pub local: Vec<String>,
    pub remotes: Vec<String>,
    pub current_branch: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BranchResult {
    pub success: bool,
    pub message: String,
}

fn run_git(cwd: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(cwd)
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

#[tauri::command]
pub fn git_detect(path: String) -> bool {
    Path::new(&path).join(".git").exists()
}

#[tauri::command]
pub fn git_list_branches(cwd: String) -> Result<BranchInfo, String> {
    let current = run_git(&cwd, &["rev-parse", "--abbrev-ref", "HEAD"]).ok();
    let local_out = run_git(&cwd, &["branch", "--format=%(refname:short)"])?;
    let local: Vec<String> = local_out.lines().map(|s| s.to_string()).filter(|s| !s.is_empty()).collect();
    let remote_out = run_git(&cwd, &["branch", "-r", "--format=%(refname:short)"]).unwrap_or_default();
    let remotes: Vec<String> = remote_out.lines().map(|s| s.to_string()).filter(|s| !s.is_empty()).collect();
    Ok(BranchInfo { local, remotes, current_branch: current })
}

#[tauri::command]
pub fn git_checkout(cwd: String, branch: String) -> BranchResult {
    match run_git(&cwd, &["checkout", &branch]) {
        Ok(msg) => BranchResult { success: true, message: msg },
        Err(msg) => BranchResult { success: false, message: msg },
    }
}

#[tauri::command]
pub fn git_create_branch(cwd: String, branch: String) -> BranchResult {
    match run_git(&cwd, &["checkout", "-b", &branch]) {
        Ok(msg) => BranchResult { success: true, message: msg },
        Err(msg) => BranchResult { success: false, message: msg },
    }
}

#[tauri::command]
pub fn git_commit(cwd: String, message: String) -> Result<String, String> {
    run_git(&cwd, &["commit", "-m", &message])
}

#[tauri::command]
pub fn git_push(cwd: String) -> Result<String, String> {
    run_git(&cwd, &["push"])
}

#[tauri::command]
pub fn git_stage(cwd: String, file_path: String) -> Result<String, String> {
    run_git(&cwd, &["add", &file_path])
}

#[tauri::command]
pub fn git_revert(cwd: String, file_path: String) -> Result<String, String> {
    run_git(&cwd, &["checkout", "--", &file_path])
}

#[tauri::command]
pub fn task_diff(cwd: String) -> Result<String, String> {
    let staged = run_git(&cwd, &["diff", "--cached"]).unwrap_or_default();
    let unstaged = run_git(&cwd, &["diff"]).unwrap_or_default();
    Ok(format!("{}\n{}", staged, unstaged))
}
