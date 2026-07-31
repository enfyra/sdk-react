import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { EnfyraClient } from '@enfyra/sdk-core';
import type { AuthTokens } from '@enfyra/sdk-core';
import type { StoreApi } from 'zustand/vanilla';
import type { AuthStore } from '../stores/authStore';
import { createAuthStore } from '../stores/authStore';
import type { ReactClientConfig } from '../types';

interface EnfyraContextValue {
  client: EnfyraClient;
  authStore: StoreApi<AuthStore>;
}

const EnfyraContext = createContext<EnfyraContextValue | null>(null);
const TOKENS_STORAGE_KEY = '__enfyra_tokens';

export interface EnfyraProviderProps {
  config: ReactClientConfig;
  children: ReactNode;
}

function parseSavedTokens(raw: string | null): AuthTokens | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.accessToken === 'string' && typeof parsed.expTime === 'number') {
      return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

export function EnfyraProvider({ config, children }: EnfyraProviderProps) {
  assertBrowserRuntime();
  const value = useMemo(() => {
    const client = new EnfyraClient(
      typeof config === 'string' ? { baseUrl: config } : config,
    );
    const saved = parseSavedTokens(localStorage.getItem(TOKENS_STORAGE_KEY));
    if (saved) {
      client.auth.setTokens(saved).catch(() => {});
    }
    return { client, authStore: createAuthStore(client) };
  }, [typeof config === 'string' ? config : config.baseUrl]);

  const client = value.client;
  const prevTokensRef = useRef<string | null>(null);

  useEffect(() => {
    prevTokensRef.current = localStorage.getItem(TOKENS_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const tokens = client.auth.getTokens();
      const current = tokens ? JSON.stringify(tokens) : null;
      if (current !== prevTokensRef.current) {
        prevTokensRef.current = current;
        if (current) {
          localStorage.setItem(TOKENS_STORAGE_KEY, current);
        } else {
          localStorage.removeItem(TOKENS_STORAGE_KEY);
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [client]);

  return (
    <EnfyraContext.Provider value={value}>{children}</EnfyraContext.Provider>
  );
}

export function useEnfyra(): EnfyraClient {
  const ctx = useContext(EnfyraContext);
  if (!ctx) throw new Error('useEnfyra must be used within an EnfyraProvider');
  return ctx.client;
}

export function useAuthStoreApi(): StoreApi<AuthStore> {
  const ctx = useContext(EnfyraContext);
  if (!ctx) throw new Error('useAuthStoreApi must be used within an EnfyraProvider');
  return ctx.authStore;
}

function assertBrowserRuntime(): void {
  if (typeof window === 'undefined') {
    throw new Error('@enfyra/sdk-react is CSR-only. Use @enfyra/next for SSR.');
  }
}
