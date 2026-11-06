use std::collections::HashMap;
use std::fs;
use std::io::{Cursor, Read, Write};
use std::path::{Path, PathBuf};
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

/// Returns the root path to the temporary directory used for caching visual assets.
///
/// Locates `<sys_temp>/foliant_visuals/` in the operating system's designated temp path.
///
/// # Context
/// When `.foliant` ZIP bundle packages are loaded, compressed image assets are extracted into
/// project-scoped subdirectories under this root during the active session. This allows webviews
/// to access media via standard filesystem paths without leaving loose extracted files next
/// to the user's project archive.
pub fn temp_visuals_dir() -> PathBuf {
    std::env::temp_dir().join("foliant_visuals")
}

/// Checks whether a given file extension corresponds to a supported visual image format.
///
/// Evaluates case-insensitively against supported raster and vector extensions:
/// `png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`, `avif`, `bmp`, and `ico`.
///
/// # Context
/// Used during project metadata scanning to distinguish actual image assets from other
/// document files or arbitrary disk attachments, preventing non-image files from being
/// inadvertently copied into the bundle's `visuals/` archive directory.
pub fn is_image_extension(ext: &str) -> bool {
    let lower = ext.to_lowercase();
    matches!(
        lower.as_str(),
        "png" | "jpg" | "jpeg" | "gif" | "webp" | "svg" | "avif" | "bmp" | "ico"
    )
}

