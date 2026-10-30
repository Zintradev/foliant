import { useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ask } from '@tauri-apps/plugin-dialog';
import { isTauriApp, closeDesktopApp } from '../utils/platform';
import { Language } from '../types/settings';

export interface UseAppCloseGuardOptions {
  hasUnsavedChanges: boolean;
  onRequestCloseConfirm?: () => void;
  language?: Language;
}

/**
 * Handles confirmation before closing or unloading the app with unsaved changes.
 * Supports both Web browser (beforeunload) and Tauri native desktop (onCloseRequested).
 */
export function useAppCloseGuard({
  hasUnsavedChanges,
  onRequestCloseConfirm,
  language = 'en',
}: UseAppCloseGuardOptions) {
  const hasUnsavedRef = useRef(hasUnsavedChanges);
  const onRequestCloseConfirmRef = useRef(onRequestCloseConfirm);

  useEffect(() => {
    hasUnsavedRef.current = hasUnsavedChanges;
    onRequestCloseConfirmRef.current = onRequestCloseConfirm;
  }, [hasUnsavedChanges, onRequestCloseConfirm]);

  // Web beforeunload listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Tauri native desktop close listener:
  // ONLY registered when there are unsaved changes.
  // When there are no unsaved changes, the native OS/Tauri close event proceeds unobstructed.
  useEffect(() => {
    if (!isTauriApp() || !hasUnsavedChanges) return;

    let unlisten: (() => void) | undefined;
    try {
      const appWindow = getCurrentWindow();
      appWindow
        .onCloseRequested(async (event) => {
          if (hasUnsavedRef.current) {
            event.preventDefault();

            if (onRequestCloseConfirmRef.current) {
              onRequestCloseConfirmRef.current();
              return;
            }

            const msg =
              language === 'es'
                ? 'Tienes cambios sin guardar en tu proyecto. ¿Estás seguro de que deseas salir sin guardar?'
                : 'You have unsaved changes in your project. Are you sure you want to exit without saving?';
            try {
              const confirmed = await ask(msg, {
                title: 'Foliant',
                kind: 'warning',
              });
              if (confirmed) {
                await closeDesktopApp();
              }
            } catch {
              if (typeof window !== 'undefined' && window.confirm(msg)) {
                await closeDesktopApp();
              }
            }
          }
        })
        .then((fn) => {
          unlisten = fn;
        })
        .catch(() => {});
    } catch {
      // Ignore if Tauri window API is not available
    }

    return () => {
      unlisten?.();
    };
  }, [hasUnsavedChanges, language]);
}

