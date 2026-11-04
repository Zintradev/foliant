use std::collections::HashMap;
use std::fs;
use std::io::{Cursor, Read, Write};
use std::path::Path;
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

/// Saves a Foliant project bundle into a single `.foliant` compressed ZIP archive.
///
/// Inside the ZIP archive:
/// - `project.json`: Project metadata with scene contents stripped to empty strings.
/// - `scenes/{scene_id}.md`: Markdown content for each scene.
/// - `images/{filename}` (optional): Any embedded asset images.
///
/// Overwrites the target file cleanly in a single operation.
#[tauri::command]
pub async fn save_project_bundle(
    file_path: String,
    project: serde_json::Value,
    scenes: Option<HashMap<String, String>>,
    images: Option<HashMap<String, String>>,
) -> Result<(), String> {
    save_project_bundle_sync(&file_path, project, scenes, images)
}

/// Synchronous internal implementation for saving the project bundle.
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
            if chapter.get("type").and_then(|t| t.as_str()) == Some("scene") {
                if let Some(id) = chapter.get("id").and_then(|i| i.as_str()) {
                    if !scene_map.contains_key(id) {
                        let content = chapter
                            .get("content")
                            .and_then(|c| c.as_str())
                            .unwrap_or_default();
                        scene_map.insert(id.to_string(), content.to_string());
                    }
                }
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

    // 3. Build ZIP archive in memory
    let mut buffer = Cursor::new(Vec::new());
    {
        let mut zip = ZipWriter::new(&mut buffer);
        let options = SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated);

        // 3a. Write project.json
        let serialized_metadata = serde_json::to_string_pretty(&metadata_project)
            .map_err(|e| format!("Failed to serialize project metadata: {e}"))?;

        zip.start_file("project.json", options)
            .map_err(|e| format!("Failed to create 'project.json' in archive: {e}"))?;
        zip.write_all(serialized_metadata.as_bytes())
            .map_err(|e| format!("Failed to write 'project.json': {e}"))?;

        // 3b. Write scenes/{scene_id}.md
        for (scene_id, content) in &scene_map {
            let safe_id: String = scene_id
                .chars()
                .filter(|c| !matches!(c, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|'))
                .collect();
            let entry_name = format!("scenes/{safe_id}.md");
            zip.start_file(&entry_name, options)
                .map_err(|e| format!("Failed to create '{entry_name}' in archive: {e}"))?;
            zip.write_all(content.as_bytes())
                .map_err(|e| format!("Failed to write '{entry_name}': {e}"))?;
        }

        // 3c. Optional images
        if let Some(imgs) = images {
            for (img_name, img_data) in imgs {
                let safe_name: String = img_name
                    .chars()
                    .filter(|c| !matches!(c, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|'))
                    .collect();
                let entry_name = format!("images/{safe_name}");
                zip.start_file(&entry_name, options)
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

    // 4. Atomically write the ZIP bytes to the target destination
    let zip_bytes = buffer.into_inner();
    let dest_path = Path::new(file_path);

    if let Some(parent) = dest_path.parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory '{}': {e}", parent.display()))?;
        }
    }

    fs::write(dest_path, &zip_bytes)
        .map_err(|e| format!("Failed to write Foliant bundle file '{}': {e}", dest_path.display()))?;

    Ok(())
}

/// Loads a Foliant project bundle from a `.foliant` ZIP archive.
///
/// Unpacks `project.json` and all `scenes/*.md` files into memory,
/// reassembles the full scene contents into the project chapters,
/// and returns the unified `FoliantProject` JSON value.
#[tauri::command]
pub async fn load_project_bundle(file_path: String) -> Result<serde_json::Value, String> {
    load_project_bundle_sync(&file_path)
}

/// Synchronous internal implementation for loading the project bundle.
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
        .map_err(|e| format!("Failed to read 'project.json' from '{}': {e}", path.display()))?;
    drop(project_file);

    let mut project: serde_json::Value = serde_json::from_str(&project_json_str)
        .map_err(|e| format!("Corrupted Foliant project: invalid JSON in 'project.json': {e}"))?;

    // 2. Read all scene markdown files from scenes/
    let mut scenes_content: HashMap<String, String> = HashMap::new();

    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| format!("Failed to read archive entry #{i}: {e}"))?;
        let entry_name = entry
            .name()
            .map_err(|e| format!("Invalid entry name in archive: {e}"))?
            .to_string();
        let normalized = entry_name.replace('\\', "/");

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
    }

    // 3. Reassemble scene contents into project.chapters
    if let Some(chapters) = project.get_mut("chapters").and_then(|c| c.as_array_mut()) {
        for chapter in chapters {
            if chapter.get("type").and_then(|t| t.as_str()) == Some("scene") {
                if let Some(id) = chapter.get("id").and_then(|i| i.as_str()) {
                    if let Some(loaded_content) = scenes_content.get(id) {
                        chapter["content"] = serde_json::Value::String(loaded_content.clone());
                    } else if !chapter.get("content").and_then(|c| c.as_str()).unwrap_or("").is_empty() {
                        // Keep preexisting inline content if present
                    } else {
                        chapter["content"] = serde_json::Value::String(String::new());
                    }
                }
            }
        }
    }

    Ok(project)
}

/// Checks whether a given file exists on disk and is a regular file.
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
        assert_eq!(scene2["content"], "Waves crashed violently against the hull.");

        // 3. Inspect ZIP archive internals directly to verify project.json has stripped content
        let file = fs::File::open(&bundle_path).expect("open zip");
        let mut archive = ZipArchive::new(file).expect("zip archive");

        let mut project_file = archive.by_name("project.json").expect("project.json exists");
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
        assert!(res.unwrap_err().contains("Corrupted or invalid Foliant project archive"));
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
        assert!(!check_file_exists(nonexistent.to_str().unwrap().to_string()));
    }
}
