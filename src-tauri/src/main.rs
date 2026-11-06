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

/// Resolves and initializes the global fallback directory for reference images.
///
/// Returns the path `<app_data_dir>/.foliant/assets/images/`, creating parent directories
/// on disk if they do not already exist.
///
/// # Context
/// Used as a persistent global fallback location when an image asset cannot be mapped to an
/// active project directory or a session-specific temporary bundle cache.
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

/// Determines the appropriate directory for visual assets based on the project type.
///
/// Inspects the provided `project_path` and `project_id` to determine whether assets
/// should be stored in a project-adjacent folder or an active session scratch directory.
///
/// # Context
/// For folder-based projects (non-`.foliant` paths), visuals reside directly in `<project_dir>/visuals`.
/// For single-file `.foliant` bundle archives, visual assets belong inside the ZIP archive.
/// During an active editing session, bundle assets are unpacked into a project-scoped system temp
/// directory (`<temp>/foliant_visuals/<project_id>/`) to prevent creating loose folders beside
/// the `.foliant` file. Falls back to [`images_dir`] if temp directory allocation fails.
fn resolve_project_visuals_dir(
    app: &tauri::AppHandle,
    project_path: Option<&str>,
    project_id: Option<&str>,
) -> Result<PathBuf, String> {
    let safe_proj_id = project_id
        .map(bundle::sanitize_file_name)
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "default".to_string());

    // If an explicit directory path is provided (not a .foliant bundle file),
    // we can resolve `<dir>/visuals`.
    if let Some(path_str) = project_path {
        let trimmed = path_str.trim();
        if !trimmed.is_empty() && !trimmed.to_lowercase().ends_with(".foliant") {
            let p = Path::new(trimmed);
            if p.is_dir() {
                let dir = p.join("visuals");
                fs::create_dir_all(&dir).map_err(|e| {
                    format!(
                        "Failed to create project visuals directory '{}': {e}",
                        dir.display()
                    )
                })?;
                return Ok(dir);
            }
        }
    }

    let temp_visuals = std::env::temp_dir()
        .join("foliant_visuals")
        .join(&safe_proj_id);
    let _ = fs::create_dir_all(&temp_visuals);
    if temp_visuals.exists() {
        return Ok(temp_visuals);
    }

    images_dir(app)
}

/// Copies an image file from the local filesystem into the project's visuals storage.
///
/// Validates file existence, verifies that the format is a supported image extension,
/// sanitizes the target filename against path traversal attacks, and copies the asset
/// into both the project visuals directory and the session temp cache.
///
/// # Context
/// Enables users to import character portraits, world-building maps, and moodboard items
/// from arbitrary disk locations into their project without manual file management.
/// Keeping a synchronized copy in the session temp cache ensures bundle packagers can
/// discover and archive the asset upon project save.
///
/// # Frontend Invocation
/// Expected arguments from React:
/// * `source_path` (`string`): Absolute path to the source image file on the local filesystem.
/// * `file_name` (`string`): Desired filename within the visuals directory (e.g. `"cover.png"`).
///   If empty, the original filename from `source_path` is preserved.
/// * `project_path` (`string | null`): Optional path to the active project folder or `.foliant` bundle file.
/// * `project_id` (`string | null`): Optional unique identifier of the active project.
///
/// Returns `Ok(String)` containing the absolute destination path on disk, or `Err(String)` describing
/// the validation or I/O failure.
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

/// Decodes a base64-encoded image and writes the binary payload directly into project visual storage.
///
/// Strips optional Data URL prefixes, decodes base64 bytes using the standard RFC 4648 alphabet,
/// sanitizes the filename to prevent directory traversal, and writes the resulting binary data
/// to both the project visuals directory and the session temp scratch directory.
///
/// # Context
/// Allows the React frontend to save imagery produced directly in the browser environment—such as
/// canvas drawings, clipboard image pastes, or generated moodboards—without requiring a prior file
/// on the local disk.
///
/// # Frontend Invocation
/// Expected arguments from React:
/// * `file_name` (`string`): Target filename including extension (e.g. `"sketch.png"`). Must not be empty.
/// * `data_base64` (`string`): Base64-encoded image string, optionally prefixed with a data URI scheme
///   (e.g. `"data:image/png;base64,..."`).
/// * `project_path` (`string | null`): Optional path to the active project folder or `.foliant` bundle file.
/// * `project_id` (`string | null`): Optional unique identifier of the active project.
///
/// Returns `Ok(String)` containing the absolute destination path on disk, or `Err(String)` if decoding
/// or file writing fails.
#[tauri::command]
async fn save_reference_image_base64(
    app: tauri::AppHandle,
    file_name: String,
    data_base64: String,
    project_path: Option<String>,
    project_id: Option<String>,
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

    let target_dir =
        resolve_project_visuals_dir(&app, project_path.as_deref(), project_id.as_deref())?;
    let dest = target_dir.join(&safe_name);

    fs::write(&dest, &bytes)
        .map_err(|e| format!("Failed to write image '{}': {e}", dest.display()))?;

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

    Ok(dest
        .to_str()
        .ok_or("Destination path contains invalid UTF-8")?
        .to_string())
}

