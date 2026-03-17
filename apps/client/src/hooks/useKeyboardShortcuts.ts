import { useEffect } from 'react';

export function useKeyboardShortcuts(
  key: string, 
  callback: () => void, 
  requireMeta = true 
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isMetaPressed = event.metaKey || event.ctrlKey;
      
      const match = event.key.toLowerCase() === key.toLowerCase() || event.key === key;

      if (match) {
        if (requireMeta && !isMetaPressed) return;
        if (!requireMeta && isMetaPressed) return;

        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, requireMeta]);
}