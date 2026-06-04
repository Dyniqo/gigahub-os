type CacheEntry<T> = {
  value?: T;
  expiresAt: number;
  promise?: Promise<T>;
};

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL_MS = 45_000;

export function hasCachedValue(key: string): boolean {
  const entry = cache.get(key);
  return Boolean(entry && entry.expiresAt > Date.now() && !entry.promise && 'value' in entry);
}

export function getCachedValue<T>(key: string): T | undefined {
  if (!hasCachedValue(key)) return undefined;
  return cache.get(key)?.value as T;
}

export async function cachedResource<T>(
  key: string,
  factory: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS,
  force = false,
): Promise<T> {
  const now = Date.now();
  const current = cache.get(key) as CacheEntry<T> | undefined;

  if (!force && current) {
    if ('value' in current && current.expiresAt > now) return current.value as T;
    if (current.promise) return current.promise;
  }

  const promise = factory()
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    });

  cache.set(key, { promise, expiresAt: now + ttlMs });
  return promise;
}

export function setCachedResource<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function invalidateResource(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }

  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
