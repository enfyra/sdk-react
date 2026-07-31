import { useCallback, useEffect } from 'react';
import { useStore } from 'zustand';
import type { AuthLoginResult, LoginCredentials } from '@enfyra/sdk-core';
import { useEnfyra, useAuthStoreApi } from '../context/EnfyraContext';
import type { AuthStore } from '../stores/authStore';

export interface UseAuthReturn {
  user: AuthStore['user'];
  isAuthenticated: boolean;
  pending: boolean;
  status: AuthStore['status'];
  error: Error | null;
  login: (credentials: LoginCredentials) => Promise<AuthLoginResult | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthStore['user']>;
}

export function useAuth(): UseAuthReturn {
  const client = useEnfyra();
  const store = useAuthStoreApi();

  const user = useStore(store, (s) => s.user);
  const isAuthenticated = useStore(store, (s) => s.isAuthenticated);
  const pending = useStore(store, (s) => s.pending);
  const status = useStore(store, (s) => s.status);
  const error = useStore(store, (s) => s.error);
  const refresh = useStore(store, (s) => s.refresh);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthLoginResult | null> => {
    store.getState().setPending(true, 'pending');
    store.getState().setError(null);
    try {
      const result = await client.auth.login(credentials);
      await store.getState().refresh();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Login failed');
      store.getState().setError(error);
      store.getState().setPending(false, 'error');
      return null;
    }
  }, [client, store]);

  const logout = useCallback(async (): Promise<void> => {
    await client.auth.logout();
    store.getState().setUser(null);
    store.getState().setPending(false, null);
  }, [client, store]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { user, isAuthenticated, pending, status, error, login, logout, refresh };
}
