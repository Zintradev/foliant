import { mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { FoliantProject } from '../types/project';

/**
 * Extracts the project directory or bundle name from a POSIX or Windows path.
 */
export function extractFileName(filePath: string | null): string | null {
  if (!filePath) return null;
  const normalized = filePath.replace(/\\/g, '/').replace(/\/+$/, '');
  const parts = normalized.split('/');
  return parts[parts.length - 1] || null;
}

/**
 * Validates and normalizes parsed JSON metadata into a strictly typed FoliantProject.
 * Ensures backward-compatibility if optional or newly added collections are missing.
 */
export function normalizeLoadedProject(data: unknown): FoliantProject {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid project file: expected a JSON object in project.json.');
  }

  const raw = data as Partial<FoliantProject>;

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `project-${Date.now()}`,
    title: typeof raw.title === 'string' && raw.title ? raw.title : 'Untitled Project',
    lastModified: typeof raw.lastModified === 'number' ? raw.lastModified : Date.now(),
    targetWords: typeof raw.targetWords === 'number' ? raw.targetWords : 80000,
    chapters: Array.isArray(raw.chapters) ? raw.chapters : [],
    storylines: Array.isArray(raw.storylines) ? raw.storylines : [],
    characters: Array.isArray(raw.characters) ? raw.characters : [],
    relationships: Array.isArray(raw.relationships) ? raw.relationships : [],
    junctions: Array.isArray(raw.junctions) ? raw.junctions : [],
    worldItems: Array.isArray(raw.worldItems) ? raw.worldItems : [],
    contextBlocks: Array.isArray(raw.contextBlocks) ? raw.contextBlocks : [],
  };
}

/**
 * Serializes and writes the novel into Foliant's industrial bundle directory architecture:
 *
 * ### Architectural Rationale:
 * 1. **O(1) Incremental Auto-Save**: In a 100,000+ word project, serializing a single giant JSON
 *    string on every keystroke causes memory spikes and UI thread stutter. By storing structural
 *    metadata in `project.json` and scene bodies in `/scenes/${chapter.id}.md`, individual scenes
 *    can be flushed in isolation.
 * 2. **Corruption Fault Tolerance**: If a crash or power failure occurs mid-write, only the current
 *    scene's `.md` file is at risk; the project taxonomy, character registry, and other chapters remain
 *    completely uncorrupted.
 * 3. **Git & VCS Friendliness**: Authors using Git or cloud sync (Dropbox, OneDrive) get clean line-by-line
 *    text diffs per scene rather than continuous merge conflicts on a monolithic JSON blob.
 */
export async function writeProjectBundle(
  baseDirectory: string,
  projectToSave: FoliantProject
): Promise<void> {
  const normalizedBase = baseDirectory.replace(/\\/g, '/').replace(/\/+$/, '');
  const scenesDirectory = `${normalizedBase}/scenes`;

  // 1. Ensure project root directory and scenes directory exist
  await mkdir(normalizedBase, { recursive: true });
  await mkdir(scenesDirectory, { recursive: true });

  // 2. Write each scene text file individually
  for (const chapter of projectToSave.chapters) {
    if (chapter.type === 'scene') {
      const sceneFilePath = `${scenesDirectory}/${chapter.id}.md`;
      const sceneContent = typeof chapter.content === 'string' ? chapter.content : '';
      await writeTextFile(sceneFilePath, sceneContent);
    }
  }

  // 3. Prepare project.json: chapters metadata without scene content
  const metadataProject: FoliantProject = {
    ...projectToSave,
    chapters: projectToSave.chapters.map((chapter) => {
      if (chapter.type === 'scene') {
        return {
          ...chapter,
          content: '',
        };
      }
      return chapter;
    }),
  };

  const projectJsonPath = `${normalizedBase}/project.json`;
  const serializedMetadata = JSON.stringify(metadataProject, null, 2);
  await writeTextFile(projectJsonPath, serializedMetadata);
}

/**
 * Reads a modular folder bundle:
 * 1. Reads and parses project.json.
 * 2. Iterates over chapters and reads each scene's content from /scenes/${chapter.id}.md.
 * 3. Reassembles the complete FoliantProject in memory with fallback for missing scene files.
 */
export async function readProjectBundle(baseDirectory: string): Promise<FoliantProject> {
  const normalizedBase = baseDirectory.replace(/\\/g, '/').replace(/\/+$/, '');
  const projectJsonPath = `${normalizedBase}/project.json`;
  const scenesDirectory = `${normalizedBase}/scenes`;

  // 1. Read root project metadata
  const metadataContent = await readTextFile(projectJsonPath);
  const parsedData = JSON.parse(metadataContent);
  const normalizedProject = normalizeLoadedProject(parsedData);

  // 2. Reassemble scene contents from individual files
  const reassembledChapters = await Promise.all(
    normalizedProject.chapters.map(async (chapter) => {
      if (chapter.type === 'scene') {
        const sceneFilePath = `${scenesDirectory}/${chapter.id}.md`;
        try {
          const content = await readTextFile(sceneFilePath);
          return {
            ...chapter,
            content,
          };
        } catch (sceneErr: unknown) {
          console.warn(
            `[Foliant Persistence] Failed to read scene file '${sceneFilePath}'. Defaulting to empty content:`,
            sceneErr
          );
          return {
            ...chapter,
            content: '',
          };
        }
      }
      return chapter;
    })
  );

  return {
    ...normalizedProject,
    chapters: reassembledChapters,
  };
}
