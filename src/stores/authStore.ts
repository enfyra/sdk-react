import { createStore } from 'zustand/vanilla';
import type { EnfyraClient, RequestStatus, UserInfo } from '@enfyra/sdk-core';

export interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  pending: boolean;
  status: RequestStatus | null;
  error: Error | null;
}

export interface AuthActions {
  refresh: () => Promise<UserInfo | null>;
  setUser: (user: UserInfo | null) => void;
  setPending: (pending: boolean, status?: RequestStatus | null) => void;
  setError: (error: Error | null) => void;
}

export type AuthStore = AuthState & AuthActions;

export function createAuthStore(client: EnfyraClient) {
  return createStore<AuthStore>((set) => ({
    user: null,
    isAuthenticated: false,
    pending: false,
    status: null,
    error: null,

    setUser: (user) => set({ user, isAuthenticated: user !== null }),
    setPending: (pending, status) => set({ pending, ...(status !== undefined ? { status } : {}) }),
    setError: (error) => set({ error }),

    refresh: async () => {
      set({ pending: true, status: 'pending', error: null });
      try {
        const user = await client.auth.getMe();
        set({ user, isAuthenticated: user !== null, pending: false, status: 'success' });
        return user;
      } catch (err) {
        const is401 = err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode?: number }).statusCode === 401;
        if (is401) {
          set({ user: null, isAuthenticated: false, pending: false, status: 'success' });
          return null;
        }
        const error = err instanceof Error ? err : new Error('Auth check failed');
        set({ error, pending: false, status: 'error' });
        return null;
      }
    },
  }));
}
