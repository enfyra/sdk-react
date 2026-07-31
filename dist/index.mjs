import { jsx } from 'react/jsx-runtime';
import { createContext, useMemo, useRef, useEffect, useContext, useCallback } from 'react';
import { EnfyraClient, isEnfyraError, WebSocketClient } from '@enfyra/sdk-core';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

function createAuthStore(client) {
  return createStore((set) => ({
    user: null,
    isAuthenticated: false,
    pending: false,
    status: null,
    error: null,
    setUser: (user) => set({ user, isAuthenticated: user !== null }),
    setPending: (pending, status) => set({ pending, ...status !== void 0 ? { status } : {} }),
    setError: (error) => set({ error }),
    refresh: async () => {
      set({ pending: true, status: "pending", error: null });
      try {
        const user = await client.auth.getMe();
        set({ user, isAuthenticated: user !== null, pending: false, status: "success" });
        return user;
      } catch (err) {
        const is401 = err && typeof err === "object" && "statusCode" in err && err.statusCode === 401;
        if (is401) {
          set({ user: null, isAuthenticated: false, pending: false, status: "success" });
          return null;
        }
        const error = err instanceof Error ? err : new Error("Auth check failed");
        set({ error, pending: false, status: "error" });
        return null;
      }
    }
  }));
}

const EnfyraContext = createContext(null);
const TOKENS_STORAGE_KEY = "__enfyra_tokens";
function parseSavedTokens(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.accessToken === "string" && typeof parsed.expTime === "number") {
      return parsed;
    }
  } catch {
  }
  return null;
}
function EnfyraProvider({ config, children }) {
  assertBrowserRuntime();
  const value = useMemo(() => {
    const client2 = new EnfyraClient(
      typeof config === "string" ? { baseUrl: config } : config
    );
    const saved = parseSavedTokens(localStorage.getItem(TOKENS_STORAGE_KEY));
    if (saved) {
      client2.auth.setTokens(saved).catch(() => {
      });
    }
    return { client: client2, authStore: createAuthStore(client2) };
  }, [typeof config === "string" ? config : config.baseUrl]);
  const client = value.client;
  const prevTokensRef = useRef(null);
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
  return /* @__PURE__ */ jsx(EnfyraContext.Provider, { value, children });
}
function useEnfyra() {
  const ctx = useContext(EnfyraContext);
  if (!ctx) throw new Error("useEnfyra must be used within an EnfyraProvider");
  return ctx.client;
}
function useAuthStoreApi() {
  const ctx = useContext(EnfyraContext);
  if (!ctx) throw new Error("useAuthStoreApi must be used within an EnfyraProvider");
  return ctx.authStore;
}
function assertBrowserRuntime() {
  if (typeof window === "undefined") {
    throw new Error("@enfyra/sdk-react is CSR-only. Use @enfyra/next for SSR.");
  }
}

