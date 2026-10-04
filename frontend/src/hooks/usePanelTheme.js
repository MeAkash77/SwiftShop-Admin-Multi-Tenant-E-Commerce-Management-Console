import { useCallback, useEffect, useState } from "react";

const VALID = new Set(["light", "dark"]);

function readTheme(storageKey, fallback) {
  try {
    const stored = localStorage.getItem(storageKey);
    if (VALID.has(stored)) return stored;
  } catch {
    /* ignore */
  }
  return fallback;
}

function applyDocumentTheme(theme) {
  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) return;

  root.dataset.panelTheme = theme;
  body.dataset.panelTheme = theme;
  root.style.colorScheme = theme;
  body.style.colorScheme = theme;
}

function clearDocumentTheme() {
  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) return;

  delete root.dataset.panelTheme;
  delete body.dataset.panelTheme;
  root.style.removeProperty("color-scheme");
  body.style.removeProperty("color-scheme");
}

/**
 * Persist panel appearance (light | dark) per workspace key.
 * When applyToDocument is true, syncs html/body colors while mounted.
 */
export default function usePanelTheme(
  storageKey = "panel-theme",
  fallback = "light",
  { applyToDocument = false } = {}
) {
  const [theme, setThemeState] = useState(() =>
    readTheme(storageKey, fallback)
  );

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      /* ignore */
    }
  }, [storageKey, theme]);

  useEffect(() => {
    if (!applyToDocument) return undefined;
    applyDocumentTheme(theme);
    return () => clearDocumentTheme();
  }, [applyToDocument, theme]);

  const setTheme = useCallback((next) => {
    setThemeState(VALID.has(next) ? next : "light");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return { theme, setTheme, toggleTheme };
}
