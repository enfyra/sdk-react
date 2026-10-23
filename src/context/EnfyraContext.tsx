import { createContext, useContext, useEffect, useState } from 'react';
import { createTokenPersistence, EnfyraClient } from '@enfyra/sdk-core';
import { createAuthStore } from '../stores/authStore';
import type { EnfyraContextValue, EnfyraProviderProps } from '../types';

const EnfyraContext = createContext<EnfyraContextValue | null>(null);
const DEFAULT_BASE_URL = '/enfyra';

export function EnfyraProvider({ config, children }: EnfyraProviderProps) {
  assertBrowserRuntime();
  const resolvedConfig =
    typeof config === 'string'
      ? { baseUrl: config }
      : (config ?? { baseUrl: DEFAULT_BASE_URL });
  const [value] = useState(() => {
    const client = new EnfyraClient(resolvedConfig);
    const persistence = createTokenPersistence(client, {
      getItem: (key) => window.localStorage.getItem(key),
      setItem: (key, value) => window.localStorage.setItem(key, value),
      removeItem: (key) => window.localStorage.removeItem(key),
    });
    return { client, authStore: createAuthStore(client), persistence };
  });

  useEffect(() => {
    value.persistence.sync();
    const interval =
      value.client.auth.strategy === 'token'
        ? setInterval(() => value.persistence.sync(), 500)
        : undefined;
    return () => {
      if (interval !== undefined) clearInterval(interval);
      value.client.dispose();
    };
  }, [value]);

  return (
    <EnfyraContext.Provider value={value}>{children}</EnfyraContext.Provider>
  );
}

export function useEnfyra(): EnfyraClient {
  const ctx = useContext(EnfyraContext);
  if (!ctx) throw new Error('useEnfyra must be used within an EnfyraProvider');
  return ctx.client;
}

export function useAuthStoreApi() {
  const ctx = useContext(EnfyraContext);
  if (!ctx)
    throw new Error('useAuthStoreApi must be used within an EnfyraProvider');
  return ctx.authStore;
}

function assertBrowserRuntime(): void {
  if (typeof window === 'undefined') {
    throw new Error(
      '@enfyra/sdk-react is CSR-only. Use @enfyra/sdk-next for SSR.',
    );
  }
}
