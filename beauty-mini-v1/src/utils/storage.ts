/**
 * Universal Storage Abstraction Layer
 * Provides a consistent API across WeChat Mini Program and H5 environments.
 * 
 * WeChat Mini Program: uses wx.setStorageSync / wx.getStorageSync
 * H5 / Browser: uses localStorage
 */

interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function createWechatStorage(): StorageAdapter {
  const isWeChat = typeof wx !== "undefined" && wx.getStorageSync;
  if (!isWeChat) {
    return createLocalStorageAdapter();
  }
  return {
    getItem(key: string): string | null {
      try {
        const value = wx.getStorageSync(key);
        return typeof value === "string" ? value : (value !== undefined && value !== null ? String(value) : null);
      } catch (e) {
        console.warn("[Storage] wx.getStorageSync failed for key", key, e);
        return null;
      }
    },
    setItem(key: string, value: string): void {
      try {
        wx.setStorageSync(key, value);
      } catch (e) {
        console.warn("[Storage] wx.setStorageSync failed for key", key, e);
      }
    },
    removeItem(key: string): void {
      try {
        wx.removeStorageSync(key);
      } catch (e) {
        console.warn("[Storage] wx.removeStorageSync failed for key", key, e);
      }
    }
  };
}

function createLocalStorageAdapter(): StorageAdapter {
  const hasStorage = typeof localStorage !== "undefined";
  if (!hasStorage) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    };
  }
  return {
    getItem(key: string): string | null {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn("[Storage] localStorage.getItem failed for key", key, e);
        return null;
      }
    },
    setItem(key: string, value: string): void {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn("[Storage] localStorage.setItem failed for key", key, e);
      }
    },
    removeItem(key: string): void {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn("[Storage] localStorage.removeItem failed for key", key, e);
      }
    }
  };
}

// Initialize with the appropriate adapter based on runtime environment
const storage: StorageAdapter = createWechatStorage();

export { storage, StorageAdapter, createWechatStorage, createLocalStorageAdapter };

// Convenience helpers
export function getStorage<T = unknown>(key: string, fallback?: T): T | null {
  const raw = storage.getItem(key);
  if (raw === null) return fallback !== undefined ? fallback : null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

export function setStorage(key: string, value: unknown): void {
  storage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
}

export function removeStorage(key: string): void {
  storage.removeItem(key);
}

// Runtime environment detection helpers (no import.meta.env needed)
export function isWeChatMiniProgram(): boolean {
  return typeof wx !== "undefined" && typeof wx.getStorageSync === "function";
}

export function isDevelopment(): boolean {
  // In WeChat mini program, there is no import.meta.env;
  // Default to false for production; developer tools can be detected separately
  return false;
}
