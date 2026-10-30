import { save, message } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { isTauriApp } from './platform';
import { downloadFileInBrowser } from './browserDownload';

export type ProjectExportFormat = 'markdown' | 'txt';

export interface ExportProjectOptions {
  /** Default suggested file name (e.g. 'My_Project.md') */
  defaultFileName?: string;
  /** Dialog window title */
  dialogTitle?: string;
}

/**
 * Exports project content to a local file in Markdown (.md) or Text (.txt) format.
 *
 * Uses native Tauri v2 APIs (`@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs`)
 * to bypass browser sandbox limitations.
 *
 * @param format - Export format ('markdown' or 'txt')
 * @param content - Plain text or markdown content of the project
 * @param options - Optional parameters for customizing the file name and title
 * @returns Absolute file path where the file was saved, or `null` if cancelled.
 */
export async function exportProject(
  format: ProjectExportFormat,
  content: string,
  options?: ExportProjectOptions
): Promise<string | null> {
  const extension = format === 'markdown' ? 'md' : 'txt';
  const defaultPath = options?.defaultFileName ?? `project.${extension}`;

  if (!isTauriApp()) {
    downloadFileInBrowser(
      content,
      defaultPath,
      format === 'markdown' ? 'text/markdown' : 'text/plain'
    );
    return defaultPath;
  }

  try {
    const filePath = await save({
      title: options?.dialogTitle ?? 'Export Project - Foliant',
      defaultPath,
      filters: [
        {
          name: 'Foliant Project',
          extensions: [extension],
        },
        {
          name: 'Supported formats (*.md, *.txt)',
          extensions: ['md', 'txt'],
        },
      ],
    });

    if (!filePath) {
      console.info('[ExportManager] User cancelled export.');
      return null;
    }

    await writeTextFile(filePath, content);
    console.info(`[ExportManager] Project exported successfully to: ${filePath}`);

    return filePath;
  } catch (error: unknown) {
    console.error('[ExportManager] Error exporting project:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    await message(
      `Could not export the project to the selected path.\n\nReason: ${errorMessage}`,
      {
        title: 'Permissions / Write Error',
        kind: 'error',
      }
    );

    throw error;
  }
}
