import { createStore } from 'zustand/vanilla';
import type { EnfyraClient, UserInfo } from '@enfyra/sdk-core';
import type { AuthStore } from '../types';

export function createAuthStore(client: EnfyraClient) {
  let generation = 0;
  let refreshPromise: Promise<UserInfo | null> | null = null;
  return createStore<AuthStore>((set, get) => ({
    user: null,
    isAuthenticated: false,
    pending: false,
    status: null,
    error: null,
    setUser: (user) => {
      generation++;
      refreshPromise = null;
      set({ user, isAuthenticated: user !== null, pending: false });
    },
    setPending: (pending, status) =>
      set({ pending, ...(status !== undefined ? { status } : {}) }),
    setError: (error) => set({ error }),
    login: async (credentials) => {
      const current = ++generation;
      refreshPromise = null;
      set({ pending: true, status: 'pending', error: null });
      try {
        const result = await client.auth.login(credentials);
        if (current !== generation) return null;
        await get().refresh();
        return result;
      } catch (err) {
        if (current === generation)
          set({
            error: err instanceof Error ? err : new Error('Login failed'),
            pending: false,
            status: 'error',
          });
        return null;
      }
    },
    logout: async () => {
      get().setUser(null);
      set({ pending: false, status: null, error: null });
      await client.auth.logout();
    },
    refresh: () => {
      if (refreshPromise) return refreshPromise;
      const current = generation;
      set({ pending: true, status: 'pending', error: null });
      refreshPromise = (async () => {
        try {
          const user = await client.auth.getMe();
          if (generation !== current) return get().user;
          set({
            user,
            isAuthenticated: user !== null,
            pending: false,
            status: 'success',
          });
          return user;
        } catch (err) {
          if (generation !== current) return get().user;
          const is401 =
            err &&
            typeof err === 'object' &&
            'statusCode' in err &&
            err.statusCode === 401;
          if (is401)
            set({
              user: null,
              isAuthenticated: false,
              pending: false,
              status: 'success',
            });
          else
            set({
              error:
                err instanceof Error ? err : new Error('Auth check failed'),
              pending: false,
              status: 'error',
            });
          return null;
        } finally {
          if (generation === current) refreshPromise = null;
        }
      })();
      return refreshPromise;
    },
  }));
}
