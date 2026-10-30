import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { loadSettings } from "./types/settings";
import { applyTheme } from "./theme/themeEngine";

// Apply persisted theme immediately before initial React mount
try {
  const initialSettings = loadSettings();
  applyTheme(initialSettings.preferences?.themeMode, initialSettings.preferences?.customTheme);
} catch {
  // Non-fatal if localStorage unavailable
}

// Global safety net for Web version: silence any stray unhandled Tauri IPC errors
if (typeof window !== "undefined") {
  const isTauri = Boolean(
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ ||
    (window as unknown as { __TAURI__?: unknown }).__TAURI__ ||
    (window as unknown as { __TAURI_IPC__?: unknown }).__TAURI_IPC__
  );
  if (!isTauri) {
    window.addEventListener("unhandledrejection", (event) => {
      const msg = String(event.reason || "");
      if (msg.includes("__TAURI_INTERNALS__") || msg.includes("invoke")) {
        event.preventDefault();
      }
    });
    window.addEventListener("error", (event) => {
      const msg = String(event.message || "");
      if (msg.includes("__TAURI_INTERNALS__") || msg.includes("invoke")) {
        event.preventDefault();
      }
    });
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
