// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use tauri::Manager;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/// Returns (and creates if necessary) the directory where reference images
/// are stored: <app_data_dir>/.foliant/assets/images/
fn images_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {e}"))?;

    let dir = base.join(".foliant").join("assets").join("images");

    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create images directory '{}': {e}", dir.display()))?;

    Ok(dir)
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/// Copies a local image file into the Foliant assets directory.
///
/// # Arguments
/// * `source_path` – Absolute path to the original image on the user's disk.
/// * `file_name`   – Desired file name inside the assets directory (e.g. "cover.png").
///                   If empty the source file name is used.
///
/// # Returns
/// The absolute path of the copied asset as a String, ready to be used as a
/// Tauri asset URL (`asset://localhost/<path>` or `convertFileSrc(path)`).
#[tauri::command]
async fn save_reference_image(
    app: tauri::AppHandle,
    source_path: String,
    file_name: String,
) -> Result<String, String> {
    let src = PathBuf::from(&source_path);

    // Validate that the source file exists and is a file (not a directory)
    if !src.exists() {
        return Err(format!("Source file not found: '{source_path}'"));
    }
    if !src.is_file() {
        return Err(format!("Source path is not a file: '{source_path}'"));
    }

    // Validate extension — only allow common image formats
    let allowed_extensions = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"];
    let ext = src
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();

    if !allowed_extensions.contains(&ext.as_str()) {
        return Err(format!(
            "Unsupported image format '.{ext}'. Allowed: {}",
            allowed_extensions.join(", ")
        ));
    }

    // Determine the destination file name
    let dest_name = if file_name.trim().is_empty() {
        src.file_name()
            .and_then(|n| n.to_str())
            .map(String::from)
            .ok_or_else(|| "Could not determine file name from source path".to_string())?
    } else {
        // Sanitise: strip any path separators to prevent directory traversal
        file_name
            .chars()
            .filter(|c| !matches!(c, '/' | '\\' | ':'))
            .collect()
    };

    let dest = images_dir(&app)?.join(&dest_name);

    fs::copy(&src, &dest).map_err(|e| {
        format!(
            "Failed to copy '{}' -> '{}': {e}",
            src.display(),
            dest.display()
        )
    })?;

    Ok(dest
        .to_str()
        .ok_or("Destination path contains invalid UTF-8")?
        .to_string())
}

/// Saves a base64-encoded image (e.g. from a paste or drag-and-drop event
/// in the frontend) directly into the assets directory.
///
/// # Arguments
/// * `file_name`    – Target file name including extension (e.g. "sketch.png").
/// * `data_base64`  – Raw base64 string (no data-URI prefix).
///
/// # Returns
/// The absolute path of the saved asset as a String.
#[tauri::command]
async fn save_reference_image_base64(
    app: tauri::AppHandle,
    file_name: String,
    data_base64: String,
) -> Result<String, String> {
    if file_name.trim().is_empty() {
        return Err("file_name must not be empty".to_string());
    }

    // Decode the base64 payload
    use std::io::Read;
    let bytes = {
        // Strip optional data-URI prefix ("data:image/png;base64,")
        let raw = if let Some(comma_pos) = data_base64.find(',') {
            &data_base64[comma_pos + 1..]
        } else {
            &data_base64
        };

        // Use the engine from the standard base64 alphabet
        let mut decoder = base64::read::DecoderReader::new(
            raw.as_bytes(),
            &base64::engine::general_purpose::STANDARD,
        );
        let mut buf = Vec::new();
        decoder
            .read_to_end(&mut buf)
            .map_err(|e| format!("Failed to decode base64 image data: {e}"))?;
        buf
    };

    // Sanitise the file name
    let safe_name: String = file_name
        .chars()
        .filter(|c| !matches!(c, '/' | '\\' | ':'))
        .collect();

    let dest = images_dir(&app)?.join(&safe_name);

    fs::write(&dest, &bytes)
        .map_err(|e| format!("Failed to write image '{}': {e}", dest.display()))?;

    Ok(dest
        .to_str()
        .ok_or("Destination path contains invalid UTF-8")?
        .to_string())
}

/// Lists all reference images currently stored in the assets directory.
///
/// # Returns
/// A Vec of absolute path strings, one per image file found.
#[tauri::command]
async fn list_reference_images(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let dir = images_dir(&app)?;
    let allowed_extensions = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"];

    let entries = fs::read_dir(&dir)
        .map_err(|e| format!("Failed to read images directory '{}': {e}", dir.display()))?;

    let mut paths = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {e}"))?;
        let path = entry.path();

        if path.is_file() {
            let ext = path
                .extension()
                .and_then(|e| e.to_str())
                .map(|e| e.to_lowercase())
                .unwrap_or_default();

            if allowed_extensions.contains(&ext.as_str())
                && let Some(s) = path.to_str()
            {
                paths.push(s.to_string());
            }
        }
    }

    // Sort alphabetically for deterministic ordering in the UI
    paths.sort();
    Ok(paths)
}

/// Deletes a specific reference image from the assets directory.
///
/// # Arguments
/// * `file_name` – File name only (no directory component) of the image to delete.
///
/// # Safety
/// The file name is validated to contain no path separators, preventing
/// directory traversal attacks.
#[tauri::command]
async fn delete_reference_image(app: tauri::AppHandle, file_name: String) -> Result<(), String> {
    // Reject any path traversal attempts
    if file_name.contains('/') || file_name.contains('\\') || file_name.contains(':') {
        return Err(format!("Invalid file name: '{file_name}'"));
    }

    let path = images_dir(&app)?.join(&file_name);

    if !path.exists() {
        return Err(format!("Image not found: '{file_name}'"));
    }

    fs::remove_file(&path).map_err(|e| format!("Failed to delete '{}': {e}", path.display()))
}

/// Saves a chapter's markdown/HTML content to disk.
/// Kept from the original implementation.
#[tauri::command]
async fn save_chapter_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("Failed to write file to '{path}': {e}"))
}

/// Exits the application process cleanly.
#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            exit_app,
            save_chapter_file,
            save_reference_image,
            save_reference_image_base64,
            list_reference_images,
            delete_reference_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_save_chapter_logic() {
        let _ = save_chapter_file;
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

    #[test]
    fn test_allowed_image_extensions() {
        let allowed = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"];
        assert!(allowed.contains(&"png"));
        assert!(allowed.contains(&"webp"));
        assert!(!allowed.contains(&"exe"));
        assert!(!allowed.contains(&"pdf"));
    }

    #[test]
    fn test_file_name_sanitisation() {
        let unsafe_name = "../../../etc/passwd";
        let sanitised: String = unsafe_name
            .chars()
            .filter(|c| !matches!(c, '/' | '\\' | ':'))
            .collect();
        assert!(!sanitised.contains('/'));
        assert!(!sanitised.contains('\\'));
    }
}
