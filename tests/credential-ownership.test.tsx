import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnfyraProvider, useEnfyra } from '../src/index';
import { createAuthStore } from '../src/stores/authStore';
import { EnfyraClient } from '@enfyra/sdk-core';

const savedTokens = new Map<string, string>();
beforeEach(() =>
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => savedTokens.get(key) ?? null,
    setItem: (key: string, value: string) => savedTokens.set(key, value),
    removeItem: (key: string) => savedTokens.delete(key),
    clear: () => savedTokens.clear(),
  }),
);
let client: EnfyraClient;
function Consumer() {
  client = useEnfyra();
  return null;
}
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});
describe('React credential ownership', () => {
  it('does not restore a legacy unowned credential over explicit initialTokens', () => {
    localStorage.setItem(
      '__enfyra_tokens',
      JSON.stringify({
        accessToken: 'other-backend',
        expTime: Date.now() + 900000,
      }),
    );
    render(
      <EnfyraProvider
        config={{
          baseUrl: 'https://b.invalid',
          auth: {
            strategy: 'token',
            initialTokens: {
              accessToken: 'explicit-b',
              expTime: Date.now() + 900000,
            },
          },
        }}
      >
        <Consumer />
      </EnfyraProvider>,
    );
    expect(client.auth.getTokens()?.accessToken).toBe('explicit-b');
  });
  it('isolates saved credentials by backend while cookie clients do not touch persistence', async () => {
    vi.useFakeTimers();
    const a = render(
      <EnfyraProvider
        config={{
          baseUrl: 'https://a.invalid',
          auth: {
            strategy: 'token',
            initialTokens: { accessToken: 'a', expTime: Date.now() + 900000 },
          },
        }}
      >
        <Consumer />
      </EnfyraProvider>,
    );
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    a.unmount();
    const saved = localStorage.getItem('__enfyra_tokens');
    const b = render(
      <EnfyraProvider
        config={{ baseUrl: 'https://b.invalid', auth: { strategy: 'token' } }}
      >
        <Consumer />
      </EnfyraProvider>,
    );
    expect(client.auth.getTokens()).toBeNull();
    b.unmount();
    const cookie = render(
      <EnfyraProvider
        config={{ baseUrl: 'https://a.invalid', auth: { strategy: 'cookie' } }}
      >
        <Consumer />
      </EnfyraProvider>,
    );
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(localStorage.getItem('__enfyra_tokens')).toBe(saved);
    cookie.unmount();
    render(
      <EnfyraProvider
        config={{ baseUrl: 'https://a.invalid', auth: { strategy: 'token' } }}
      >
        <Consumer />
      </EnfyraProvider>,
    );
    expect(client.auth.getTokens()?.accessToken).toBe('a');
  });
  it('keeps the mounted client when a parent recreates equivalent inline config', () => {
    const view = () => (
      <EnfyraProvider
        config={{ baseUrl: 'https://a.invalid', auth: { strategy: 'none' } }}
      >
        <Consumer />
      </EnfyraProvider>
    );
    const mounted = render(view());
    const first = client;
    mounted.rerender(view());
    expect(client).toBe(first);
  });
  it('invalidates pending refresh as soon as logout starts', async () => {
    let resolveRefresh!: (value: any) => void;
    let resolveLogout!: () => void;
    const store = createAuthStore({
      auth: {
        getMe: () =>
          new Promise((done) => {
            resolveRefresh = done;
          }),
        logout: () =>
          new Promise<void>((done) => {
            resolveLogout = done;
          }),
      },
    } as never);
    const refresh = store.getState().refresh();
    const logout = store.getState().logout();
    resolveRefresh({ id: 'old' });
    await refresh;
    expect(store.getState().user).toBeNull();
    resolveLogout();
    await logout;
  });
  it('does not restore auth state from a refresh completed after logout', async () => {
    let resolve!: (value: any) => void;
    const store = createAuthStore({
      auth: {
        getMe: () =>
          new Promise((done) => {
            resolve = done;
          }),
      },
    } as never);
    const pending = store.getState().refresh();
    store.getState().setUser(null);
    resolve({ id: 'old' });
    await pending;
    expect(store.getState().user).toBeNull();
  });
});
