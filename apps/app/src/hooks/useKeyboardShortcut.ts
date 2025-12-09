import { useEffect } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * Enables better keyboard navigation throughout the app
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    enabled?: boolean;
  } = {}
) {
  const { ctrl = false, shift = false, alt = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the pressed key matches
      if (event.key.toLowerCase() !== key.toLowerCase()) return;

      // Check modifiers
      if (ctrl && !event.ctrlKey && !event.metaKey) return;
      if (shift && !event.shiftKey) return;
      if (alt && !event.altKey) return;

      // Don't trigger if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      event.preventDefault();
      callback();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback, ctrl, shift, alt, enabled]);
}

/**
 * Hook to add Escape key handler
 */
export function useEscapeKey(callback: () => void, enabled = true) {
  useKeyboardShortcut('Escape', callback, { enabled });
}

/**
 * Hook to add Enter key handler
 */
export function useEnterKey(callback: () => void, enabled = true) {
  useKeyboardShortcut('Enter', callback, { enabled });
}

export default useKeyboardShortcut;
