import { a as reactExports } from "./index-l2RTGEA9.js";
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = reactExports.useState(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  const setValue = reactExports.useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        window.dispatchEvent(new CustomEvent("local-storage-update", {
          detail: { key, value: valueToStore }
        }));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  const removeValue = reactExports.useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error("Error parsing storage event:", error);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    const handleLocalUpdate = (e) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };
    window.addEventListener("local-storage-update", handleLocalUpdate);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage-update", handleLocalUpdate);
    };
  }, [key, initialValue]);
  return [storedValue, setValue, removeValue];
}
export {
  useLocalStorage as u
};
