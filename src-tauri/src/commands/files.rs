use std::fs;

#[tauri::command]
pub fn read_mindmap_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|error| format!("Unable to read file '{}': {}", path, error))
}

#[tauri::command]
pub fn write_mindmap_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents)
        .map_err(|error| format!("Unable to write file '{}': {}", path, error))
}

#[tauri::command]
pub fn write_binary_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    fs::write(&path, contents)
        .map_err(|error| format!("Unable to write file '{}': {}", path, error))
}