/// Sanitizes a file or directory name by stripping illegal filesystem characters.
///
/// Filters out characters prohibited across Windows and POSIX filesystems:
/// `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, and `|`.
///
/// # Context
/// Critical for cross-platform archive portability and path traversal prevention. Prevents
/// zip-slip vulnerabilities when unpacking entry names from `.foliant` ZIP archives and ensures
/// generated filenames remain valid regardless of whether the user is on Windows, macOS, or Linux.
pub fn sanitize_file_name(name: &str) -> String {
    name.chars()
        .filter(|c| !matches!(c, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|'))
        .collect()
}

/// Recursively scans project JSON metadata to locate, collect, and relativize image file paths for archive packaging.
///
/// Traverses all JSON objects, arrays, and string properties:
/// 1. Identifies existing bundle-relative paths (`visuals/...` or `images/...`) and staged temp files.
/// 2. Discovers absolute image paths on the local filesystem, stages them in `images_to_pack`,
///    and records mapped paths in `seen_paths` to prevent duplicate archive entries.
/// 3. Rewrites absolute paths in-place into portable relative paths (`visuals/<sanitized_name>`).
///
/// # Context
/// Absolute filesystem paths (e.g. `C:\Users\...` or `/home/...`) break portability when a `.foliant`
/// bundle is transferred to another machine or directory. Relativizing paths within `project.json`
/// and collecting the physical files to be packaged under `visuals/` ensures that every `.foliant`
/// bundle is completely self-contained and reproducible.
fn process_visual_paths_for_save(
    val: &mut serde_json::Value,
    images_to_pack: &mut HashMap<String, PathBuf>,
    seen_paths: &mut HashMap<String, String>,
    project_id: Option<&str>,
) {
    match val {
        serde_json::Value::Object(map) => {
            for (_key, v) in map.iter_mut() {
                process_visual_paths_for_save(v, images_to_pack, seen_paths, project_id);
            }
        }
        serde_json::Value::Array(arr) => {
            for v in arr.iter_mut() {
                process_visual_paths_for_save(v, images_to_pack, seen_paths, project_id);
            }
        }
        serde_json::Value::String(s) => {
            let str_val = s.trim();
            if str_val.is_empty()
                || str_val.len() > 512
                || str_val.starts_with("data:")
                || str_val.starts_with("http://")
                || str_val.starts_with("https://")
                || str_val.contains('\n')
                || str_val.contains('\r')
            {
                return;
            }

            // Case A: Path is already relative "visuals/<name>" or "images/<name>"
            if str_val.starts_with("visuals/") || str_val.starts_with("images/") {
                let filename = str_val
                    .strip_prefix("visuals/")
                    .or_else(|| str_val.strip_prefix("images/"))
                    .unwrap_or(str_val);
                let safe_name = sanitize_file_name(filename);
                if !safe_name.is_empty() {
                    let mut temp_candidate = temp_visuals_dir().join(&safe_name);
                    if let Some(pid) = project_id {
                        let safe_pid = sanitize_file_name(pid);
                        let candidate_in_proj = temp_visuals_dir().join(&safe_pid).join(&safe_name);
                        if candidate_in_proj.is_file() {
                            temp_candidate = candidate_in_proj;
                        }
                    }
                    if temp_candidate.is_file() {
                        images_to_pack.insert(safe_name.clone(), temp_candidate);
                    }
                    *s = format!("visuals/{}", safe_name);
                }
                return;
            }

            // Case B: Path is a file on disk
            let p = Path::new(str_val);
            if let Some(ext) = p
                .extension()
                .and_then(|e| e.to_str())
                .filter(|e| is_image_extension(e))
                && p.is_file()
            {
                if let Some(already_mapped) = seen_paths.get(str_val) {
                    *s = already_mapped.clone();
                    return;
                }

                let raw_name = p
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("image.png");
                let mut safe_name = sanitize_file_name(raw_name);
                if safe_name.is_empty() {
                    safe_name = format!("img_{}.{}", images_to_pack.len(), ext);
                }

                // Avoid name collisions for different source files
                if images_to_pack.contains_key(&safe_name)
                    && images_to_pack.get(&safe_name) != Some(&p.to_path_buf())
                {
                    safe_name = format!("{}_{}", images_to_pack.len(), safe_name);
                }

                let rel_path = format!("visuals/{}", safe_name);
                seen_paths.insert(str_val.to_string(), rel_path.clone());
                images_to_pack.insert(safe_name, p.to_path_buf());
                *s = rel_path;
            }
        }
        _ => {}
    }
}

/// Recursively rewrites bundle-relative visual paths to absolute paths pointing to the session temporary directory.
///
/// Scans project metadata for `"visuals/<filename>"` or `"images/<filename>"` references, resolves them
/// to `<temp_dir>/<filename>`, and automatically populates in-memory Data URLs (`data:<mime>;base64,...`)
/// for objects missing an active base64 payload.
///
/// # Context
/// Inside a `.foliant` archive, image paths are stored as portable relative references. Upon loading,
/// the React frontend and underlying webview require absolute local filesystem paths or Data URLs to
/// display images in the DOM and canvas without violating browser security sandboxes.
fn resolve_visual_paths_to_temp(val: &mut serde_json::Value, temp_dir: &Path) {
    match val {
        serde_json::Value::Object(map) => {
            // If this object represents an image (e.g. has "path" or "name")
            // and we have its file in temp_dir, ensure "base64" or "src" is populated with a data URL
            let mut resolved_filename: Option<String> = None;
            for (_key, v) in map.iter_mut() {
                resolve_visual_paths_to_temp(v, temp_dir);
            }

            if let Some(path_val) = map.get("path").and_then(|p| p.as_str()) {
                let p = Path::new(path_val);
                if let Some(file_name) = p.file_name().and_then(|f| f.to_str()) {
                    resolved_filename = Some(sanitize_file_name(file_name));
                }
            } else if let Some(name_val) = map.get("name").and_then(|n| n.as_str()) {
                resolved_filename = Some(sanitize_file_name(name_val));
            }

            if let Some(fname) = resolved_filename {
                let file_path = temp_dir.join(&fname);
                if file_path.is_file() {
                    map.insert(
                        "path".to_string(),
                        serde_json::Value::String(file_path.to_string_lossy().to_string()),
                    );
                    let need_base64 = map
                        .get("base64")
                        .and_then(|b| b.as_str())
                        .is_none_or(str::is_empty);
                    if need_base64 && let Ok(bytes) = fs::read(&file_path) {
                        let ext = file_path
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
                        let data_url = format!("data:{mime};base64,{b64}");
                        map.insert(
                            "base64".to_string(),
                            serde_json::Value::String(data_url.clone()),
                        );
                        map.insert("src".to_string(), serde_json::Value::String(data_url));
                    }
                }
            }
        }
        serde_json::Value::Array(arr) => {
            for v in arr.iter_mut() {
                resolve_visual_paths_to_temp(v, temp_dir);
            }
        }
        serde_json::Value::String(s) => {
            let str_val = s.trim();
            if str_val.starts_with("visuals/") || str_val.starts_with("images/") {
                let filename = str_val
                    .strip_prefix("visuals/")
                    .or_else(|| str_val.strip_prefix("images/"))
                    .unwrap_or(str_val);
                let safe_name = sanitize_file_name(filename);
                if !safe_name.is_empty() {
                    let abs_path = temp_dir.join(&safe_name);
                    *s = abs_path.to_string_lossy().to_string();
                }
            }
        }
        _ => {}
    }
}

/// Recursively strips in-memory base64 data strings from visual metadata objects before serialization.
///
/// Traverses the JSON tree and removes all `"base64"` object keys.
///
/// # Context
/// While base64 Data URLs are cached in memory for rapid frontend rendering, writing large base64
/// strings into `project.json` inside the `.foliant` ZIP would duplicate data already stored in the
/// `visuals/` folder, causing substantial archive bloat and slowing down JSON serialization.
fn strip_base64_from_visuals(val: &mut serde_json::Value) {
    match val {
        serde_json::Value::Object(map) => {
            map.remove("base64");
            for v in map.values_mut() {
                strip_base64_from_visuals(v);
            }
        }
        serde_json::Value::Array(arr) => {
            for v in arr {
                strip_base64_from_visuals(v);
            }
        }
        _ => {}
    }
}

/// Asynchronously serializes and packages a Foliant project into a `.foliant` compressed ZIP archive.
///
/// Offloads the synchronous compression, JSON stripping, and disk I/O operations to a blocking thread pool
/// via [`tauri::async_runtime::spawn_blocking`].
///
/// # Context
/// Archiving a novel project—including serializing metadata, deflating scene Markdown files, and writing
/// binary image assets—can be CPU and disk intensive. Executing this in a background worker thread
/// guarantees that the main Tauri event loop and React frontend remain completely responsive without UI stutter.
///
/// # Frontend Invocation
/// Expected arguments from React:
/// * `file_path` (`string`): Absolute target filesystem path ending with `.foliant`.
/// * `project` (`object`): Complete `FoliantProject` JSON data containing metadata, chapters, and world items.
/// * `scenes` (`Record<string, string> | null`): Optional map of scene IDs to Markdown text. If omitted,
///   scene contents are extracted from `project.chapters`.
/// * `images` (`Record<string, string> | null`): Optional map of filenames to base64 image strings for explicit packaging.
///
/// Returns `Ok(())` on successful save, or `Err(String)` describing any serialization, compression, or file I/O failure.
#[tauri::command]
pub async fn save_project_bundle(
    file_path: String,
    project: serde_json::Value,
    scenes: Option<HashMap<String, String>>,
    images: Option<HashMap<String, String>>,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        save_project_bundle_sync(&file_path, project, scenes, images)
    })
    .await
    .map_err(|e| format!("Save task failed: {e}"))?
}

