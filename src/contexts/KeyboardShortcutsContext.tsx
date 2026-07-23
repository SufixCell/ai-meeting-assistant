import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Platform } from 'react-native';

export interface Keybinds {
  pauseKey: string;
  pauseLabel: string;
  stopKey: string;
  stopLabel: string;
}

const DEFAULT_KEYBINDS: Keybinds = {
  pauseKey: 'Space',
  pauseLabel: 'SPACE',
  stopKey: 'KeyS',
  stopLabel: 'S',
};

const STORAGE_KEY = 'notia_keyboard_binds';

interface KeyboardShortcutsContextType {
  keybinds: Keybinds;
  updatePauseKey: (code: string, label: string) => void;
  updateStopKey: (code: string, label: string) => void;
  resetDefaults: () => void;
  registerPauseHandler: (fn: (() => void) | null) => void;
  registerStopHandler: (fn: (() => void) | null) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType>({
  keybinds: DEFAULT_KEYBINDS,
  updatePauseKey: () => {},
  updateStopKey: () => {},
  resetDefaults: () => {},
  registerPauseHandler: () => {},
  registerStopHandler: () => {},
});

const loadKeybinds = (): Keybinds => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (_) {}
  return DEFAULT_KEYBINDS;
};

const saveKeybinds = (binds: Keybinds) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(binds));
    }
  } catch (_) {}
};

export const KeyboardShortcutsProvider = ({ children }: { children: ReactNode }) => {
  const [keybinds, setKeybinds] = useState<Keybinds>(DEFAULT_KEYBINDS);
  const pauseHandlerRef = useRef<(() => void) | null>(null);
  const stopHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setKeybinds(loadKeybinds());
  }, []);

  const updatePauseKey = (code: string, label: string) => {
    setKeybinds(prev => {
      const updated = { ...prev, pauseKey: code, pauseLabel: label };
      saveKeybinds(updated);
      return updated;
    });
  };

  const updateStopKey = (code: string, label: string) => {
    setKeybinds(prev => {
      const updated = { ...prev, stopKey: code, stopLabel: label };
      saveKeybinds(updated);
      return updated;
    });
  };

  const resetDefaults = () => {
    setKeybinds(DEFAULT_KEYBINDS);
    saveKeybinds(DEFAULT_KEYBINDS);
  };

  const registerPauseHandler = (fn: (() => void) | null) => {
    pauseHandlerRef.current = fn;
  };

  const registerStopHandler = (fn: (() => void) | null) => {
    stopHandlerRef.current = fn;
  };

  // Global Web Keydown Listener
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea or contenteditable element
      const target = e.target as HTMLElement;
      if (
        target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        )
      ) {
        return;
      }

      const code = e.code;
      const key = e.key.toUpperCase();

      // Check Pause key match
      if (
        (keybinds.pauseKey && code === keybinds.pauseKey) ||
        (keybinds.pauseLabel && (key === keybinds.pauseLabel || (keybinds.pauseLabel === 'SPACE' && code === 'Space')))
      ) {
        if (pauseHandlerRef.current) {
          e.preventDefault();
          pauseHandlerRef.current();
        }
      }

      // Check Stop key match
      else if (
        (keybinds.stopKey && code === keybinds.stopKey) ||
        (keybinds.stopLabel && (key === keybinds.stopLabel || (keybinds.stopLabel === 'ESC' && code === 'Escape')))
      ) {
        if (stopHandlerRef.current) {
          e.preventDefault();
          stopHandlerRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keybinds]);

  return (
    <KeyboardShortcutsContext.Provider value={{
      keybinds,
      updatePauseKey,
      updateStopKey,
      resetDefaults,
      registerPauseHandler,
      registerStopHandler,
    }}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};

export const useKeyboardShortcuts = () => useContext(KeyboardShortcutsContext);
