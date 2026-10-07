'use client';

import { useSyncExternalStore, useCallback } from 'react';

/**
 * Event-driven subscription to synchronize localStorage updates
 */
function subscribe(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('local-storage-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('local-storage-change', callback);
  };
}

/**
 * React 18/19 compliant hook to read and write to localStorage
 * Avoids hydration mismatches and cascading render warnings.
 *
 * @param {string} key - localStorage key
 * @param {*} initialValue - Default fallback value
 */
export function useLocalStorage(key, initialValue = null) {
  const getSnapshot = () => {
    if (typeof window === 'undefined') return JSON.stringify(initialValue);
    try {
      const item = localStorage.getItem(key);
      return item !== null ? item : JSON.stringify(initialValue);
    } catch {
      return JSON.stringify(initialValue);
    }
  };

  const getServerSnapshot = () => JSON.stringify(initialValue);

  const rawValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (value) => {
      if (typeof window === 'undefined') return;
      try {
        if (value === null || value === undefined) {
          localStorage.removeItem(key);
        } else {
          const stringified = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(key, stringified);
        }
        // Notify other components in the same tab
        window.dispatchEvent(new Event('local-storage-change'));
      } catch (err) {
        console.error(`Failed to update localStorage for key "${key}":`, err);
      }
    },
    [key]
  );

  let parsedValue = initialValue;
  try {
    parsedValue = rawValue ? JSON.parse(rawValue) : initialValue;
  } catch {
    parsedValue = rawValue || initialValue;
  }

  return [parsedValue, setValue];
}
