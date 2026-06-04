import { useEffect, useState } from 'react';
import { ApiError, api } from '../lib/api';
import { cachedResource, getCachedValue, setCachedResource } from '../lib/resourceCache';
import type { Profile } from '../types/api';

export const PROFILE_UPDATED_EVENT = 'gigahub:profile-updated';
const PROFILE_TTL_MS = 90_000;
const PROFILE_NOT_FOUND_TTL_MS = 12_000;

function profileCacheKey(userId?: string | null): string {
  return userId ? `profile:me:${userId}` : 'profile:me:anonymous';
}

async function readProfileWithSoftRetry(): Promise<Profile | null> {
  const waits = [0, 220, 520, 900];

  for (let attempt = 0; attempt < waits.length; attempt += 1) {
    if (waits[attempt] > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, waits[attempt]));
    }

    try {
      return await api.profiles.me();
    } catch (errorValue) {
      if (!(errorValue instanceof ApiError) || errorValue.status !== 404) throw errorValue;
      if (attempt === waits.length - 1) return null;
    }
  }

  return null;
}

export async function loadCurrentProfileCached(
  force = false,
  userId?: string | null,
): Promise<Profile | null> {
  const key = profileCacheKey(userId);

  try {
    return await cachedResource(key, readProfileWithSoftRetry, PROFILE_TTL_MS, force);
  } catch (errorValue) {
    if (errorValue instanceof ApiError && errorValue.status === 404) {
      setCachedResource(key, null, PROFILE_NOT_FOUND_TTL_MS);
      return null;
    }
    throw errorValue;
  }
}

export function hasCurrentProfileCached(userId?: string | null): boolean {
  return getCachedValue<Profile | null>(profileCacheKey(userId)) !== undefined;
}

export function primeCurrentProfile(profile: Profile | null, userId?: string | null): void {
  setCachedResource(
    profileCacheKey(userId ?? profile?.userId),
    profile,
    profile ? PROFILE_TTL_MS : PROFILE_NOT_FOUND_TTL_MS,
  );
}

export function dispatchProfileUpdated(profile: Profile): void {
  primeCurrentProfile(profile, profile.userId);
  window.dispatchEvent(new CustomEvent<Profile>(PROFILE_UPDATED_EVENT, { detail: profile }));
}

export function useCurrentProfile(enabled: boolean, userId?: string | null) {
  const key = profileCacheKey(userId);
  const [profile, setProfile] = useState<Profile | null>(
    () => getCachedValue<Profile | null>(key) ?? null,
  );
  const [isLoading, setIsLoading] = useState(
    enabled && getCachedValue<Profile | null>(key) === undefined,
  );

  useEffect(() => {
    let active = true;
    const nextKey = profileCacheKey(userId);

    if (!enabled || !userId) {
      setProfile(null);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    const cached = getCachedValue<Profile | null>(nextKey);
    if (cached !== undefined) {
      setProfile(cached);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    loadCurrentProfileCached(false, userId)
      .then((nextProfile) => {
        if (active) setProfile(nextProfile);
      })
      .catch(() => {
        if (active) setProfile(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, userId]);

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const nextProfile = (event as CustomEvent<Profile>).detail;
      if (nextProfile && (!userId || nextProfile.userId === userId)) setProfile(nextProfile);
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
  }, [userId]);

  return { profile, isLoading };
}
