use std::fs;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_mindmap_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|error| format!("Unable to read file '{}': {}", path, error))
}

#[tauri::command]
fn write_mindmap_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents)
        .map_err(|error| format!("Unable to write file '{}': {}", path, error))
}

#[tauri::command]
fn write_binary_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    fs::write(&path, contents)
        .map_err(|error| format!("Unable to write file '{}': {}", path, error))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            read_mindmap_file,
            write_mindmap_file,
            write_binary_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