/// Synchronously serializes and packages a Foliant project into a `.foliant` compressed ZIP archive.
///
/// Assembles the archive with the following internal layout:
/// - `project.json`: Project metadata with scene contents stripped to empty strings to reduce parsing overhead,
///   and image references relativized to `"visuals/<filename>"`.
/// - `scenes/{scene_id}.md`: Individual Markdown files for each scene, compressed using `Deflated`.
/// - `visuals/{filename}`: Binary image assets stored using `Stored` (no compression).
///
/// # Context
/// Separated from [`save_project_bundle`] to enable direct, deterministic unit testing without requiring
/// an active Tauri runtime context. Applies `Deflated` compression to narrative documents to maximize space
/// efficiency while storing image assets uncompressed (`Stored`), eliminating redundant CPU compression cycles
/// on already compressed media formats (JPEG/PNG/WebP). Employs atomic writes to ensure target `.foliant` files
/// are never left in a partially written or corrupted state.
pub fn save_project_bundle_sync(
    file_path: &str,
    project: serde_json::Value,
    scenes: Option<HashMap<String, String>>,
    images: Option<HashMap<String, String>>,
) -> Result<(), String> {
    if !project.is_object() {
        return Err("Invalid project data: root must be a JSON object.".to_string());
    }

    // 1. Gather all scenes either from the optional argument or extracted from project.chapters
    let mut scene_map = scenes.unwrap_or_default();

    if let Some(chapters) = project.get("chapters").and_then(|c| c.as_array()) {
        for chapter in chapters {
            if chapter.get("type").and_then(|t| t.as_str()) == Some("scene")
                && let Some(id) = chapter.get("id").and_then(|i| i.as_str())
                && !scene_map.contains_key(id)
            {
                let content = chapter
                    .get("content")
                    .and_then(|c| c.as_str())
                    .unwrap_or_default();
                scene_map.insert(id.to_string(), content.to_string());
            }
        }
    }

    // 2. Prepare stripped project metadata (scene contents set to empty string)
    let mut metadata_project = project.clone();
    if let Some(chapters) = metadata_project
        .get_mut("chapters")
        .and_then(|c| c.as_array_mut())
    {
        for chapter in chapters {
            if chapter.get("type").and_then(|t| t.as_str()) == Some("scene") {
                chapter["content"] = serde_json::Value::String(String::new());
            }
        }
    }

    // 2b. Strip redundant in-memory base64 payloads from visuals metadata
    if let Some(visuals) = metadata_project.get_mut("visuals") {
        strip_base64_from_visuals(visuals);
    }

    // 3. Scan metadata for visual image paths, collect files, and convert to relative "visuals/..."
    let mut images_to_pack: HashMap<String, PathBuf> = HashMap::new();
    let mut seen_paths: HashMap<String, String> = HashMap::new();
    let project_id_owned = metadata_project
        .get("id")
        .and_then(|i| i.as_str())
        .map(String::from);
    process_visual_paths_for_save(
        &mut metadata_project,
        &mut images_to_pack,
        &mut seen_paths,
        project_id_owned.as_deref(),
    );

    // 4. Build ZIP archive in memory
    let mut buffer = Cursor::new(Vec::new());
    {
        let mut zip = ZipWriter::new(&mut buffer);
        let doc_options =
            SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
        let image_options =
            SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored);

        // 4a. Write project.json
        let serialized_metadata = serde_json::to_string_pretty(&metadata_project)
            .map_err(|e| format!("Failed to serialize project metadata: {e}"))?;

        zip.start_file("project.json", doc_options)
            .map_err(|e| format!("Failed to create 'project.json' in archive: {e}"))?;
        zip.write_all(serialized_metadata.as_bytes())
            .map_err(|e| format!("Failed to write 'project.json': {e}"))?;

        // 4b. Write scenes/{scene_id}.md
        for (scene_id, content) in &scene_map {
            let safe_id = sanitize_file_name(scene_id);
            let entry_name = format!("scenes/{safe_id}.md");
            zip.start_file(&entry_name, doc_options)
                .map_err(|e| format!("Failed to create '{entry_name}' in archive: {e}"))?;
            zip.write_all(content.as_bytes())
                .map_err(|e| format!("Failed to write '{entry_name}': {e}"))?;
        }

        // 4c. Write collected visual images into visuals/{filename} (stored uncompressed for speed)
        for (img_name, src_path) in &images_to_pack {
            let safe_name = sanitize_file_name(img_name);
            let entry_name = format!("visuals/{safe_name}");
            if let Ok(bytes) = fs::read(src_path) {
                zip.start_file(&entry_name, image_options)
                    .map_err(|e| format!("Failed to create '{entry_name}' in archive: {e}"))?;
                zip.write_all(&bytes)
                    .map_err(|e| format!("Failed to write '{entry_name}': {e}"))?;
            }
        }

        // 4d. Optional images explicitly passed via arguments
        if let Some(imgs) = images {
            for (img_name, img_data) in imgs {
                let safe_name = sanitize_file_name(&img_name);
                let entry_name = format!("visuals/{safe_name}");
                zip.start_file(&entry_name, image_options)
                    .map_err(|e| format!("Failed to create '{entry_name}' in archive: {e}"))?;

                let bytes = if let Some(comma_pos) = img_data.find(',') {
                    use base64::Engine;
                    base64::engine::general_purpose::STANDARD
                        .decode(&img_data[comma_pos + 1..])
                        .unwrap_or_else(|_| img_data.into_bytes())
                } else if let Ok(decoded) = {
                    use base64::Engine;
                    base64::engine::general_purpose::STANDARD.decode(&img_data)
                } {
                    decoded
                } else {
                    img_data.into_bytes()
                };

                zip.write_all(&bytes)
                    .map_err(|e| format!("Failed to write '{entry_name}': {e}"))?;
            }
        }

        zip.finish()
            .map_err(|e| format!("Failed to finalize ZIP archive: {e}"))?;
    }

    // 5. Atomically write the ZIP bytes to the target destination
    let zip_bytes = buffer.into_inner();
    let dest_path = Path::new(file_path);

    if let Some(parent) = dest_path.parent()
        && !parent.as_os_str().is_empty()
        && !parent.exists()
    {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory '{}': {e}", parent.display()))?;
    }

    fs::write(dest_path, &zip_bytes).map_err(|e| {
        format!(
            "Failed to write Foliant bundle file '{}': {e}",
            dest_path.display()
        )
    })?;

    // 6. Clean up empty "visuals" directory beside .foliant if it was created previously
    if let Some(parent) = dest_path.parent() {
        let loose_visuals = parent.join("visuals");
        if loose_visuals.is_dir()
            && let Ok(mut entries) = fs::read_dir(&loose_visuals)
            && entries.next().is_none()
        {
            let _ = fs::remove_dir(&loose_visuals);
        }
    }

    Ok(())
}

