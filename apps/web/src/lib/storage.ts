import type { AuthResponse, TokenResponse, User } from '../types/api';

const AUTH_KEY = 'gigahub.forge.auth.session.v1';
const LEGACY_LOCAL_AUTH_KEYS = [
  'gigahub.forge.auth.v5',
  'gigahub.forge.auth.v4',
  'gigahub.forge.auth.v3',
  'gigahub.forge.auth.v2',
  'gigahub.forge.auth.v1',
];

export const AUTH_REFRESHED_EVENT = 'gigahub:auth-refreshed';
export const AUTH_CLEARED_EVENT = 'gigahub:auth-cleared';

export type StoredAuth = {
  user: User;
  tokens: TokenResponse;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}

function readFromSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeToSession(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Ignore quota/private-mode errors and keep the in-memory React state usable.
  }
}

function removeFromSession(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // no-op
  }
}

function removeFromLocal(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // no-op
  }
}

export function isJwtLike(token?: string | null): boolean {
  return Boolean(token && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token));
}

export function isRefreshTokenLike(token?: string | null): boolean {
  return Boolean(token && token.length >= 32);
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return atob(padded);
}

export function readJwtExpiryMs(token?: string | null): number | null {
  if (!isJwtLike(token)) return null;
  const tokenValue = token as string;

  try {
    const payload = JSON.parse(decodeBase64Url(tokenValue.split('.')[1])) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isAccessTokenExpiring(skewMs = 60_000): boolean {
  const token = readAccessToken();
  if (!token) return false;
  const expiresAt = readJwtExpiryMs(token);
  return expiresAt !== null && expiresAt <= Date.now() + skewMs;
}

function normalizeAuth(value: unknown): StoredAuth | null {
  if (!isRecord(value)) return null;
  const maybeData = isRecord(value.data) ? value.data : value;
  if (!isRecord(maybeData.user) || !isRecord(maybeData.tokens)) return null;

  const tokens = maybeData.tokens as Record<string, unknown>;
  const accessToken = typeof tokens.accessToken === 'string' ? tokens.accessToken : '';
  const refreshToken = typeof tokens.refreshToken === 'string' ? tokens.refreshToken : '';

  if (!isJwtLike(accessToken) || !isRefreshTokenLike(refreshToken)) return null;

  return maybeData as StoredAuth;
}

function purgeLegacyLocalAuth(): void {
  LEGACY_LOCAL_AUTH_KEYS.forEach(removeFromLocal);
}

export function loadStoredAuth(): StoredAuth | null {
  purgeLegacyLocalAuth();

  try {
    const raw = readFromSession(AUTH_KEY);
    if (!raw) return null;
    const auth = normalizeAuth(JSON.parse(raw));
    if (!auth) {
      clearStoredAuth();
      return null;
    }
    return auth;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function persistAuth(auth: AuthResponse): void {
  const normalized = normalizeAuth(auth);
  if (!normalized) {
    clearStoredAuth();
    throw new Error('Invalid authentication token response');
  }

  writeToSession(AUTH_KEY, JSON.stringify(normalized));
  purgeLegacyLocalAuth();
}

export function clearStoredAuth(): void {
  removeFromSession(AUTH_KEY);
  purgeLegacyLocalAuth();
}

export function readAccessToken(): string | null {
  const token = loadStoredAuth()?.tokens.accessToken ?? null;
  return isJwtLike(token) ? token : null;
}

export function readRefreshToken(): string | null {
  const token = loadStoredAuth()?.tokens.refreshToken ?? null;
  return isRefreshTokenLike(token) ? token : null;
}
