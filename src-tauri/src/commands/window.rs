#[tauri::command]
pub fn set_window_title(window: tauri::WebviewWindow, title: String) -> Result<(), String> {
    window
        .set_title(&title)
        .map_err(|error| format!("Unable to set window title '{}': {}", title, error))
}
