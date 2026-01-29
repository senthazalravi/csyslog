import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
      // Notify other hooks in the same window about changes for this key
      try {
        window.dispatchEvent(new CustomEvent('local-storage', { detail: { key, value } }));
      } catch (err) {
        // ignore custom event errors
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Listen for storage (other windows) and custom local-storage events in this window
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          // ignore parse errors
        }
      }
    };

    const onLocalStorageEvent = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce?.detail?.key === key) {
        setStoredValue(ce.detail.value);
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('local-storage', onLocalStorageEvent as EventListener);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('local-storage', onLocalStorageEvent as EventListener);
    };
  }, [key]);

  return [storedValue, setValue];
}
