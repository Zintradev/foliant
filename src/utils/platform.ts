/**
 * Platform detection utilities for Foliant:
 * Distinguishes between native Tauri desktop execution and Web browser execution.
 */

export const isTauriApp = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ ||
      (window as unknown as { __TAURI__?: unknown }).__TAURI__ ||
      (window as unknown as { __TAURI_IPC__?: unknown }).__TAURI_IPC__
    )
  );
};

export const isWebPlatform = (): boolean => {
  return !isTauriApp();
};

/**
 * Closes the application.
 * In desktop (Tauri): exits the app cleanly or destroys the window.
 * In web: redirects back to the landing page or closes tab.
 */
export const closeDesktopApp = async (): Promise<void> => {
  if (isTauriApp()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('exit_app');
      return;
    } catch {
      // Fallback if exit_app is not available
    }

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.destroy();
      return;
    } catch {
      // Fallback
    }

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.close();
      return;
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    try {
      window.close();
    } catch {
      // Ignore
    }
    window.location.href = '../';
  }
};

