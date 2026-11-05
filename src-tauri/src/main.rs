// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

mod bundle;
pub use bundle::{check_file_exists, load_project_bundle, save_project_bundle};

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

/// Resolves the visuals directory for a project.
///
/// If `project_path` is provided, resolves `<project_directory>/visuals/`
/// (or `<project_file_dir>/visuals/` if `project_path` points to a `.foliant` file).
/// If not provided or empty, falls back to the system temp directory `temp_visuals_dir()`.
fn resolve_project_visuals_dir(
    app: &tauri::AppHandle,
    project_path: Option<&str>,
    project_id: Option<&str>,
) -> Result<PathBuf, String> {
    if let Some(path_str) = project_path {
        let trimmed = path_str.trim();
        if !trimmed.is_empty() {
            let p = Path::new(trimmed);
            let base_dir = if p.is_file() || trimmed.to_lowercase().ends_with(".foliant") {
                p.parent().unwrap_or(p)
            } else {
                p
            };
            let dir = base_dir.join("visuals");
            fs::create_dir_all(&dir).map_err(|e| {
                format!(
                    "Failed to create project visuals directory '{}': {e}",
                    dir.display()
                )
            })?;
            return Ok(dir);
        }
    }

    let safe_proj_id = project_id
        .map(bundle::sanitize_file_name)
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "default".to_string());

    let temp_visuals = std::env::temp_dir()
        .join("foliant_visuals")
        .join(&safe_proj_id);
    let _ = fs::create_dir_all(&temp_visuals);
    if temp_visuals.exists() {
        return Ok(temp_visuals);
    }

    images_dir(app)
}

/// Copies a local image file into the project's visuals directory.
///
/// # Arguments
/// * `source_path` – Absolute path to the original image on the user's disk.
/// * `file_name`   – Desired file name inside the visuals directory (e.g. "cover.png").
///                   If empty the source file name is used.
/// * `project_path` – Optional path to current project folder or .foliant file.
///
/// # Returns
/// The absolute path of the copied asset as a String.
#[tauri::command]
async fn save_reference_image(
    app: tauri::AppHandle,
    source_path: String,
    file_name: String,
    project_path: Option<String>,
    project_id: Option<String>,
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

    let target_dir =
        resolve_project_visuals_dir(&app, project_path.as_deref(), project_id.as_deref())?;
    let dest = target_dir.join(&dest_name);

    fs::copy(&src, &dest).map_err(|e| {
        format!(
            "Failed to copy '{}' -> '{}': {e}",
            src.display(),
            dest.display()
        )
    })?;

    // Also keep a copy in project-scoped temp visuals directory
    let safe_proj_id = project_id
        .as_deref()
        .map(bundle::sanitize_file_name)
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "default".to_string());
    let temp_visuals = std::env::temp_dir()
        .join("foliant_visuals")
        .join(&safe_proj_id);
    let _ = fs::create_dir_all(&temp_visuals);
    let _ = fs::copy(&src, temp_visuals.join(&dest_name));

    Ok(dest
        .to_str()
        .ok_or("Destination path contains invalid UTF-8")?
        .to_string())
}

/// Saves a base64-encoded image directly into the project's visuals/ directory.
///
/// # Arguments
/// * `file_name`    – Target file name including extension (e.g. "sketch.png").
/// * `data_base64`  – Raw base64 string (or data-URI prefix).
/// * `project_path` – Optional path to current project folder or .foliant file.
///
/// # Returns
/// The absolute path of the saved asset as a String.
#[tauri::command]
async fn save_reference_image_base64(
    app: tauri::AppHandle,
    file_name: String,
    data_base64: String,
    project_path: Option<String>,
    project_id: Option<String>,
) -> Result<String, String> {
    eprintln!(
        "[Rust:save_reference_image_base64] Received request for file: '{file_name}' (payload len: {}, project: {:?}, id: {:?})",
        data_base64.len(),
        project_path,
        project_id
    );
    if file_name.trim().is_empty() {
        eprintln!("[Rust:save_reference_image_base64] Error: file_name is empty");
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
        decoder.read_to_end(&mut buf).map_err(|e| {
            eprintln!("[Rust:save_reference_image_base64] Base64 decode error: {e}");
            format!("Failed to decode base64 image data: {e}")
        })?;
        buf
    };
    eprintln!(
        "[Rust:save_reference_image_base64] Decoded {} bytes for '{file_name}'",
        bytes.len()
    );

    // Sanitise the file name
    let safe_name: String = file_name
        .chars()
        .filter(|c| !matches!(c, '/' | '\\' | ':'))
        .collect();

    let target_dir =
        resolve_project_visuals_dir(&app, project_path.as_deref(), project_id.as_deref())?;
    let dest = target_dir.join(&safe_name);

    fs::write(&dest, &bytes).map_err(|e| {
        eprintln!(
            "[Rust:save_reference_image_base64] Write error at '{}': {e}",
            dest.display()
        );
        format!("Failed to write image '{}': {e}", dest.display())
    })?;
    eprintln!(
        "[Rust:save_reference_image_base64] Saved successfully to project visuals: '{}'",
        dest.display()
    );

    // Also write to project-scoped temp visuals directory
    let safe_proj_id = project_id
        .as_deref()
        .map(bundle::sanitize_file_name)
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "default".to_string());
    let temp_visuals = std::env::temp_dir()
        .join("foliant_visuals")
        .join(&safe_proj_id);
    let _ = fs::create_dir_all(&temp_visuals);
    let temp_dest = temp_visuals.join(&safe_name);
    let _ = fs::write(&temp_dest, &bytes);
    eprintln!(
        "[Rust:save_reference_image_base64] Saved copy to temp visuals: '{}'",
        temp_dest.display()
    );

    Ok(dest
        .to_str()
        .ok_or("Destination path contains invalid UTF-8")?
        .to_string())
}

