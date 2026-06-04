import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, api } from '../lib/api';
import {
  AUTH_CLEARED_EVENT,
  AUTH_REFRESHED_EVENT,
  clearStoredAuth,
  loadStoredAuth,
  persistAuth,
  readRefreshToken,
} from '../lib/storage';
import { invalidateResource } from '../lib/resourceCache';
import { loadCurrentProfileCached } from '../hooks/useCurrentProfile';
import type { AuthResponse, RegistrationRole, User } from '../types/api';

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string, role: RegistrationRole): Promise<void>;
  logout(): Promise<void>;
  refreshMe(): Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = loadStoredAuth();
  const [user, setUser] = useState<User | null>(stored?.user ?? null);
  const [isLoading, setIsLoading] = useState(false);

  const applyAuth = useCallback((auth: AuthResponse) => {
    invalidateResource();
    persistAuth(auth);
    setUser(auth.user);
    void loadCurrentProfileCached(false, auth.user.id).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    void loadCurrentProfileCached(false, user.id).catch(() => undefined);
  }, [user?.id]);

  useEffect(() => {
    const handleRefresh = (event: Event) => {
      const auth = (event as CustomEvent<AuthResponse>).detail;
      if (auth) setUser(auth.user);
    };

    const handleClear = () => setUser(null);

    window.addEventListener(AUTH_REFRESHED_EVENT, handleRefresh);
    window.addEventListener(AUTH_CLEARED_EVENT, handleClear);
    return () => {
      window.removeEventListener(AUTH_REFRESHED_EVENT, handleRefresh);
      window.removeEventListener(AUTH_CLEARED_EVENT, handleClear);
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        applyAuth(await api.auth.login(email.trim(), password));
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuth],
  );

  const register = useCallback(
    async (email: string, password: string, role: RegistrationRole) => {
      setIsLoading(true);
      try {
        applyAuth(await api.auth.register(email.trim(), password, role));
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuth],
  );

  const logout = useCallback(async () => {
    const refreshToken = readRefreshToken();
    invalidateResource();
    clearStoredAuth();
    setUser(null);
    if (refreshToken) {
      try {
        await api.auth.logout(refreshToken);
      } catch {
        // The local session is already cleared.
      }
    }
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const nextUser = await api.users.me();
      setUser(nextUser);
      const storedNow = loadStoredAuth();
      if (storedNow) persistAuth({ ...storedNow, user: nextUser });
    } catch (errorValue) {
      if (errorValue instanceof ApiError && errorValue.status === 401) {
        invalidateResource();
        clearStoredAuth();
        setUser(null);
      }
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshMe,
    }),
    [isLoading, login, logout, refreshMe, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
