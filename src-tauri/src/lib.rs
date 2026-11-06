pub mod bundle;

/// Returns a greeting string for IPC connection diagnostics.
///
/// This command serves as a verification probe between the React frontend and
/// the Rust backend to confirm that invoke handlers and serialization operate properly.
///
/// # Frontend Invocation
/// Expected arguments from React:
/// * `name` (`&str` / `string`): The name or identifier of the entity to greet.
///
/// Returns a formatted greeting string: `"Hello, <name>! You've been greeted from Rust!"`.
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Initializes and launches the Tauri desktop application runtime.
///
/// Configures core plugins (opener, native dialogs, filesystem access, process management,
/// and auto-updates) and mounts invoke command handlers for IPC communication with the
/// React frontend before starting the primary application event loop.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            bundle::save_project_bundle,
            bundle::load_project_bundle,
            bundle::check_file_exists
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
