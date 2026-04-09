use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub kiro_bin: Option<String>,
    pub auto_approve: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            kiro_bin: None,
            auto_approve: false,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct StoreData {
    pub settings: Settings,
}

pub struct SettingsState(pub Mutex<StoreData>);

impl Default for SettingsState {
    fn default() -> Self {
        let data = load_store().unwrap_or_default();
        Self(Mutex::new(data))
    }
}

fn store_path() -> PathBuf {
    let dir = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    dir.join("kirodex").join("kirodex-store.json")
}

fn load_store() -> Option<StoreData> {
    let path = store_path();
    let content = fs::read_to_string(path).ok()?;
    serde_json::from_str(&content).ok()
}

fn persist_store(data: &StoreData) -> Result<(), String> {
    let path = store_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_settings(state: tauri::State<'_, SettingsState>) -> Result<Settings, String> {
    let store = state.0.lock().map_err(|e| e.to_string())?;
    Ok(store.settings.clone())
}

#[tauri::command]
pub fn save_settings(
    state: tauri::State<'_, SettingsState>,
    settings: Settings,
) -> Result<(), String> {
    let mut store = state.0.lock().map_err(|e| e.to_string())?;
    store.settings = settings;
    persist_store(&store)
}
