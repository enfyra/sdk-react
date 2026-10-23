import { useEffect } from 'react';
import { useStore } from 'zustand';
import { useAuthStoreApi } from '../context/EnfyraContext';
import type { UseAuthReturn } from '../types';

export function useAuth(): UseAuthReturn {
  const store = useAuthStoreApi();
  const user = useStore(store, (s) => s.user);
  const isAuthenticated = useStore(store, (s) => s.isAuthenticated);
  const pending = useStore(store, (s) => s.pending);
  const status = useStore(store, (s) => s.status);
  const error = useStore(store, (s) => s.error);
  const refresh = useStore(store, (s) => s.refresh);
  const login = useStore(store, (s) => s.login);
  const logout = useStore(store, (s) => s.logout);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return {
    user,
    isAuthenticated,
    pending,
    status,
    error,
    login,
    logout,
    refresh,
  };
}