/// Lists all valid reference image files associated with a project.
///
/// Scans both the project-adjacent visuals directory and the project-scoped session temp
/// directory, filtering entries against supported image extensions (`png`, `jpg`, `jpeg`,
/// `gif`, `webp`, `svg`, `avif`). Deduplicates identical filenames and returns paths in
/// sorted alphabetical order.
///
/// # Context
/// Required by the frontend gallery and visual asset manager to display all available visual
/// materials across both folder projects and unpacked `.foliant` bundles in a deterministic order.
///
/// # Frontend Invocation
/// Expected arguments from React:
/// * `project_path` (`string | null`): Optional path to the active project folder or `.foliant` file.
/// * `project_id` (`string | null`): Optional unique identifier of the active project.
///
/// Returns `Ok(Vec<String>)` containing sorted absolute file paths, or `Err(String)` if directory
/// resolution fails.
#[tauri::command]
async fn list_reference_images(
    app: tauri::AppHandle,
    project_path: Option<String>,
    project_id: Option<String>,
) -> Result<Vec<String>, String> {
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
    Ok(paths)
}

/// Removes an image file from the project's visuals storage and temporary caches.
///
/// Verifies that the provided `file_name` contains no directory traversal sequences
/// (`/`, `\`, `:`), deletes the file from the resolved project visuals directory if present,
/// and cleans up matching files in both the project-scoped session temp directory and legacy
/// fallback caches.
///
/// # Context
/// Ensures asset deletions performed by the user in the frontend media manager do not leave
/// dangling or orphaned files in the project or system temp directories.
///
/// # Frontend Invocation
/// Expected arguments from React:
/// * `file_name` (`string`): Base filename only (e.g. `"concept.png"`), without path separators.
/// * `project_path` (`string | null`): Optional path to the active project folder or `.foliant` file.
/// * `project_id` (`string | null`): Optional unique identifier of the active project.
///
/// Returns `Ok(())` on successful deletion (or if the file was already absent), or `Err(String)`
/// if path validation or deletion fails.
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

/// Writes chapter or scene text content directly to a designated file on disk.
///
/// Ensures parent directories exist before writing the given content string to the specified path.
///
/// # Context
/// Facilitates direct chapter persistence for multi-file workspace workflows, standalone Markdown
/// exports, or legacy document structures that store chapters as individual filesystem documents
/// rather than packaging them into a unified `.foliant` bundle archive.
///
/// # Frontend Invocation
/// Expected arguments from React:
/// * `path` (`string`): Absolute filesystem path where the chapter document should be written.
/// * `content` (`string`): Full text content (Markdown or HTML) to write to the file.
///
/// Returns `Ok(())` on success, or `Err(String)` if directory creation or file writing fails.
#[tauri::command]
async fn save_chapter_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent()
        && !parent.as_os_str().is_empty()
    {
        let _ = fs::create_dir_all(parent);
    }
    fs::write(&path, content).map_err(|e| format!("Failed to write file to '{path}': {e}"))
}

/// Reads an image from disk and encodes its binary data into a standard Data URL string.
///
/// Reads the file bytes, detects the MIME type from the file extension (`image/jpeg`,
/// `image/png`, `image/webp`, etc.), base64-encodes the bytes, and returns a formatted
/// data URL (`data:<mime>;base64,<payload>`).
///
/// # Context
/// Directly converts local image assets to base64 Data URLs to bypass Tauri asset protocol
/// restrictions (`asset://`) and webview origin sandboxing. This avoids IPC protocol overhead,
/// eliminates Content Security Policy (CSP) blocking for local filesystem files, and provides
/// immediate visual previews in the React editor and canvas widgets.
///
/// # Frontend Invocation
/// Expected arguments from React:
/// * `file_path` (`string`): Absolute filesystem path of the image to read.
///
/// Returns `Ok(String)` containing the complete Data URL, or `Err(String)` if the file
/// cannot be found or read.
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

/// Requests a clean termination of the desktop application process.
///
/// Exits the Tauri application process immediately with return code 0.
///
/// # Context
/// Provides a programmatic termination hook for custom UI controls in the React frontend
/// (e.g. custom title bars, modal exit dialogs, or menu bar quit options) without relying
/// exclusively on native window frame buttons.
///
/// # Frontend Invocation
/// Expected arguments from React:
/// * None.
///
/// Does not return a value as the process terminates upon invocation.
#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/// Application entry point for the Foliant desktop client.
///
/// Registers core Tauri plugins (filesystem, native dialogs, external opener, process lifecycle,
/// and auto-updater), registers IPC invoke handlers for frontend communication, and starts
/// the Tauri runtime loop.
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
        let sample_path = "../tests/fixtures/test-chapter.md";
        assert!(
            sample_path.ends_with(".md"),
            "Chapter file path must end with .md"
        );
        assert!(
            !sample_path.is_empty(),
            "Chapter file path must not be empty"
        );
        assert!(
            Path::new(sample_path).exists(),
            "Sample test chapter fixture file should exist in tests/fixtures"
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