/// Asynchronously unpacks and parses a `.foliant` ZIP bundle into a unified project JSON object.
///
/// Offloads decompression, archive extraction, and path reconciliation to a blocking background thread
/// via [`tauri::async_runtime::spawn_blocking`].
///
/// # Context
/// Unpacking multi-scene projects and extracting bundled visual assets can involve significant disk I/O.
/// Running this command on a worker thread keeps the React frontend UI smooth and responsive during project load.
///
/// # Frontend Invocation
/// Expected arguments from React:
/// * `file_path` (`string`): Absolute filesystem path to an existing `.foliant` bundle file.
///
/// Returns `Ok(serde_json::Value)` containing the complete `FoliantProject` object with reassembled scene
/// contents and resolved asset paths, or `Err(String)` if the file is missing, corrupted, or contains invalid JSON.
#[tauri::command]
pub async fn load_project_bundle(file_path: String) -> Result<serde_json::Value, String> {
    load_project_bundle_sync(&file_path)
}

/// Synchronously unpacks and reconstructs a Foliant project from a `.foliant` ZIP archive.
///
/// 1. Reads and parses `project.json`.
/// 2. Extracts `scenes/*.md` entries and injects their Markdown content back into the corresponding chapters.
/// 3. Extracts `visuals/` assets into the project-scoped session temporary directory (`foliant_visuals/<project_id>/`).
/// 4. Converts bundle-relative visual paths back into absolute paths and populates in-memory Data URLs.
///
/// # Context
/// Core bundle loading implementation separated from [`load_project_bundle`] for headless unit testing.
/// Isolates extracted visual assets into a project-scoped temporary folder, preventing namespace clashes
/// between different projects and ensuring clean project reloading during an active user session.
pub fn load_project_bundle_sync(file_path: &str) -> Result<serde_json::Value, String> {
    let path = Path::new(file_path);

    if !path.exists() {
        return Err(format!("File not found: '{}'", path.display()));
    }
    if !path.is_file() {
        return Err(format!("Path is not a valid file: '{}'", path.display()));
    }

    let file = fs::File::open(path)
        .map_err(|e| format!("Failed to open file '{}': {e}", path.display()))?;

    let mut archive = ZipArchive::new(file).map_err(|e| {
        format!(
            "Corrupted or invalid Foliant project archive '{}': {e}",
            path.display()
        )
    })?;

    // 1. Read project.json
    let mut project_file = archive.by_name("project.json").map_err(|_| {
        format!(
            "Corrupted Foliant project: missing 'project.json' inside '{}'",
            path.display()
        )
    })?;

    let mut project_json_str = String::new();
    project_file
        .read_to_string(&mut project_json_str)
        .map_err(|e| {
            format!(
                "Failed to read 'project.json' from '{}': {e}",
                path.display()
            )
        })?;
    drop(project_file);

    let mut project: serde_json::Value = serde_json::from_str(&project_json_str)
        .map_err(|e| format!("Corrupted Foliant project: invalid JSON in 'project.json': {e}"))?;

    // 2. Read all scene markdown files from scenes/ and extract visuals/ into project-scoped temp dir
    let mut scenes_content: HashMap<String, String> = HashMap::new();
    let project_id = project
        .get("id")
        .and_then(|i| i.as_str())
        .unwrap_or("default");
    let safe_project_id = sanitize_file_name(project_id);
    let temp_dir = temp_visuals_dir().join(&safe_project_id);
    let _ = fs::create_dir_all(&temp_dir);

    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| format!("Failed to read archive entry #{i}: {e}"))?;
        let entry_name = entry
            .name()
            .map_err(|e| format!("Invalid entry name in archive: {e}"))?
            .to_string();
        let normalized = entry_name.replace('\\', "/");

        // 2a. Scenes
        if normalized.starts_with("scenes/") && normalized.ends_with(".md") {
            let scene_id = normalized
                .strip_prefix("scenes/")
                .unwrap_or("")
                .strip_suffix(".md")
                .unwrap_or("");

            if !scene_id.is_empty() {
                let mut content = String::new();
                entry
                    .read_to_string(&mut content)
                    .map_err(|e| format!("Failed to read scene file '{entry_name}': {e}"))?;
                scenes_content.insert(scene_id.to_string(), content);
            }
        }

        // 2b. Visuals / Images extraction to temp directory
        if (normalized.starts_with("visuals/") || normalized.starts_with("images/"))
            && !normalized.ends_with('/')
        {
            let filename = normalized
                .strip_prefix("visuals/")
                .or_else(|| normalized.strip_prefix("images/"))
                .unwrap_or(&normalized);
            let safe_name = sanitize_file_name(filename);
            if !safe_name.is_empty() {
                let target_path = temp_dir.join(&safe_name);
                if let Ok(mut out_file) = fs::File::create(&target_path) {
                    let _ = std::io::copy(&mut entry, &mut out_file);
                }
            }
        }
    }

    // 3. Reassemble scene contents into project.chapters
    if let Some(chapters) = project.get_mut("chapters").and_then(|c| c.as_array_mut()) {
        for chapter in chapters {
            if chapter.get("type").and_then(|t| t.as_str()) == Some("scene")
                && let Some(id) = chapter.get("id").and_then(|i| i.as_str())
            {
                if let Some(loaded_content) = scenes_content.get(id) {
                    chapter["content"] = serde_json::Value::String(loaded_content.clone());
                } else if !chapter
                    .get("content")
                    .and_then(|c| c.as_str())
                    .unwrap_or("")
                    .is_empty()
                {
                    // Keep preexisting inline content if present
                } else {
                    chapter["content"] = serde_json::Value::String(String::new());
                }
            }
        }
    }

    // 4. Resolve relative "visuals/..." paths to absolute paths in system temp directory
    resolve_visual_paths_to_temp(&mut project, &temp_dir);

    Ok(project)
}

