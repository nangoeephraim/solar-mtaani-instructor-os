import { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';

/**
 * useLocalStorage - Persist state to localStorage with TypeScript generics
 * Features: Auto-sync across browser tabs, error handling, SSR-safe
 * 
 * @param key - The localStorage key
 * @param initialValue - The initial value if key doesn't exist
 * @returns [storedValue, setValue, removeValue] - Similar to useState with remove function
 * 
 * @example
 * const [settings, setSettings] = useLocalStorage('app-settings', { theme: 'light' });
 * setSettings({ theme: 'dark' });
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, Dispatch<SetStateAction<T>>, () => void] {
    // Get from localStorage or use initial value
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Update localStorage when state changes
    const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
        try {
            // Allow value to be a function so we have the same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
                // Dispatch custom event for same-window updates
                window.dispatchEvent(new CustomEvent('local-storage-update', {
                    detail: { key, value: valueToStore }
                }));
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    // Remove value from localStorage
    const removeValue = useCallback(() => {
        try {
            setStoredValue(initialValue);
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
            }
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    // Listen for changes in other tabs/windows
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    setStoredValue(JSON.parse(e.newValue) as T);
                } catch (error) {
                    console.error('Error parsing storage event:', error);
                }
            } else if (e.key === key && e.newValue === null) {
                setStoredValue(initialValue);
            }
        };

        // Listen for changes from other tabs
        window.addEventListener('storage', handleStorageChange);

        // Listen for changes from same window (custom event)
        const handleLocalUpdate = (e: CustomEvent<{ key: string; value: T }>) => {
            if (e.detail.key === key) {
                setStoredValue(e.detail.value);
            }
        };
        window.addEventListener('local-storage-update', handleLocalUpdate as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('local-storage-update', handleLocalUpdate as EventListener);
        };
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
