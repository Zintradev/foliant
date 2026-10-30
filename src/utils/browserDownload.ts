/**
 * Client-side browser file download utility for Foliant Web.
 * Triggers a native browser file download without requiring Tauri plugins.
 */
export function downloadFileInBrowser(
  content: string | Uint8Array | Blob,
  filename: string,
  mimeType: string = 'application/octet-stream'
) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const blob =
    content instanceof Blob
      ? content
      : new Blob([content as any], { type: mimeType });

  if (typeof URL.createObjectURL === 'function') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }, 1000);
  }
}
