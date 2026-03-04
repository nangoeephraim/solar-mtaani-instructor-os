/**
 * PRISM Offline Sync Service
 * 
 * Provides robust offline capabilities:
 * 1. Persistent IndexedDB caching for fast loads and offline reading.
 * 2. Mutation queue to store actions (like add student) when offline,
 *    and replay them automatically when the connection is restored.
 */

const DB_NAME = 'prism_offline_db';
const DB_VERSION = 1;
const STORE_CACHE = 'api_cache';
const STORE_QUEUE = 'mutation_queue';

// ==========================================
// CORE IndexedDB WRAPPER
// ==========================================

let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                // Cache Store (Key-Value)
                if (!db.objectStoreNames.contains(STORE_CACHE)) {
                    db.createObjectStore(STORE_CACHE);
                }
                // Queue Store (for delayed mutations)
                if (!db.objectStoreNames.contains(STORE_QUEUE)) {
                    db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
            request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
        });
    }
    return dbPromise;
};

// ==========================================
// KEY-VALUE CACHE (For Read Data)
// ==========================================

export const setCache = async (key: string, data: any): Promise<void> => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_CACHE, 'readwrite');
            const store = transaction.objectStore(STORE_CACHE);
            const request = store.put(data, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn('[Offline Sync] Failed to cache data:', err);
    }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_CACHE, 'readonly');
            const store = transaction.objectStore(STORE_CACHE);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn('[Offline Sync] Failed to read cache:', err);
        return null;
    }
};

export const clearCache = async (): Promise<void> => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_CACHE, 'readwrite');
            const store = transaction.objectStore(STORE_CACHE);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn('[Offline Sync] Failed to clear cache:', err);
    }
};

// ==========================================
// MUTATION QUEUE (For Offline Writes)
// ==========================================

export interface QueuedMutation {
    id?: number;
    action: string;
    payload: any;
    timestamp: number;
}

/**
 * Enqueue a mutation to be safely sent to the server later.
 */
export const enqueueMutation = async (action: string, payload: any): Promise<void> => {
    try {
        const db = await getDB();
        const mutation: QueuedMutation = { action, payload, timestamp: Date.now() };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_QUEUE, 'readwrite');
            const store = transaction.objectStore(STORE_QUEUE);
            const request = store.add(mutation);

            request.onsuccess = () => {
                console.log(`[Offline Sync] Enqueued mutation: ${action}`);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error('[Offline Sync] Queue error:', err);
    }
};

/**
 * Fetch all pending offline mutations
 */
export const getPendingMutations = async (): Promise<QueuedMutation[]> => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_QUEUE, 'readonly');
            const store = transaction.objectStore(STORE_QUEUE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error('[Offline Sync] Read queue error:', err);
        return [];
    }
};

/**
 * Remove a single mutation from the queue after successful processing
 */
export const dequeueMutation = async (id: number): Promise<void> => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_QUEUE, 'readwrite');
            const store = transaction.objectStore(STORE_QUEUE);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error('[Offline Sync] Dequeue error:', err);
    }
};

// ==========================================
// NETWORK STATUS UTILITIES
// ==========================================

export const isOnline = (): boolean => navigator.onLine;

let isSyncing = false;

/**
 * Attempt to replay all queued mutations to the server.
 * Requires a callback map matching `action` strings to actual API calls.
 */
export const syncQueue = async (
    actionHandlers: Record<string, (payload: any) => Promise<boolean>>
): Promise<void> => {
    if (!isOnline() || isSyncing) return;

    const pending = await getPendingMutations();
    if (pending.length === 0) return;

    console.log(`[Offline Sync] Syncing ${pending.length} pending mutations...`);
    isSyncing = true;

    for (const mutation of pending) {
        try {
            const handler = actionHandlers[mutation.action];
            if (handler) {
                const success = await handler(mutation.payload);
                if (success && mutation.id) {
                    await dequeueMutation(mutation.id);
                    console.log(`[Offline Sync] Synced mutation: ${mutation.action}`);
                } else {
                    console.warn(`[Offline Sync] Handler returned false for: ${mutation.action}`);
                }
            } else {
                console.error(`[Offline Sync] No handler found for action: ${mutation.action}`);
                // Safely dequeue to prevent poison pills from blocking the queue
                if (mutation.id) await dequeueMutation(mutation.id);
            }
        } catch (err) {
            console.error(`[Offline Sync] Failed to sync ${mutation.action}:`, err);
            // Break on network error, but continue if the server rejected it. 
            // Better checking needed here, but for now we stop to retry later.
            break;
        }
    }

    isSyncing = false;
    console.log('[Offline Sync] Sync absolute complete.');
};
