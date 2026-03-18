import { useEffect } from "react";

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isModifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (isModifier) {
        if (shortcuts[key]) {
          event.preventDefault();
          shortcuts[key]();
          return;
        }
        if ((key === "=" || key === "+") && shortcuts["zoomIn"]) {
          event.preventDefault();
          shortcuts["zoomIn"]();
          return;
        }
        if (key === "-" && shortcuts["zoomOut"]) {
          event.preventDefault();
          shortcuts["zoomOut"]();
          return;
        }
      }
      if (!isModifier && key === "escape" && shortcuts["escape"]) {
        shortcuts["escape"]();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}