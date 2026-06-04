import { useEffect, useState } from 'react';
import { cachedResource, getCachedValue, hasCachedValue } from '../lib/resourceCache';

export type ResourceState<T> = {
  data: T;
  error: string | null;
  isLoading: boolean;
  refresh(): Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T>>;
};

type ResourceOptions = {
  cacheKey?: string;
  ttlMs?: number;
  keepPreviousOnError?: boolean;
};

export function useAsyncResource<T>(
  factory: () => Promise<T>,
  fallback: T,
  deps: React.DependencyList = [],
  options: ResourceOptions = {},
): ResourceState<T> {
  const hasCached = options.cacheKey ? hasCachedValue(options.cacheKey) : false;
  const cached = hasCached && options.cacheKey ? getCachedValue<T>(options.cacheKey) : undefined;
  const [data, setData] = useState<T>(hasCached ? (cached as T) : fallback);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!hasCached);

  async function load(force = false) {
    setIsLoading(true);
    setError(null);
    try {
      const nextData = options.cacheKey
        ? await cachedResource(options.cacheKey, factory, options.ttlMs, force)
        : await factory();
      setData(nextData);
    } catch (errorValue) {
      setError(
        errorValue instanceof Error
          ? errorValue.message
          : 'We could not refresh this view. Showing the last available workspace state.',
      );
      if (!options.keepPreviousOnError) setData(fallback);
    } finally {
      setIsLoading(false);
    }
  }

  async function refresh() {
    await load(true);
  }

  useEffect(() => {
    void load(false);
  }, deps);

  return { data, error, isLoading, refresh, setData };
}