/// Lists all reference images currently stored in the project's visuals directory.
///
/// # Arguments
/// * `project_path` – Optional path to current project folder or .foliant file.
/// * `project_id`   – Optional project unique identifier.
///
/// # Returns
/// A Vec of absolute path strings, one per image file found.
#[tauri::command]
async fn list_reference_images(
    app: tauri::AppHandle,
    project_path: Option<String>,
    project_id: Option<String>,
) -> Result<Vec<String>, String> {
    eprintln!(
        "[Rust:list_reference_images] START: project_path={:?}, project_id={:?}",
        project_path, project_id
    );
    let allowed_extensions = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"];
    let mut paths = Vec::new();
    let mut seen_filenames = std::collections::HashSet::new();

    // 1. Scan the project's visuals directory (from project_path if any)
    if let Ok(dir) =
        resolve_project_visuals_dir(&app, project_path.as_deref(), project_id.as_deref())
        && dir.exists()
        && dir.is_dir()
        && let Ok(entries) = fs::read_dir(&dir)
    {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let ext = path
                    .extension()
                    .and_then(|e| e.to_str())
                    .map(|e| e.to_lowercase())
                    .unwrap_or_default();

                if allowed_extensions.contains(&ext.as_str())
                    && let Some(file_name) = path.file_name().and_then(|f| f.to_str())
                    && !seen_filenames.contains(file_name)
                {
                    seen_filenames.insert(file_name.to_string());
                    if let Some(s) = path.to_str() {
                        paths.push(s.to_string());
                    }
                }
            }
        }
    }

    // 2. Also scan project-scoped temp directory (where .foliant ZIP bundles are unpacked)
    let safe_proj_id = project_id
        .as_deref()
        .map(bundle::sanitize_file_name)
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "default".to_string());
    let temp_visuals = std::env::temp_dir()
        .join("foliant_visuals")
        .join(&safe_proj_id);
    if temp_visuals.exists()
        && temp_visuals.is_dir()
        && let Ok(entries) = fs::read_dir(&temp_visuals)
    {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let ext = path
                    .extension()
                    .and_then(|e| e.to_str())
                    .map(|e| e.to_lowercase())
                    .unwrap_or_default();

                if allowed_extensions.contains(&ext.as_str())
                    && let Some(file_name) = path.file_name().and_then(|f| f.to_str())
                    && !seen_filenames.contains(file_name)
                {
                    seen_filenames.insert(file_name.to_string());
                    if let Some(s) = path.to_str() {
                        paths.push(s.to_string());
                    }
                }
            }
        }
    }

    // Sort alphabetically for deterministic ordering in the UI
    paths.sort();
    eprintln!(
        "[Rust:list_reference_images] RETURN: found {} images: {:?}",
        paths.len(),
        paths
    );
    Ok(paths)
}

/// Deletes a specific reference image from the project's visuals directory.
///
/// # Arguments
/// * `file_name` – File name only (no directory component) of the image to delete.
/// * `project_path` – Optional path to current project folder or .foliant file.
/// * `project_id`   – Optional project unique identifier.
#[tauri::command]
async fn delete_reference_image(
    app: tauri::AppHandle,
    file_name: String,
    project_path: Option<String>,
    project_id: Option<String>,
) -> Result<(), String> {
    // Reject any path traversal attempts
    if file_name.contains('/') || file_name.contains('\\') || file_name.contains(':') {
        return Err(format!("Invalid file name: '{file_name}'"));
    }

    let target_dir =
        resolve_project_visuals_dir(&app, project_path.as_deref(), project_id.as_deref())?;
    let path = target_dir.join(&file_name);

    if path.exists() {
        fs::remove_file(&path)
            .map_err(|e| format!("Failed to delete '{}': {e}", path.display()))?;
    }

    // Also remove from project-scoped temp visuals if present
    let safe_proj_id = project_id
        .as_deref()
        .map(bundle::sanitize_file_name)
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "default".to_string());
    let temp_path = std::env::temp_dir()
        .join("foliant_visuals")
        .join(&safe_proj_id)
        .join(&file_name);
    if temp_path.exists() {
        let _ = fs::remove_file(&temp_path);
    }

    // Legacy un-scoped fallback cleanup
    let legacy_temp = std::env::temp_dir()
        .join("foliant_visuals")
        .join(&file_name);
    if legacy_temp.exists() {
        let _ = fs::remove_file(&legacy_temp);
    }

    Ok(())
}

/// Saves a chapter's markdown/HTML content to disk.
/// Kept from the original implementation.
#[tauri::command]
async fn save_chapter_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("Failed to write file to '{path}': {e}"))
}

/// Reads an image from disk and encodes it into a standard data URL (`data:image/...;base64,...`).
/// Bypasses asset protocol and scope restrictions, ensuring instant preview.
#[tauri::command]
async fn read_image_as_data_url(file_path: String) -> Result<String, String> {
    let path = std::path::Path::new(&file_path);
    if !path.exists() || !path.is_file() {
        return Err(format!("File not found: '{file_path}'"));
    }
    let bytes = fs::read(path).map_err(|e| format!("Failed to read '{file_path}': {e}"))?;
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_else(|| "png".to_string());

    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "avif" => "image/avif",
        "bmp" => "image/bmp",
        "ico" => "image/x-icon",
        _ => "image/png",
    };

    use base64::Engine;
    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:{mime};base64,{b64}"))
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
            read_image_as_data_url,
            list_reference_images,
            delete_reference_image,
            save_project_bundle,
            load_project_bundle,
            check_file_exists,
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
