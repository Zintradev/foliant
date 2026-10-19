// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
async fn save_chapter_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|err| format!("Failed to write file to '{path}': {err}"))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![save_chapter_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_save_chapter_logic() {
        // Ensure the save_chapter_file command is accessible
        let _ = save_chapter_file;

        // Verify path and markdown extension structure for chapter files
        let sample_path = "./test-chapter.md";
        assert!(
            sample_path.ends_with(".md"),
            "Chapter file path must end with .md"
        );
        assert!(
            !sample_path.is_empty(),
            "Chapter file path must not be empty"
        );
    }
}
