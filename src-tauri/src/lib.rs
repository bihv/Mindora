use std::fs;

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

#[tauri::command]
fn set_window_title(window: tauri::WebviewWindow, title: String) -> Result<(), String> {
    window
        .set_title(&title)
        .map_err(|error| format!("Unable to set window title '{}': {}", title, error))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read_mindmap_file,
            write_mindmap_file,
            write_binary_file,
            set_window_title
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