function useAuth() {
  const client = useEnfyra();
  const store = useAuthStoreApi();
  const user = useStore(store, (s) => s.user);
  const isAuthenticated = useStore(store, (s) => s.isAuthenticated);
  const pending = useStore(store, (s) => s.pending);
  const status = useStore(store, (s) => s.status);
  const error = useStore(store, (s) => s.error);
  const refresh = useStore(store, (s) => s.refresh);
  const login = useCallback(async (credentials) => {
    store.getState().setPending(true, "pending");
    store.getState().setError(null);
    try {
      const result = await client.auth.login(credentials);
      await store.getState().refresh();
      return result;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Login failed");
      store.getState().setError(error2);
      store.getState().setPending(false, "error");
      return null;
    }
  }, [client, store]);
  const logout = useCallback(async () => {
    await client.auth.logout();
    store.getState().setUser(null);
    store.getState().setPending(false, null);
  }, [client, store]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { user, isAuthenticated, pending, status, error, login, logout, refresh };
}

function useQuery(table, options = {}) {
  const client = useEnfyra();
  const { select, filter, sort, limit, page, meta, deep, immediate = true } = options;
  const store = useMemo(() => createStore(() => ({
    data: null,
    error: null,
    pending: false,
    status: null,
    meta: null
  })), []);
  const filterKey = JSON.stringify(filter);
  const selectKey = JSON.stringify(select);
  const metaKey = JSON.stringify(meta);
  const deepKey = JSON.stringify(deep);
  const refresh = useCallback(async () => {
    store.setState({ pending: true, status: "pending", error: null });
    try {
      const builder = client.from(table);
      if (select) builder.select(select);
      if (filter) builder.filter(filter);
      if (sort) builder.sort(sort);
      if (limit !== void 0) builder.limit(limit);
      if (page !== void 0) builder.page(page);
      if (meta) builder.meta(meta);
      if (deep) builder.deep(deep);
      const result = await builder.execute();
      store.setState({ data: result.data, meta: result.meta ?? null, pending: false, status: "success" });
      return result.data;
    } catch (err) {
      const enfyraError = isEnfyraError(err) ? err : { message: err instanceof Error ? err.message : "Request failed", code: "NETWORK_ERROR" };
      store.setState({ error: enfyraError, pending: false, status: "error" });
      return null;
    }
  }, [client, table, store, selectKey, filterKey, sort, limit, page, metaKey, deepKey]);
  useEffect(() => {
    if (immediate) void refresh();
  }, [refresh, immediate]);
  const data = useStore(store, (s) => s.data);
  const error = useStore(store, (s) => s.error);
  const pending = useStore(store, (s) => s.pending);
  const status = useStore(store, (s) => s.status);
  const queryMeta = useStore(store, (s) => s.meta);
  return { data, error, pending, status, meta: queryMeta, refresh };
}
function useMutation(table, options = {}) {
  const client = useEnfyra();
  const { operation = "insert", onSuccess, onError, onSettled } = options;
  const store = useMemo(() => createStore(() => ({
    data: null,
    error: null,
    pending: false,
    status: null
  })), []);
  const callbacksRef = useRef({ onSuccess, onError, onSettled });
  callbacksRef.current = { onSuccess, onError, onSettled };
  const execute = useCallback(async (params) => {
    store.setState({ pending: true, status: "pending", error: null });
    try {
      let result = null;
      if (params.ids && params.ids.length > 0) {
        const results = await Promise.all(
          params.ids.map((id) => {
            if (operation === "delete") return client.from(table).byId(id).delete();
            return client.from(table).byId(id).update(params.data);
          })
        );
        result = results.map((r) => r?.data ?? null);
      } else if (operation === "delete") {
        if (params.id == null) throw new Error("id is required for delete");
        await client.from(table).byId(params.id).delete();
        result = null;
      } else if (operation === "update") {
        if (params.id == null) throw new Error("id is required for update");
        result = (await client.from(table).byId(params.id).update(params.data)).data;
      } else {
        result = (await client.from(table).insert(params.data)).data;
      }
      store.setState({ data: result, pending: false, status: "success" });
      callbacksRef.current.onSuccess?.(result);
      return result;
    } catch (err) {
      const enfyraError = isEnfyraError(err) ? err : { message: err instanceof Error ? err.message : "Request failed", code: "NETWORK_ERROR" };
      store.setState({ error: enfyraError, pending: false, status: "error" });
      callbacksRef.current.onError?.(enfyraError);
      return null;
    } finally {
      callbacksRef.current.onSettled?.();
    }
  }, [client, table, operation, store]);
  const data = useStore(store, (s) => s.data);
  const error = useStore(store, (s) => s.error);
  const pending = useStore(store, (s) => s.pending);
  const status = useStore(store, (s) => s.status);
  return { data, error, pending, status, execute };
}

function useStorage() {
  const client = useEnfyra();
  const store = useMemo(() => createStore(() => ({ uploading: false })), []);
  const uploading = useStore(store, (s) => s.uploading);
  const upload = useCallback(async (file, options) => {
    store.setState({ uploading: true });
    try {
      return await client.storage.upload({ file, ...options });
    } catch {
      return null;
    } finally {
      store.setState({ uploading: false });
    }
  }, [client, store]);
  const download = useCallback((fileId) => {
    return client.storage.download(fileId).catch(() => null);
  }, [client]);
  const getDownloadUrl = useCallback((fileId) => {
    return client.storage.getDownloadUrl(fileId);
  }, [client]);
  const getFolderTree = useCallback(async () => {
    try {
      return await client.storage.getFolderTree();
    } catch {
      return null;
    }
  }, [client]);
  return { uploading, upload, download, getDownloadUrl, getFolderTree };
}

function useWebSocket(gateway, options = {}) {
  const client = useEnfyra();
  const { immediate = false } = options;
  const store = useMemo(() => createStore(() => ({
    connected: false,
    connecting: false,
    error: null
  })), []);
  const wsRef = useRef(null);
  const unsubscribesRef = useRef([]);
  const connected = useStore(store, (s) => s.connected);
  const connecting = useStore(store, (s) => s.connecting);
  const error = useStore(store, (s) => s.error);
  const connect = useCallback(async () => {
    if (wsRef.current) return;
    store.setState({ connecting: true, error: null });
    const baseUrl = options.baseUrl ?? client.getHttpClient().baseUrl.replace(/\/api\/?$/, "");
    const ws = new WebSocketClient({
      baseUrl,
      gateway,
      getAuthToken: () => client.auth.getToken(),
      reconnect: true
    });
    ws.on("connect", () => store.setState({ connected: true, connecting: false }));
    ws.on("disconnect", () => store.setState({ connected: false }));
    ws.on("connect_error", (value) => {
      store.setState({
        error: value instanceof Error ? value : new Error(String(value)),
        connecting: false
      });
    });
    wsRef.current = ws;
    try {
      await ws.connect();
    } catch (value) {
      const err = value instanceof Error ? value : new Error(String(value));
      store.setState({ error: err, connecting: false });
      wsRef.current = null;
      throw err;
    }
  }, [client, gateway, options.baseUrl, store]);
  const disconnect = useCallback(() => {
    unsubscribesRef.current.forEach((fn) => fn());
    unsubscribesRef.current = [];
    wsRef.current?.disconnect();
    wsRef.current = null;
    store.setState({ connected: false, connecting: false });
  }, [store]);
  const emit = useCallback((event, data) => {
    wsRef.current?.emit(event, data);
  }, []);
  const on = useCallback((event, handler) => {
    if (!wsRef.current) throw new Error("Not connected. Call connect() first.");
    const unsubscribe = wsRef.current.on(event, handler);
    unsubscribesRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);
  useEffect(() => {
    if (immediate) void connect().catch(() => void 0);
    return disconnect;
  }, [immediate, connect, disconnect]);
  return { connected, connecting, error, connect, disconnect, emit, on };
}

export { EnfyraProvider, useAuth, useEnfyra, useMutation, useQuery, useStorage, useWebSocket };
