import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) setValue(JSON.parse(item));
    } catch {
      // ignore SSR/parse errors
    }
  }, [key]);

  const setStoredValue = (val: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next = typeof val === 'function' ? (val as (prev: T) => T)(prev) : val;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // quota exceeded or private mode
      }
      return next;
    });
  };

  return [value, setStoredValue];
}
