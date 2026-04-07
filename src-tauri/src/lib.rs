mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::files::read_mindmap_file,
            commands::files::write_mindmap_file,
            commands::files::write_binary_file,
            commands::window::set_window_title
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
