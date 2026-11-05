import { isTauriApp } from './platform';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'up-to-date'
  | 'downloading'
  | 'restarting'
  | 'error';

export interface CheckUpdateOptions {
  silent?: boolean;
  language?: string;
  onStatusChange?: (status: UpdateStatus, message?: string) => void;
}

export interface CheckUpdateResult {
  status: 'up-to-date' | 'updated' | 'cancelled' | 'error' | 'not-desktop';
  version?: string;
  error?: string;
}

/**
 * Checks for Foliant updates via @tauri-apps/plugin-updater.
 * Designed with a strict opt-in / local-first architecture.
 */
export async function checkForAppUpdates(
  options: CheckUpdateOptions = {}
): Promise<CheckUpdateResult> {
  const { silent = false, language = 'en', onStatusChange } = options;
  const isEs = language === 'es';

  if (!isTauriApp()) {
    return { status: 'not-desktop' };
  }

  onStatusChange?.('checking', isEs ? 'Buscando actualizaciones...' : 'Checking for updates...');

  try {
    let update = null;
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      update = await check();
    } catch (checkErr) {
      const checkErrorMsg = checkErr instanceof Error ? checkErr.message : String(checkErr);
      const isFetchOrNotFoundError =
        checkErrorMsg.toLowerCase().includes('could not fetch') ||
        checkErrorMsg.toLowerCase().includes('not found') ||
        checkErrorMsg.toLowerCase().includes('404') ||
        checkErrorMsg.toLowerCase().includes('network') ||
        checkErrorMsg.toLowerCase().includes('release json') ||
        checkErrorMsg.toLowerCase().includes('failed to fetch');

      if (isFetchOrNotFoundError) {
        onStatusChange?.(
          'up-to-date',
          isEs
            ? 'Estás en la última versión. No hay actualizaciones disponibles.'
            : 'You are on the latest version. No updates available.'
        );
        return { status: 'up-to-date' };
      }

      // Re-throw if it's an unexpected error
      throw checkErr;
    }

    if (!update) {
      onStatusChange?.(
        'up-to-date',
        isEs
          ? 'Estás en la última versión. No hay actualizaciones disponibles.'
          : 'You are on the latest version. No updates available.'
      );
      return { status: 'up-to-date' };
    }

    onStatusChange?.('available', isEs ? `Actualización v${update.version} disponible` : `Update v${update.version} available`);

    const promptText = isEs
      ? `Hay una nueva versión de Foliant disponible (v${update.version}).\n\n¿Deseas descargarla, instalarla y reiniciar la aplicación ahora?`
      : `A new version of Foliant is available (v${update.version}).\n\nWould you like to download, install and restart the application now?`;

    let shouldInstall = false;
    try {
      const { ask } = await import('@tauri-apps/plugin-dialog');
      shouldInstall = await ask(promptText, {
        title: isEs ? 'Actualización disponible' : 'Update Available',
        kind: 'info',
        okLabel: isEs ? 'Instalar y reiniciar' : 'Install & restart',
        cancelLabel: isEs ? 'Cancelar' : 'Cancel',
      });
    } catch {
      shouldInstall = window.confirm(promptText);
    }

    if (!shouldInstall) {
      onStatusChange?.('idle');
      return { status: 'cancelled', version: update.version };
    }

    onStatusChange?.('downloading', isEs ? 'Descargando e instalando actualización...' : 'Downloading and installing update...');

    await update.downloadAndInstall();

    onStatusChange?.('restarting', isEs ? 'Reiniciando aplicación...' : 'Restarting application...');

    try {
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch {
      // Ignore relaunch error or pending restart
    }

    return { status: 'updated', version: update.version };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const isFetchOrNotFoundError =
      errorMsg.toLowerCase().includes('could not fetch') ||
      errorMsg.toLowerCase().includes('not found') ||
      errorMsg.toLowerCase().includes('404') ||
      errorMsg.toLowerCase().includes('network') ||
      errorMsg.toLowerCase().includes('release json') ||
      errorMsg.toLowerCase().includes('failed to fetch');

    if (isFetchOrNotFoundError) {
      onStatusChange?.(
        'up-to-date',
        isEs ? 'Estás en la última versión.' : 'You are on the latest version.'
      );
      return { status: 'up-to-date' };
    }

    onStatusChange?.('error', errorMsg);

    if (!silent) {
      const displayMsg = isEs
        ? `No se pudo comprobar si hay actualizaciones:\n${errorMsg}`
        : `Could not check for updates:\n${errorMsg}`;
      try {
        const { message } = await import('@tauri-apps/plugin-dialog');
        await message(displayMsg, {
          title: isEs ? 'Error de actualización' : 'Update Error',
          kind: 'error',
        });
      } catch {
        alert(displayMsg);
      }
    }

    return { status: 'error', error: errorMsg };
  }
}