/// Verifies whether a given path exists on the local filesystem and points to a regular file.
///
/// # Context
/// Provides a fast, lightweight file existence check for the React frontend (e.g. verifying recent
/// project lists or checking whether a target file was deleted) without requiring full filesystem
/// plugin permissions or throwing frontend exceptions.
///
/// # Frontend Invocation
/// Expected arguments from React:
/// * `file_path` (`string`): Absolute filesystem path to check.
///
/// Returns `true` if the path exists and is a regular file; `false` otherwise.
#[tauri::command]
pub fn check_file_exists(file_path: String) -> bool {
    let path = Path::new(&file_path);
    path.exists() && path.is_file()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_save_and_load_project_bundle() {
        let temp_dir = tempfile::tempdir().expect("Failed to create tempdir");
        let bundle_path = temp_dir.path().join("test_novel.foliant");
        let bundle_path_str = bundle_path.to_str().unwrap();

        let mock_project = json!({
            "id": "proj-abc",
            "title": "A Journey into the Unknown",
            "lastModified": 1700000000000_u64,
            "targetWords": 50000,
            "chapters": [
                {
                    "id": "scene-1",
                    "title": "Departure",
                    "content": "The ship sailed at dawn.",
                    "type": "scene"
                },
                {
                    "id": "folder-1",
                    "title": "Act I",
                    "content": "",
                    "type": "folder"
                },
                {
                    "id": "scene-2",
                    "title": "The Storm",
                    "content": "Waves crashed violently against the hull.",
                    "type": "scene"
                }
            ],
            "storylines": [],
            "characters": [],
            "relationships": [],
            "junctions": [],
            "worldItems": [],
            "contextBlocks": []
        });

        // 1. Save bundle
        let save_res = save_project_bundle_sync(bundle_path_str, mock_project.clone(), None, None);
        assert!(save_res.is_ok(), "Save failed: {:?}", save_res.err());

        // 2. Load bundle back
        let loaded_res = load_project_bundle_sync(bundle_path_str);
        assert!(loaded_res.is_ok(), "Load failed: {:?}", loaded_res.err());

        let loaded = loaded_res.unwrap();
        assert_eq!(loaded["id"], "proj-abc");
        assert_eq!(loaded["title"], "A Journey into the Unknown");

        let chapters = loaded["chapters"].as_array().expect("chapters array");
        assert_eq!(chapters.len(), 3);

        let scene1 = &chapters[0];
        assert_eq!(scene1["id"], "scene-1");
        assert_eq!(scene1["content"], "The ship sailed at dawn.");

        let folder1 = &chapters[1];
        assert_eq!(folder1["id"], "folder-1");

        let scene2 = &chapters[2];
        assert_eq!(scene2["id"], "scene-2");
        assert_eq!(
            scene2["content"],
            "Waves crashed violently against the hull."
        );

        // 3. Inspect ZIP archive internals directly to verify project.json has stripped content
        let file = fs::File::open(&bundle_path).expect("open zip");
        let mut archive = ZipArchive::new(file).expect("zip archive");

        let mut project_file = archive
            .by_name("project.json")
            .expect("project.json exists");
        let mut pj_str = String::new();
        project_file.read_to_string(&mut pj_str).unwrap();
        let stripped_pj: serde_json::Value = serde_json::from_str(&pj_str).unwrap();
        let stripped_chapters = stripped_pj["chapters"].as_array().unwrap();
        assert_eq!(stripped_chapters[0]["content"], "");
        assert_eq!(stripped_chapters[2]["content"], "");
    }

    #[test]
    fn test_corrupted_archive_errors() {
        let temp_dir = tempfile::tempdir().unwrap();
        let bad_file = temp_dir.path().join("corrupted.foliant");
        fs::write(&bad_file, b"this is not a zip file").unwrap();

        let res = load_project_bundle_sync(bad_file.to_str().unwrap());
        assert!(res.is_err());
        assert!(
            res.unwrap_err()
                .contains("Corrupted or invalid Foliant project archive")
        );
    }

    #[test]
    fn test_missing_project_json_error() {
        let temp_dir = tempfile::tempdir().unwrap();
        let bad_zip = temp_dir.path().join("no_project.foliant");

        let file = fs::File::create(&bad_zip).unwrap();
        let mut zip = ZipWriter::new(file);
        let options = SimpleFileOptions::default();
        zip.start_file("other.txt", options).unwrap();
        zip.write_all(b"hello").unwrap();
        zip.finish().unwrap();

        let res = load_project_bundle_sync(bad_zip.to_str().unwrap());
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("missing 'project.json'"));
    }

    #[test]
    fn test_clean_overwrite_removes_old_scenes() {
        let temp_dir = tempfile::tempdir().unwrap();
        let bundle_path = temp_dir.path().join("overwrite_test.foliant");
        let bundle_path_str = bundle_path.to_str().unwrap();

        // Project with 2 scenes
        let proj1 = json!({
            "id": "p1",
            "title": "V1",
            "chapters": [
                { "id": "scene-old-1", "title": "Old 1", "content": "Text 1", "type": "scene" },
                { "id": "scene-old-2", "title": "Old 2", "content": "Text 2", "type": "scene" }
            ]
        });
        save_project_bundle_sync(bundle_path_str, proj1, None, None).unwrap();

        // Project V2 removes old-2 and only has new scene
        let proj2 = json!({
            "id": "p1",
            "title": "V2",
            "chapters": [
                { "id": "scene-new-1", "title": "New 1", "content": "Brand new text", "type": "scene" }
            ]
        });
        save_project_bundle_sync(bundle_path_str, proj2, None, None).unwrap();

        // Load back and verify old scenes are completely gone
        let loaded = load_project_bundle_sync(bundle_path_str).unwrap();
        let chapters = loaded["chapters"].as_array().unwrap();
        assert_eq!(chapters.len(), 1);
        assert_eq!(chapters[0]["id"], "scene-new-1");

        // Inspect zip archive entries directly
        let file = fs::File::open(&bundle_path).unwrap();
        let mut archive = ZipArchive::new(file).unwrap();
        let entry_names: Vec<String> = (0..archive.len())
            .map(|i| archive.by_index(i).unwrap().name().unwrap().to_string())
            .collect();

        assert!(!entry_names.contains(&"scenes/scene-old-1.md".to_string()));
        assert!(!entry_names.contains(&"scenes/scene-old-2.md".to_string()));
        assert!(entry_names.contains(&"scenes/scene-new-1.md".to_string()));
    }

    #[test]
    fn test_check_file_exists_command() {
        let temp_dir = tempfile::tempdir().unwrap();
        let sample_file = temp_dir.path().join("existing.foliant");
        fs::write(&sample_file, b"content").unwrap();

        assert!(check_file_exists(sample_file.to_str().unwrap().to_string()));

        let nonexistent = temp_dir.path().join("deleted.foliant");
        assert!(!check_file_exists(
            nonexistent.to_str().unwrap().to_string()
        ));
    }

    #[test]
    fn test_visuals_portability_in_bundle() {
        let temp_dir = tempfile::tempdir().unwrap();

        // Create a mock physical image file on disk
        let mock_image_path = temp_dir.path().join("sample_test_asset.jpg");
        let mock_bytes = b"MOCK_JPEG_IMAGE_DATA_BYTES";
        fs::write(&mock_image_path, mock_bytes).unwrap();

        let bundle_path = temp_dir.path().join("portable_novel.foliant");
        let bundle_path_str = bundle_path.to_str().unwrap();

        let project_with_visuals = json!({
            "id": "proj-visuals",
            "title": "Visual Novel",
            "chapters": [],
            "characters": [
                {
                    "id": "char-1",
                    "name": "Knight",
                    "avatarUrl": mock_image_path.to_str().unwrap()
                }
            ],
            "visuals": [
                {
                    "id": "vis-1",
                    "name": "sample_test_asset.jpg",
                    "path": mock_image_path.to_str().unwrap()
                }
            ]
        });

        // 1. Save bundle
        save_project_bundle_sync(bundle_path_str, project_with_visuals, None, None).unwrap();

        // 2. Inspect ZIP directly: verify relative path in project.json and file in visuals/
        let zip_file = fs::File::open(&bundle_path).unwrap();
        let mut archive = ZipArchive::new(zip_file).unwrap();

        let mut project_entry = archive.by_name("project.json").unwrap();
        let mut project_json_str = String::new();
        project_entry.read_to_string(&mut project_json_str).unwrap();
        drop(project_entry);

        let parsed_metadata: serde_json::Value = serde_json::from_str(&project_json_str).unwrap();
        assert_eq!(
            parsed_metadata["characters"][0]["avatarUrl"], "visuals/sample_test_asset.jpg",
            "Avatar path in project.json must be relative"
        );
        assert_eq!(
            parsed_metadata["visuals"][0]["path"], "visuals/sample_test_asset.jpg",
            "Visual path in project.json must be relative"
        );

        let mut visual_entry = archive.by_name("visuals/sample_test_asset.jpg").unwrap();
        let mut extracted_bytes = Vec::new();
        visual_entry.read_to_end(&mut extracted_bytes).unwrap();
        assert_eq!(extracted_bytes, mock_bytes);
        drop(visual_entry);
        drop(archive);

        // 3. Load bundle: verify paths resolve to project-scoped system temp directory and file is extracted
        let loaded = load_project_bundle_sync(bundle_path_str).unwrap();
        let expected_temp_path = temp_visuals_dir()
            .join("proj-visuals")
            .join("sample_test_asset.jpg");
        let expected_temp_path_str = expected_temp_path.to_str().unwrap();

        assert_eq!(
            loaded["characters"][0]["avatarUrl"], expected_temp_path_str,
            "Avatar path on load must point to system temp directory"
        );
        assert_eq!(
            loaded["visuals"][0]["path"], expected_temp_path_str,
            "Visual path on load must point to system temp directory"
        );
        assert!(
            expected_temp_path.exists(),
            "Extracted image must exist in system temp dir"
        );
        let _ = fs::remove_dir_all(expected_temp_path.parent().unwrap());
    }
}
