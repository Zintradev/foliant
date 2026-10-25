import { save, message } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

export type ManuscriptFormat = 'markdown' | 'txt';

export interface ExportManuscriptOptions {
  /** Nombre sugerido para el archivo por defecto (ej. 'Mi_Manuscrito.md') */
  defaultFileName?: string;
  /** Título de la ventana de diálogo de guardado */
  dialogTitle?: string;
}

/**
 * Exporta el contenido de un manuscrito a un archivo local en formato Markdown (.md) o Texto (.txt).
 *
 * Utiliza las APIs nativas de Tauri v2 (`@tauri-apps/plugin-dialog` y `@tauri-apps/plugin-fs`)
 * para eludir las limitaciones del sandbox del navegador y permitir al usuario elegir la ruta de destino.
 *
 * @param format - Formato de exportación ('markdown' o 'txt')
 * @param content - Contenido en texto plano o markdown del manuscrito
 * @param options - Parámetros opcionales para personalizar el nombre por defecto y título
 * @returns La ruta absoluta donde se guardó el archivo, o `null` si el usuario canceló el diálogo.
 */
export async function exportManuscript(
  format: ManuscriptFormat,
  content: string,
  options?: ExportManuscriptOptions
): Promise<string | null> {
  const extension = format === 'markdown' ? 'md' : 'txt';
  const defaultPath = options?.defaultFileName ?? `manuscript.${extension}`;

  try {
    // 1. Solicitar al usuario que elija la ruta de guardado mediante el diálogo nativo
    const filePath = await save({
      title: options?.dialogTitle ?? 'Exportar Manuscrito - Foliant',
      defaultPath,
      filters: [
        {
          name: 'Foliant Manuscript',
          extensions: [extension],
        },
        {
          name: 'Todos los formatos soportados (*.md, *.txt)',
          extensions: ['md', 'txt'],
        },
      ],
    });

    // 2. Early return si el usuario cancela la selección
    if (!filePath) {
      console.info('[ExportManager] El usuario canceló la exportación.');
      return null;
    }

    // 3. Escribir el contenido en disco eludiendo el sandbox del navegador
    await writeTextFile(filePath, content);
    console.info(`[ExportManager] Manuscrito guardado exitosamente en: ${filePath}`);

    return filePath;
  } catch (error: unknown) {
    // Captura de errores de permisos (Tauri Capability/Scope) o del sistema de archivos
    console.error('[ExportManager] Error al exportar el manuscrito:', error);

    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Notificación en la interfaz mediante diálogo nativo / modal
    await message(
      `No se pudo exportar el manuscrito en la ruta seleccionada.\n\nCausa: ${errorMessage}\n\nPor favor, verifica que la aplicación tenga permisos de escritura en la ubicación elegida.`,
      {
        title: 'Error de Permisos / Escritura',
        kind: 'error',
      }
    );

    throw error;
  }
}
