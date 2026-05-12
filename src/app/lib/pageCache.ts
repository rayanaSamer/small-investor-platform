// cache بسيط في الذاكرة - يحفظ البيانات بين التنقلات
const store = new Map<string, { data: unknown; ts: number }>();
const TTL = 3 * 60 * 1000; // 3 دقائق

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL) { store.delete(key); return null; }
  return entry.data as T;
}

export function setCached(key: string, data: unknown) {
  store.set(key, { data, ts: Date.now() });
}

export function invalidateCache(key: string) {
  store.delete(key);
}

export function invalidateUserCache(userId: string) {
  for (const key of store.keys()) {
    if (key.startsWith(userId)) store.delete(key);
  }
}
